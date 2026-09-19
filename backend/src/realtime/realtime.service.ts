import { ConnectionManager } from './connection.manager';
import { RealtimeEnvelope } from './realtime.types';

export class RealtimeService {
  /**
   * Send notification to a specific user
   */
  public static sendNotification(userId: string, notification: any): void {
    const envelope: RealtimeEnvelope = {
      type: 'NOTIFICATION_NEW',
      timestamp: new Date().toISOString(),
      data: notification,
      channel: `user:${userId}`
    };
    ConnectionManager.sendToUser(userId, envelope);
  }

  /**
   * Broadcast notification to multiple resolved recipients
   */
  public static broadcastNotification(recipientUserIds: string[], notification: any): void {
    for (const userId of recipientUserIds) {
      this.sendNotification(userId, notification);
    }
  }

  /**
   * Broadcast real-time resource update (e.g. transfer approved, ticket scanned)
   */
  public static broadcastResourceUpdate(channel: string, resourceData: any): void {
    const envelope: RealtimeEnvelope = {
      type: 'RESOURCE_UPDATED',
      timestamp: new Date().toISOString(),
      data: resourceData,
      channel
    };
    ConnectionManager.broadcastToChannel(channel, envelope);
  }

  /**
   * Broadcast metric update to dashboard
   */
  public static broadcastMetricUpdate(channel: string, metricData: any): void {
    const envelope: RealtimeEnvelope = {
      type: 'DASHBOARD_UPDATE',
      timestamp: new Date().toISOString(),
      data: metricData,
      channel
    };
    ConnectionManager.broadcastToChannel(channel, envelope);
  }

  /**
   * Disconnect all active sockets for a revoked/blocked user
   */
  public static disconnectUser(userId: string, reason = 'Acesso revogado ou bloqueado'): void {
    ConnectionManager.terminateUserConnections(userId, reason);
  }
}
