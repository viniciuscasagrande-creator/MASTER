import crypto from 'crypto';
import { prisma } from '../../../../core/database/prisma';
import {
  CommercialOfferingVersionDTO,
  CreateOfferingVersionDTO,
  PublishOfferingVersionDTO
} from '../../../../../../shared/types';
import { DefaultTermsService } from '../terms/default-terms.service';
import { OfferingFeatureService } from '../features/offering-feature.service';
import { OfferingCompositionService } from '../composition/offering-composition.service';

export class OfferingVersionService {
  /**
   * Calcula o hash canônico determinístico SHA-256 de uma versão do catálogo
   */
  public static computeContentHash(data: {
    offeringId: string;
    versionNumber: number;
    nameSnapshot: string;
    descriptionSnapshot?: string | null;
    defaultTerms?: any[];
    features?: any[];
    compositions?: any[];
  }): string {
    const canonicalPayload = {
      offeringId: data.offeringId,
      versionNumber: data.versionNumber,
      nameSnapshot: data.nameSnapshot.trim(),
      descriptionSnapshot: data.descriptionSnapshot ? data.descriptionSnapshot.trim() : '',
      defaultTerms: (data.defaultTerms || []).map(t => ({
        termType: t.termType,
        calculationType: t.calculationType,
        percentage: t.percentage ?? null,
        amount: t.amount ?? null,
        minimumAmount: t.minimumAmount ?? null,
        payer: t.payer || 'PRODUCER',
        conditions: t.conditions || ''
      })).sort((a, b) => (a.termType || '').localeCompare(b.termType || '')),
      features: (data.features || []).map(f => ({
        featureId: f.featureId,
        included: f.included !== false,
        limitValue: f.limitValue ?? null
      })).sort((a, b) => (a.featureId || '').localeCompare(b.featureId || '')),
      compositions: (data.compositions || []).map(c => ({
        childOfferingId: c.childOfferingId,
        quantity: c.quantity || 1,
        required: c.required !== false
      })).sort((a, b) => (a.childOfferingId || '').localeCompare(b.childOfferingId || ''))
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(canonicalPayload))
      .digest('hex');
  }

  /**
   * Lista todas as versões de uma oferta
   */
  public static async listVersions(offeringId: string): Promise<CommercialOfferingVersionDTO[]> {
    const versions = await prisma.commercialOfferingVersion.findMany({
      where: { offeringId },
      include: {
        defaultTerms: true,
        features: true,
        compositions: true
      }
    });

    return versions.map((v: any) => this.mapToDTO(v));
  }

  /**
   * Obtém detalhes de uma versão específica
   */
  public static async getVersionById(versionId: string): Promise<CommercialOfferingVersionDTO | null> {
    const ver = await prisma.commercialOfferingVersion.findUnique({
      where: { id: versionId },
      include: {
        defaultTerms: true,
        features: true,
        compositions: true
      }
    });

    return ver ? this.mapToDTO(ver) : null;
  }

