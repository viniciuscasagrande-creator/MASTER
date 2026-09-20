import { prisma } from '../../../../core/database/prisma';
import { OfflineValidationBundleDTO } from '@shared/types/index';
import { TicketTokenService } from '../validation/ticket-token.service';
import { AccessRuleService } from '../rules/access-rule.service';
import { TicketAccessBlockService } from '../exceptions/ticket-access-block.service';

export class OfflineBundleService {
  /**
   * Generates a restricted offline validation bundle for a specific device, session, and access point.
   */
  public static async generateBundle(params: {
    eventId: string;
    sessionId: string;
    accessPointId: string;
    deviceId: string;
    validityHours?: number;
  }): Promise<OfflineValidationBundleDTO> {
    const validityHours = params.validityHours || 8;
    const now = new Date();
    const validUntil = new Date(now.getTime() + validityHours * 60 * 60 * 1000);
    const bundleId = `bun_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 1. Fetch tickets for this session & event
    const tickets = await prisma.ticket.findMany({
      where: {
        eventId: params.eventId,
        sessionId: params.sessionId
      }
    });

    // 2. Fetch rules
    const rules = await AccessRuleService.listRules(params.eventId, params.sessionId);
    const activeRules = rules.filter(r => r.active);

    // 3. Fetch all active blocks
    const blocks = await TicketAccessBlockService.listBlocks(params.eventId);
    const blockedTicketIds = new Set(blocks.map(b => b.ticketId));

    // 4. Fetch previous entries for these tickets to calculate currentEntries
    const previousEntries = await prisma.accessEntry.findMany({
      where: {
        eventId: params.eventId,
        sessionId: params.sessionId
      }
    });
    const entryCounts: Record<string, number> = {};
    for (const entry of previousEntries) {
      if (entry.movementType === 'ENTRY' || entry.movementType === 'REENTRY' || entry.movementType === 'MANUAL_ENTRY') {
        entryCounts[entry.ticketId] = (entryCounts[entry.ticketId] || 0) + 1;
      }
    }

    // 5. Build bundle ticket list
    const bundleTickets = tickets.map((t: any) => {
      const ticketCode = t.ticketCode || t.id;
      const tokenHash = TicketTokenService.computeHash(ticketCode);
      const isBlocked = blockedTicketIds.has(t.id);
      const currentEntries = entryCounts[t.id] || 0;

      // Find matching rule
      const rule = activeRules.find(r =>
        (r.ticketTypeIds.length === 0 || r.ticketTypeIds.includes(t.ticketTypeId)) &&
        (r.allowedAccessPointIds.length === 0 || r.allowedAccessPointIds.includes(params.accessPointId))
      );

      const reentryPolicy = rule ? rule.reentryPolicy : 'NO_REENTRY';
      const maxEntries = rule ? rule.maxReentries + 1 : 1;

      return {
        id: t.id,
        tokenHash,
        ticketNumber: t.ticketNumber || t.ticketCode || t.id,
        ticketTypeId: t.ticketTypeId || 'default',
        ticketTypeName: t.ticketTypeName || 'Padrão',
        sectionName: t.sectionName || undefined,
        attendeeName: t.attendeeName || t.customerName || undefined,
        reentryPolicy,
        maxEntries,
        currentEntries,
        status: t.status || 'ACTIVE',
        isBlocked
      };
    });

    const bundleDTO: OfflineValidationBundleDTO = {
      bundleId,
      eventId: params.eventId,
      sessionId: params.sessionId,
      accessPointId: params.accessPointId,
      deviceId: params.deviceId,
      generatedAt: now.toISOString(),
      validUntil: validUntil.toISOString(),
      ticketsSummary: {
        totalTickets: bundleTickets.length
      },
      tickets: bundleTickets,
      rules: activeRules
    };

    // Store bundle metadata in database
    await prisma.offlineValidationBundle.create({
      data: {
        bundleId,
        eventId: params.eventId,
        sessionId: params.sessionId,
        accessPointId: params.accessPointId,
        deviceId: params.deviceId,
        totalTickets: bundleTickets.length,
        bundleData: JSON.stringify({ summary: bundleDTO.ticketsSummary, count: bundleTickets.length }),
        validUntil,
        createdAt: now
      }
    });

    return bundleDTO;
  }
}
