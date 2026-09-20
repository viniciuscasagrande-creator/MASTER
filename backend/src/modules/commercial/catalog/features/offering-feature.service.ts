import { prisma } from '../../../../core/database/prisma';
import { CommercialFeatureDTO, OfferingFeatureDTO } from '../../../../../../shared/types';

export class OfferingFeatureService {
  /**
   * Lista todos os recursos técnicos do catálogo
   */
  public static async listFeatures(category?: string): Promise<CommercialFeatureDTO[]> {
    const where: any = { active: true };
    if (category) {
      where.category = category;
    }

    const features = await prisma.commercialFeature.findMany({ where });

    return features.map((f: any) => ({
      id: f.id,
      code: f.code,
      name: f.name,
      description: f.description,
      category: f.category,
      active: f.active,
      createdAt: f.createdAt ? new Date(f.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: f.updatedAt ? new Date(f.updatedAt).toISOString() : new Date().toISOString()
    }));
  }

  /**
   * Busca recurso técnico por ID
   */
  public static async getFeatureById(id: string): Promise<CommercialFeatureDTO | null> {
    const f = await prisma.commercialFeature.findUnique({ where: { id } });
    if (!f) return null;

    return {
      id: f.id,
      code: f.code,
      name: f.name,
      description: f.description,
      category: f.category,
      active: f.active,
      createdAt: f.createdAt ? new Date(f.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: f.updatedAt ? new Date(f.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  /**
   * Cria novo recurso técnico no catálogo
   */
  public static async createFeature(dto: {
    code: string;
    name: string;
    description?: string;
    category?: string;
  }): Promise<CommercialFeatureDTO> {
    if (!dto.code || !dto.name) {
      throw new Error('Código e nome do recurso são obrigatórios.');
    }

    const normalizedCode = dto.code.trim().toLowerCase();
    const existing = await prisma.commercialFeature.findUnique({
      where: { code: normalizedCode }
    });

    if (existing) {
      throw new Error(`Recurso com código "${normalizedCode}" já existe.`);
    }

    const created = await prisma.commercialFeature.create({
      data: {
        code: normalizedCode,
        name: dto.name.trim(),
        description: dto.description || null,
        category: dto.category || 'PLATFORM',
        active: true
      }
    });

    return {
      id: created.id,
      code: created.code,
      name: created.name,
      description: created.description,
      category: created.category,
      active: created.active,
      createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: created.updatedAt ? new Date(created.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  /**
   * Associa recursos técnicos a uma versão de oferta
   */
  public static async assignFeaturesToVersion(
    offeringVersionId: string,
    features: Array<{
      featureId: string;
      included?: boolean;
      limitValue?: number | null;
      limitUnit?: string | null;
      configurationJson?: string | null;
    }>
  ): Promise<OfferingFeatureDTO[]> {
    // 1. Remove mapeamentos antigos desta versão
    await prisma.offeringFeature.deleteMany({
      where: { offeringVersionId }
    });

    // 2. Insere novos mapeamentos
    const result: OfferingFeatureDTO[] = [];

    for (const item of features) {
      const feat = await prisma.commercialFeature.findUnique({
        where: { id: item.featureId }
      });

      if (!feat) {
        throw new Error(`Recurso ID "${item.featureId}" não encontrado no catálogo.`);
      }

      const of = await prisma.offeringFeature.create({
        data: {
          offeringVersionId,
          featureId: item.featureId,
          included: item.included !== undefined ? item.included : true,
          limitValue: item.limitValue ?? null,
          limitUnit: item.limitUnit || null,
          configurationJson: item.configurationJson || null
        }
      });

      result.push({
        id: of.id,
        offeringVersionId: of.offeringVersionId,
        featureId: of.featureId,
        featureCode: feat.code,
        featureName: feat.name,
        featureCategory: feat.category,
        included: of.included,
        limitValue: of.limitValue,
        limitUnit: of.limitUnit,
        configurationJson: of.configurationJson,
        createdAt: of.createdAt ? new Date(of.createdAt).toISOString() : new Date().toISOString()
      });
    }

    return result;
  }

  /**
   * Lista os recursos técnicos vinculados a uma versão
   */
  public static async listFeaturesByVersion(offeringVersionId: string): Promise<OfferingFeatureDTO[]> {
    const list = await prisma.offeringFeature.findMany({
      where: { offeringVersionId }
    });

    return list.map((of: any) => ({
      id: of.id,
      offeringVersionId: of.offeringVersionId,
      featureId: of.featureId,
      featureCode: of.feature?.code,
      featureName: of.feature?.name,
      featureCategory: of.feature?.category,
      included: of.included,
      limitValue: of.limitValue,
      limitUnit: of.limitUnit,
      configurationJson: of.configurationJson,
      createdAt: of.createdAt ? new Date(of.createdAt).toISOString() : new Date().toISOString()
    }));
  }
}
