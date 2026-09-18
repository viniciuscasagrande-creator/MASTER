import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../core/database/prisma';
import { NotFoundError } from '../../core/errors/AppError';
import { AuditService } from '../audit/audit.service';

export class RolesController {
  public static async listRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await prisma.role.findMany({
        include: {
          rolePermissions: {
            include: { permission: true }
          }
        }
      });
      res.status(200).json({ total: roles.length, roles });
    } catch (err) {
      next(err);
    }
  }

  public static async getRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const role = await prisma.role.findUnique({
        where: { id: String(id) },
        include: {
          rolePermissions: {
            include: { permission: true }
          }
        }
      });

      if (!role) throw new NotFoundError('Perfil não encontrado.');
      res.status(200).json({ role });
    } catch (err) {
      next(err);
    }
  }

  public static async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, code, description } = req.body;

      const role = await prisma.role.create({
        data: { name, code, description }
      });

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'CREATE_ROLE',
        resource: `ROLE:${role.id}`,
        details: `Novo perfil criado: ${role.name} (${role.code}).`,
        result: 'SUCCESS'
      });

      res.status(201).json({ success: true, role });
    } catch (err) {
      next(err);
    }
  }

  public static async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const updated = await prisma.role.update({
        where: { id: String(id) },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description })
        }
      });

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'UPDATE_ROLE',
        resource: `ROLE:${id}`,
        details: `Perfil ${updated.name} atualizado.`,
        result: 'SUCCESS'
      });

      res.status(200).json({ success: true, role: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async listPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await prisma.permission.findMany();
      res.status(200).json({ total: permissions.length, permissions });
    } catch (err) {
      next(err);
    }
  }

  public static async assignPermissionToRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { permissionId } = req.body;

      const record = await prisma.rolePermission.create({
        data: { roleId: String(id), permissionId: String(permissionId) }
      });

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'ASSIGN_PERMISSION_ROLE',
        resource: `ROLE:${id}`,
        details: `Permissão ${permissionId} vinculada ao perfil ${id}.`,
        result: 'SUCCESS'
      });

      res.status(200).json({ success: true, record });
    } catch (err) {
      next(err);
    }
  }

  public static async removePermissionFromRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, permissionId } = req.params;

      await prisma.rolePermission.deleteMany({
        where: { roleId: String(id), permissionId: String(permissionId) }
      });

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'REMOVE_PERMISSION_ROLE',
        resource: `ROLE:${id}`,
        details: `Permissão ${permissionId} desvinculada do perfil ${id}.`,
        result: 'SUCCESS'
      });

      res.status(200).json({ success: true, message: 'Permissão desvinculada do perfil.' });
    } catch (err) {
      next(err);
    }
  }
}
