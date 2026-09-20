import { prisma } from '../../../../core/database/prisma';
import { OfflineSyncBatchDTO, OfflineConflictDTO } from '@shared/types/index';
import { TicketTokenService } from '../validation/ticket-token.service';
import { AuditService } from '../../../audit/audit.service';
import { OperationTimelineService } from '../../operation/timeline/operation-timeline.service';

export class OfflineSyncService {
  /**
   * Reconciles a batch of offline validations recorded on a local scanner.
   */
  public static async processOfflineBatch(batch: OfflineSyncBatchDTO): Promise<{
    batchId: string;
    itemsCount: number;
    acceptedCount: number;
    conflictsCount: number;
    conflicts: OfflineConflictDTO[];
  }> {
    const conflicts: any[] = [];
    let acceptedCount = 0;

    // Verify device
    const device = await prisma.accessDevice.findUnique({ where: { id: batch.deviceId } });
    if (!device) throw new Error('Dispositivo não cadastrado para sincronização.');

    for (const item of batch.items) {
      // 1. Parse code or token
      const parsed = TicketTokenService.parseTokenOrCode(item.tokenOrCode);

      // 2. Find ticket
      let ticket: any = null;
      if (parsed.ticketId) {
        ticket = await prisma.ticket.findUnique({ where: { id: parsed.ticketId } });
      }
      if (!ticket) {
        ticket = await prisma.ticket.findFirst({
          where: {
            OR: [
              { id: parsed.rawCode },
              { ticketCode: parsed.rawCode },
              { ticketCodeNormalized: parsed.rawCode.toUpperCase() }
            ]
          }
        });
      }

      if (!ticket) {
        // Unknown ticket scanned offline -> conflict
        const conflict = await prisma.offlineConflict.create({
          data: {
            batchId: batch.batchId,
            ticketId: 'UNKNOWN',
            ticketNumber: parsed.rawCode,
            conflictType: 'STATUS_CHANGED_ONLINE',
            offlineMovementAt: new Date(item.localTimestamp),
            deviceId: batch.deviceId,
            operatorId: batch.operatorId,
            resolved: false,
            resolutionNotes: 'Ingresso não encontrado no banco central durante conciliação offline.'
          }
        });
        conflicts.push(conflict);
        continue;
      }

      // 3. Conflict Detection: Was ticket entered online prior to or concurrently with this offline movement?
      const onlineEntries = await prisma.accessEntry.findMany({
        where: {
          ticketId: ticket.id,
          sessionId: batch.sessionId
        }
      });

      const hasOnlineEntry = onlineEntries.some((e: any) =>
        e.movementType === 'ENTRY' || e.movementType === 'REENTRY'
      );

      if (hasOnlineEntry && item.movementType === 'ENTRY') {
        // CONFLICT_DUPLICATE_OFFLINE! Same ticket was used online and offline!
        const serverEntry = onlineEntries[0];
        const conflict = await prisma.offlineConflict.create({
          data: {
            batchId: batch.batchId,
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber || ticket.ticketCode || ticket.id,
            conflictType: 'CONFLICT_DUPLICATE_OFFLINE',
            serverMovementAt: new Date(serverEntry.createdAt),
            offlineMovementAt: new Date(item.localTimestamp),
            deviceId: batch.deviceId,
            operatorId: batch.operatorId,
            resolved: false,
            resolutionNotes: `Ingresso já validado online no portão às ${new Date(serverEntry.createdAt).toLocaleTimeString('pt-BR')}. Entrada offline duplicada detectada.`
          }
        });
        conflicts.push(conflict);

        // Push alert to Operation Timeline
        const opSession = await prisma.eventOperationSession.findFirst({
          where: { sessionId: batch.sessionId }
        });
        if (opSession) {
          OperationTimelineService.addEvent({
            operationId: opSession.id,
            category: 'CHECKIN',
            severity: 'ERROR',
            title: 'Conflito Offline Duplicado!',
            description: `Ingresso ${ticket.ticketNumber || ticket.ticketCode} utilizado online e offline simultaneamente.`,
            actorName: 'Sincronizador Offline',
            metadata: { conflictId: conflict.id, ticketId: ticket.id }
          });
        }

      } else {
        // Valid offline entry accepted
        acceptedCount += 1;

        // Record AccessValidation
        const val = await prisma.accessValidation.create({
          data: {
            eventId: batch.eventId,
            sessionId: batch.sessionId,
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber || ticket.ticketCode || null,
            accessPointId: item.accessPointId || 'OFFLINE_GATE',
            deviceId: batch.deviceId,
            operatorId: batch.operatorId,
            decision: item.offlineDecision || 'ALLOW',
            reasonCode: item.offlineReasonCode || 'OFFLINE_SYNC_ACCEPTED',
            movementType: item.movementType,
            validationRequestId: item.validationRequestId,
            isOfflineProcessed: true,
            offlineTimestamp: new Date(item.localTimestamp),
            createdAt: new Date()
          }
        });

        if (item.offlineDecision === 'ALLOW') {
          await prisma.accessEntry.create({
            data: {
              ticketId: ticket.id,
              eventId: batch.eventId,
              sessionId: batch.sessionId,
              accessPointId: item.accessPointId || 'OFFLINE_GATE',
              deviceId: batch.deviceId,
              operatorId: batch.operatorId,
              movementType: item.movementType,
              validationId: val.id,
              createdAt: new Date(item.localTimestamp)
            }
          });

          await prisma.ticket.update({
            where: { id: ticket.id },
            data: { usedAt: new Date(item.localTimestamp), isUsed: true }
          });
        }
      }
    }

    // Record Batch
    await prisma.offlineSyncBatch.create({
      data: {
        batchId: batch.batchId,
        deviceId: batch.deviceId,
        eventId: batch.eventId,
        sessionId: batch.sessionId,
        operatorId: batch.operatorId,
        itemsCount: batch.items.length,
        acceptedCount,
        conflictsCount: conflicts.length,
        syncedAt: new Date()
      }
    });

    // Update device lastSyncAt
    await prisma.accessDevice.update({
      where: { id: batch.deviceId },
      data: { lastSyncAt: new Date() }
    });

    await AuditService.log({
      action: 'OFFLINE_BATCH_SYNCED',
      resource: 'offline_sync',
      resourceId: batch.batchId,
      userId: batch.operatorId,
      details: {
        total: batch.items.length,
        accepted: acceptedCount,
        conflicts: conflicts.length
      }
    });

    return {
      batchId: batch.batchId,
      itemsCount: batch.items.length,
      acceptedCount,
      conflictsCount: conflicts.length,
      conflicts: conflicts.map(c => this.mapConflictToDTO(c))
    };
  }

