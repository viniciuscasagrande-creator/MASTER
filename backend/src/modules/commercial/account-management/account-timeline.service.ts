import { prisma } from '../../../core/database/prisma';
import {
  AccountCommercialTimelineDTO,
  AccountCommercialTimelineEventDTO
} from '../../../../../shared/types';

export class AccountTimelineService {
  /**
   * Constrói a linha do tempo comercial unificada da conta do produtor.
   * REGRA FUNDAMENTAL: Zero duplicação. Não existe tabela ProducerCommercialHistory.
   * Os fatos são agregados em tempo de consulta a partir dos módulos 1.3.3 a 1.3.8.
   */
  public static async getAccountTimeline(producerId: string): Promise<AccountCommercialTimelineDTO> {
    const producer = await prisma.producer.findUnique({
      where: { id: producerId }
    });

    if (!producer) {
      const err: any = new Error(`Produtor ${producerId} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    const events: AccountCommercialTimelineEventDTO[] = [];

    // 1. Contratos Comerciais (1.3.6)
    const contracts = await prisma.commercialContract.findMany({
      where: { producerId },
      include: { amendments: true, renewals: true }
    });

    for (const c of contracts) {
      events.push({
        id: `timeline_ctr_${c.id}`,
        timestamp: new Date(c.createdAt).toISOString(),
        category: 'CONTRACT',
        type: 'CONTRACT_CREATED',
        title: `Contrato Criado — ${c.publicCode}`,
        description: `Contrato comercial formal gerado com status ${c.status}.`,
        actorId: c.createdBy || null,
        actorName: c.createdByName || null,
        referenceId: c.id,
        referencePublicCode: c.publicCode,
        metadata: { status: c.status, effectiveFrom: c.effectiveFrom, effectiveUntil: c.effectiveUntil }
      });

      if (c.signedAt) {
        events.push({
          id: `timeline_ctr_signed_${c.id}`,
          timestamp: new Date(c.signedAt).toISOString(),
          category: 'CONTRACT',
          type: 'CONTRACT_SIGNED',
          title: `Contrato Assinado — ${c.publicCode}`,
          description: `Instrumento jurídico assinado e efetivado na plataforma.`,
          actorId: null,
          actorName: 'Partes Contratantes',
          referenceId: c.id,
          referencePublicCode: c.publicCode,
          metadata: { signedAt: c.signedAt }
        });
      }

      // Aditivos Contratuais (1.3.6)
      for (const adt of c.amendments || []) {
        events.push({
          id: `timeline_adt_${adt.id}`,
          timestamp: new Date(adt.createdAt).toISOString(),
          category: 'AMENDMENT',
          type: 'AMENDMENT_CREATED',
          title: `Termo Aditivo — ${adt.publicCode || `Nº ${adt.amendmentNumber}`}`,
          description: adt.summary || adt.reason || 'Alteração de condições comerciais ou vigência.',
          actorId: adt.createdBy || null,
          actorName: adt.createdByName || null,
          referenceId: adt.id,
          referencePublicCode: adt.publicCode || null,
          metadata: { amendmentNumber: adt.amendmentNumber, type: adt.type, status: adt.status }
        });
      }

      // Renovações Contratuais (1.3.6 & 1.3.9)
      for (const rnw of c.renewals || []) {
        events.push({
          id: `timeline_rnw_${rnw.id}`,
          timestamp: new Date(rnw.createdAt).toISOString(),
          category: 'RENEWAL',
          type: 'RENEWAL_CYCLE_STARTED',
          title: `Ciclo de Renovação ${rnw.renewalCycle || 1} Iniciado`,
          description: `Tipo: ${rnw.renewalType === 'SIMPLE' ? 'Renovação Simples' : 'Renegociação Completa'}. Status: ${rnw.status}. ${rnw.notes || ''}`,
          actorId: rnw.createdBy || null,
          actorName: rnw.createdByName || null,
          referenceId: rnw.id,
          referencePublicCode: c.publicCode,
          metadata: { renewalCycle: rnw.renewalCycle, renewalType: rnw.renewalType, status: rnw.status }
        });

        if (rnw.completedAt) {
          events.push({
            id: `timeline_rnw_completed_${rnw.id}`,
            timestamp: new Date(rnw.completedAt).toISOString(),
            category: 'RENEWAL',
            type: 'RENEWAL_COMPLETED',
            title: `Renovação Ciclo ${rnw.renewalCycle || 1} Concluída`,
            description: `Contrato renovado com sucesso até ${rnw.targetEffectiveUntil ? new Date(rnw.targetEffectiveUntil).toLocaleDateString('pt-BR') : 'data acordada'}.`,
            actorId: null,
            actorName: rnw.responsibleName || 'Comercial',
            referenceId: rnw.id,
            referencePublicCode: c.publicCode,
            metadata: { targetEffectiveUntil: rnw.targetEffectiveUntil }
          });
        }
      }
    }

    // 2. Oportunidades Comerciais e Movimentações (1.3.4 & 1.3.9)
    const opportunities = await prisma.commercialOpportunity.findMany({
      where: { producerId },
      orderBy: { createdAt: 'desc' }
    });

    for (const opp of opportunities) {
      events.push({
        id: `timeline_opp_${opp.id}`,
        timestamp: new Date(opp.createdAt).toISOString(),
        category: 'OPPORTUNITY',
        type: 'OPPORTUNITY_CREATED',
        title: `Oportunidade Comercial — ${opp.title}`,
        description: opp.description || `Oportunidade aberta no código ${opp.publicCode}.`,
        actorId: opp.ownerId,
        actorName: opp.ownerName || null,
        referenceId: opp.id,
        referencePublicCode: opp.publicCode,
        metadata: { movementType: opp.movementType, status: opp.status, estimatedValue: opp.estimatedValue }
      });

      if (opp.wonAt) {
        events.push({
          id: `timeline_opp_won_${opp.id}`,
          timestamp: new Date(opp.wonAt).toISOString(),
          category: 'OPPORTUNITY',
          type: 'OPPORTUNITY_WON',
          title: `Oportunidade Ganha — ${opp.title}`,
          description: `Negociação comercial concluída com êxito.`,
          actorId: opp.wonBy || opp.ownerId,
          actorName: opp.ownerName || null,
          referenceId: opp.id,
          referencePublicCode: opp.publicCode,
          metadata: { wonAt: opp.wonAt }
        });
      }
    }

    // 3. Propostas Comerciais (1.3.5)
    const proposals = await prisma.commercialProposal.findMany({
      where: { producerId },
      orderBy: { createdAt: 'desc' }
    });

    for (const prop of proposals) {
      events.push({
        id: `timeline_prop_${prop.id}`,
        timestamp: new Date(prop.createdAt).toISOString(),
        category: 'PROPOSAL',
        type: 'PROPOSAL_GENERATED',
        title: `Proposta Comercial — ${prop.publicCode}`,
        description: `Proposta formal emitida com status ${prop.status}.`,
        actorId: prop.ownerId || prop.createdBy || null,
        actorName: prop.ownerName || null,
        referenceId: prop.id,
        referencePublicCode: prop.publicCode,
        metadata: { status: prop.status, currentVersionNumber: prop.currentVersionNumber }
      });

      if (prop.acceptedAt) {
        events.push({
          id: `timeline_prop_acc_${prop.id}`,
          timestamp: new Date(prop.acceptedAt).toISOString(),
          category: 'PROPOSAL',
          type: 'PROPOSAL_ACCEPTED',
          title: `Proposta Aceita — ${prop.publicCode}`,
          description: `Produtor formalizou o aceite das condições comerciais da proposta.`,
          actorId: null,
          actorName: 'Produtor',
          referenceId: prop.id,
          referencePublicCode: prop.publicCode,
          metadata: { acceptedAt: prop.acceptedAt }
        });
      }
    }

    // 4. Atividades de Relacionamento (1.3.3)
    const activities = await prisma.commercialActivity.findMany({
      where: { producerId },
      orderBy: { occurredAt: 'desc' }
    });

    for (const act of activities) {
      events.push({
        id: `timeline_act_${act.id}`,
        timestamp: new Date(act.occurredAt || act.createdAt).toISOString(),
        category: 'ACTIVITY',
        type: `ACTIVITY_${act.type}`,
        title: `Interação B2B: ${act.subject}`,
        description: act.description || `Atividade de relacionamento registrada pelo executivo de contas.`,
        actorId: act.createdBy,
        actorName: act.createdByName || null,
        referenceId: act.id,
        referencePublicCode: null,
        metadata: { type: act.type, nextActionAt: act.nextActionAt, nextActionDescription: act.nextActionDescription }
      });
    }

    // 5. Habilitações e Mudanças de Entitlements (1.3.8)
    const entitlements = await prisma.producerEntitlement.findMany({
      where: { producerId }
    });

    for (const ent of entitlements) {
      events.push({
        id: `timeline_ent_${ent.id}`,
        timestamp: new Date(ent.createdAt).toISOString(),
        category: 'ENTITLEMENT',
        type: 'FEATURE_ACTIVATED',
        title: `Recurso Habilitado: ${ent.featureName || ent.featureCode}`,
        description: `Feature ${ent.featureCode} ativada via contrato/plano vigente.`,
        actorId: null,
        actorName: 'Sistema de Habilitação',
        referenceId: ent.id,
        referencePublicCode: null,
        metadata: { featureCode: ent.featureCode, status: ent.status }
      });
    }

    // Ordenação cronológica estrita (mais recente primeiro)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      producerId: producer.id,
      producerName: producer.name,
      events,
      totalEvents: events.length
    };
  }
}
