import { prisma } from '../../../../core/database/prisma';
import { SessionAccessPointDTO } from '@shared/types/index';

export class SessionAccessPointService {
  public static async ensureSessionAccessPoints(eventId: string, sessionId: string, operationId: string): Promise<void> {
    const existing = await prisma.sessionAccessPoint.findMany({ where: { sessionId } });
    if (existing.length > 0) return;

    // Check venue access points linked to the event/venue
    const session = await prisma.eventSession.findUnique({ where: { id: sessionId } });
    let venueAps: any[] = [];
    if (session?.venueId) {
      venueAps = await prisma.venueAccessPoint.findMany({ where: { venueId: session.venueId } });
    }

    if (venueAps.length > 0) {
      for (const vap of venueAps) {
        await prisma.sessionAccessPoint.create({
          data: {
            operationId,
            sessionId,
            accessPointId: vap.id,
            name: vap.name,
            type: vap.type || 'ENTRY',
            status: 'CLOSED',
            executionMode: 'LOGICAL',
            validatedCount: 0,
            rejectedCount: 0
          }
        });
      }
    } else {
      // Default initial access points
      const defaults = [
        { name: 'Portão Principal - Norte', type: 'ENTRY' },
        { name: 'Portão Secundário - Sul', type: 'ENTRY' },
        { name: 'Acesso VIP / Hospitality', type: 'VIP' },
        { name: 'Saída de Emergência / Dispersão', type: 'EXIT' }
      ];
      for (let i = 0; i < defaults.length; i++) {
        const d = defaults[i];
        await prisma.sessionAccessPoint.create({
          data: {
            operationId,
            sessionId,
            accessPointId: `ap-default-${i + 1}`,
            name: d.name,
            type: d.type,
            status: 'CLOSED',
            executionMode: 'LOGICAL',
            validatedCount: 0,
            rejectedCount: 0
          }
        });
      }
    }
  }

  public static async listAccessPoints(sessionId: string): Promise<SessionAccessPointDTO[]> {
    const points = await prisma.sessionAccessPoint.findMany({ where: { sessionId } });
    return points.map((p: any) => ({
      id: p.id,
      operationId: p.operationId,
      sessionId: p.sessionId,
      accessPointId: p.accessPointId,
      name: p.name,
      type: p.type as any,
      status: p.status as any,
      executionMode: p.executionMode as any,
      openedAt: p.openedAt ? new Date(p.openedAt).toISOString() : null,
      closedAt: p.closedAt ? new Date(p.closedAt).toISOString() : null,
      validatedCount: p.validatedCount || 0,
      rejectedCount: p.rejectedCount || 0,
      lastActivityAt: p.lastActivityAt ? new Date(p.lastActivityAt).toISOString() : null
    }));
  }

  public static async updateStatus(
    id: string,
    status: 'OPEN' | 'CLOSED' | 'PAUSED',
    executionMode: 'LOGICAL' | 'INTEGRATION' = 'LOGICAL'
  ): Promise<any> {
    const ap = await prisma.sessionAccessPoint.findUnique({ where: { id } });
    if (!ap) throw new Error('Ponto de acesso não encontrado');

    const updateData: any = {
      status,
      executionMode,
      updatedAt: new Date()
    };

    if (status === 'OPEN' && !ap.openedAt) {
      updateData.openedAt = new Date();
    } else if (status === 'CLOSED') {
      updateData.closedAt = new Date();
    }

    return prisma.sessionAccessPoint.update({
      where: { id },
      data: updateData
    });
  }

  public static async recordValidation(id: string, success: boolean): Promise<any> {
    const ap = await prisma.sessionAccessPoint.findUnique({ where: { id } });
    if (!ap) return null;

    return prisma.sessionAccessPoint.update({
      where: { id },
      data: {
        validatedCount: success ? (ap.validatedCount || 0) + 1 : ap.validatedCount,
        rejectedCount: !success ? (ap.rejectedCount || 0) + 1 : ap.rejectedCount,
        lastActivityAt: new Date()
      }
    });
  }
}
