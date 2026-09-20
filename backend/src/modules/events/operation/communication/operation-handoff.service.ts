import { prisma } from '../../../../core/database/prisma';
import { OperationHandoffDTO } from '@shared/types/index';
import { OperationTimelineService } from '../timeline/operation-timeline.service';
import { AuditService } from '../../../audit/audit.service';

export class OperationHandoffService {
  public static async registerHandoff(params: {
    operationId: string;
    eventId: string;
    areaId?: string | null;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    notes: string;
  }): Promise<OperationHandoffDTO> {
    const { operationId, eventId, areaId, fromUserId, fromUserName, toUserId, toUserName, notes } = params;

    let areaName: string | null = null;
    let areaCode: string | null = null;
    if (areaId) {
      const area = await prisma.eventOperationArea.findUnique({ where: { id: areaId } });
      if (area) {
        areaName = area.name;
        areaCode = area.areaCode;
      }
    }

    // Capture open incidents count
    const incidents = await prisma.supportTicket.findMany({
      where: {
        eventId,
        type: 'INCIDENT',
        status: 'OPEN',
        ...(areaCode ? { areaCode } : {})
      }
    });

    // Capture open tasks count
    const tasks = await prisma.eventTask.findMany({
      where: { eventId, status: 'OPEN' }
    });

    const record = await prisma.operationHandoff.create({
      data: {
        operationId,
        areaId: areaId || null,
        areaName,
        fromUserId,
        fromUserName,
        toUserId,
        toUserName,
        notes,
        openIncidentsCount: incidents.length,
        openTasksCount: tasks.length
      }
    });

    // Timeline event
    OperationTimelineService.addEvent({
      operationId,
      category: 'COMMAND',
      severity: 'INFO',
      title: `Passagem de Turno${areaName ? ` - ${areaName}` : ''}`,
      description: `De ${fromUserName} para ${toUserName}. Pendências ativas: ${incidents.length} incidentes, ${tasks.length} tarefas.`,
      actorName: fromUserName,
      metadata: { handoffId: record.id, fromUserId, toUserId, areaId }
    });

    // Audit log
    await AuditService.log({
      action: 'OPERATION_SHIFT_HANDOFF',
      resource: 'OPERATION_HANDOFF',
      resourceId: record.id,
      userId: fromUserId,
      details: { operationId, eventId, toUserId, openIncidentsCount: incidents.length, openTasksCount: tasks.length }
    });

    return {
      id: record.id,
      operationId: record.operationId,
      areaId: record.areaId,
      areaName: record.areaName || undefined,
      fromUserId: record.fromUserId,
      fromUserName: record.fromUserName,
      toUserId: record.toUserId,
      toUserName: record.toUserName,
      notes: record.notes,
      openIncidentsCount: record.openIncidentsCount,
      openTasksCount: record.openTasksCount,
      createdAt: new Date(record.createdAt).toISOString()
    };
  }

  public static async listHandoffs(operationId: string): Promise<OperationHandoffDTO[]> {
    const list = await prisma.operationHandoff.findMany({
      where: { operationId },
      orderBy: { createdAt: 'desc' }
    });

    return list.map((h: any) => ({
      id: h.id,
      operationId: h.operationId,
      areaId: h.areaId,
      areaName: h.areaName || undefined,
      fromUserId: h.fromUserId,
      fromUserName: h.fromUserName,
      toUserId: h.toUserId,
      toUserName: h.toUserName,
      notes: h.notes,
      openIncidentsCount: h.openIncidentsCount,
      openTasksCount: h.openTasksCount,
      createdAt: new Date(h.createdAt).toISOString()
    }));
  }
}
