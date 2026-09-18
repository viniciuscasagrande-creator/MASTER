import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../../modules/audit/audit.service';

/**
 * Middleware requirePermission:
 * Enforces that the user has the required permission code (or isSuperAdmin).
 */
export const requirePermission = (permissionCode: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        error: '401 — Não autenticado.',
        statusCode: 401
      });
      return;
    }

    // 1. Super Admin universal bypass
    if (user.isSuperAdmin) {
      return next();
    }

    // 2. Granular permission check
    if (!user.permissions.includes(permissionCode)) {
      await AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'PERMISSION_DENIED_403',
        resource: req.originalUrl,
        details: `Permissão '${permissionCode}' requerida, mas ausente nas credenciais do usuário.`,
        ipAddress: req.ip || '127.0.0.1',
        result: 'DENIED'
      });

      res.status(403).json({
        error: 'Você não possui permissão para realizar esta operação.',
        statusCode: 403,
        details: {
          requiredPermission: permissionCode,
          userRoles: user.roles
        }
      });
      return;
    }

    next();
  };
};

/**
 * Helper requireAnyPermission:
 * Allows access if the user has AT LEAST ONE of the specified permission codes.
 */
export const requireAnyPermission = (permissionCodes: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        error: '401 — Não autenticado.',
        statusCode: 401
      });
      return;
    }

    if (user.isSuperAdmin) {
      return next();
    }

    const hasAny = permissionCodes.some(code => user.permissions.includes(code));
    if (!hasAny) {
      await AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'PERMISSION_DENIED_403',
        resource: req.originalUrl,
        details: `Nenhuma das permissões requeridas (${permissionCodes.join(', ')}) foi atendida.`,
        ipAddress: req.ip || '127.0.0.1',
        result: 'DENIED'
      });

      res.status(403).json({
        error: 'Você não possui permissão para realizar esta operação.',
        statusCode: 403,
        details: {
          requiredAnyOf: permissionCodes,
          userRoles: user.roles
        }
      });
      return;
    }

    next();
  };
};
