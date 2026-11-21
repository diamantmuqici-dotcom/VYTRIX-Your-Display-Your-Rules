import { createHash, randomBytes } from 'node:crypto';

/** Lowercase hex SHA-256 digest of the supplied bytes. */
export function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

/** URL-safe opaque token with `bytes` of entropy. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}