  /**
   * Lists unresolved conflicts for an event.
   */
  public static async listConflicts(eventId: string): Promise<OfflineConflictDTO[]> {
    const batches = await prisma.offlineSyncBatch.findMany({ where: { eventId } });
    const batchIds = batches.map((b: any) => b.batchId);

    const conflicts = await prisma.offlineConflict.findMany({
      where: {
        batchId: { in: batchIds }
      },
      orderBy: { createdAt: 'desc' }
    });

    return conflicts.map((c: any) => this.mapConflictToDTO(c));
  }

  /**
   * Resolves an offline conflict with supervisor notes.
   */
  public static async resolveConflict(conflictId: string, resolvedBy: string, notes: string): Promise<OfflineConflictDTO> {
    const conflict = await prisma.offlineConflict.findUnique({ where: { id: conflictId } });
    if (!conflict) throw new Error('Conflito não encontrado.');

    const updated = await prisma.offlineConflict.update({
      where: { id: conflictId },
      data: {
        resolved: true,
        resolvedBy,
        resolvedAt: new Date(),
        resolutionNotes: notes
      }
    });

    return this.mapConflictToDTO(updated);
  }

  private static mapConflictToDTO(c: any): OfflineConflictDTO {
    return {
      id: c.id,
      batchId: c.batchId,
      ticketId: c.ticketId,
      ticketNumber: c.ticketNumber,
      conflictType: c.conflictType,
      serverMovementAt: c.serverMovementAt ? new Date(c.serverMovementAt).toISOString() : undefined,
      offlineMovementAt: new Date(c.offlineMovementAt).toISOString(),
      deviceId: c.deviceId,
      operatorId: c.operatorId,
      resolved: c.resolved,
      resolvedBy: c.resolvedBy || undefined,
      resolvedAt: c.resolvedAt ? new Date(c.resolvedAt).toISOString() : undefined,
      resolutionNotes: c.resolutionNotes || undefined,
      createdAt: new Date(c.createdAt).toISOString()
    };
  }
}
