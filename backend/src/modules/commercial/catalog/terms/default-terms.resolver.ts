import { prisma } from '../../../../core/database/prisma';
import { CommercialDefaultTermDTO } from '../../../../../../shared/types';

export class DefaultTermsResolver {
  /**
   * Resolve as condições comerciais padrão ativas para uma oferta e versão.
   * Se for um pacote, inclui também as condições consolidadas dos itens que compõem o pacote se não sobrepostas.
   */
  public static async resolveTerms(
    offeringId: string,
    versionNumber?: number
  ): Promise<CommercialDefaultTermDTO[]> {
    const offering = await prisma.commercialOffering.findUnique({
      where: { id: offeringId }
    });

    if (!offering) {
      throw new Error(`Oferta ID "${offeringId}" não encontrada no catálogo.`);
    }

    let version: any = null;

    if (versionNumber) {
      version = await prisma.commercialOfferingVersion.findUnique({
        where: {
          offeringId_versionNumber: {
            offeringId,
            versionNumber
          }
        }
      });
    } else if (offering.currentVersionId) {
      version = await prisma.commercialOfferingVersion.findUnique({
        where: { id: offering.currentVersionId }
      });
    }

    if (!version) {
      // Fallback para termos herdados dos campos default da própria oferta
      return [
        {
          id: `term_fallback_${offering.id}`,
          offeringVersionId: version?.id || 'none',
          termType: (offering.type === 'PLAN' || offering.type === 'SERVICE') ? 'PLATFORM_COMMISSION' : 'CUSTOM',
          calculationType: offering.defaultPricingModel || 'PERCENTAGE',
          currency: 'BRL',
          percentage: offering.defaultPercentage,
          amount: offering.defaultAmount,
          minimumAmount: null,
          payer: offering.defaultPayer || 'PRODUCER',
          splitProducerPercentage: null,
          splitBuyerPercentage: null,
          conditions: null,
          negotiable: true,
          createdAt: new Date().toISOString()
        }
      ];
    }

    const terms = await prisma.commercialDefaultTerm.findMany({
      where: { offeringVersionId: version.id }
    });

    const mappedTerms: CommercialDefaultTermDTO[] = terms.map((t: any) => ({
      id: t.id,
      offeringVersionId: t.offeringVersionId,
      termType: t.termType,
      calculationType: t.calculationType,
      currency: t.currency || 'BRL',
      percentage: t.percentage,
      amount: t.amount,
      minimumAmount: t.minimumAmount,
      payer: t.payer || 'PRODUCER',
      splitProducerPercentage: t.splitProducerPercentage,
      splitBuyerPercentage: t.splitBuyerPercentage,
      conditions: t.conditions,
      negotiable: t.negotiable !== undefined ? t.negotiable : true,
      validFrom: t.validFrom ? new Date(t.validFrom).toISOString() : null,
      validUntil: t.validUntil ? new Date(t.validUntil).toISOString() : null,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString()
    }));

    // Se a oferta tiver termos próprios na versão, retorna-os
    if (mappedTerms.length > 0) {
      return mappedTerms;
    }

    // Se for um pacote sem termos próprios, busca termos das composições filhas
    if (offering.type === 'PACKAGE') {
      const compositions = await prisma.commercialOfferingComposition.findMany({
        where: { parentOfferingVersionId: version.id }
      });

      const aggregatedTerms: CommercialDefaultTermDTO[] = [];
      for (const comp of compositions) {
        const childTerms = await this.resolveTerms(comp.childOfferingId);
        aggregatedTerms.push(...childTerms);
      }

      if (aggregatedTerms.length > 0) {
        return aggregatedTerms;
      }
    }

    // Fallback padrão se não houver termos cadastrados
    return [
      {
        id: `term_def_${version.id}`,
        offeringVersionId: version.id,
        termType: 'PLATFORM_COMMISSION',
        calculationType: offering.defaultPricingModel || 'PERCENTAGE',
        currency: 'BRL',
        percentage: offering.defaultPercentage,
        amount: offering.defaultAmount,
        minimumAmount: null,
        payer: offering.defaultPayer || 'PRODUCER',
        splitProducerPercentage: null,
        splitBuyerPercentage: null,
        conditions: null,
        negotiable: true,
        createdAt: new Date().toISOString()
      }
    ];
  }
}
