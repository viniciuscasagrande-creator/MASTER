import { prisma } from '../../../../core/database/prisma';
import { AccessRuleDTO, ReentryPolicyType } from '@shared/types/index';

export class AccessRuleService {
  /**
   * Creates or registers an access rule for an event.
   */
  public static async createRule(data: {
    eventId: string;
    sessionId?: string;
    name: string;
    ticketTypeIds?: string[];
    allowedAccessPointIds?: string[];
    allowedSectionIds?: string[];
    reentryPolicy?: ReentryPolicyType;
    maxReentries?: number;
    windowStartsBeforeMinutes?: number;
    windowEndsAfterMinutes?: number;
  }): Promise<AccessRuleDTO> {
    const created = await prisma.accessRule.create({
      data: {
        eventId: data.eventId,
        sessionId: data.sessionId || null,
        name: data.name,
        ticketTypeIds: JSON.stringify(data.ticketTypeIds || []),
        allowedAccessPointIds: JSON.stringify(data.allowedAccessPointIds || []),
        allowedSectionIds: JSON.stringify(data.allowedSectionIds || []),
        reentryPolicy: data.reentryPolicy || 'NO_REENTRY',
        maxReentries: data.maxReentries || 0,
        windowStartsBeforeMinutes: data.windowStartsBeforeMinutes ?? 120,
        windowEndsAfterMinutes: data.windowEndsAfterMinutes ?? 60,
        active: true
      }
    });

    return this.mapToDTO(created);
  }

  /**
   * Lists access rules for an event and optionally a session.
   */
  public static async listRules(eventId: string, sessionId?: string): Promise<AccessRuleDTO[]> {
    const rules = await prisma.accessRule.findMany({
      where: {
        eventId,
        ...(sessionId ? { OR: [{ sessionId: null }, { sessionId }] } : {})
      }
    });
    return rules.map((r: any) => this.mapToDTO(r));
  }

  /**
   * Updates an access rule.
   */
  public static async updateRule(id: string, data: Partial<AccessRuleDTO>): Promise<AccessRuleDTO> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.ticketTypeIds !== undefined) updateData.ticketTypeIds = JSON.stringify(data.ticketTypeIds);
    if (data.allowedAccessPointIds !== undefined) updateData.allowedAccessPointIds = JSON.stringify(data.allowedAccessPointIds);
    if (data.allowedSectionIds !== undefined) updateData.allowedSectionIds = JSON.stringify(data.allowedSectionIds);
    if (data.reentryPolicy !== undefined) updateData.reentryPolicy = data.reentryPolicy;
    if (data.maxReentries !== undefined) updateData.maxReentries = data.maxReentries;
    if (data.windowStartsBeforeMinutes !== undefined) updateData.windowStartsBeforeMinutes = data.windowStartsBeforeMinutes;
    if (data.windowEndsAfterMinutes !== undefined) updateData.windowEndsAfterMinutes = data.windowEndsAfterMinutes;
    if (data.active !== undefined) updateData.active = data.active;

    const updated = await prisma.accessRule.update({
      where: { id },
      data: updateData
    });

    return this.mapToDTO(updated);
  }

  /**
   * Evaluates matching rule for a given ticket type, access point, and session.
   */
  public static async findMatchingRule(params: {
    eventId: string;
    sessionId?: string;
    ticketTypeId?: string;
    accessPointId?: string;
    sectionId?: string;
  }): Promise<AccessRuleDTO | null> {
    const rules = await this.listRules(params.eventId, params.sessionId);
    const activeRules = rules.filter(r => r.active);

    if (activeRules.length === 0) {
      // Default fallback rule if no custom rule configured
      return {
        id: 'default-fallback-rule',
        eventId: params.eventId,
        sessionId: params.sessionId,
        name: 'Regra Padrão (Sem reentrada)',
        ticketTypeIds: [],
        allowedAccessPointIds: [],
        allowedSectionIds: [],
        reentryPolicy: 'NO_REENTRY',
        maxReentries: 0,
        windowStartsBeforeMinutes: 180,
        windowEndsAfterMinutes: 120,
        active: true
      };
    }

    // Try specific match first
    for (const rule of activeRules) {
      const matchType = rule.ticketTypeIds.length === 0 || (params.ticketTypeId && rule.ticketTypeIds.includes(params.ticketTypeId));
      const matchPoint = rule.allowedAccessPointIds.length === 0 || (params.accessPointId && rule.allowedAccessPointIds.includes(params.accessPointId));
      const matchSection = rule.allowedSectionIds.length === 0 || (params.sectionId && rule.allowedSectionIds.includes(params.sectionId));

      if (matchType && matchPoint && matchSection) {
        return rule;
      }
    }

    // Fallback to first active rule
    return activeRules[0];
  }

  private static mapToDTO(r: any): AccessRuleDTO {
    return {
      id: r.id,
      eventId: r.eventId,
      sessionId: r.sessionId || undefined,
      name: r.name,
      ticketTypeIds: typeof r.ticketTypeIds === 'string' ? JSON.parse(r.ticketTypeIds || '[]') : (r.ticketTypeIds || []),
      allowedAccessPointIds: typeof r.allowedAccessPointIds === 'string' ? JSON.parse(r.allowedAccessPointIds || '[]') : (r.allowedAccessPointIds || []),
      allowedSectionIds: typeof r.allowedSectionIds === 'string' ? JSON.parse(r.allowedSectionIds || '[]') : (r.allowedSectionIds || []),
      reentryPolicy: r.reentryPolicy as ReentryPolicyType,
      maxReentries: r.maxReentries || 0,
      windowStartsBeforeMinutes: r.windowStartsBeforeMinutes ?? 120,
      windowEndsAfterMinutes: r.windowEndsAfterMinutes ?? 60,
      active: r.active ?? true
    };
  }
}
