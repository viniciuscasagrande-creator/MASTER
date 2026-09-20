import { ImportMapping, ImportMappingField, ImportType } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';

export class MappingService {
  public static async saveMapping(
    name: string,
    importType: ImportType,
    fields: ImportMappingField[],
    partnerName?: string | null,
    producerId?: string | null
  ): Promise<ImportMapping> {
    const created = await prisma.importMappingModel.create({
      data: {
        name,
        importType,
        partnerName: partnerName || null,
        producerId: producerId || null,
        fields: JSON.stringify(fields)
      }
    });

    return {
      id: created.id,
      name: created.name,
      importType: created.importType as ImportType,
      partnerName: created.partnerName,
      producerId: created.producerId,
      fields: JSON.parse(created.fields),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString()
    };
  }

  public static async getMappingById(id: string): Promise<ImportMapping | null> {
    const found = await prisma.importMappingModel.findUnique({ where: { id } });
    if (!found) return null;

    return {
      id: found.id,
      name: found.name,
      importType: found.importType as ImportType,
      partnerName: found.partnerName,
      producerId: found.producerId,
      fields: JSON.parse(found.fields),
      createdAt: found.createdAt.toISOString(),
      updatedAt: found.updatedAt.toISOString()
    };
  }

  public static async findMappingForPartner(
    importType: ImportType,
    partnerName?: string | null,
    producerId?: string | null
  ): Promise<ImportMapping | null> {
    const found = await prisma.importMappingModel.findFirst({
      where: {
        importType,
        ...(partnerName ? { partnerName } : {}),
        ...(producerId ? { producerId } : {})
      }
    });

    if (!found) return null;

    return {
      id: found.id,
      name: found.name,
      importType: found.importType as ImportType,
      partnerName: found.partnerName,
      producerId: found.producerId,
      fields: JSON.parse(found.fields),
      createdAt: found.createdAt.toISOString(),
      updatedAt: found.updatedAt.toISOString()
    };
  }

  public static async listMappings(importType?: ImportType): Promise<ImportMapping[]> {
    const list = await prisma.importMappingModel.findMany({
      where: importType ? { importType } : undefined
    });

    return list.map((m: any) => ({
      id: m.id,
      name: m.name,
      importType: m.importType as ImportType,
      partnerName: m.partnerName,
      producerId: m.producerId,
      fields: typeof m.fields === 'string' ? JSON.parse(m.fields) : m.fields,
      createdAt: m.createdAt.toISOString ? m.createdAt.toISOString() : m.createdAt,
      updatedAt: m.updatedAt.toISOString ? m.updatedAt.toISOString() : m.updatedAt
    }));
  }

  public static async deleteMapping(id: string): Promise<boolean> {
    await prisma.importMappingModel.delete({ where: { id } });
    return true;
  }
}

