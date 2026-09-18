import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../core/database/prisma';
import { hashPassword } from '../../core/security/password';
import { NotFoundError } from '../../core/errors/AppError';
import { AuditService } from '../audit/audit.service';

export class UsersAdminController {
  public static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        include: {
          userRoles: { include: { role: true } },
          userPermissions: { include: { permission: true } },
          producerAccesses: { include: { producer: true } },
          eventAccesses: { include: { event: true } }
        }
      });

      res.status(200).json({ total: users.length, users });
    } catch (err) {
      next(err);
    }
  }

  public static async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id: String(id) },
        include: {
          userRoles: { include: { role: true } },
          userPermissions: { include: { permission: true } },
          producerAccesses: { include: { producer: true } },
          eventAccesses: { include: { event: true } }
        }
      });

      if (!user) throw new NotFoundError('Usuário não encontrado.');
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }

  public static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, isSuperAdmin, status, roleId } = req.body;

      const passwordHash = await hashPassword(password || 'SenhaPadrao2026!');
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          isSuperAdmin: Boolean(isSuperAdmin),
          status: status || 'ACTIVE'
        }
      });

      if (roleId) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId }
        });
      }

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'CREATE_USER',
        resource: `USER:${user.id}`,
        details: `Usuário ${user.name} (${user.email}) criado pela administração.`,
        result: 'SUCCESS'
      });

      res.status(201).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  public static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, status, isSuperAdmin } = req.body;

      const updated = await prisma.user.update({
        where: { id: String(id) },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(status && { status }),
          ...(isSuperAdmin !== undefined && { isSuperAdmin: Boolean(isSuperAdmin) })
        }
      });

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'UPDATE_USER',
        resource: `USER:${id}`,
        details: `Cadastro do usuário ${updated.name} atualizado.`,
        result: 'SUCCESS'
      });

      res.status(200).json({ success: true, user: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { roleId } = req.body;

      const userRole = await prisma.userRole.create({
        data: { userId: String(id), roleId: String(roleId) }
      });

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'ASSIGN_ROLE',
        resource: `USER:${id}`,
        details: `Perfil ${roleId} associado ao usuário ${id}.`,
        result: 'SUCCESS'
      });

      res.status(200).json({ success: true, userRole });
    } catch (err) {
      next(err);
    }
  }

  public static async removeRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, roleId } = req.params;

      await prisma.userRole.deleteMany({
        where: { userId: String(id), roleId: String(roleId) }
      });

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'REMOVE_ROLE',
        resource: `USER:${id}`,
        details: `Perfil ${roleId} removido do usuário ${id}.`,
        result: 'SUCCESS'
      });

      res.status(200).json({ success: true, message: 'Perfil desvinculado com sucesso.' });
    } catch (err) {
      next(err);
    }
  }

  public static async setPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { permissionId, isGranted } = req.body;

      const userPermission = await prisma.userPermission.create({
        data: {
          userId: String(id),
          permissionId: String(permissionId),
          isGranted: isGranted ?? true
        }
      });

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'UPDATE_USER_PERMISSION',
        resource: `USER:${id}`,
        details: `Permissão ${permissionId} ${isGranted === false ? 'revogada' : 'concedida'} diretamente ao usuário.`,
        result: 'SUCCESS'
      });

      res.status(200).json({ success: true, userPermission });
    } catch (err) {
      next(err);
    }
  }

  public static async assignProducer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { producerId } = req.body;

      const access = await prisma.userProducerAccess.create({
        data: { userId: String(id), producerId: String(producerId) }
      });

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'ASSIGN_PRODUCER_SCOPE',
        resource: `USER:${id}`,
        producerId: String(producerId),
        details: `Acesso ao produtor ${producerId} concedido ao usuário ${id}.`,
        result: 'SUCCESS'
      });

      res.status(200).json({ success: true, access });
    } catch (err) {
      next(err);
    }
  }

  public static async assignEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { eventId } = req.body;

      const access = await prisma.userEventAccess.create({
        data: { userId: String(id), eventId: String(eventId) }
      });

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'ASSIGN_EVENT_SCOPE',
        resource: `USER:${id}`,
        eventId: String(eventId),
        details: `Acesso ao evento ${eventId} concedido ao usuário ${id}.`,
        result: 'SUCCESS'
      });

      res.status(200).json({ success: true, access });
    } catch (err) {
      next(err);
    }
  }

  public static async blockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const updated = await prisma.user.update({
        where: { id: String(id) },
        data: { status: 'BLOCKED' }
      });

      // Revoke all active sessions
      await prisma.session.deleteMany({
        where: { userId: String(id) }
      });

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'BLOCK_USER',
        resource: `USER:${id}`,
        details: `Usuário ${updated.name} suspenso/bloqueado pela governança. Todas as sessões foram invalidadas.`,
        result: 'SUCCESS'
      });

      res.status(200).json({ success: true, message: `Usuário ${updated.name} bloqueado com sucesso.`, user: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async unblockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const updated = await prisma.user.update({
        where: { id: String(id) },
        data: { status: 'ACTIVE' }
      });

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'UNBLOCK_USER',
        resource: `USER:${id}`,
        details: `Usuário ${updated.name} reativado pela governança.`,
        result: 'SUCCESS'
      });

      res.status(200).json({ success: true, message: `Usuário ${updated.name} reativado com sucesso.`, user: updated });
    } catch (err) {
      next(err);
    }
  }
}
