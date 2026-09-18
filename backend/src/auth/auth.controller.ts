import { Request, Response, NextFunction } from 'express';
import { db } from '../core/database/index';
import { generateSessionToken, comparePassword } from '../core/security/hash';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, twoFactorCode } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        return;
      }

      const user = db.getUserByEmail(email);
      if (!user) {
        db.logSecurity({
          email,
          eventType: 'LOGIN_FAILED',
          ipAddress: req.ip || '127.0.0.1',
          details: `Tentativa de login falha: e-mail ${email} inexistente.`
        });
        res.status(401).json({ error: 'Credenciais inválidas.' });
        return;
      }

      if (user.status === 'blocked') {
        db.logSecurity({
          userId: user.id,
          email: user.email,
          eventType: 'USER_BLOCKED',
          ipAddress: req.ip || '127.0.0.1',
          details: `Tentativa de login por usuário bloqueado: ${user.email}`
        });
        res.status(403).json({ error: 'ACESSO BLOQUEADO — Esta conta foi desativada pela administração.' });
        return;
      }

      // Check password
      const passwordMatch = await comparePassword(password, 'mock_hash');
      if (!passwordMatch) {
        db.logSecurity({
          userId: user.id,
          email: user.email,
          eventType: 'LOGIN_FAILED',
          ipAddress: req.ip || '127.0.0.1',
          details: `Senha incorreta para ${user.email}`
        });
        res.status(401).json({ error: 'Credenciais inválidas.' });
        return;
      }

      // 2FA Verification if enforced
      if (user.twoFactorEnforced && !twoFactorCode) {
        db.logSecurity({
          userId: user.id,
          email: user.email,
          eventType: '2FA_REQUIRED',
          ipAddress: req.ip || '127.0.0.1',
          details: `Desafio 2FA solicitado para ${user.email}`
        });
        res.status(200).json({
          requireTwoFactor: true,
          userId: user.id,
          message: 'Autenticação de Dois Fatores (2FA) obrigatória para esta conta.'
        });
        return;
      }

      // Successful login
      const token = generateSessionToken(user.id);
      db.activeSessions.set(token, {
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      user.lastLoginAt = new Date().toISOString();
      user.lastIpAddress = req.ip || '127.0.0.1';

      db.logSecurity({
        userId: user.id,
        email: user.email,
        eventType: 'LOGIN_SUCCESS',
        ipAddress: req.ip || '127.0.0.1',
        details: `Login bem-sucedido para ${user.name} (${user.roleName})`
      });

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roleSlug: user.roleSlug,
          roleName: user.roleName,
          organization: user.organization,
          isInternalStaff: user.isInternalStaff,
          scope: user.scope,
          permissions: user.permissions,
          twoFactorEnabled: user.twoFactorEnabled,
          twoFactorEnforced: user.twoFactorEnforced
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static me(req: Request, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }
    res.json({ user: req.user });
  }

  public static logout(req: Request, res: Response): void {
    const authHeader = req.headers['authorization'];
    if (authHeader && typeof authHeader === 'string') {
      const token = authHeader.replace('Bearer ', '').trim();
      db.activeSessions.delete(token);
    }
    res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
  }
}
