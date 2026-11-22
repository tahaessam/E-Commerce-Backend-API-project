import {
  Inject,
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { CustomerRepository } from '../customer/repositories/customer.repo';
import { UserRepository } from '../user/repositories/user.repo';
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
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    @Inject(CACHE_PORT) private readonly cachePort: CachePort,
  ) {}

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.toLowerCase().trim();
    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new ConflictException('User already exists');

    const otp = generateOtp(this.configService.get<number>('OTP_LENGTH') ?? 6);
    const otpSecret = this.getRequiredSecret('OTP_HMAC_SECRET');
    const otpHash = hashOtp(otp, otpSecret);
    const passwordHash = await hashPassword(registerDto.password);
    const cacheKey = this.getRegistrationCacheKey(email);
    const user = { ...registerDto, email, password: passwordHash };
    await this.cachePort.set(cacheKey, JSON.stringify({ otpHash, user }), this.getOtpTtlSeconds());
    await this.emailService.sendOtpEmail(email, otp);
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
    const otpSecret = this.getRequiredSecret('OTP_HMAC_SECRET');
    const attemptsKey = `auth:otp:attempts:${email.toLowerCase().trim()}`;
    const attempts = Number((await this.cachePort.get(attemptsKey)) ?? 0);
    if (attempts >= 5) throw new HttpException('Too many OTP attempts', HttpStatus.TOO_MANY_REQUESTS);
    await this.cachePort.set(attemptsKey, String(attempts + 1), this.getOtpTtlSeconds());
    if (!verifyOtpHash(payload.otpHash, otp, otpSecret)) {
      throw new UnauthorizedException('Invalid OTP');
    }
    await this.cachePort.del(attemptsKey);

    if (payload.userId) {
      await this.customerRepository.update(payload.userId, { isVerified: true });
    } else if (payload.user) {
      await this.customerRepository.create({
        ...payload.user,
        role: UserRole.user,
        provider: provider_role.User,
        isVerified: true,
      });
    } else {
      throw new UnauthorizedException('Invalid verification request');
    }

    await this.cachePort.del(cacheKey);
    return { success: true };
  }

  async resendOtp(dto: ResendOtpDto) {
    const email = dto.email.toLowerCase().trim();
    const cacheKey = this.getRegistrationCacheKey(email);
    const pendingRegistration = await this.cachePort.get(cacheKey);
    const resendKey = `auth:otp:resend:${email}`;
    const resendCount = Number((await this.cachePort.get(resendKey)) ?? 0);
    if (resendCount >= 3) throw new HttpException('OTP resend limit reached', HttpStatus.TOO_MANY_REQUESTS);
    await this.cachePort.set(resendKey, String(resendCount + 1), this.getOtpTtlSeconds());
    const otp = generateOtp(this.configService.get<number>('OTP_LENGTH') ?? 6);
    const otpSecret = this.getRequiredSecret('OTP_HMAC_SECRET');
    const otpHash = hashOtp(otp, otpSecret);

    if (pendingRegistration) {
      const pendingPayload = JSON.parse(pendingRegistration) as {
        otpHash: string;
        user?: RegisterDto;
        userId?: string;
      };
      if (!pendingPayload.user && !pendingPayload.userId) {
        throw new UnauthorizedException('Invalid registration verification state');
      }
      await this.cachePort.set(
        cacheKey,
        JSON.stringify({ ...pendingPayload, otpHash }),
        this.getOtpTtlSeconds(),
      );
    } else {
      const existing = await this.customerRepository.findOne({ email });
      if (!existing) throw new NotFoundException('User not found');
      if (existing.isVerified) throw new ConflictException('Account is already verified');

      await this.cachePort.set(
        cacheKey,
        JSON.stringify({ otpHash, userId: existing._id.toString() }),
        this.getOtpTtlSeconds(),
      );
    }

    await this.emailService.sendOtpEmail(email, otp);
    return { success: true };
  }

  async login(loginDto: LoginDto) {
    const user = await this.customerRepository.findOneWithPassword({ email: loginDto.email.toLowerCase().trim() });
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

    const refreshJwtSecret = this.getRequiredSecret('jwt.refreshSecret');
    this.getRequiredSecret('jwt.accessSecret');
    const jti = crypto.randomUUID();
    const accessToken = await this.jwtService.signAsync({ sub: user._id.toString(), role: user.role });
    const refreshToken = await this.jwtService.signAsync(
      { sub: user._id.toString(), role: user.role, jti },
      {
        secret: refreshJwtSecret,
        expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d') as JwtSignOptions['expiresIn'],
      },
    );
    const refreshSecret = this.getRequiredSecret('REFRESH_HMAC_SECRET');
    const refreshHash = hashOtp(refreshToken, refreshSecret);
    await this.cachePort.set(`auth:refresh:${jti}`, refreshHash, this.getRefreshTtlSeconds());
    return { accessToken, refreshToken, jti };
  }

  async refresh(refreshToken: string) {
    const refreshJwtSecret = this.getRequiredSecret('jwt.refreshSecret');
    let payload: { sub: string; role: UserRole; jti: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: refreshJwtSecret,
      }) as { sub: string; role: UserRole; jti: string };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      typeof payload.jti !== 'string' ||
      !Object.values(UserRole).includes(payload.role)
    ) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }
    const { jti } = payload;
    const storedHash = await this.cachePort.get(`auth:refresh:${jti}`);
    if (!storedHash) throw new UnauthorizedException('Refresh token not recognized');

    const refreshSecret = this.getRequiredSecret('REFRESH_HMAC_SECRET');
    if (!verifyOtpHash(storedHash, refreshToken, refreshSecret)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.cachePort.del(`auth:refresh:${jti}`);
    const newJti = crypto.randomUUID();
    const newRefresh = await this.jwtService.signAsync(
      { sub: payload.sub, role: payload.role, jti: newJti },
      {
        secret: refreshJwtSecret,
        expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d') as JwtSignOptions['expiresIn'],
      },
    );
    const newAccess = await this.jwtService.signAsync({
      sub: payload.sub,
      role: payload.role,
    });
    const newHash = hashOtp(newRefresh, refreshSecret);
    await this.cachePort.set(`auth:refresh:${newJti}`, newHash, this.getRefreshTtlSeconds());
    return { accessToken: newAccess, refreshToken: newRefresh, jti: newJti };
  }

  async getProfile(userId: string) {
    const user = await this.customerRepository.findOne({ _id: userId });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private getRequiredSecret(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value || value.length < 32) {
      throw new InternalServerErrorException(key + ' must be configured with at least 32 characters');
    }
    return value;
  }

  private getOtpTtlSeconds(): number {
    const ttl = Number(this.configService.get<string>('OTP_EXPIRES_IN') ?? 300);
    return Number.isFinite(ttl) && ttl > 0 ? ttl : 300;
  }

  private getRefreshTtlSeconds(): number {
    const ttl = Number(this.configService.get<string>('REFRESH_TOKEN_TTL_SECONDS') ?? 604800);
    return Number.isFinite(ttl) && ttl > 0 ? ttl : 604800;
  }

  private getRegistrationCacheKey(email: string): string {
    return `auth:register:${email.toLowerCase().trim()}`;
  }
}
