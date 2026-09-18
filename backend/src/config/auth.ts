import { env } from './env';

export const authConfig = {
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN
  },
  argon2: {
    // Argon2id enterprise security profile
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1
  },
  passwordPolicy: {
    minLength: 8,
    requireSpecialChar: true,
    requireNumber: true,
    requireUppercase: true
  }
};
