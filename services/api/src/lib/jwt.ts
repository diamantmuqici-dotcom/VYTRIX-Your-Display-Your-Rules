import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

export type TokenType = 'access' | 'refresh';

export interface TokenClaims extends JwtPayload {
  sub: string;
  role: string;
  typ: TokenType;
}

export interface SignTokenInput {
  userId: string;
  role: string;
  type: TokenType;
  secret: string;
  ttl: string;
}

/** Sign a VYTRIX access or refresh JWT. `ttl` uses the `ms` duration format. */
export function signToken(input: SignTokenInput): string {
  const options: SignOptions = {
    subject: input.userId,
    expiresIn: input.ttl as SignOptions['expiresIn'],
  };
  return jwt.sign({ role: input.role, typ: input.type }, input.secret, options);
}

/** Verify a JWT and enforce its token type. Returns null for any invalid token. */
export function verifyToken(token: string, secret: string, expected: TokenType): TokenClaims | null {
  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'string') return null;
    if (decoded.typ !== expected) return null;
    if (typeof decoded.sub !== 'string' || typeof decoded.role !== 'string') return null;
    return decoded as TokenClaims;
  } catch {
    return null;
  }
}
