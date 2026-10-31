import { Injectable, Logger } from '@nestjs/common';

/**
 * Simple structured JSON logger for security‑relevant events.
 * Logs are written to stdout; log aggregation can be configured externally.
 * Sensitive fields (passwords, OTPs, tokens, hashes, secrets) are intentionally omitted.
 */
@Injectable()
export class SecurityLogService {
  private readonly logger = new Logger('Security');

  log(event: string, data: Record<string, any> = {}): void {
    // Remove any potentially sensitive keys before logging.
    const sanitized = { ...data };
    const sensitive = ['password', 'otp', 'otpHash', 'token', 'refreshToken', 'hash', 'secret'];
    for (const key of sensitive) {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    }
    this.logger.log(JSON.stringify({ event, ...sanitized }));
  }
}
