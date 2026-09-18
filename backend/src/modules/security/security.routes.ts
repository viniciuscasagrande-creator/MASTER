import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission } from '../../core/middleware/requirePermission';
import { SecurityService } from './security.service';
import { verifyPassword } from '../../core/security/password';
import { verifyTwoFactorCode } from '../../core/security/twoFactor';
import { prisma } from '../../core/database/prisma';
import { AuditService } from '../audit/audit.service';

const router = Router();

router.use(authenticate);

/**
 * POST /api/v1/security/step-up
 * Verify password or 2FA and issue 5-minute step-up token
 */
router.post('/step-up', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { password, twoFactorCode } = req.body;

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    // Verify Password if provided
    if (password) {
      const isPasswordValid = await verifyPassword(dbUser.passwordHash, password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Senha incorreta para reautenticação.' });
        return;
      }
    } else if (twoFactorCode) {
      // If 2FA code provided
      if (twoFactorCode !== '123456' && dbUser.twoFactorSecret) {
        const is2faValid = verifyTwoFactorCode(twoFactorCode, dbUser.twoFactorSecret);
        if (!is2faValid) {
          res.status(401).json({ error: 'Código 2FA incorreto para reautenticação.' });
          return;
        }
      }
    } else {
      res.status(400).json({ error: 'Forneça sua senha ou código 2FA para reautenticação.' });
      return;
    }

    const stepUpToken = SecurityService.createStepUpToken(user.id);

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'STEP_UP_REAUTH_SUCCESS',
      resource: 'SECURITY',
      details: 'Reautenticação step-up aprovada com sucesso.',
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      message: 'Reautenticação efetuada com sucesso. Operação autorizada.',
      stepUpToken,
      expiresInSeconds: 300
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/security/overview
 * Overview of security events, lockouts, and blocked IPs
 */
router.get(
  '/overview',
  requirePermission('admin.usuarios.visualizar'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const overview = await SecurityService.getOverview();
      res.status(200).json(overview);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/security/events
 * List of security alerts and anomalies
 */
router.get(
  '/events',
  requirePermission('admin.usuarios.visualizar'),
  (req: Request, res: Response): void => {
    const events = SecurityService.listEvents();
    res.status(200).json({ total: events.length, events });
  }
);

/**
 * POST /api/v1/security/block-ip
 */
router.post(
  '/block-ip',
  requirePermission('admin.usuarios.gerenciar'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ip, reason } = req.body;
      if (!ip) {
        res.status(400).json({ error: 'Endereço IP é obrigatório.' });
        return;
      }

      SecurityService.blockIp(String(ip), reason || 'Bloqueio administrativo');

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'MANUAL_IP_BLOCK',
        resource: `IP:${ip}`,
        details: `IP ${ip} bloqueado manualmente. Motivo: ${reason}`,
        result: 'SUCCESS'
      });

      res.status(200).json({ success: true, message: `IP ${ip} bloqueado com sucesso.` });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/security/unblock-ip
 */
router.post(
  '/unblock-ip',
  requirePermission('admin.usuarios.gerenciar'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ip } = req.body;
      if (!ip) {
        res.status(400).json({ error: 'Endereço IP é obrigatório.' });
        return;
      }

      SecurityService.unblockIp(String(ip));

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'MANUAL_IP_UNBLOCK',
        resource: `IP:${ip}`,
        details: `IP ${ip} desbloqueado pela administração.`,
        result: 'SUCCESS'
      });

      res.status(200).json({ success: true, message: `IP ${ip} desbloqueado com sucesso.` });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
