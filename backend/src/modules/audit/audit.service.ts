import { prisma } from '../../core/database/prisma';

export interface LogAuditParams {
  userId?: string;
  userName?: string;
  action: string;
  resource: string;
  producerId?: string;
  eventId?: string;
  details?: string;
  ipAddress?: string;
  result?: 'SUCCESS' | 'DENIED' | 'FAILED';
}

export class AuditService {
  public static async log(params: LogAuditParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId: params.userId,
          userName: params.userName,
          action: params.action,
          resource: params.resource,
          producerId: params.producerId,
          eventId: params.eventId,
          details: params.details,
          ipAddress: params.ipAddress || '127.0.0.1',
          result: params.result || 'SUCCESS'
        }
      });
    } catch (err) {
      console.error('[AuditService Error]:', err);
    }
  }

  public static async listLogs(filters?: { userId?: string; action?: string }) {
    return prisma.auditLog.findMany({
      where: filters
    });
  }
}
