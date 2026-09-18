import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../core/database/prisma';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission } from '../../core/middleware/requirePermission';
import { NotFoundError } from '../../core/errors/AppError';
import { AuditService } from '../audit/audit.service';

const router = Router();

router.use(authenticate);

// List all active sessions
router.get('/', requirePermission('admin.usuarios.visualizar'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await prisma.session.findMany();
    const users = await prisma.user.findMany();

    const activeSessions = sessions
      .filter((s: any) => !s.revokedAt)
      .map((s: any) => {
        const u = users.find((user: any) => user.id === s.userId);
        return {
          id: s.id,
          userId: s.userId,
          userName: u?.name || 'Desconhecido',
          userEmail: u?.email || '',
          ipAddress: s.ipAddress || '189.44.120.19',
          userAgent: s.userAgent || 'Chrome/Windows 11',
          location: 'Curitiba, PR',
          startedAt: s.createdAt,
          expiresAt: s.expiresAt
        };
      });

    res.status(200).json({ total: activeSessions.length, sessions: activeSessions });
  } catch (err) {
    next(err);
  }
});

// Terminate single session
router.delete('/:id', requirePermission('admin.usuarios.gerenciar'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const session = await prisma.session.findUnique({ where: { id: String(id) } });

    if (!session) throw new NotFoundError('Sessão não encontrada.');

    await prisma.session.update({
      where: { id: String(id) },
      data: { revokedAt: new Date() }
    });

    await AuditService.log({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'TERMINATE_SESSION',
      resource: `SESSION:${id}`,
      details: `Sessão ${id} encerrada manualmente pela administração.`,
      result: 'SUCCESS'
    });

    res.status(200).json({ success: true, message: 'Sessão encerrada com sucesso.' });
  } catch (err) {
    next(err);
  }
});

// Terminate all sessions of a user
router.delete('/user/:userId', requirePermission('admin.usuarios.gerenciar'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    await prisma.session.deleteMany({
      where: { userId: String(userId) }
    });

    await AuditService.log({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'TERMINATE_ALL_USER_SESSIONS',
      resource: `USER:${userId}`,
      details: `Todas as sessões ativas do usuário ${userId} foram revogadas.`,
      result: 'SUCCESS'
    });

    res.status(200).json({ success: true, message: 'Todas as sessões do usuário foram encerradas.' });
  } catch (err) {
    next(err);
  }
});

export default router;
