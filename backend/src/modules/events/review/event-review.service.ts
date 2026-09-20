import crypto from 'crypto';
import { prisma } from '../../../core/database/prisma';
import { EventReviewSnapshotDTO } from '@shared/types/index';
import { AuditService } from '../../audit/audit.service';

export class EventReviewService {
  /**
   * Gera a representação canônica e o hash SHA-256 da configuração do evento
   */
  static async generateConfigurationHash(eventId: string): Promise<{ hash: string; config: any; summary: any; eventName: string }> {
    const [
      event,
      venues,
      sections,
      sessions,
      ticketTypes,
      batches,
      channels,
      complimentaryConfigs
    ] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.eventVenue.findMany({ where: { eventId } }),
      prisma.eventSection.findMany({ where: { eventId } }),
      prisma.eventSession.findMany({ where: { eventId } }),
      (prisma as any).ticketType?.findMany?.({ where: { eventId } }) || [],
      (prisma as any).ticketBatch?.findMany?.({ where: { eventId } }) || [],
      (prisma as any).salesChannelConfig?.findMany?.({ where: { eventId } }) || [],
      (prisma as any).complimentaryConfig?.findMany?.({ where: { eventId } }) || []
    ]);

    if (!event) {
      throw new Error(`Evento ${eventId} não encontrado para cálculo de hash de configuração.`);
    }

    // Configuração normalizada para hashing
    const canonicalConfig = {
      event: {
        id: event.id,
        name: event.name,
        slug: event.slug,
        producerId: event.producerId
      },
      venues: (venues || []).map((v: any) => ({ id: v.id, venueId: v.venueId, name: v.name })).sort((a: any, b: any) => a.id.localeCompare(b.id)),
      sections: (sections || []).map((s: any) => ({ id: s.id, name: s.name, capacity: s.capacity, active: s.active })).sort((a: any, b: any) => a.id.localeCompare(b.id)),
      sessions: (sessions || []).map((s: any) => ({ id: s.id, name: s.name, sessionDate: s.sessionDate, status: s.status })).sort((a: any, b: any) => a.id.localeCompare(b.id)),
      ticketTypes: (ticketTypes || []).map((t: any) => ({ id: t.id, name: t.name, basePrice: t.basePrice, active: t.active })).sort((a: any, b: any) => a.id.localeCompare(b.id)),
      batches: (batches || []).map((b: any) => ({ id: b.id, name: b.name, price: b.price, totalQuantity: b.totalQuantity, status: b.status })).sort((a: any, b: any) => a.id.localeCompare(b.id)),
      channels: (channels || []).map((c: any) => ({ id: c.id, channelType: c.channelType, enabled: c.enabled, commissionPercentage: c.commissionPercentage })).sort((a: any, b: any) => a.id.localeCompare(b.id)),
      complimentary: (complimentaryConfigs || []).map((c: any) => ({ id: c.id, quota: c.quota, enabled: c.enabled })).sort((a: any, b: any) => a.id.localeCompare(b.id))
    };

    const hash = crypto.createHash('sha256').update(JSON.stringify(canonicalConfig)).digest('hex');

    const summary = {
      eventName: event.name,
      sectionsCount: canonicalConfig.sections.length,
      sessionsCount: canonicalConfig.sessions.length,
      ticketTypesCount: canonicalConfig.ticketTypes.length,
      batchesCount: canonicalConfig.batches.length,
      channelsCount: canonicalConfig.channels.filter((c: any) => c.enabled).length,
      totalConfiguredCapacity: canonicalConfig.sections.reduce((acc: number, s: any) => acc + (s.capacity || 0), 0)
    };

    return { hash, config: canonicalConfig, summary, eventName: event.name };
  }

  /**
   * Cria um novo Snapshot Imutável de Revisão (EventReviewSnapshot)
   */
  static async createSnapshot(
    eventId: string,
    user: { id: string; name?: string }
  ): Promise<EventReviewSnapshotDTO> {
    const { hash, summary, eventName } = await this.generateConfigurationHash(eventId);

    // Invalida snapshots VALID anteriores marcando como SUPERSEDED
    const existingSnapshots = await (prisma as any).eventReviewSnapshot.findMany({
      where: { eventId, status: 'VALID' }
    });

    for (const snap of existingSnapshots) {
      await (prisma as any).eventReviewSnapshot.update({
        where: { id: snap.id },
        data: { status: 'SUPERSEDED' }
      });
    }

    const currentVersion = existingSnapshots.length + 1;

    const newSnapshot = await (prisma as any).eventReviewSnapshot.create({
      data: {
        id: `rev_snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventId,
        eventVersion: currentVersion,
        configurationHash: hash,
        submittedBy: user.id,
        submittedByName: user.name || 'Sistema DiskIngressos',
        submittedAt: new Date(),
        status: 'VALID',
        invalidatedReason: null,
        summaryJson: JSON.stringify(summary),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await AuditService.log({
      action: 'EVENT_REVIEW_SNAPSHOT_CREATED',
      resource: 'EventReviewSnapshot',
      resourceId: newSnapshot.id,
      userId: user.id,
      eventId,
      details: {
        eventId,
        version: currentVersion,
        hash,
        summary
      }
    });

    return {
      id: newSnapshot.id,
      eventId: newSnapshot.eventId,
      eventVersion: newSnapshot.eventVersion,
      configurationHash: newSnapshot.configurationHash,
      submittedBy: newSnapshot.submittedBy,
      submittedByName: newSnapshot.submittedByName,
      submittedAt: newSnapshot.submittedAt.toISOString ? newSnapshot.submittedAt.toISOString() : newSnapshot.submittedAt,
      status: newSnapshot.status,
      invalidatedReason: newSnapshot.invalidatedReason,
      summaryData: {
        eventName,
        sessionsCount: summary.sessionsCount,
        sectionsCount: summary.sectionsCount,
        batchesCount: summary.batchesCount,
        channelsCount: summary.channelsCount,
        readinessScore: 100,
        totalCapacity: summary.totalConfiguredCapacity
      }
    };
  }

  /**
   * Obtém o snapshot válido mais recente do evento
   */
  static async getLatestSnapshot(eventId: string): Promise<EventReviewSnapshotDTO | null> {
    const snapshots = await (prisma as any).eventReviewSnapshot.findMany({
      where: { eventId },
      orderBy: { submittedAt: 'desc' }
    });

    if (!snapshots || snapshots.length === 0) {
      return null;
    }

    const latest = snapshots[0];
    let parsedSummary: any = {};
    try {
      parsedSummary = typeof latest.summaryJson === 'string' ? JSON.parse(latest.summaryJson) : (latest.summaryJson || {});
    } catch {
      parsedSummary = {};
    }

    return {
      id: latest.id,
      eventId: latest.eventId,
      eventVersion: latest.eventVersion,
      configurationHash: latest.configurationHash,
      submittedBy: latest.submittedBy,
      submittedByName: latest.submittedByName,
      submittedAt: latest.submittedAt?.toISOString ? latest.submittedAt.toISOString() : latest.submittedAt,
      status: latest.status,
      invalidatedReason: latest.invalidatedReason,
      summaryData: {
        eventName: parsedSummary.eventName || 'Evento',
        sessionsCount: parsedSummary.sessionsCount || 0,
        sectionsCount: parsedSummary.sectionsCount || 0,
        batchesCount: parsedSummary.batchesCount || 0,
        channelsCount: parsedSummary.channelsCount || 0,
        readinessScore: 100,
        totalCapacity: parsedSummary.totalConfiguredCapacity || 0
      }
    };
  }

  /**
   * Valida se a configuração atual do evento ainda corresponde ao snapshot de revisão
   */
  static async validateSnapshotIntegrity(eventId: string): Promise<{
    valid: boolean;
    currentHash: string;
    snapshotHash?: string;
    reason?: string;
    snapshot?: EventReviewSnapshotDTO | null;
  }> {
    const latestSnapshot = await this.getLatestSnapshot(eventId);

    if (!latestSnapshot) {
      return {
        valid: false,
        currentHash: '',
        reason: 'Nenhum snapshot de revisão encontrado para este evento.'
      };
    }

    if (latestSnapshot.status !== 'VALID') {
      return {
        valid: false,
        currentHash: '',
        snapshotHash: latestSnapshot.configurationHash,
        reason: `O snapshot existente encontra-se com status ${latestSnapshot.status} (${latestSnapshot.invalidatedReason || 'Sem justificativa'}).`,
        snapshot: latestSnapshot
      };
    }

    const { hash: currentHash } = await this.generateConfigurationHash(eventId);

    if (currentHash !== latestSnapshot.configurationHash) {
      // Automaticamente invalida o snapshot pois o evento sofreu mutações não homologadas
      await this.invalidateSnapshot(eventId, 'Configuração do evento alterada após submissão do snapshot de revisão');
      return {
        valid: false,
        currentHash,
        snapshotHash: latestSnapshot.configurationHash,
        reason: 'A configuração do evento diverge do snapshot congelado de revisão.',
        snapshot: { ...latestSnapshot, status: 'INVALIDATED' }
      };
    }

    return {
      valid: true,
      currentHash,
      snapshotHash: latestSnapshot.configurationHash,
      snapshot: latestSnapshot
    };
  }

  /**
   * Invalida snapshot de revisão ativo
   */
  static async invalidateSnapshot(eventId: string, reason: string): Promise<void> {
    const validSnapshots = await (prisma as any).eventReviewSnapshot.findMany({
      where: { eventId, status: 'VALID' }
    });

    for (const snap of validSnapshots) {
      await (prisma as any).eventReviewSnapshot.update({
        where: { id: snap.id },
        data: {
          status: 'INVALIDATED',
          invalidatedReason: reason,
          updatedAt: new Date()
        }
      });
    }
  }
}
