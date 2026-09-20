import { prisma } from '../../../../core/database/prisma';
import { OperationBroadcastDTO } from '@shared/types/index';
import { OperationTimelineService } from '../timeline/operation-timeline.service';
import { AuditService } from '../../../audit/audit.service';

export class OperationBroadcastService {
  public static async createBroadcast(params: {
    operationId: string;
    eventId: string;
    targetAreaId?: string | null;
    priority: 'INFO' | 'WARNING' | 'CRITICAL';
    title: string;
    message: string;
    sentBy: string;
    sentByName: string;
    requiresAck?: boolean;
  }): Promise<OperationBroadcastDTO> {
    const { operationId, eventId, targetAreaId, priority, title, message, sentBy, sentByName, requiresAck } = params;

    const record = await prisma.operationBroadcast.create({
      data: {
        operationId,
        targetAreaId: targetAreaId || null,
        priority,
        title,
        message,
        sentBy,
        sentByName,
        requiresAck: requiresAck ?? false
      }
    });

    let targetAreaName = 'Todas as áreas';
    if (targetAreaId) {
      const area = await prisma.eventOperationArea.findUnique({ where: { id: targetAreaId } });
      if (area) targetAreaName = area.name;
    }

    // Timeline event
    OperationTimelineService.addEvent({
      operationId,
      category: 'BROADCAST',
      severity: priority === 'CRITICAL' ? 'ERROR' : priority === 'WARNING' ? 'WARNING' : 'INFO',
      title: `Comunicado: ${title}`,
      description: `[${targetAreaName}] ${message}`,
      actorName: sentByName,
      metadata: { broadcastId: record.id, priority, targetAreaId }
    });

    // Audit log
    await AuditService.log({
      action: 'OPERATION_BROADCAST_SENT',
      resource: 'OPERATION_BROADCAST',
      resourceId: record.id,
      userId: sentBy,
      details: { operationId, eventId, priority, title, targetAreaId }
    });

    return {
      id: record.id,
      operationId: record.operationId,
      targetAreaId: record.targetAreaId,
      targetAreaName,
      priority: record.priority as any,
      title: record.title,
      message: record.message,
      sentBy: record.sentBy,
      sentByName: record.sentByName,
      sentAt: new Date(record.sentAt).toISOString(),
      requiresAck: record.requiresAck,
      acknowledgementsCount: 0
    };
  }

  public static async acknowledgeBroadcast(params: {
    broadcastId: string;
    userId: string;
    userName: string;
  }): Promise<any> {
    const { broadcastId, userId, userName } = params;
    const bcast = await prisma.operationBroadcast.findUnique({ where: { id: broadcastId } });
    if (!bcast) throw new Error('Comunicado não encontrado');

    const receipt = await prisma.operationBroadcastReceipt.upsert({
      where: {
        broadcastId_userId: { broadcastId, userId }
      },
      create: {
        broadcastId,
        userId,
        userName
      },
      update: {
        acknowledgedAt: new Date()
      }
    });

    return receipt;
  }

  public static async listBroadcasts(operationId: string): Promise<OperationBroadcastDTO[]> {
    const list = await prisma.operationBroadcast.findMany({
      where: { operationId },
      orderBy: { sentAt: 'desc' }
    });

    const areas = await prisma.eventOperationArea.findMany();

    return list.map((b: any) => {
      const area = b.targetAreaId ? areas.find((a: any) => a.id === b.targetAreaId) : null;
      return {
        id: b.id,
        operationId: b.operationId,
        targetAreaId: b.targetAreaId,
        targetAreaName: area ? area.name : 'Todas as áreas',
        priority: b.priority as any,
        title: b.title,
        message: b.message,
        sentBy: b.sentBy,
        sentByName: b.sentByName,
        sentAt: new Date(b.sentAt).toISOString(),
        requiresAck: b.requiresAck,
        acknowledgementsCount: b.receipts?.length || 0
      };
    });
  }
}
