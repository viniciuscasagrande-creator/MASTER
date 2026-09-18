import { Request, Response, NextFunction } from 'express';
import { db } from '../core/database/index';
import { ROLES_CATALOG } from '../roles/rolesCatalog';
import { PERMISSIONS_CATALOG } from '../permissions/permissionsCatalog';
import { NotFoundError } from '../core/errors/AppError';

export class UsersController {
  public static listUsers(req: Request, res: Response): void {
    res.json({
      total: db.users.length,
      users: db.users
    });
  }

  public static getUser(req: Request, res: Response, next: NextFunction): void {
    const { userId } = req.params;
    const user = db.getUserById(String(userId));

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    res.json({ user });
  }

  public static updateUser(req: Request, res: Response, next: NextFunction): void {
    const { userId } = req.params;
    const { permissions, scope, status, roleSlug } = req.body;

    const user = db.getUserById(String(userId));
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const previousRole = user.roleSlug;
    const previousPermissionsCount = user.permissions.length;

    if (permissions && Array.isArray(permissions)) {
      user.permissions = permissions;
    }
    if (scope && typeof scope === 'object') {
      user.scope = scope;
    }
    if (status && (status === 'active' || status === 'blocked' || status === 'pending_activation')) {
      user.status = status;
    }
    if (roleSlug) {
      const foundRole = ROLES_CATALOG.find(r => r.slug === roleSlug);
      if (foundRole) {
        user.roleSlug = foundRole.slug;
        user.roleName = foundRole.name;
      }
    }

    // Audit log
    const auditRecord = db.logAudit({
      userId: req.user?.id || 'sys-admin',
      userName: req.user?.name || 'Administrador',
      action: 'UPDATE_PERMISSIONS_SCOPE',
      module: 'ADMIN_USUARIOS',
      entityType: 'USER',
      entityId: user.id,
      details: `Permissões do usuário ${user.name} atualizadas: ${previousPermissionsCount} -> ${user.permissions.length} permissões. Perfil: ${previousRole} -> ${user.roleSlug}. Status: ${user.status}.`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.json({
      success: true,
      message: `Permissões de ${user.name} atualizadas com sucesso.`,
      user,
      auditId: auditRecord.id
    });
  }

  public static listRoles(req: Request, res: Response): void {
    res.json({ roles: ROLES_CATALOG });
  }

  public static listPermissions(req: Request, res: Response): void {
    res.json({ permissions: PERMISSIONS_CATALOG });
  }
}
