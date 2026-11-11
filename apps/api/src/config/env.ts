import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(8).optional(),
  BOOTSTRAP_ADMIN_NAME: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3010'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  WAHA_BASE_URL: z.string().optional(),
  WAHA_API_KEY: z.string().optional(),
  CHATWOOT_BASE_URL: z.string().optional(),
  CHATWOOT_API_TOKEN: z.string().optional(),
  CHATWOOT_ACCOUNT_ID: z.string().optional(),
  AI_ENCRYPTION_KEY: z.string().min(32).optional(),
});

export const env = schema.parse(process.env);
