import { prisma } from '../../../../core/database/prisma';
import { CommercialDefaultTermDTO } from '../../../../../../shared/types';
import { DefaultTermsResolver } from './default-terms.resolver';

export class DefaultTermsService {
  /**
   * Lista todas as condições padrão cadastradas para uma versão
   */
  public static async listTermsByVersion(offeringVersionId: string): Promise<CommercialDefaultTermDTO[]> {
    const terms = await prisma.commercialDefaultTerm.findMany({
      where: { offeringVersionId }
    });

    return terms.map((t: any) => ({
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
  }

  /**
   * Define os termos padrão para uma versão de oferta
   */
  public static async setDefaultTerms(
    offeringVersionId: string,
    terms: Array<Partial<CommercialDefaultTermDTO>>
  ): Promise<CommercialDefaultTermDTO[]> {
    await prisma.commercialDefaultTerm.deleteMany({
      where: { offeringVersionId }
    });

    const result: CommercialDefaultTermDTO[] = [];

    for (const t of terms) {
      const created = await prisma.commercialDefaultTerm.create({
        data: {
          offeringVersionId,
          termType: t.termType || 'PLATFORM_COMMISSION',
          calculationType: t.calculationType || 'PERCENTAGE',
          currency: t.currency || 'BRL',
          percentage: t.percentage !== undefined ? Number(t.percentage) : null,
          amount: t.amount !== undefined ? Number(t.amount) : null,
          minimumAmount: t.minimumAmount !== undefined ? Number(t.minimumAmount) : null,
          payer: t.payer || 'PRODUCER',
          splitProducerPercentage: t.splitProducerPercentage !== undefined ? Number(t.splitProducerPercentage) : null,
          splitBuyerPercentage: t.splitBuyerPercentage !== undefined ? Number(t.splitBuyerPercentage) : null,
          conditions: t.conditions || null,
          negotiable: t.negotiable !== undefined ? t.negotiable : true,
          validFrom: t.validFrom ? new Date(t.validFrom) : null,
          validUntil: t.validUntil ? new Date(t.validUntil) : null
        }
      });

      result.push({
        id: created.id,
        offeringVersionId: created.offeringVersionId,
        termType: created.termType,
        calculationType: created.calculationType,
        currency: created.currency || 'BRL',
        percentage: created.percentage,
        amount: created.amount,
        minimumAmount: created.minimumAmount,
        payer: created.payer || 'PRODUCER',
        splitProducerPercentage: created.splitProducerPercentage,
        splitBuyerPercentage: created.splitBuyerPercentage,
        conditions: created.conditions,
        negotiable: created.negotiable,
        validFrom: created.validFrom ? new Date(created.validFrom).toISOString() : null,
        validUntil: created.validUntil ? new Date(created.validUntil).toISOString() : null,
        createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : new Date().toISOString()
      });
    }

    return result;
  }

  /**
   * Resolução unificada de condições padrão ativas
   */
  public static async resolveTerms(offeringId: string, versionNumber?: number): Promise<CommercialDefaultTermDTO[]> {
    return DefaultTermsResolver.resolveTerms(offeringId, versionNumber);
  }
}
