import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const from = this.configService.get<string>('mailer.from');

    try {
      await this.mailerService.sendMail({
        to,
        from,
        subject: 'Your verification code',
        html: this.buildOtpTemplate(otp),
      });
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}`, error as Error);
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }
  }

  private buildOtpTemplate(otp: string): string {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
        <h2>Email verification</h2>
        <p>Your one-time verification code is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 16px 0;">${otp}</p>
        <p>This code expires soon. If you did not request this code, ignore this email.</p>
      </div>
    `;
  }
}
