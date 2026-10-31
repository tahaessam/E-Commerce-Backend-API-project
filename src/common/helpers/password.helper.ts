import * as bcrypt from 'bcrypt';

export const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hash a plain‑text password using bcrypt.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a plain‑text password with a bcrypt hash.
 */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Detect whether a stored password value appears to be a bcrypt hash.
 * Bcrypt hashes start with "$2b$" or "$2a$".
 */
export function isHashed(value: string): boolean {
  return value.startsWith('$2b$') || value.startsWith('$2a$');
}
