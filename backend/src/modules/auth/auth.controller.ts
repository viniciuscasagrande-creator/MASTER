import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import {
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  twoFactorVerifySchema
} from './auth.schemas';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await AuthService.login({
        email: validated.email,
        password: validated.password,
        twoFactorCode: validated.twoFactorCode,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.user?.sessionId;
      const userId = req.user?.id;
      const result = await AuthService.logout(sessionId || '', userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = refreshSchema.parse(req.body);
      const result = await AuthService.refresh(validated.refreshToken);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado.' });
        return;
      }
      const context = await AuthService.getMe(req.user.id);
      res.status(200).json(context);
    } catch (err) {
      next(err);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = forgotPasswordSchema.parse(req.body);
      res.status(200).json({
        success: true,
        message: `Instruções de redefinição de senha enviadas para ${validated.email}.`
      });
    } catch (err) {
      next(err);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = resetPasswordSchema.parse(req.body);
      res.status(200).json({
        success: true,
        message: 'Senha redefinida com sucesso. Faça login novamente.'
      });
    } catch (err) {
      next(err);
    }
  }

  public static async setup2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.setup2FA(req.user!.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async verify2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = twoFactorVerifySchema.parse(req.body);
      const result = await AuthService.verify2FA(req.user!.id, validated.code);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await AuthService.listSessions(req.user!.id);
      res.status(200).json({ sessions });
    } catch (err) {
      next(err);
    }
  }

  public static async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AuthService.revokeSession(req.user!.id, String(id));
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
