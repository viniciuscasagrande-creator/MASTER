import { prisma } from '../../core/database/prisma';
import { DomainEvent } from '../../events/event.types';
import { RecipientResolverService } from './recipient-resolver.service';
import { NotificationTemplateService } from './template.service';
import { GroupingService } from './grouping.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { AuditService } from '../audit/audit.service';

export class NotificationService {
  /**
   * Main Event Consumer: Process domain event, resolve recipients, group/deduplicate, persist and push via WebSocket
   */
  public static async processDomainEvent(event: DomainEvent): Promise<any> {
    // 1. Resolve strictly authorized recipients
    const recipientUserIds = await RecipientResolverService.resolveRecipients(event);

    if (recipientUserIds.length === 0) {
      // No authorized recipients for this event scope/permission
      return null;
    }

    // 2. Format actionable template
    const formatted = NotificationTemplateService.format(event);

    // 3. Check anti-noise grouping
    const grouping = await GroupingService.checkGrouping(
      formatted.groupKey,
      formatted.title,
      event.data
    );

    if (grouping.isAggregated && grouping.notificationId) {
      // Aggregated into existing notification. Fetch updated record and push update
      const existing = await prisma.notification.findUnique({
        where: { id: grouping.notificationId }
      });

      // Broadcast live update to recipients
      RealtimeService.broadcastNotification(recipientUserIds, {
        notification: existing,
        isUpdate: true
      });

      return existing;
    }

    // 4. Create new Notification record
    const notification = await prisma.notification.create({
      data: {
        type: formatted.type,
        priority: formatted.priority,
        module: formatted.module,
        title: formatted.title,
        description: formatted.description,
        groupKey: formatted.groupKey,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        actionUrl: formatted.actionUrl,
        producerId: event.producerId,
        eventId: event.eventId,
        metadata: JSON.stringify(event.data || {})
      }
    });

    // 5. Create recipient links for each resolved user
    for (const userId of recipientUserIds) {
      await prisma.notificationRecipient.create({
        data: {
          notificationId: notification.id,
          userId,
          status: 'UNREAD'
        }
      });
    }

    // 6. Push real-time WebSocket alert directly to online recipients
    RealtimeService.broadcastNotification(recipientUserIds, {
      notification,
      unreadCountIncrement: 1
    });

    return notification;
  }

  /**
   * List notifications for a specific user with filtering
   */
  public static async listUserNotifications(
    userId: string,
    filters?: {
      status?: 'UNREAD' | 'READ' | 'ARCHIVED';
      module?: string;
      priority?: string;
    }
  ) {
    const recipientWhere: any = { userId };
    if (filters?.status) {
      recipientWhere.status = filters.status;
    } else {
      // Exclude archived from default inbox
      recipientWhere.status = { in: ['UNREAD', 'READ'] };
    }

    const recipientLinks = await prisma.notificationRecipient.findMany({
      where: recipientWhere,
      include: { notification: true }
    });

    let results = recipientLinks.map((rl: any) => ({
      id: rl.id,
      notificationId: rl.notificationId,
      status: rl.status,
      readAt: rl.readAt,
      archivedAt: rl.archivedAt,
      createdAt: rl.createdAt,
      notification: rl.notification
    }));

    if (filters?.module && filters.module !== 'all') {
      results = results.filter((r: any) => r.notification?.module === filters.module);
    }
    if (filters?.priority && filters.priority !== 'all') {
      results = results.filter((r: any) => r.notification?.priority === filters.priority);
    }

    return results;
  }

  /**
   * Get unread notification count for a user
   */
  public static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notificationRecipient.count({
      where: {
        userId,
        status: 'UNREAD'
      }
    });
  }

  /**
   * Mark a notification as READ for a user
   */
  public static async markAsRead(recipientIdOrNotifId: string, userId: string) {
    // Locate recipient record
    const record = await prisma.notificationRecipient.findFirst({
      where: {
        OR: [
          { id: recipientIdOrNotifId, userId },
          { notificationId: recipientIdOrNotifId, userId }
        ]
      }
    });

    if (!record) {
      return null;
    }

    return prisma.notificationRecipient.update({
      where: { id: record.id },
      data: {
        status: 'READ',
        readAt: new Date()
      }
    });
  }

  /**
   * Mark all unread notifications as READ for a user
   */
  public static async markAllAsRead(userId: string) {
    return prisma.notificationRecipient.updateMany({
      where: {
        userId,
        status: 'UNREAD'
      },
      data: {
        status: 'READ',
        readAt: new Date()
      }
    });
  }

  /**
   * Archive a notification
   */
  public static async archiveNotification(recipientIdOrNotifId: string, userId: string) {
    const record = await prisma.notificationRecipient.findFirst({
      where: {
        OR: [
          { id: recipientIdOrNotifId, userId },
          { notificationId: recipientIdOrNotifId, userId }
        ]
      }
    });

    if (!record) {
      return null;
    }

    return prisma.notificationRecipient.update({
      where: { id: record.id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date()
      }
    });
  }

  /**
   * Get user notification preferences
   */
  public static async getUserPreferences(userId: string) {
    return prisma.notificationPreference.findMany({
      where: { userId }
    });
  }

  /**
   * Update user notification preferences
   */
  public static async updatePreference(userId: string, module: string, channel = 'IN_APP', isEnabled: boolean) {
    // Check if module is mandatory (e.g. security alerts cannot be disabled)
    if (module.toUpperCase() === 'SECURITY' && !isEnabled) {
      throw new Error('Alertas de segurança e compliance são obrigatórios e não podem ser desativados.');
    }

    return prisma.notificationPreference.upsert({
      where: {
        userId_module_channel: {
          userId,
          module: module.toLowerCase(),
          channel
        }
      },
      create: {
        userId,
        module: module.toLowerCase(),
        channel,
        isEnabled
      },
      update: {
        isEnabled
      }
    });
  }
}
