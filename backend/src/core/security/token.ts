import jwt from 'jsonwebtoken';
import { authConfig } from '../../config/auth';
import { UnauthorizedError } from '../errors/AppError';

export interface AccessTokenPayload {
  sub: string; // User ID
  email: string;
  sessionId: string;
  isSuperAdmin: boolean;
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, authConfig.jwt.secret, {
    expiresIn: authConfig.jwt.expiresIn as any
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, authConfig.jwt.secret) as AccessTokenPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('401 — Token de acesso expirado.');
    }
    throw new UnauthorizedError('401 — Token de acesso inválido ou corrompido.');
  }
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, authConfig.jwt.refreshSecret, {
    expiresIn: authConfig.jwt.refreshExpiresIn as any
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, authConfig.jwt.refreshSecret) as RefreshTokenPayload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('401 — Refresh Token expirado. Faça login novamente.');
    }
    throw new UnauthorizedError('401 — Refresh Token inválido.');
  }
}
