import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/disk_interno?schema=public'),
  JWT_SECRET: z.string().default('dk_secret_enterprise_jwt_super_key_2026_super_secure'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default('dk_refresh_enterprise_super_key_2026_secure'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  SUPERADMIN_EMAIL: z.string().email().default('admin@diskingressos.com.br'),
  GEMINI_API_KEY: z.string().optional()
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Configuração inválida de variáveis de ambiente:', _env.error.format());
  throw new Error('Variáveis de ambiente inválidas');
}

export const env = _env.data;
