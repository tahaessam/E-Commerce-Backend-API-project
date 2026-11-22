import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { VerifyOtpDto } from './dto/verify-otp.dto';
import type { ResendOtpDto } from './dto/resend-otp.dto';
import { RefreshDto } from './dto/refresh.dto';
import { IsPublic } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @IsPublic()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      message: 'Verification code sent',
      success: true,
      data: result,
    };
  }

  @IsPublic()
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(dto);
    return { message: 'Account verified successfully', success: true, data: result };
  }

  @IsPublic()
  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    const result = await this.authService.resendOtp(dto);
    return { message: 'Verification code resent', success: true, data: result };
  }

  @IsPublic()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const tokens = await this.authService.login(loginDto);
    return {
      message: 'Customer logged in successfully',
      success: true,
      data: tokens,
    };
  }

  @IsPublic()
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    const tokens = await this.authService.refresh(dto.refreshToken);
    return { message: 'Tokens refreshed successfully', success: true, data: tokens };
  }
}
