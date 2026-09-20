import { prisma } from '../../../../core/database/prisma';
import { ProposalDiffDTO, ProposalDiffItemDTO } from '../../../../../../shared/types';

export class ProposalDiffService {
  /**
   * Compara duas versões da proposta identificando alterações em condições comerciais, taxas, vigência e eventos
   */
  public static async compareVersions(
    proposalId: string,
    baseVersionNumber: number,
    targetVersionNumber: number
  ): Promise<ProposalDiffDTO> {
    const vBase = await prisma.commercialProposalVersion.findUnique({
      where: {
        proposalId_versionNumber: {
          proposalId,
          versionNumber: Number(baseVersionNumber)
        }
      },
      include: { terms: true, events: true }
    });

    const vTarget = await prisma.commercialProposalVersion.findUnique({
      where: {
        proposalId_versionNumber: {
          proposalId,
          versionNumber: Number(targetVersionNumber)
        }
      },
      include: { terms: true, events: true }
    });

    if (!vBase || !vTarget) {
      throw new Error(`Uma ou ambas as versões (V${baseVersionNumber}, V${targetVersionNumber}) não foram encontradas.`);
    }

    const changes: ProposalDiffItemDTO[] = [];

    // 1. Comparação de Cabeçalho / Vigência / Modelo
    if (vBase.title !== vTarget.title) {
      changes.push({
        category: 'HEADER',
        changeType: 'MODIFIED',
        identifier: 'title',
        label: 'Título da Proposta',
        oldValue: vBase.title,
        newValue: vTarget.title,
        description: `Título alterado de "${vBase.title}" para "${vTarget.title}"`
      });
    }

    const dateBase = vBase.validUntil ? new Date(vBase.validUntil).toISOString().split('T')[0] : '';
    const dateTarget = vTarget.validUntil ? new Date(vTarget.validUntil).toISOString().split('T')[0] : '';
    if (dateBase !== dateTarget) {
      changes.push({
        category: 'HEADER',
        changeType: 'MODIFIED',
        identifier: 'validUntil',
        label: 'Vigência da Proposta',
        oldValue: dateBase,
        newValue: dateTarget,
        description: `Validade alterada de ${dateBase} para ${dateTarget}`
      });
    }

    if (vBase.commercialModel !== vTarget.commercialModel) {
      changes.push({
        category: 'HEADER',
        changeType: 'MODIFIED',
        identifier: 'commercialModel',
        label: 'Modelo Comercial',
        oldValue: vBase.commercialModel,
        newValue: vTarget.commercialModel,
        description: `Modelo comercial alterado de ${vBase.commercialModel} para ${vTarget.commercialModel}`
      });
    }

    // 2. Comparação de Termos Comerciais
    const baseTerms = vBase.terms || [];
    const targetTerms = vTarget.terms || [];

    // Mapeamento por chave única (termType + name)
    const baseTermMap = new Map<string, any>(baseTerms.map((t: any) => [`${t.termType}_${t.name}`, t]));
    const targetTermMap = new Map<string, any>(targetTerms.map((t: any) => [`${t.termType}_${t.name}`, t]));

    for (const [key, tTarget] of targetTermMap.entries()) {
      const tBase: any = baseTermMap.get(key);
      if (!tBase) {
        changes.push({
          category: 'TERM',
          changeType: 'ADDED',
          identifier: key,
          label: tTarget.name,
          oldValue: null,
          newValue: tTarget,
          description: `Condição comercial "${tTarget.name}" adicionada (${tTarget.calculationType === 'PERCENTAGE' ? `${tTarget.percentage}%` : `R$ ${tTarget.amount}`})`
        });
      } else {
        // Verifica modificações de percentual, valor, pagador ou condições
        const pctChanged = tBase.percentage !== tTarget.percentage;
        const amtChanged = tBase.amount !== tTarget.amount;
        const payerChanged = tBase.payer !== tTarget.payer;
        const condChanged = (tBase.conditions || '').trim() !== (tTarget.conditions || '').trim();

        if (pctChanged || amtChanged || payerChanged || condChanged) {
          const details: string[] = [];
          if (pctChanged) details.push(`Percentual: ${tBase.percentage}% → ${tTarget.percentage}%`);
          if (amtChanged) details.push(`Valor: R$ ${tBase.amount} → R$ ${tTarget.amount}`);
          if (payerChanged) details.push(`Pagador: ${tBase.payer} → ${tTarget.payer}`);
          if (condChanged) details.push('Condições textuais ajustadas');

          changes.push({
            category: 'TERM',
            changeType: 'MODIFIED',
            identifier: key,
            label: tTarget.name,
            oldValue: tBase,
            newValue: tTarget,
            description: `Condição "${tTarget.name}" alterada: ${details.join(', ')}`
          });
        }
      }
    }

    for (const [key, tBase] of baseTermMap.entries()) {
      if (!targetTermMap.has(key)) {
        changes.push({
          category: 'TERM',
          changeType: 'REMOVED',
          identifier: key,
          label: (tBase as any).name,
          oldValue: tBase,
          newValue: null,
          description: `Condição comercial "${(tBase as any).name}" removida`
        });
      }
    }

    // 3. Comparação de Eventos
    const baseEvents = vBase.events || [];
    const targetEvents = vTarget.events || [];

    const baseEventMap = new Map<string, any>(baseEvents.map((e: any) => [e.estimatedEventName, e]));
    const targetEventMap = new Map<string, any>(targetEvents.map((e: any) => [e.estimatedEventName, e]));

    for (const [name, eTarget] of targetEventMap.entries()) {
      const eBase: any = baseEventMap.get(name);
      if (!eBase) {
        changes.push({
          category: 'EVENT',
          changeType: 'ADDED',
          identifier: name,
          label: name,
          oldValue: null,
          newValue: eTarget,
          description: `Evento "${name}" incluído no escopo da proposta`
        });
      } else {
        const venueChanged = (eBase.estimatedVenue || '') !== (eTarget.estimatedVenue || '');
        const tktChanged = eBase.estimatedTickets !== eTarget.estimatedTickets;
        const revChanged = eBase.estimatedGrossRevenue !== eTarget.estimatedGrossRevenue;

        if (venueChanged || tktChanged || revChanged) {
          changes.push({
            category: 'EVENT',
            changeType: 'MODIFIED',
            identifier: name,
            label: name,
            oldValue: eBase,
            newValue: eTarget,
            description: `Estimativas do evento "${name}" alteradas`
          });
        }
      }
    }

    for (const [name, eBase] of baseEventMap.entries()) {
      if (!targetEventMap.has(name)) {
        changes.push({
          category: 'EVENT',
          changeType: 'REMOVED',
          identifier: name,
          label: name,
          oldValue: eBase,
          newValue: null,
          description: `Evento "${name}" removido do escopo`
        });
      }
    }

    return {
      baseVersionNumber: Number(baseVersionNumber),
      targetVersionNumber: Number(targetVersionNumber),
      hasDifferences: changes.length > 0 || vBase.contentHash !== vTarget.contentHash,
      contentHashBase: vBase.contentHash,
      contentHashTarget: vTarget.contentHash,
      changes
    };
  }
}
