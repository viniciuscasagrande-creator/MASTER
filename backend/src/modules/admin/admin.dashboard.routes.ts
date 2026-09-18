import { Router, Request, Response, NextFunction } from 'express';
import { prisma, memoryDb } from '../../core/database/prisma';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission } from '../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);

router.get('/dashboard', requirePermission('admin.usuarios.visualizar'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        userRoles: { include: { role: true } }
      }
    });

    const totalUsers = users.length;
    const activeUsers = users.filter((u: any) => u.status === 'ACTIVE').length;
    const blockedUsers = users.filter((u: any) => u.status === 'BLOCKED').length;

    const roles = await prisma.role.findMany();
    const sessions = await prisma.session.findMany({
      where: { revokedAt: null }
    });

    const auditLogs = await prisma.auditLog.findMany();
    const securityAlerts = auditLogs.filter((l: any) => l.result === 'DENIED' || l.action.includes('VIOLATION') || l.action.includes('BLOCKED')).length;

    // Distribution by role
    const roleCounts: Record<string, number> = {};
    for (const r of roles) {
      roleCounts[r.name] = 0;
    }

    for (const u of users) {
      for (const ur of u.userRoles || []) {
        const roleName = ur.role?.name || 'Sem Perfil';
        roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
      }
    }

    const accessByRole = Object.entries(roleCounts).map(([role, count]) => ({
      role,
      count,
      percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
    }));

    // Recent activities from audit
    const recentActivities = auditLogs.slice(0, 10).map((l: any) => ({
      id: l.id,
      user: l.userName || 'Sistema',
      action: l.action,
      resource: l.resource,
      result: l.result,
      details: l.details,
      timestamp: l.createdAt
    }));

    res.status(200).json({
      metrics: {
        totalUsers,
        activeUsers,
        blockedUsers,
        activePercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100 * 10) / 10 : 0,
        totalRoles: roles.length,
        activeSessions: sessions.length,
        securityAlerts
      },
      accessByRole,
      recentActivities
    });
  } catch (err) {
    next(err);
  }
});

export default router;
