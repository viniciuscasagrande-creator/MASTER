import { prisma } from '../../../../core/database/prisma';
import { EffectiveCommercialTermsDTO } from '../../../../../../shared/types';

export class ContractEffectiveTermsService {
  /**
   * Resolve as condições comerciais efetivas vigentes para um produtor em uma determinada data (atDate).
   * Consolida: Contrato Base Vigente + Todos os Aditivos Ativos cujo effectiveFrom <= atDate.
   * Este serviço é a fonte da verdade oficial para cálculos de repasse, borderô e taxas pelo Financeiro.
   */
  public static async getEffectiveTerms(
    producerId: string,
    atDate: Date = new Date()
  ): Promise<EffectiveCommercialTermsDTO | null> {
    const atTime = atDate.getTime();

    // Busca contratos do produtor
    const contracts = await prisma.commercialContract.findMany({
      where: { producerId },
      include: {
        versions: {
          include: { terms: true }
        },
        amendments: true
      }
    });

    // Encontra o contrato vigente na data especificada
    const activeContract = contracts.find((c: any) => {
      // O contrato deve estar ACTIVE ou SIGNED com data de vigência atendida
      if (c.status !== 'ACTIVE' && c.status !== 'SIGNED') return false;

      const fromTime = c.effectiveFrom ? new Date(c.effectiveFrom).getTime() : 0;
      const untilTime = c.effectiveUntil ? new Date(c.effectiveUntil).getTime() : Infinity;

      return fromTime <= atTime && atTime <= untilTime;
    });

    if (!activeContract) {
      return null;
    }

    // Pega a versão atual do contrato
    const currentVersion = (activeContract.versions || []).find(
      (v: any) => v.versionNumber === activeContract.currentVersionNumber
    ) || activeContract.versions?.[0];

    const baseTerms = currentVersion?.terms || [];

    // Mapeamento dos termos efetivos iniciando pela minuta base
    const termsMap = new Map<string, any>();

    for (const term of baseTerms) {
      const key = term.offeringId || term.termType;
      termsMap.set(key, {
        termType: term.termType,
        name: term.name,
        calculationType: term.calculationType,
        percentage: term.percentage,
        amount: term.amount,
        minimumAmount: term.minimumAmount,
        payer: term.payer,
        splitProducerPercentage: term.splitProducerPercentage,
        splitBuyerPercentage: term.splitBuyerPercentage,
        conditions: term.conditions,
        source: 'BASE_CONTRACT',
        sourceAmendmentCode: null
      });
    }

    // Filtra aditivos com status ACTIVE e vigência iniciada até atDate
    const activeAmendments = (activeContract.amendments || []).filter((a: any) => {
      if (a.status !== 'ACTIVE') return false;
      const amendmentEffective = new Date(a.effectiveFrom).getTime();
      return amendmentEffective <= atTime;
    });

    // Ordena aditivos cronologicamente por número/data
    activeAmendments.sort((a: any, b: any) => a.amendmentNumber - b.amendmentNumber);

    // Aplica sobreposição de aditivos sobre os termos base
    for (const amendment of activeAmendments) {
      if (amendment.termsSnapshotJson) {
        try {
          const amendmentTerms = JSON.parse(amendment.termsSnapshotJson);
          for (const at of amendmentTerms) {
            const key = at.offeringId || at.termType;
            termsMap.set(key, {
              termType: at.termType,
              name: at.name,
              calculationType: at.calculationType,
              percentage: at.percentage,
              amount: at.amount,
              minimumAmount: at.minimumAmount,
              payer: at.payer,
              splitProducerPercentage: at.splitProducerPercentage,
              splitBuyerPercentage: at.splitBuyerPercentage,
              conditions: at.conditions,
              source: 'AMENDMENT',
              sourceAmendmentCode: amendment.publicCode
            });
          }
        } catch (e) {
          // ignore parsing error if any
        }
      }
    }

    return {
      producerId,
      contractId: activeContract.id,
      contractPublicCode: activeContract.publicCode,
      contractTitle: activeContract.title,
      atDate: atDate.toISOString(),
      isContractActive: activeContract.status === 'ACTIVE',
      activeAmendmentsCount: activeAmendments.length,
      terms: Array.from(termsMap.values())
    };
  }
}
