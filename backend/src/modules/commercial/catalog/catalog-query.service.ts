import { prisma } from '../../../core/database/prisma';
import {
  CommercialCatalogMetricsDTO,
  CommercialOfferingDTO,
  CommercialOfferingCategoryDTO
} from '../../../../../shared/types';
import { OfferingService } from './offerings/offering.service';

export class CatalogQueryService {
  /**
   * Consolida métricas executivas do catálogo comercial
   */
  public static async getMetrics(): Promise<CommercialCatalogMetricsDTO> {
    const offerings = await prisma.commercialOffering.findMany();

    return {
      totalOfferings: offerings.length,
      plansCount: offerings.filter((o: any) => o.type === 'PLAN').length,
      packagesCount: offerings.filter((o: any) => o.type === 'PACKAGE').length,
      servicesCount: offerings.filter((o: any) => o.type === 'SERVICE').length,
      modulesCount: offerings.filter((o: any) => o.type === 'MODULE').length,
      addOnsCount: offerings.filter((o: any) => o.type === 'ADD_ON').length,
      activeCount: offerings.filter((o: any) => o.status === 'ACTIVE').length,
      draftCount: offerings.filter((o: any) => o.status === 'DRAFT').length,
      discontinuedCount: offerings.filter((o: any) => o.status === 'DISCONTINUED').length
    };
  }

  /**
   * Lista todos os Planos Oficiais Ativos
   */
  public static async listPlans(): Promise<CommercialOfferingDTO[]> {
    return OfferingService.listOfferings({ type: 'PLAN', activeOnly: true });
  }

  /**
   * Lista todos os Pacotes Comerciais Ativos com suas composições
   */
  public static async listPackages(): Promise<CommercialOfferingDTO[]> {
    return OfferingService.listOfferings({ type: 'PACKAGE', activeOnly: true });
  }

  /**
   * Lista todos os Serviços e Adicionais Ativos
   */
  public static async listServices(): Promise<CommercialOfferingDTO[]> {
    const services = await OfferingService.listOfferings({ type: 'SERVICE', activeOnly: true });
    const addons = await OfferingService.listOfferings({ type: 'ADD_ON', activeOnly: true });
    return [...services, ...addons];
  }

  /**
   * Lista todas as categorias comerciais estruturadas com suas ofertas
   */
  public static async listCategoriesWithOfferings(): Promise<CommercialOfferingCategoryDTO[]> {
    const categories = await prisma.commercialOfferingCategory.findMany({
      where: { active: true }
    });

    const offerings = await OfferingService.listOfferings({ activeOnly: true });

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
        .filter(o => o.categoryId === cat.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    }));
  }
}
