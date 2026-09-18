import { Request, Response, NextFunction } from 'express';
import { SecurityService } from './security.service';

/**
 * Middleware requireStepUp:
 * Enforces recent reauthentication for high-impact financial or administrative operations.
 * If header 'X-Step-Up-Token' is missing or expired, halts with 403 STEP_UP_REQUIRED.
 */
export const requireStepUp = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  const stepUpToken = req.headers['x-step-up-token'];

  if (!stepUpToken || typeof stepUpToken !== 'string') {
    res.status(403).json({
      error: 'OPERAÇÃO CRÍTICA — Esta ação requer reautenticação imediata por segurança (Step-Up).',
      code: 'STEP_UP_REQUIRED',
      statusCode: 403,
      requiresStepUp: true,
      message: 'Confirme sua senha ou código 2FA para prosseguir.'
    });
    return;
  }

  const isValid = SecurityService.verifyStepUpToken(user.id, stepUpToken.trim());
  if (!isValid) {
    res.status(403).json({
      error: 'Token de reautenticação (Step-Up) inválido ou expirado. Por favor confirme suas credenciais novamente.',
      code: 'STEP_UP_EXPIRED',
      statusCode: 403,
      requiresStepUp: true
    });
    return;
  }

  next();
};
