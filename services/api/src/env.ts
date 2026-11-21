import 'dotenv/config';
import { z } from 'zod';

const optionalString = z.string().optional().default('');
const optionalUrl = optionalString.refine(
  (value) => value === '' || URL.canParse(value),
  'must be a valid URL or empty',
);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  DATABASE_URL: z.string().min(1).refine(
    (value) => /^postgres(ql)?:\/\//.test(value),
    'DATABASE_URL must be a PostgreSQL connection string',
  ),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  MACHINE_ID_PEPPER: z.string().min(16, 'MACHINE_ID_PEPPER must be at least 16 characters'),
  ACCESS_TOKEN_TTL: z.string().min(1).default('15m'),
  REFRESH_TOKEN_TTL: z.string().min(1).default('7d'),
  CORS_ORIGIN: z.string().min(1).default('*'),

  RELEASE_SIGNING_PUBLIC_KEY: optionalString,
  ADMIN_RELEASE_TOKEN: optionalString,

  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  STRIPE_PRICE_MONTHLY: optionalString,
  STRIPE_PRICE_LIFETIME: optionalString,
  STRIPE_SUCCESS_URL: optionalUrl,
  STRIPE_CANCEL_URL: optionalUrl,

  DISCORD_CLIENT_ID: optionalString,
  DISCORD_CLIENT_SECRET: optionalString,
  DISCORD_REDIRECT_URI: optionalUrl,

  S3_ENDPOINT: optionalUrl,
  S3_REGION: z.string().min(1).default('us-east-1'),
  S3_BUCKET: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,
  S3_PUBLIC_BASE_URL: optionalUrl,
  STORAGE_LOCAL_DIR: z.string().min(1).default('./.storage'),

  TELEMETRY_ENABLED: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
  throw new Error(`Invalid VYTRIX API configuration:\n${issues}`);
}

const config = parsed.data;

const features = {
  stripe: config.STRIPE_SECRET_KEY !== '',
  billing: config.STRIPE_SECRET_KEY !== '' && config.STRIPE_PRICE_MONTHLY !== '' &&
    config.STRIPE_PRICE_LIFETIME !== '' && config.STRIPE_SUCCESS_URL !== '' && config.STRIPE_CANCEL_URL !== '',
  webhooks: config.STRIPE_SECRET_KEY !== '' && config.STRIPE_WEBHOOK_SECRET !== '',
  discord: config.DISCORD_CLIENT_ID !== '' && config.DISCORD_CLIENT_SECRET !== '' && config.DISCORD_REDIRECT_URI !== '',
  s3: config.S3_ENDPOINT !== '' && config.S3_BUCKET !== '' && config.S3_ACCESS_KEY_ID !== '' && config.S3_SECRET_ACCESS_KEY !== '',
  releases: config.RELEASE_SIGNING_PUBLIC_KEY !== '',
  adminToken: config.ADMIN_RELEASE_TOKEN !== '',
  telemetry: config.TELEMETRY_ENABLED,
} as const;

export const env = { ...config, features };
export type Env = typeof env;
