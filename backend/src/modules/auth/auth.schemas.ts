import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
  twoFactorCode: z.string().optional()
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token obrigatório')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token de recuperação obrigatório'),
  newPassword: z.string().min(8, 'A nova senha deve possuir no mínimo 8 caracteres')
});

export const twoFactorVerifySchema = z.object({
  code: z.string().min(6, 'Código 2FA deve possuir 6 dígitos')
});
