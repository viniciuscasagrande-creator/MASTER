import { prisma } from '../database/prisma';
import { ConfigScopeType } from './configuration.types';

export class ConfigurationRepository {
  public static async getDefinition(key: string): Promise<any> {
    return prisma.configurationDefinition.findUnique({
      where: { key }
    });
  }

  public static async listDefinitions(domain?: string): Promise<any[]> {
    const where: any = {};
    if (domain) where.domain = domain.toUpperCase();
    return prisma.configurationDefinition.findMany({
      where,
      include: { values: true }
    });
  }

  public static async findValue(
    definitionId: string,
    scopeType: ConfigScopeType,
    producerId?: string | null,
    eventId?: string | null
  ): Promise<any> {
    const where: any = {
      definitionId,
      scopeType,
      isActive: true
    };
    if (scopeType === 'PRODUCER') {
      where.producerId = producerId;
    } else if (scopeType === 'EVENT') {
      where.eventId = eventId;
    }
    return prisma.configurationValue.findFirst({ where });
  }

  public static async listValuesForDefinition(definitionId: string): Promise<any[]> {
    return prisma.configurationValue.findMany({
      where: { definitionId }
    });
  }

  public static async upsertValue(
    definitionId: string,
    scopeType: ConfigScopeType,
    producerId: string | null | undefined,
    eventId: string | null | undefined,
    parsedValue: any,
    reason: string,
    userId: string,
    userName?: string,
    effectiveFrom?: Date | string | null,
    effectiveUntil?: Date | string | null
  ): Promise<any> {
    const existing = await this.findValue(definitionId, scopeType, producerId, eventId);

    const stringifiedValue = JSON.stringify(parsedValue);

    if (existing) {
      const nextVersion = (existing.version || 1) + 1;
      // Record version history
      await prisma.configurationVersion.create({
        data: {
          valueId: existing.id,
          versionNumber: existing.version || 1,
          previousValue: existing.value,
          newValue: stringifiedValue,
          scopeType,
          producerId: producerId || null,
          eventId: eventId || null,
          changeReason: reason,
          changedByUserId: userId,
          changedByUserName: userName || null,
          effectiveFrom: existing.effectiveFrom || null,
          effectiveUntil: existing.effectiveUntil || null
        }
      });

      const updated = await prisma.configurationValue.update({
        where: { id: existing.id },
        data: {
          value: stringifiedValue,
          version: nextVersion,
          isActive: true,
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
          effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : null,
          updatedByUserId: userId,
          updatedByUserName: userName || null,
          changeReason: reason
        }
      });

      return updated;
    } else {
      const created = await prisma.configurationValue.create({
        data: {
          definitionId,
          scopeType,
          producerId: producerId || null,
          eventId: eventId || null,
          value: stringifiedValue,
          version: 1,
          isActive: true,
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
          effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : null,
          updatedByUserId: userId,
          updatedByUserName: userName || null,
          changeReason: reason
        }
      });

      return created;
    }
  }

  public static async removeValue(
    definitionId: string,
    scopeType: ConfigScopeType,
    producerId?: string | null,
    eventId?: string | null
  ): Promise<any> {
    const existing = await this.findValue(definitionId, scopeType, producerId, eventId);
    if (!existing) return null;

    return prisma.configurationValue.delete({
      where: { id: existing.id }
    });
  }

  public static async logAudit(
    entityType: 'CONFIGURATION' | 'POLICY' | 'FEATURE_FLAG' | 'KILL_SWITCH',
    entityId: string,
    entityKey: string | null,
    action: string,
    scopeType: ConfigScopeType,
    producerId: string | null | undefined,
    eventId: string | null | undefined,
    previousValue: any,
    newValue: any,
    changeReason: string,
    userId: string,
    userName?: string
  ): Promise<any> {
    return prisma.configurationAudit.create({
      data: {
        entityType,
        entityId,
        entityKey,
        action,
        scopeType,
        producerId: producerId || null,
        eventId: eventId || null,
        previousValue: previousValue !== undefined ? JSON.stringify(previousValue) : null,
        newValue: newValue !== undefined ? JSON.stringify(newValue) : null,
        changeReason,
        userId,
        userName: userName || null
      }
    });
  }

  public static async listAudits(args?: {
    entityType?: string;
    entityId?: string;
    entityKey?: string;
    producerId?: string;
    take?: number;
  }): Promise<any[]> {
    const where: any = {};
    if (args?.entityType) where.entityType = args.entityType;
    if (args?.entityId) where.entityId = args.entityId;
    if (args?.entityKey) where.entityKey = args.entityKey;
    if (args?.producerId) where.producerId = args.producerId;

    return prisma.configurationAudit.findMany({
      where,
      take: args?.take || 100
    });
  }
}
