import { Inject, Injectable, ConflictException, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { loginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { CustomerRepository } from '../customer/repositories/customer.repo';
import { EmailService } from '../mailer/mail.service';
import { CACHE_PORT } from '../common/cache/cache.tokens';
import type { CachePort } from '../common/cache/cache.interface';
import { hashPassword, comparePassword, isHashed } from '../common/helpers/password.helper';
import { generateOtp, hashOtp, verifyOtpHash } from '../common/helpers/otp.helper';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    @Inject(CACHE_PORT) private readonly cachePort: CachePort,
  ) {}

  // ---------- Registration ----------
  async register(registerDto: RegisterDto) {
    const existing = await this.customerRepository.findOne({ email: registerDto.email });
    if (existing) {
      throw new ConflictException('User already exists');
    }
    const otp = generateOtp(this.configService.get<number>('OTP_LENGTH') ?? 6);
    const otpSecret = this.configService.get<string>('OTP_HMAC_SECRET');
    const otpHash = hashOtp(otp, otpSecret);
    const cacheKey = this.getRegistrationCacheKey(registerDto.email);
    const payload = { otpHash, user: registerDto };
    await this.cachePort.set(cacheKey, JSON.stringify(payload), this.getOtpTtlSeconds());
    await this.emailService.sendOtpEmail(registerDto.email, otp);
    return { success: true };
  }

  // ---------- OTP Verification ----------
  async verifyOtp(dto: VerifyOtpDto) {
    const { email, otp } = dto;
    const cacheKey = this.getRegistrationCacheKey(email);
    const stored = await this.cachePort.get(cacheKey);
    if (!stored) {
      throw new NotFoundException('OTP not found or expired');
    }
    const { otpHash, user } = JSON.parse(stored);
    const otpSecret = this.configService.get<string>('OTP_HMAC_SECRET');
    const valid = verifyOtpHash(otpHash, otp, otpSecret);
    if (!valid) {
      throw new UnauthorizedException('Invalid OTP');
    }
    const hashedPassword = await hashPassword(user.password);
    const userToCreate = { ...user, password: hashedPassword, isVerified: true };
    await this.customerRepository.create(userToCreate);
    await this.cachePort.del(cacheKey);
    return { success: true };
  }

  // ---------- Resend OTP ----------
  async resendOtp(dto: ResendOtpDto) {
    const { email } = dto;
    const existing = await this.customerRepository.findOne({ email });
    if (!existing) {
      throw new NotFoundException('User not found');
    }
    const otp = generateOtp(this.configService.get<number>('OTP_LENGTH') ?? 6);
    const otpSecret = this.configService.get<string>('OTP_HMAC_SECRET');
    const otpHash = hashOtp(otp, otpSecret);
    const cacheKey = this.getRegistrationCacheKey(email);
    const payload = { otpHash, user: { email, password: existing.password } };
    await this.cachePort.set(cacheKey, JSON.stringify(payload), this.getOtpTtlSeconds());
    await this.emailService.sendOtpEmail(email, otp);
    return { success: true };
  }

  // ---------- Login ----------
  async login(loginDto: loginDto) {
    const user = await this.customerRepository.findOne({ email: loginDto.email }).select('+password');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const storedPassword = user.password as string;
    let passwordMatches: boolean;
    if (isHashed(storedPassword)) {
      passwordMatches = await comparePassword(loginDto.password, storedPassword);
    } else {
      passwordMatches = loginDto.password === storedPassword;
      if (passwordMatches) {
        const newHash = await hashPassword(storedPassword);
        await this.customerRepository.updateOne({ _id: user._id }, { password: newHash });
      }
    }
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isVerified) {
      throw new ForbiddenException('Account not verified');
    }
    const jti = crypto.randomUUID();
    const accessToken = await this.jwtService.signAsync({ sub: user._id, role: user.role });
    const refreshToken = await this.jwtService.signAsync({ sub: user._id, role: user.role, jti }, { expiresIn: '7d' });
    const refreshSecret = this.configService.get<string>('REFRESH_HMAC_SECRET');
    const refreshHash = hashOtp(refreshToken, refreshSecret);
    await this.cachePort.set(`auth:refresh:${jti}`, refreshHash, 7 * 24 * 60 * 60);
    return { accessToken, refreshToken, jti };
  }

  // ---------- Refresh Token Rotation ----------
  async refresh(refreshToken: string) {
    const payload = this.jwtService.verify(refreshToken) as { sub: string; role: string; jti: string };
    const { jti } = payload;
    const storedHash = await this.cachePort.get(`auth:refresh:${jti}`);
    if (!storedHash) {
      throw new UnauthorizedException('Refresh token not recognized');
    }
    const refreshSecret = this.configService.get<string>('REFRESH_HMAC_SECRET');
    if (!verifyOtpHash(storedHash, refreshToken, refreshSecret)) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.cachePort.del(`auth:refresh:${jti}`);
    const newJti = crypto.randomUUID();
    const newRefresh = await this.jwtService.signAsync({ sub: payload.sub, role: payload.role, jti: newJti }, { expiresIn: '7d' });
    const newAccess = await this.jwtService.signAsync({ sub: payload.sub, role: payload.role });
    const newHash = hashOtp(newRefresh, refreshSecret);
    await this.cachePort.set(`auth:refresh:${newJti}`, newHash, 7 * 24 * 60 * 60);
    return { accessToken: newAccess, refreshToken: newRefresh, jti: newJti };
  }

  // ---------- Profile ----------
  async getProfile(userId: string) {
    const user = await this.customerRepository.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
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
