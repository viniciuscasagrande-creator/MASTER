import { prisma } from '../../../../core/database/prisma';
import {
  CommercialOfferingDTO,
  CommercialOfferingType,
  CommercialOfferingStatus,
  CreateOfferingDTO,
  UpdateOfferingDTO,
  DiscontinueOfferingDTO
} from '../../../../../../shared/types';
import { OfferingVersionService } from '../versions/offering-version.service';
import { DefaultTermsService } from '../terms/default-terms.service';
import { OfferingFeatureService } from '../features/offering-feature.service';
import { OfferingCompositionService } from '../composition/offering-composition.service';
import { CatalogImpactService } from '../impact/catalog-impact.service';

export class OfferingService {
  /**
   * Lista ofertas do catálogo com suporte a filtros flexíveis
   */
  public static async listOfferings(filters?: {
    type?: CommercialOfferingType;
    categoryId?: string;
    status?: CommercialOfferingStatus;
    search?: string;
    activeOnly?: boolean;
  }): Promise<CommercialOfferingDTO[]> {
    const where: any = {};

    if (filters?.type) where.type = filters.type;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.status) where.status = filters.status;
    if (filters?.activeOnly) where.active = true;

    let offerings = await prisma.commercialOffering.findMany({
      where,
      include: {
        category: true,
        currentVersion: {
          include: {
            defaultTerms: true,
            features: true,
            compositions: true
          }
        },
        compositions: true
      }
    });

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      offerings = offerings.filter(
        (o: any) =>
          o.name.toLowerCase().includes(q) ||
          o.code.toLowerCase().includes(q) ||
          o.publicCode.toLowerCase().includes(q) ||
          (o.description && o.description.toLowerCase().includes(q))
      );
    }

    return offerings.map((o: any) => this.mapToDTO(o));
  }

  /**
   * Obtém detalhes de uma oferta pelo ID
   */
  public static async getOfferingById(id: string): Promise<CommercialOfferingDTO | null> {
    const offering = await prisma.commercialOffering.findUnique({
      where: { id },
      include: {
        category: true,
        currentVersion: {
          include: {
            defaultTerms: true,
            features: true,
            compositions: true
          }
        },
        versions: true,
        compositions: true
      }
    });

    return offering ? this.mapToDTO(offering) : null;
  }

  /**
   * Obtém detalhes de uma oferta pelo código oficial interno ou código público
   */
  public static async getOfferingByCode(code: string): Promise<CommercialOfferingDTO | null> {
    const offering = await prisma.commercialOffering.findFirst({
      where: {
        OR: [{ code }, { publicCode: code }]
      },
      include: {
        category: true,
        currentVersion: {
          include: {
            defaultTerms: true,
            features: true,
            compositions: true
          }
        }
      }
    });

    return offering ? this.mapToDTO(offering) : null;
  }

  /**
   * Cria uma nova oferta oficial no catálogo (Plano, Pacote, Serviço ou Adicional)
   * Inicializa automaticamente a Versão 1 (v1) ativa e imutável.
   */
  public static async createOffering(
    dto: CreateOfferingDTO,
    userId: string,
    userName: string
  ): Promise<CommercialOfferingDTO> {
    if (!dto.name || !dto.categoryId || !dto.type) {
      throw new Error('Nome, categoria e tipo são obrigatórios para a oferta comercial.');
    }

    // Valida categoria
    const cat = await prisma.commercialOfferingCategory.findUnique({
      where: { id: dto.categoryId }
    });
    if (!cat) {
      throw new Error(`Categoria comercial ID "${dto.categoryId}" não encontrada.`);
    }

    // Normaliza código
    let code = dto.code ? dto.code.trim().toUpperCase() : '';
    if (!code) {
      code = dto.name
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    }

    const existing = await prisma.commercialOffering.findFirst({
      where: { code }
    });
    if (existing) {
      throw new Error(`Já existe uma oferta cadastrada com o código "${code}".`);
    }

    const now = new Date();
    const year = now.getFullYear();
    const count = (await prisma.commercialOffering.count()) + 101;
    const publicCode = `OFR-${year}-${String(count).padStart(6, '0')}`;

    // 1. Cria a entidade raiz da oferta
    const offering = await prisma.commercialOffering.create({
      data: {
        publicCode,
        categoryId: dto.categoryId,
        code,
        name: dto.name.trim(),
        type: dto.type,
        shortDescription: dto.shortDescription || null,
        description: dto.description || null,
        status: 'ACTIVE',
        currentVersionNumber: 1,
        defaultPricingModel: dto.defaultPricingModel || 'PERCENTAGE',
        defaultPercentage: dto.defaultPercentage !== undefined ? Number(dto.defaultPercentage) : null,
        defaultAmount: dto.defaultAmount !== undefined ? Number(dto.defaultAmount) : null,
        defaultPayer: dto.defaultPayer || 'PRODUCER',
        sortOrder: dto.sortOrder || 0,
        active: true
      }
    });

    // 2. Calcula hash inicial para a versão 1
    const compItems = dto.compositions || dto.composition || [];
    const contentHash = OfferingVersionService.computeContentHash({
      offeringId: offering.id,
      versionNumber: 1,
      nameSnapshot: offering.name,
      descriptionSnapshot: offering.description,
      defaultTerms: dto.defaultTerms,
      features: dto.features,
      compositions: compItems
    });

    // 3. Cria a Versão 1 inicial ativa
    const version1 = await prisma.commercialOfferingVersion.create({
      data: {
        offeringId: offering.id,
        versionNumber: 1,
        status: 'ACTIVE',
        nameSnapshot: offering.name,
        descriptionSnapshot: offering.description,
        validFrom: now,
        validUntil: null,
        contentHash,
        changeSummary: 'Lançamento e publicação inicial da oferta no catálogo',
        publishedAt: now,
        publishedBy: userId,
        publishedByName: userName,
        createdBy: userId,
        createdByName: userName
      }
    });

    // 4. Grava termos padrão associados à versão 1
    if (dto.defaultTerms && dto.defaultTerms.length > 0) {
      await DefaultTermsService.setDefaultTerms(version1.id, dto.defaultTerms);
    } else {
      // Cria termo padrão com os valores da própria oferta
      await DefaultTermsService.setDefaultTerms(version1.id, [
        {
          termType: dto.type === 'ADD_ON' ? 'EQUIPMENT' : 'PLATFORM_COMMISSION',
          calculationType: dto.defaultPricingModel || 'PERCENTAGE',
          currency: 'BRL',
          percentage: dto.defaultPercentage ?? null,
          amount: dto.defaultAmount ?? null,
          payer: dto.defaultPayer || 'PRODUCER',
          negotiable: true
        }
      ]);
    }

    // 5. Grava recursos técnicos associados à versão 1
    if (dto.features && dto.features.length > 0) {
      await OfferingFeatureService.assignFeaturesToVersion(version1.id, dto.features);
    }

    // 6. Grava composições (se for Pacote ou Plano com itens incluídos)
    if (compItems.length > 0) {
      await OfferingCompositionService.setCompositions(offering.id, version1.id, compItems);
    }

    // 7. Vincula a versão 1 como versão corrente
    await prisma.commercialOffering.update({
      where: { id: offering.id },
      data: {
        currentVersionId: version1.id,
        currentVersionNumber: 1
      }
    });

    const created = await this.getOfferingById(offering.id);
    return created!;
  }

  /**
   * Atualiza metadados gerais da oferta
   */
  public static async updateOffering(id: string, dto: UpdateOfferingDTO): Promise<CommercialOfferingDTO> {
    const offering = await prisma.commercialOffering.findUnique({ where: { id } });
    if (!offering) {
      throw new Error(`Oferta ID "${id}" não encontrada no catálogo.`);
    }

    await prisma.commercialOffering.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        shortDescription: dto.shortDescription !== undefined ? dto.shortDescription : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        categoryId: dto.categoryId || undefined,
        defaultPricingModel: dto.defaultPricingModel,
        defaultPercentage: dto.defaultPercentage !== undefined ? Number(dto.defaultPercentage) : undefined,
        defaultAmount: dto.defaultAmount !== undefined ? Number(dto.defaultAmount) : undefined,
        defaultPayer: dto.defaultPayer,
        sortOrder: dto.sortOrder !== undefined ? Number(dto.sortOrder) : undefined,
        active: dto.active !== undefined ? Boolean(dto.active) : undefined
      }
    });

    const updated = await this.getOfferingById(id);
    return updated!;
  }

  /**
   * Descontinua uma oferta do catálogo
   * Preserva todo o histórico de propostas e contratos através do isolamento de snapshots.
   */
  public static async discontinueOffering(
    id: string,
    dto: DiscontinueOfferingDTO,
    userId: string
  ): Promise<CommercialOfferingDTO> {
    const offering = await prisma.commercialOffering.findUnique({ where: { id } });
    if (!offering) {
      throw new Error(`Oferta ID "${id}" não encontrada no catálogo.`);
    }

    if (offering.status === 'DISCONTINUED') {
      throw new Error(`A oferta "${offering.name}" já se encontra descontinuada.`);
    }

    // Analisa impacto prévio para auditoria
    const impact = await CatalogImpactService.analyzeImpact(id);

    const now = new Date();

    // 1. Atualiza a oferta para DISCONTINUED
    await prisma.commercialOffering.update({
      where: { id },
      data: {
        status: 'DISCONTINUED',
        active: false
      }
    });

    // 2. Se houver versão corrente, marca com validUntil
    if (offering.currentVersionId) {
      await prisma.commercialOfferingVersion.update({
        where: { id: offering.currentVersionId },
        data: {
          status: 'DISCONTINUED',
          validUntil: now,
          changeSummary: `Descontinuado por ${userId}. Motivo: ${dto.reason || 'Sem motivo especificado'}. Impacto: ${impact.warningMessage}`
        }
      });
    }

    const discontinued = await this.getOfferingById(id);
    return discontinued!;
  }

  private static mapToDTO(o: any): CommercialOfferingDTO {
    return {
      id: o.id,
      publicCode: o.publicCode,
      categoryId: o.categoryId,
      categoryName: o.category?.name,
      code: o.code,
      name: o.name,
      type: o.type,
      shortDescription: o.shortDescription,
      description: o.description,
      status: o.status,
      currentVersionId: o.currentVersionId,
      currentVersionNumber: o.currentVersionNumber || 1,
      currentVersion: o.currentVersion ? {
        id: o.currentVersion.id,
        offeringId: o.currentVersion.offeringId,
        versionNumber: o.currentVersion.versionNumber,
        status: o.currentVersion.status,
        nameSnapshot: o.currentVersion.nameSnapshot,
        descriptionSnapshot: o.currentVersion.descriptionSnapshot,
        validFrom: o.currentVersion.validFrom ? new Date(o.currentVersion.validFrom).toISOString() : null,
        validUntil: o.currentVersion.validUntil ? new Date(o.currentVersion.validUntil).toISOString() : null,
        contentHash: o.currentVersion.contentHash,
        changeSummary: o.currentVersion.changeSummary,
        publishedAt: o.currentVersion.publishedAt ? new Date(o.currentVersion.publishedAt).toISOString() : null,
        publishedBy: o.currentVersion.publishedBy,
        publishedByName: o.currentVersion.publishedByName,
        createdBy: o.currentVersion.createdBy,
        createdByName: o.currentVersion.createdByName,
        createdAt: o.currentVersion.createdAt ? new Date(o.currentVersion.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: o.currentVersion.updatedAt ? new Date(o.currentVersion.updatedAt).toISOString() : new Date().toISOString(),
        defaultTerms: o.currentVersion.defaultTerms?.map((t: any) => ({
          id: t.id,
          offeringVersionId: t.offeringVersionId,
          termType: t.termType,
          calculationType: t.calculationType,
          currency: t.currency || 'BRL',
          percentage: t.percentage,
          amount: t.amount,
          minimumAmount: t.minimumAmount,
          payer: t.payer,
          splitProducerPercentage: t.splitProducerPercentage,
          splitBuyerPercentage: t.splitBuyerPercentage,
          conditions: t.conditions,
          negotiable: t.negotiable,
          validFrom: t.validFrom ? new Date(t.validFrom).toISOString() : null,
          validUntil: t.validUntil ? new Date(t.validUntil).toISOString() : null,
          createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString()
        })),
        features: o.currentVersion.features?.map((f: any) => ({
          id: f.id,
          offeringVersionId: f.offeringVersionId,
          featureId: f.featureId,
          featureCode: f.featureCode || f.feature?.code,
          featureName: f.featureName || f.feature?.name,
          featureCategory: f.featureCategory || f.feature?.category,
          included: f.included,
          limitValue: f.limitValue,
          limitUnit: f.limitUnit,
          configurationJson: f.configurationJson,
          createdAt: f.createdAt ? new Date(f.createdAt).toISOString() : new Date().toISOString()
        })),
        compositions: o.currentVersion.compositions?.map((c: any) => ({
          id: c.id,
          parentOfferingId: c.parentOfferingId,
          parentOfferingVersionId: c.parentOfferingVersionId,
          childOfferingId: c.childOfferingId,
          childOfferingPublicCode: c.childOfferingPublicCode || c.childOffering?.publicCode,
          childOfferingName: c.childOfferingName || c.childOffering?.name,
          childOfferingType: c.childOfferingType || c.childOffering?.type,
          childOfferingVersionId: c.childOfferingVersionId,
          quantity: c.quantity,
          required: c.required,
          sortOrder: c.sortOrder,
          createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString()
        }))
      } : null,
      defaultPricingModel: o.defaultPricingModel,
      defaultPercentage: o.defaultPercentage,
      defaultAmount: o.defaultAmount,
      defaultPayer: o.defaultPayer,
      active: o.active,
      sortOrder: o.sortOrder || 0,
      createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : new Date().toISOString(),
      versions: o.versions?.map((v: any) => ({
        id: v.id,
        offeringId: v.offeringId,
        versionNumber: v.versionNumber,
        status: v.status,
        nameSnapshot: v.nameSnapshot,
        descriptionSnapshot: v.descriptionSnapshot,
        validFrom: v.validFrom ? new Date(v.validFrom).toISOString() : null,
        validUntil: v.validUntil ? new Date(v.validUntil).toISOString() : null,
        contentHash: v.contentHash,
        changeSummary: v.changeSummary,
        publishedAt: v.publishedAt ? new Date(v.publishedAt).toISOString() : null,
        publishedBy: v.publishedBy,
        createdBy: v.createdBy,
        createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: v.updatedAt ? new Date(v.updatedAt).toISOString() : new Date().toISOString()
      })),
      compositions: o.compositions?.map((c: any) => ({
        id: c.id,
        parentOfferingId: c.parentOfferingId,
        parentOfferingVersionId: c.parentOfferingVersionId,
        childOfferingId: c.childOfferingId,
        childOfferingPublicCode: c.childOfferingPublicCode || c.childOffering?.publicCode,
        childOfferingName: c.childOfferingName || c.childOffering?.name,
        childOfferingType: c.childOfferingType || c.childOffering?.type,
        childOfferingVersionId: c.childOfferingVersionId,
        quantity: c.quantity,
        required: c.required,
        sortOrder: c.sortOrder,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString()
      }))
    };
  }
}
