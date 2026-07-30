import { z } from 'zod';

/**
 * Validasi environment variable saat startup.
 * Aplikasi gagal cepat (fail-fast) bila konfigurasi tidak valid.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default('api/v1'),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(604800),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // URL publik API ini (dipakai untuk membangun signed URL driver lokal)
  PUBLIC_API_URL: z.string().default('http://localhost:4000/api/v1'),

  // auto = pakai R2 bila kredensial lengkap, jika tidak pakai disk lokal
  STORAGE_DRIVER: z.enum(['auto', 'r2', 'local']).default('auto'),
  STORAGE_LOCAL_DIR: z.string().default('.storage'),

  R2_ENDPOINT: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().default('digitemplate'),
  R2_PUBLIC_BASE_URL: z.string().optional(),
  DOWNLOAD_URL_TTL: z.coerce.number().default(600),
  DOWNLOAD_MAX_PER_LICENSE: z.coerce.number().default(5),

  MAIL_PROVIDER: z.enum(['console', 'smtp', 'resend']).default('console'),
  MAIL_FROM: z.string().default('DigiTemplate <no-reply@digitemplate.id>'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  BANK_NAME: z.string().default('BCA'),
  BANK_ACCOUNT_NUMBER: z.string().default('0000000000'),
  BANK_ACCOUNT_HOLDER: z.string().default('DigiTemplate'),
  INVOICE_EXPIRY_HOURS: z.coerce.number().default(24),

  THROTTLE_TTL: z.coerce.number().default(60),
  THROTTLE_LIMIT: z.coerce.number().default(100),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Konfigurasi environment tidak valid:\n${issues}`);
  }
  return parsed.data;
}