  /**
   * Cria uma nova versão em RASCUNHO (DRAFT) para uma oferta comercial
   */
  public static async createDraftVersion(
    offeringId: string,
    dto: CreateOfferingVersionDTO,
    userId: string,
    userName: string
  ): Promise<CommercialOfferingVersionDTO> {
    const offering = await prisma.commercialOffering.findUnique({
      where: { id: offeringId }
    });

    if (!offering) {
      throw new Error(`Oferta ID "${offeringId}" não encontrada no catálogo.`);
    }

    // Calcula próximo número de versão
    const existingVersions = await prisma.commercialOfferingVersion.findMany({
      where: { offeringId }
    });
    const maxVersion = existingVersions.reduce((max: number, v: any) => Math.max(max, v.versionNumber || 1), 0);
    const nextVersionNumber = maxVersion + 1;

    const nameSnapshot = dto.nameSnapshot?.trim() || offering.name;
    const descriptionSnapshot = dto.descriptionSnapshot !== undefined ? dto.descriptionSnapshot : offering.description;

    // Calcula contentHash inicial
    const contentHash = this.computeContentHash({
      offeringId,
      versionNumber: nextVersionNumber,
      nameSnapshot,
      descriptionSnapshot,
      defaultTerms: dto.defaultTerms,
      features: dto.features,
      compositions: dto.compositions || dto.composition || []
    });

    // 1. Cria a versão em DRAFT
    const version = await prisma.commercialOfferingVersion.create({
      data: {
        offeringId,
        versionNumber: nextVersionNumber,
        status: 'DRAFT',
        nameSnapshot,
        descriptionSnapshot,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        contentHash,
        changeSummary: dto.changeSummary || `Criação da versão ${nextVersionNumber}`,
        createdBy: userId,
        createdByName: userName
      }
    });

    // 2. Se informados termos, grava-os
    if (dto.defaultTerms && dto.defaultTerms.length > 0) {
      await DefaultTermsService.setDefaultTerms(version.id, dto.defaultTerms);
    } else if (offering.currentVersionId) {
      // Clona termos da versão anterior ativa se não especificados
      const previousTerms = await DefaultTermsService.listTermsByVersion(offering.currentVersionId);
      if (previousTerms.length > 0) {
        await DefaultTermsService.setDefaultTerms(version.id, previousTerms);
      }
    }

    // 3. Se informados recursos técnicos, associa-os
    if (dto.features && dto.features.length > 0) {
      await OfferingFeatureService.assignFeaturesToVersion(version.id, dto.features);
    } else if (offering.currentVersionId) {
      const prevFeatures = await OfferingFeatureService.listFeaturesByVersion(offering.currentVersionId);
      if (prevFeatures.length > 0) {
        await OfferingFeatureService.assignFeaturesToVersion(version.id, prevFeatures);
      }
    }

    // 4. Se informadas composições (pacotes), grava-as
    const compItems = dto.compositions || dto.composition;
    if (compItems && compItems.length > 0) {
      await OfferingCompositionService.setCompositions(offering.id, version.id, compItems);
    } else if (offering.currentVersionId) {
      const prevComps = await OfferingCompositionService.listCompositions(offering.id, offering.currentVersionId);
      if (prevComps.length > 0) {
        await OfferingCompositionService.setCompositions(
          offering.id,
          version.id,
          prevComps.map(c => ({
            childOfferingId: c.childOfferingId,
            childOfferingVersionId: c.childOfferingVersionId,
            quantity: c.quantity,
            required: c.required,
            sortOrder: c.sortOrder
          }))
        );
      }
    }

    const reloaded = await this.getVersionById(version.id);
    return reloaded!;
  }

  /**
   * Publica uma versão do catálogo, tornando-a a versão ativa corrente (ACTIVE)
   */
  public static async publishVersion(
    versionId: string,
    dto: PublishOfferingVersionDTO,
    userId: string,
    userName: string
  ): Promise<CommercialOfferingVersionDTO> {
    const version = await prisma.commercialOfferingVersion.findUnique({
      where: { id: versionId },
      include: {
        defaultTerms: true,
        features: true,
        compositions: true
      }
    });

    if (!version) {
      throw new Error(`Versão ID "${versionId}" não encontrada.`);
    }

    if (version.status === 'ACTIVE') {
      throw new Error(`Esta versão já está publicada e ativa.`);
    }

    if (version.status === 'DISCONTINUED') {
      throw new Error(`Uma versão descontinuada não pode ser reativada diretamente.`);
    }

    const now = new Date();
    const validFrom = dto.validFrom ? new Date(dto.validFrom) : (version.validFrom || now);
    const validUntil = dto.validUntil ? new Date(dto.validUntil) : version.validUntil;

    // Recomputa hash final de integridade antes da publicação
    const finalHash = this.computeContentHash({
      offeringId: version.offeringId,
      versionNumber: version.versionNumber,
      nameSnapshot: version.nameSnapshot,
      descriptionSnapshot: version.descriptionSnapshot,
      defaultTerms: version.defaultTerms,
      features: version.features,
      compositions: version.compositions
    });

    // 1. Atualiza a versão para ACTIVE
    const published = await prisma.commercialOfferingVersion.update({
      where: { id: versionId },
      data: {
        status: 'ACTIVE',
        contentHash: finalHash,
        validFrom,
        validUntil,
        publishedAt: now,
        publishedBy: userId,
        publishedByName: userName,
        changeSummary: dto.changeSummary || version.changeSummary
      }
    });

    // 2. Atualiza a oferta comercial apontando para esta nova versão corrente
    await prisma.commercialOffering.update({
      where: { id: version.offeringId },
      data: {
        name: version.nameSnapshot,
        description: version.descriptionSnapshot,
        status: 'ACTIVE',
        currentVersionId: version.id,
        currentVersionNumber: version.versionNumber
      }
    });

    const reloaded = await this.getVersionById(published.id);
    return reloaded!;
  }

  private static mapToDTO(v: any): CommercialOfferingVersionDTO {
    return {
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
      publishedByName: v.publishedByName,
      createdBy: v.createdBy,
      createdByName: v.createdByName,
      createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: v.updatedAt ? new Date(v.updatedAt).toISOString() : new Date().toISOString(),
      defaultTerms: v.defaultTerms?.map((t: any) => ({
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
      features: v.features?.map((f: any) => ({
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
      compositions: v.compositions?.map((c: any) => ({
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
