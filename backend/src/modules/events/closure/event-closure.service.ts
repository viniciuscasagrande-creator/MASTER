import { prisma } from '../../../core/database/prisma';
import { EventClosureReadinessDTO, EventClosureRecordDTO, EventClosureSnapshotDTO } from '@shared/types/index';
import { ClosureCheckRegistry } from './checks/closure-check.registry';
import { ClosureOverrideService } from './overrides/closure-override.service';
import { AuditService } from '../../audit/audit.service';

export class EventClosureService {
  /**
   * Evaluates readiness to close entire event.
   */
  public static async getReadiness(eventId: string): Promise<EventClosureReadinessDTO> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Evento não encontrado.');

    const evalResult = await ClosureCheckRegistry.evaluateEventChecks(eventId);

    return {
      eventId,
      eventName: event.name,
      canClose: evalResult.canClose,
      allSessionsClosed: evalResult.allSessionsClosed,
      sessionsSummary: evalResult.sessionsSummary,
      checks: evalResult.checks,
      blockers: evalResult.blockers,
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Formally closes the event, transitioning status to FINISHED.
   */
  public static async closeEvent(params: {
    eventId: string;
    closedBy: string;
    closedByName: string;
    notes?: string;
  }): Promise<{
    closureRecord: EventClosureRecordDTO;
    snapshot: EventClosureSnapshotDTO;
  }> {
    const event = await prisma.event.findUnique({ where: { id: params.eventId } });
    if (!event) throw new Error('Evento não encontrado.');

    if (event.status === 'FINISHED' || event.status === 'ARCHIVED') {
      const existing = await prisma.eventClosureRecord.findUnique({ where: { eventId: params.eventId } });
      const snap = await prisma.eventClosureSnapshot.findFirst({ where: { eventId: params.eventId } });
      if (existing && snap) {
        return {
          closureRecord: this.mapRecordToDTO(existing),
          snapshot: this.mapSnapshotToDTO(snap)
        };
      }
    }

    // 1. Evaluate checks
    const readiness = await this.getReadiness(params.eventId);
    if (!readiness.canClose) {
      throw new Error(`Não é possível encerrar o evento: ${readiness.blockers.join(' ')}`);
    }

    // 2. Count overrides applied to event
    const overrides = await ClosureOverrideService.listOverrides('EVENT', params.eventId);
    const hadBlockerOverrides = overrides.length > 0;

    // 3. Consolidate snapshot metrics from real data
    const sessions = await prisma.eventSession.findMany({ where: { eventId: params.eventId } });
    const sessionClosureRecords = await prisma.sessionClosureRecord.findMany({ where: { eventId: params.eventId } });
    const tickets = await prisma.ticket.findMany({ where: { eventId: params.eventId } });
    const entries = await prisma.accessEntry.findMany({ where: { eventId: params.eventId } });
    const orders = await prisma.order.findMany({ where: { eventId: params.eventId } });

    const totalTicketsSold = tickets.length;
    const uniqueCheckedIn = new Set(entries.map((e: any) => e.ticketId)).size;
    const checkInRate = totalTicketsSold > 0 ? Math.round((uniqueCheckedIn / totalTicketsSold) * 1000) / 10 : 0;
    const totalGrossRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

    const incidents = await prisma.supportTicket.findMany({ where: { eventId: params.eventId, type: 'INCIDENT' } });
    const resolvedIncidents = incidents.filter((i: any) => i.status === 'CLOSED' || i.status === 'RESOLVED').length;

    const tasks = await prisma.eventTask.findMany({ where: { eventId: params.eventId } });
    const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED').length;

    const devices = await prisma.accessDevice.findMany({ where: { eventId: params.eventId } });
    const batches = await prisma.offlineSyncBatch.findMany({ where: { eventId: params.eventId } });
    const conflicts = await prisma.offlineConflict.findMany({
      where: { batchId: { in: batches.map((b: any) => b.batchId) } }
    });

    const now = new Date();

    // 4. Update Event Status in database to FINISHED
    const statusBefore = event.status;
    await prisma.event.update({
      where: { id: params.eventId },
      data: {
        status: 'FINISHED',
        updatedAt: now
      }
    });

    // 5. Create EventClosureRecord
    const closureRecord = await prisma.eventClosureRecord.create({
      data: {
        eventId: params.eventId,
        eventName: event.name,
        closedBy: params.closedBy,
        closedByName: params.closedByName,
        closedAt: now,
        statusBefore,
        statusAfter: 'FINISHED',
        hadBlockerOverrides,
        overridesCount: overrides.length,
        notes: params.notes || null
      }
    });

    // 6. Create EventClosureSnapshot
    const snapshot = await prisma.eventClosureSnapshot.create({
      data: {
        eventId: params.eventId,
        closedAt: now,
        sessionsCount: sessions.length,
        totalTicketsSold,
        totalCheckedIn: uniqueCheckedIn,
        checkInRate,
        totalOrdersCount: orders.length,
        totalGrossRevenue,
        snapshotData: JSON.stringify({
          incidentsSummary: {
            total: incidents.length,
            resolved: resolvedIncidents,
            unresolved: incidents.length - resolvedIncidents
          },
          tasksSummary: {
            total: tasks.length,
            completed: completedTasks,
            uncompleted: tasks.length - completedTasks
          },
          devicesSummary: {
            totalDevices: devices.length,
            offlineBatchesSynced: batches.length,
            conflictsRecorded: conflicts.length
          },
          closureRecords: sessionClosureRecords
        }),
        createdAt: now
      }
    });

    await AuditService.log({
      action: 'EVENT_CLOSED_FINISHED',
      resource: 'event',
      resourceId: params.eventId,
      userId: params.closedBy,
      details: {
        statusBefore,
        statusAfter: 'FINISHED',
        totalTicketsSold,
        uniqueCheckedIn
      }
    });

    return {
      closureRecord: this.mapRecordToDTO(closureRecord),
      snapshot: this.mapSnapshotToDTO(snapshot)
    };
  }

  private static mapRecordToDTO(r: any): EventClosureRecordDTO {
    return {
      id: r.id,
      eventId: r.eventId,
      eventName: r.eventName,
      closedBy: r.closedBy,
      closedByName: r.closedByName,
      closedAt: new Date(r.closedAt).toISOString(),
      statusBefore: r.statusBefore,
      statusAfter: r.statusAfter,
      hadBlockerOverrides: r.hadBlockerOverrides,
      overridesCount: r.overridesCount || 0,
      notes: r.notes || undefined
    };
  }

  private static mapSnapshotToDTO(s: any): EventClosureSnapshotDTO {
    const data = typeof s.snapshotData === 'string' ? JSON.parse(s.snapshotData || '{}') : (s.snapshotData || {});
    return {
      id: s.id,
      eventId: s.eventId,
      closedAt: new Date(s.closedAt).toISOString(),
      sessionsCount: s.sessionsCount || 0,
      totalTicketsSold: s.totalTicketsSold || 0,
      totalCheckedIn: s.totalCheckedIn || 0,
      checkInRate: s.checkInRate || 0,
      totalOrdersCount: s.totalOrdersCount || 0,
      totalGrossRevenue: s.totalGrossRevenue || 0,
      incidentsSummary: data.incidentsSummary || { total: 0, resolved: 0, unresolved: 0 },
      tasksSummary: data.tasksSummary || { total: 0, completed: 0, uncompleted: 0 },
      devicesSummary: data.devicesSummary || { totalDevices: 0, offlineBatchesSynced: 0, conflictsRecorded: 0 },
      closureRecords: data.closureRecords || []
    };
  }
}
