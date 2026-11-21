import { argon2id, hash, verify } from 'argon2';

const OPTIONS = {
  type: argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

/** Hash a plaintext password with Argon2id. */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

/** Verify a plaintext password against an Argon2id hash. Returns false on any mismatch. */
export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
