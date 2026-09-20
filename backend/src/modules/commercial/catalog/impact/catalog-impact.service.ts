import { prisma } from '../../../../core/database/prisma';
import { CommercialCatalogImpactDTO } from '../../../../../../shared/types';

export class CatalogImpactService {
  /**
   * Avalia o impacto comercial e contratual antes de descontinuar ou alterar uma oferta.
   * Propostas aceitas e contratos ativos são isolados por snapshot e NUNCA quebram.
   */
  public static async analyzeImpact(offeringId: string): Promise<CommercialCatalogImpactDTO> {
    const offering = await prisma.commercialOffering.findUnique({
      where: { id: offeringId }
    });

    if (!offering) {
      throw new Error(`Oferta ID "${offeringId}" não encontrada para análise de impacto.`);
    }

    // 1. Propostas em Rascunho / Em Revisão que utilizam este offeringId em seus termos
    const allProposals = await prisma.commercialProposal.findMany({
      include: {
        versions: {
          include: {
            terms: true
          }
        }
      }
    });

    let draftCount = 0;
    let sentCount = 0;

    for (const prop of allProposals) {
      const currentVer = prop.versions?.find((v: any) => v.id === prop.currentVersionId) || prop.versions?.[prop.versions.length - 1];
      const hasOffering = currentVer?.terms?.some((t: any) => t.offeringId === offeringId);

      if (hasOffering) {
        if (['DRAFT', 'IN_REVIEW', 'APPROVAL_PENDING'].includes(prop.status)) {
          draftCount++;
        } else if (['READY_TO_SEND', 'SENT', 'VIEWED'].includes(prop.status)) {
          sentCount++;
        }
      }
    }

    // 2. Contratos Ativos ou Assinados que utilizam este offeringId
    const allContracts = await prisma.commercialContract.findMany({
      include: {
        versions: {
          include: {
            terms: true
          }
        }
      }
    });

    let activeContractsCount = 0;
    for (const ctr of allContracts) {
      if (['ACTIVE', 'SIGNED'].includes(ctr.status)) {
        const currentVer = ctr.versions?.find((v: any) => v.id === ctr.currentVersionId) || ctr.versions?.[ctr.versions.length - 1];
        const hasOffering = currentVer?.terms?.some((t: any) => t.offeringId === offeringId);
        if (hasOffering) {
          activeContractsCount++;
        }
      }
    }

    // 3. Pacotes ou Planos Pai que incluem esta oferta como item componente
    const parentComps = await prisma.commercialOfferingComposition.findMany({
      where: { childOfferingId: offeringId }
    });

    const parentOfferingIds = Array.from(new Set(parentComps.map((c: any) => c.parentOfferingId)));
    const parentPackages: Array<{ id: string; name: string; publicCode: string }> = [];

    for (const pId of parentOfferingIds) {
      const pOff = await prisma.commercialOffering.findUnique({ where: { id: pId } });
      if (pOff && pOff.status === 'ACTIVE') {
        parentPackages.push({
          id: pOff.id,
          name: pOff.name,
          publicCode: pOff.publicCode
        });
      }
    }

    const warningParts: string[] = [];
    if (parentPackages.length > 0) {
      warningParts.push(`Presente como componente em ${parentPackages.length} pacote(s) ativo(s) (${parentPackages.map(p => p.name).join(', ')}).`);
    }
    if (draftCount > 0) {
      warningParts.push(`Presente em ${draftCount} proposta(s) em negociação.`);
    }
    if (activeContractsCount > 0) {
      warningParts.push(`Presente em ${activeContractsCount} contrato(s) ativo(s) (preservados integralmente por snapshot).`);
    }

    const warningMessage = warningParts.length > 0
      ? `Atenção: ${warningParts.join(' ')} A descontinuação impedirá novas vendas sem alterar registros históricos.`
      : 'Oferta sem dependências ativas impedindo descontinuação imediata.';

    return {
      offeringId: offering.id,
      offeringCode: offering.code,
      offeringName: offering.name,
      draftProposalsCount: draftCount,
      sentProposalsCount: sentCount,
      activeContractsCount,
      parentPackagesCount: parentPackages.length,
      parentPackages,
      canDiscontinue: true, // Sempre permitido pois respeita imutabilidade por snapshot
      warningMessage
    };
  }
}
