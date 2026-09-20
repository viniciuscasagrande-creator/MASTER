import crypto from 'crypto';
import { prisma } from '../../../../core/database/prisma';
import { CommercialContractVersionDTO } from '../../../../../../shared/types';

export class ContractVersionService {
  /**
   * Calcula o contentHash SHA-256 canônico e determinístico dos termos, partes e vigência do contrato.
   * Mudança em qualquer taxa, condição, parte ou vigência altera o hash.
   */
  public static computeContentHash(data: {
    title: string;
    effectiveFrom: string | Date | null;
    effectiveUntil: string | Date | null;
    terms: Array<{
      termType: string;
      name: string;
      calculationType: string;
      percentage?: number | null;
      amount?: number | null;
      minimumAmount?: number | null;
      payer: string;
      conditions?: string | null;
      splitProducerPercentage?: number | null;
      splitBuyerPercentage?: number | null;
    }>;
    parties?: Array<{
      partyType: string;
      legalName: string;
      document: string;
      representativeName: string;
    }>;
  }): string {
    const effectiveFromIso = data.effectiveFrom
      ? (data.effectiveFrom instanceof Date ? data.effectiveFrom.toISOString().split('T')[0] : new Date(data.effectiveFrom).toISOString().split('T')[0])
      : null;

    const effectiveUntilIso = data.effectiveUntil
      ? (data.effectiveUntil instanceof Date ? data.effectiveUntil.toISOString().split('T')[0] : new Date(data.effectiveUntil).toISOString().split('T')[0])
      : null;

    const canonicalTerms = [...(data.terms || [])]
      .map(t => ({
        termType: t.termType,
        name: (t.name || '').trim(),
        calculationType: t.calculationType,
        percentage: t.percentage !== undefined && t.percentage !== null ? Number(t.percentage).toFixed(2) : null,
        amount: t.amount !== undefined && t.amount !== null ? Number(t.amount).toFixed(2) : null,
        minimumAmount: t.minimumAmount !== undefined && t.minimumAmount !== null ? Number(t.minimumAmount).toFixed(2) : null,
        payer: t.payer,
        conditions: t.conditions ? t.conditions.trim() : null,
        splitProducerPercentage: t.splitProducerPercentage !== undefined && t.splitProducerPercentage !== null ? Number(t.splitProducerPercentage).toFixed(2) : null,
        splitBuyerPercentage: t.splitBuyerPercentage !== undefined && t.splitBuyerPercentage !== null ? Number(t.splitBuyerPercentage).toFixed(2) : null
      }))
      .sort((a, b) => a.termType.localeCompare(b.termType) || a.name.localeCompare(b.name));

    const canonicalParties = [...(data.parties || [])]
      .map(p => ({
        partyType: p.partyType,
        legalName: (p.legalName || '').trim(),
        document: (p.document || '').replace(/\D/g, ''),
        representativeName: (p.representativeName || '').trim()
      }))
      .sort((a, b) => a.partyType.localeCompare(b.partyType));

    const canonicalObject = {
      title: data.title.trim(),
      effectiveFrom: effectiveFromIso,
      effectiveUntil: effectiveUntilIso,
      terms: canonicalTerms,
      parties: canonicalParties
    };

    const canonicalString = JSON.stringify(canonicalObject);
    return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
  }

  /**
   * Obtém versão específica com termos hidratados
   */
  public static async getVersion(contractId: string, versionNumber: number): Promise<CommercialContractVersionDTO | null> {
    const version = await prisma.commercialContractVersion.findUnique({
      where: {
        contractId_versionNumber: {
          contractId,
          versionNumber
        }
      },
      include: {
        terms: true
      }
    });

    if (!version) return null;

    return {
      ...version,
      createdAt: version.createdAt instanceof Date ? version.createdAt.toISOString() : version.createdAt,
      updatedAt: version.updatedAt instanceof Date ? version.updatedAt.toISOString() : version.updatedAt,
      effectiveFrom: version.effectiveFrom ? (version.effectiveFrom instanceof Date ? version.effectiveFrom.toISOString() : version.effectiveFrom) : null,
      effectiveUntil: version.effectiveUntil ? (version.effectiveUntil instanceof Date ? version.effectiveUntil.toISOString() : version.effectiveUntil) : null,
      approvedAt: version.approvedAt ? (version.approvedAt instanceof Date ? version.approvedAt.toISOString() : version.approvedAt) : null,
      signedAt: version.signedAt ? (version.signedAt instanceof Date ? version.signedAt.toISOString() : version.signedAt) : null,
      terms: (version.terms || []).map((t: any) => ({
        ...t,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt
      }))
    };
  }
}
