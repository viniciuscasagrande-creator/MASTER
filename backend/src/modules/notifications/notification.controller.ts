import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { prisma } from '../../core/database/prisma';
import { AuditService } from '../audit/audit.service';

export class NotificationController {
  public static async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { status, module, priority } = req.query;

      const notifications = await NotificationService.listUserNotifications(user.id, {
        status: status as any,
        module: module as string,
        priority: priority as string
      });

      res.status(200).json({
        total: notifications.length,
        notifications
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const unreadCount = await NotificationService.getUnreadCount(user.id);
      res.status(200).json({ unreadCount });
    } catch (err) {
      next(err);
    }
  }

  public static async getNotificationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      const record = await prisma.notificationRecipient.findFirst({
        where: {
          notificationId: String(id),
          userId: user.id
        },
        include: { notification: true }
      });

      if (!record) {
        res.status(404).json({ error: 'Notificação não encontrada.' });
        return;
      }

      res.status(200).json({ notification: record });
    } catch (err) {
      next(err);
    }
  }

  public static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      const updated = await NotificationService.markAsRead(String(id), user.id);
      if (!updated) {
        res.status(404).json({ error: 'Notificação não encontrada.' });
        return;
      }

      res.status(200).json({ success: true, updated });
    } catch (err) {
      next(err);
    }
  }

  public static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const result = await NotificationService.markAllAsRead(user.id);
      res.status(200).json({ success: true, markedCount: result.count });
    } catch (err) {
      next(err);
    }
  }

  public static async archiveNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;

      const updated = await NotificationService.archiveNotification(String(id), user.id);
      if (!updated) {
        res.status(404).json({ error: 'Notificação não encontrada.' });
        return;
      }

      res.status(200).json({ success: true, message: 'Notificação arquivada.' });
    } catch (err) {
      next(err);
    }
  }

  public static async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const preferences = await NotificationService.getUserPreferences(user.id);
      res.status(200).json({ preferences });
    } catch (err) {
      next(err);
    }
  }

  public static async updatePreference(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { module, channel, isEnabled } = req.body;

      if (!module || isEnabled === undefined) {
        res.status(400).json({ error: 'Campos module e isEnabled são obrigatórios.' });
        return;
      }

      const pref = await NotificationService.updatePreference(user.id, module, channel || 'IN_APP', isEnabled);

      await AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'UPDATE_NOTIFICATION_PREFERENCE',
        resource: `PREFERENCE:${module}`,
        details: `Preferência do módulo '${module}' alterada para: ${isEnabled ? 'Habilitada' : 'Desabilitada'}.`,
        result: 'SUCCESS'
      });

      res.status(200).json({ success: true, preference: pref });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao atualizar preferência.' });
    }
  }

  // --- Admin Endpoints ---

  public static async listRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rules = await prisma.notificationRule.findMany();
      res.status(200).json({ total: rules.length, rules });
    } catch (err) {
      next(err);
    }
  }

  public static async createRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventType, requiredPerm, defaultPriority, type, isMandatory } = req.body;

      const rule = await prisma.notificationRule.create({
        data: {
          eventType,
          requiredPerm,
          defaultPriority: defaultPriority || 'NORMAL',
          type: type || 'INFO',
          isMandatory: isMandatory || false
        }
      });

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'CREATE_NOTIFICATION_RULE',
        resource: `RULE:${eventType}`,
        details: `Regra de notificação para '${eventType}' criada.`,
        result: 'SUCCESS'
      });

      res.status(201).json({ success: true, rule });
    } catch (err) {
      next(err);
    }
  }

  public static async listDeliveries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const outbox = await prisma.eventOutbox.findMany();
      res.status(200).json({ total: outbox.length, outbox });
    } catch (err) {
      next(err);
    }
  }
}
