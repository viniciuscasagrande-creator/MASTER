import { prisma } from '../../../core/database/prisma';
import { EventArchiveRecordDTO } from '@shared/types/index';
import { AuditService } from '../../audit/audit.service';

export class EventArchiveService {
  /**
   * Archives an event that has completed its lifecycle (FINISHED or CANCELLED).
   * After archival, the event enters strict read-only mode.
   */
  public static async archiveEvent(params: {
    eventId: string;
    justification: string;
    archivedBy: string;
    archivedByName: string;
  }): Promise<EventArchiveRecordDTO> {
    const event = await prisma.event.findUnique({ where: { id: params.eventId } });
    if (!event) throw new Error('Evento não encontrado.');

    if (event.status === 'ARCHIVED') {
      const existing = await prisma.eventArchiveRecord.findUnique({ where: { eventId: params.eventId } });
      if (existing) return this.mapToDTO(existing);
      throw new Error('O evento já se encontra arquivado.');
    }

    // Lifecycle invariant: Only FINISHED or CANCELLED events can be archived
    if (event.status !== 'FINISHED' && event.status !== 'CANCELLED') {
      throw new Error(`Apenas eventos encerrados (FINISHED) ou cancelados (CANCELLED) podem ser arquivados. Status atual: ${event.status}`);
    }

    if (!params.justification || params.justification.trim().length < 5) {
      throw new Error('Justificativa para arquivamento é obrigatória.');
    }

    const now = new Date();
    const statusBefore = event.status;

    // Find snapshot or cancellation request if available
    const snapshot = await prisma.eventClosureSnapshot.findFirst({ where: { eventId: params.eventId } });
    const cancelReq = await prisma.eventCancellationRequest.findFirst({ where: { eventId: params.eventId, status: 'EXECUTED' } });

    // 1. Update event status in database to ARCHIVED
    await prisma.event.update({
      where: { id: params.eventId },
      data: {
        status: 'ARCHIVED',
        archivedAt: now,
        updatedAt: now
      }
    });

    // 2. Create EventArchiveRecord
    const record = await prisma.eventArchiveRecord.create({
      data: {
        eventId: params.eventId,
        eventName: event.name,
        statusBeforeArchive: statusBefore,
        archivedBy: params.archivedBy,
        archivedByName: params.archivedByName,
        archivedAt: now,
        justification: params.justification.trim(),
        closureSnapshotId: snapshot?.id || null,
        cancellationRequestId: cancelReq?.id || null,
        readOnlyEnforced: true
      }
    });

    // 3. Publish outbox event
    await prisma.outboxRecords.push({
      id: `out_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      aggregateType: 'EVENT',
      aggregateId: params.eventId,
      eventType: 'EVENT_ARCHIVED',
      payload: JSON.stringify({
        eventId: params.eventId,
        eventName: event.name,
        statusBefore,
        archivedAt: now.toISOString()
      }),
      status: 'PENDING',
      createdAt: now
    });

    await AuditService.log({
      action: 'EVENT_ARCHIVED',
      resource: 'event',
      resourceId: params.eventId,
      userId: params.archivedBy,
      details: {
        statusBefore,
        justification: params.justification
      }
    });

    return this.mapToDTO(record);
  }

  /**
   * Lists all archived event records.
   */
  public static async listArchived(): Promise<EventArchiveRecordDTO[]> {
    const list = await prisma.eventArchiveRecord.findMany({
      orderBy: { archivedAt: 'desc' }
    });
    return list.map((a: any) => this.mapToDTO(a));
  }

  /**
   * Gets archive record for a specific event.
   */
  public static async getByEventId(eventId: string): Promise<EventArchiveRecordDTO | null> {
    const record = await prisma.eventArchiveRecord.findUnique({
      where: { eventId }
    });
    return record ? this.mapToDTO(record) : null;
  }

  private static mapToDTO(a: any): EventArchiveRecordDTO {
    return {
      id: a.id,
      eventId: a.eventId,
      eventName: a.eventName,
      statusBeforeArchive: a.statusBeforeArchive,
      archivedBy: a.archivedBy,
      archivedByName: a.archivedByName,
      archivedAt: new Date(a.archivedAt).toISOString(),
      justification: a.justification,
      closureSnapshotId: a.closureSnapshotId || undefined,
      cancellationRequestId: a.cancellationRequestId || undefined,
      readOnlyEnforced: a.readOnlyEnforced ?? true
    };
  }
}
