import { LegacyIdMapping } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';

export class LegacyIdService {
  /**
   * Registers a legacy ID to new internal ID mapping with conflict prevention
   */
  public static async registerMapping(
    migrationId: string,
    sourceSystem: string,
    entityType: string,
    legacyId: string,
    newId: string
  ): Promise<LegacyIdMapping> {
    const existing = await prisma.legacyIdMappingModel.findUnique({
      where: {
        migrationProjectId_entityType_legacyId: {
          migrationProjectId: migrationId,
          entityType,
          legacyId
        }
      }
    });

    if (existing) {
      const updated = await prisma.legacyIdMappingModel.update({
        where: { id: existing.id },
        data: { newId }
      });
      return {
        id: updated.id,
        migrationId: updated.migrationProjectId,
        sourceSystem,
        entityType: updated.entityType,
        legacyId: updated.legacyId,
        newId: updated.newId,
        createdAt: updated.createdAt.toISOString ? updated.createdAt.toISOString() : updated.createdAt
      };
    }

    const created = await prisma.legacyIdMappingModel.create({
      data: {
        migrationProjectId: migrationId,
        entityType,
        legacyId,
        newId,
        createdAt: new Date()
      }
    });

    return {
      id: created.id,
      migrationId: created.migrationProjectId,
      sourceSystem,
      entityType: created.entityType,
      legacyId: created.legacyId,
      newId: created.newId,
      createdAt: created.createdAt.toISOString ? created.createdAt.toISOString() : created.createdAt
    };
  }

  /**
   * Resolves a newly generated internal ID from a legacy ID
   */
  public static async resolveNewId(
    migrationId: string,
    entityType: string,
    legacyId: string
  ): Promise<string | null> {
    const mapping = await prisma.legacyIdMappingModel.findUnique({
      where: {
        migrationProjectId_entityType_legacyId: {
          migrationProjectId: migrationId,
          entityType,
          legacyId
        }
      }
    });

    return mapping ? mapping.newId : null;
  }

  /**
   * Resolves a legacy ID from internal new ID
   */
  public static async resolveLegacyId(newId: string): Promise<string | null> {
    const mapping = await prisma.legacyIdMappingModel.findFirst({
      where: { newId }
    });

    return mapping ? mapping.legacyId : null;
  }

  /**
   * Lists all mappings registered for a migration project
   */
  public static async getMappingsForProject(
    migrationId: string,
    entityType?: string,
    sourceSystem = 'LEGACY'
  ): Promise<LegacyIdMapping[]> {
    const list = await prisma.legacyIdMappingModel.findMany({
      where: {
        migrationProjectId: migrationId,
        ...(entityType ? { entityType } : {})
      }
    });

    return list.map(m => ({
      id: m.id,
      migrationId: m.migrationProjectId,
      sourceSystem,
      entityType: m.entityType,
      legacyId: m.legacyId,
      newId: m.newId,
      createdAt: m.createdAt.toISOString ? m.createdAt.toISOString() : m.createdAt
    }));
  }
}
