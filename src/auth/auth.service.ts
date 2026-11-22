import {
  Inject,
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { CustomerRepository } from '../customer/repositories/customer.repo';
import { EmailService } from '../mailer/mail.service';
import { CACHE_PORT } from '../common/cache/cache.tokens';
import type { CachePort } from '../common/cache/cache.interface';
import { hashPassword, comparePassword, isHashed } from '../common/helpers/password.helper';
import { generateOtp, hashOtp, verifyOtpHash } from '../common/helpers/otp.helper';
import * as crypto from 'crypto';
import { UserRole } from '../common/enums/role.enum';
import { provider_role } from '../common/enums/provider.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    @Inject(CACHE_PORT) private readonly cachePort: CachePort,
  ) {}

  async register(registerDto: RegisterDto) {
    const existing = await this.customerRepository.findOne({ email: registerDto.email });
    if (existing) throw new ConflictException('User already exists');

    const otp = generateOtp(this.configService.get<number>('OTP_LENGTH') ?? 6);
    const otpSecret = this.configService.get<string>('OTP_HMAC_SECRET');
    const otpHash = hashOtp(otp, otpSecret);
    const cacheKey = this.getRegistrationCacheKey(registerDto.email);
    await this.cachePort.set(cacheKey, JSON.stringify({ otpHash, user: registerDto }), this.getOtpTtlSeconds());
    await this.emailService.sendOtpEmail(registerDto.email, otp);
    return { success: true };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { email, otp } = dto;
    const cacheKey = this.getRegistrationCacheKey(email);
    const stored = await this.cachePort.get(cacheKey);
    if (!stored) throw new NotFoundException('OTP not found or expired');

    const payload = JSON.parse(stored) as {
      otpHash: string;
      user?: RegisterDto;
      userId?: string;
    };
    const otpSecret = this.configService.get<string>('OTP_HMAC_SECRET');
    if (!verifyOtpHash(payload.otpHash, otp, otpSecret)) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (payload.userId) {
      await this.customerRepository.update(payload.userId, { isVerified: true });
    } else if (payload.user) {
      const hashedPassword = await hashPassword(payload.user.password);
      await this.customerRepository.create({
        ...payload.user,
        role: UserRole.user,
        provider: provider_role.User,
        password: hashedPassword,
        isVerified: true,
      });
    } else {
      throw new UnauthorizedException('Invalid verification request');
    }

    await this.cachePort.del(cacheKey);
    return { success: true };
  }

  async resendOtp(dto: ResendOtpDto) {
    const { email } = dto;
    const existing = await this.customerRepository.findOne({ email });
    if (!existing) throw new NotFoundException('User not found');
    if (existing.isVerified) throw new ConflictException('Account is already verified');

    const otp = generateOtp(this.configService.get<number>('OTP_LENGTH') ?? 6);
    const otpSecret = this.configService.get<string>('OTP_HMAC_SECRET');
    const otpHash = hashOtp(otp, otpSecret);
    await this.cachePort.set(
      this.getRegistrationCacheKey(email),
      JSON.stringify({ otpHash, userId: existing._id.toString() }),
      this.getOtpTtlSeconds(),
    );
    await this.emailService.sendOtpEmail(email, otp);
    return { success: true };
  }

  async login(loginDto: LoginDto) {
    const user = await this.customerRepository.findOneWithPassword({ email: loginDto.email });
    if (!user) throw new NotFoundException('User not found');

    const storedPassword = user.password as string;
    let passwordMatches: boolean;
    if (isHashed(storedPassword)) {
      passwordMatches = await comparePassword(loginDto.password, storedPassword);
    } else {
      passwordMatches = loginDto.password === storedPassword;
      if (passwordMatches) {
        const newHash = await hashPassword(storedPassword);
        await this.customerRepository.update(user._id, { password: newHash });
      }
    }
    if (!passwordMatches) throw new UnauthorizedException('Invalid credentials');
    if (!user.isVerified) throw new ForbiddenException('Account not verified');

    const jti = crypto.randomUUID();
    const accessToken = await this.jwtService.signAsync({ sub: user._id.toString(), role: user.role });
    const refreshToken = await this.jwtService.signAsync(
      { sub: user._id.toString(), role: user.role, jti },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d',
      },
    );
    const refreshSecret = this.configService.get<string>('REFRESH_HMAC_SECRET');
    const refreshHash = hashOtp(refreshToken, refreshSecret);
    await this.cachePort.set(`auth:refresh:${jti}`, refreshHash, 7 * 24 * 60 * 60);
    return { accessToken, refreshToken, jti };
  }

  async refresh(refreshToken: string) {
    const refreshJwtSecret = this.configService.get<string>('jwt.refreshSecret');
    const payload = this.jwtService.verify(refreshToken, {
      secret: refreshJwtSecret,
    }) as { sub: string; role: string; jti: string };
    const { jti } = payload;
    const storedHash = await this.cachePort.get(`auth:refresh:${jti}`);
    if (!storedHash) throw new UnauthorizedException('Refresh token not recognized');

    const refreshSecret = this.configService.get<string>('REFRESH_HMAC_SECRET');
    if (!verifyOtpHash(storedHash, refreshToken, refreshSecret)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.cachePort.del(`auth:refresh:${jti}`);
    const newJti = crypto.randomUUID();
    const newRefresh = await this.jwtService.signAsync(
      { sub: payload.sub, role: payload.role, jti: newJti },
      {
        secret: refreshJwtSecret,
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d',
      },
    );
    const newAccess = await this.jwtService.signAsync({
      sub: payload.sub,
      role: payload.role,
    });
    const newHash = hashOtp(newRefresh, refreshSecret);
    await this.cachePort.set(`auth:refresh:${newJti}`, newHash, 7 * 24 * 60 * 60);
    return { accessToken: newAccess, refreshToken: newRefresh, jti: newJti };
  }

  async getProfile(userId: string) {
    const user = await this.customerRepository.findOne({ _id: userId });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private getOtpTtlSeconds(): number {
    const ttl = Number(this.configService.get<string>('OTP_EXPIRES_IN') ?? 300);
    return Number.isFinite(ttl) && ttl > 0 ? ttl : 300;
  }

  private getRegistrationCacheKey(email: string): string {
    return `auth:register:${email.toLowerCase().trim()}`;
  }
}
