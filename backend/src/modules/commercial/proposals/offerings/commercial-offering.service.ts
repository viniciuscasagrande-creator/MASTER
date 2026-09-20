import { prisma } from '../../../../core/database/prisma';
import { CommercialOfferingCategoryDTO, CommercialOfferingDTO } from '../../../../../../shared/types';

export class CommercialOfferingService {
  /**
   * Lista categorias ativas de serviços e ofertas comerciais com itens
   */
  public static async listCategories(): Promise<CommercialOfferingCategoryDTO[]> {
    const categories = await prisma.commercialOfferingCategory.findMany({
      where: { active: true }
    });

    const offerings = await prisma.commercialOffering.findMany({
      where: { active: true }
    });

    return categories.map((cat: any) => ({
      id: cat.id,
      code: cat.code,
      name: cat.name,
      description: cat.description,
      sortOrder: cat.sortOrder || 0,
      active: cat.active,
      createdAt: cat.createdAt ? new Date(cat.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: cat.updatedAt ? new Date(cat.updatedAt).toISOString() : new Date().toISOString(),
      offerings: offerings
        .filter((off: any) => off.categoryId === cat.id)
        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((off: any) => ({
          id: off.id,
          categoryId: off.categoryId,
          categoryName: cat.name,
          code: off.code,
          name: off.name,
          description: off.description,
          defaultPricingModel: off.defaultPricingModel,
          defaultPercentage: off.defaultPercentage,
          defaultAmount: off.defaultAmount,
          defaultPayer: off.defaultPayer,
          active: off.active,
          sortOrder: off.sortOrder || 0,
          createdAt: off.createdAt ? new Date(off.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: off.updatedAt ? new Date(off.updatedAt).toISOString() : new Date().toISOString()
        }))
    }));
  }

  /**
   * Lista todas as ofertas do catálogo com filtro opcional por categoria
   */
  public static async listOfferings(categoryId?: string): Promise<CommercialOfferingDTO[]> {
    const where: any = { active: true };
    if (categoryId) where.categoryId = categoryId;

    const offerings = await prisma.commercialOffering.findMany({ where });
    const categories = await prisma.commercialOfferingCategory.findMany();
    const catMap = new Map(categories.map((c: any) => [c.id, c.name]));

    return offerings.map((off: any) => ({
      id: off.id,
      categoryId: off.categoryId,
      categoryName: catMap.get(off.categoryId) || 'Geral',
      code: off.code,
      name: off.name,
      description: off.description,
      defaultPricingModel: off.defaultPricingModel,
      defaultPercentage: off.defaultPercentage,
      defaultAmount: off.defaultAmount,
      defaultPayer: off.defaultPayer,
      active: off.active,
      sortOrder: off.sortOrder || 0,
      createdAt: off.createdAt ? new Date(off.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: off.updatedAt ? new Date(off.updatedAt).toISOString() : new Date().toISOString()
    }));
  }

  /**
   * Obtém detalhes de uma oferta específica
   */
  public static async getOfferingById(id: string): Promise<CommercialOfferingDTO | null> {
    const off = await prisma.commercialOffering.findUnique({ where: { id } });
    if (!off) return null;

    const cat = await prisma.commercialOfferingCategory.findUnique({ where: { id: off.categoryId } });

    return {
      id: off.id,
      categoryId: off.categoryId,
      categoryName: cat?.name || 'Geral',
      code: off.code,
      name: off.name,
      description: off.description,
      defaultPricingModel: off.defaultPricingModel,
      defaultPercentage: off.defaultPercentage,
      defaultAmount: off.defaultAmount,
      defaultPayer: off.defaultPayer,
      active: off.active,
      sortOrder: off.sortOrder || 0,
      createdAt: off.createdAt ? new Date(off.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: off.updatedAt ? new Date(off.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  /**
   * Cria nova oferta no catálogo
   */
  public static async createOffering(data: any): Promise<CommercialOfferingDTO> {
    if (!data.name || !data.code || !data.categoryId) {
      throw new Error('Nome, código e categoria são obrigatórios para a oferta.');
    }

    const created = await prisma.commercialOffering.create({
      data: {
        categoryId: data.categoryId,
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        description: data.description || null,
        defaultPricingModel: data.defaultPricingModel || 'PERCENTAGE',
        defaultPercentage: data.defaultPercentage !== undefined ? Number(data.defaultPercentage) : null,
        defaultAmount: data.defaultAmount !== undefined ? Number(data.defaultAmount) : null,
        defaultPayer: data.defaultPayer || 'PRODUCER',
        sortOrder: data.sortOrder || 0,
        active: true
      }
    });

    return this.getOfferingById(created.id) as Promise<CommercialOfferingDTO>;
  }

  /**
   * Atualiza oferta existente
   */
  public static async updateOffering(id: string, data: any): Promise<CommercialOfferingDTO> {
    await prisma.commercialOffering.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        description: data.description !== undefined ? data.description : undefined,
        defaultPricingModel: data.defaultPricingModel,
        defaultPercentage: data.defaultPercentage !== undefined ? Number(data.defaultPercentage) : undefined,
        defaultAmount: data.defaultAmount !== undefined ? Number(data.defaultAmount) : undefined,
        defaultPayer: data.defaultPayer,
        sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined,
        active: data.active !== undefined ? Boolean(data.active) : undefined
      }
    });

    return this.getOfferingById(id) as Promise<CommercialOfferingDTO>;
  }
}
