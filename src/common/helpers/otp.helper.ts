import * as crypto from 'crypto';
import * as cryptoUtils from 'crypto';
import * as util from 'util';
import * as base64url from 'base64url';

/**
 * Generate a numeric OTP of given length using a cryptographically secure RNG.
 */
export function generateOtp(length: number = 6): string {
  const digits = [];
  for (let i = 0; i < length; i++) {
    // crypto.randomInt generates a number in [0, max)
    const digit = crypto.randomInt(0, 10);
    digits.push(digit.toString());
  }
  return digits.join('');
}

/**
 * Create an HMAC‑SHA256 hash of the OTP using a secret.
 * The result is base64url‑encoded for storage.
 */
export function hashOtp(otp: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(otp);
  return hmac.digest('base64url');
}

/**
 * Verify that a supplied OTP matches the stored HMAC hash.
 */
export function verifyOtpHash(storedHash: string, otp: string, secret: string): boolean {
  const computed = hashOtp(otp, secret);
  // Use constant‑time comparison to avoid timing attacks
  return crypto.timingSafeEqual(Buffer.from(storedHash, 'base64url'), Buffer.from(computed, 'base64url'));
}
