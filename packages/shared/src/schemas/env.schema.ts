import { z } from 'zod';

export const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.union([z.string(), z.number()]).default('4000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters').default('super-secret-omniflow-jwt-key-2026'),
  JWT_REFRESH_SECRET: z.string().optional().default('super-secret-refresh-key-2026'),
  ENCRYPTION_MASTER_KEY: z.string().min(16).default('0123456789abcdef0123456789abcdef'),
  OPENAI_API_KEY: z.string().optional(),
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  WEBHOOK_VERIFY_TOKEN: z.string().optional().default('omniflow_verify_token_secure_2026'),
  BKASH_APP_KEY: z.string().optional(),
  BKASH_APP_SECRET: z.string().optional(),
  BKASH_USERNAME: z.string().optional(),
  BKASH_PASSWORD: z.string().optional(),
  STEADFAST_API_KEY: z.string().optional(),
  STEADFAST_SECRET_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

export const WebEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_API_URL: z.string().default('http://localhost:4000'),
  NEXT_PUBLIC_WS_URL: z.string().default('http://localhost:4000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('OmniFlow AI'),
});

export type WebEnv = z.infer<typeof WebEnvSchema>;

export function validateServerEnv(env: Record<string, string | undefined> = process.env): ServerEnv {
  const result = ServerEnvSchema.safeParse(env);
  if (!result.success) {
    const formatted = result.error.format();
    // eslint-disable-next-line no-console
    console.error('❌ Invalid server environment configuration:', JSON.stringify(formatted, null, 2));
    throw new Error('Environment variable validation failed');
  }
  return result.data;
}

export function validateWebEnv(env: Record<string, string | undefined> = process.env): WebEnv {
  const result = WebEnvSchema.safeParse(env);
  if (!result.success) {
    const formatted = result.error.format();
    // eslint-disable-next-line no-console
    console.error('❌ Invalid web environment configuration:', JSON.stringify(formatted, null, 2));
    throw new Error('Web environment variable validation failed');
  }
  return result.data;
}
