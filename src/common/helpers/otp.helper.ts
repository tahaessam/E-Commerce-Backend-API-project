import * as crypto from 'crypto';

/**
 * Generate a numeric OTP of given length using a cryptographically secure RNG.
 */
export function generateOtp(length: number = 6): string {
  const digits: string[] = [];
  for (let i = 0; i < length; i++) {
    digits.push(crypto.randomInt(0, 10).toString());
  }
  return digits.join('');
}

/**
 * Create an HMAC-SHA256 hash of the OTP using a secret.
 * The result is base64url-encoded for storage.
 */
export function hashOtp(otp: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(otp);
  return hmac.digest('base64url');
}

/**
 * Verify that a supplied OTP matches the stored HMAC hash.
 */
export function verifyOtpHash(
  storedHash: string,
  otp: string,
  secret: string,
): boolean {
  const computed = hashOtp(otp, secret);
  const storedBuffer = Buffer.from(storedHash, 'base64url');
  const computedBuffer = Buffer.from(computed, 'base64url');

  return (
    storedBuffer.length === computedBuffer.length &&
    crypto.timingSafeEqual(storedBuffer, computedBuffer)
  );
}
