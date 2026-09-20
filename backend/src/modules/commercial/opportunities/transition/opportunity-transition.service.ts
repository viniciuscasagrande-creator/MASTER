import { prisma } from '../../../../core/database/prisma';
import { AuditService } from '../../../audit/audit.service';
import { OpportunityClosingService } from '../closing/opportunity-closing.service';
import { CommercialOpportunityDTO } from '../../../../../../shared/types';

export class OpportunityTransitionService {
  /**
   * Executa a transição de estágio de uma oportunidade no Kanban/Pipeline
   * com controle de concorrência otimista (409) e histórico detalhado.
   */
  public static async transitionStage(
    input: {
      opportunityId: string;
      targetStageId: string;
      expectedVersion: number;
      reason?: string;
      closeReasonId?: string;
      closeNotes?: string;
    },
    user: any
  ): Promise<CommercialOpportunityDTO> {
    const opp = await prisma.commercialOpportunity.findUnique({ where: { id: input.opportunityId } });
    if (!opp) throw new Error(`Oportunidade ${input.opportunityId} não encontrada.`);

    if (opp.status !== 'OPEN') {
      throw new Error(`Oportunidades finalizadas (${opp.status}) não podem transicionar de estágio.`);
    }

    if (opp.version !== input.expectedVersion) {
      throw new Error('Conflito de versão ao mover oportunidade (409). Outro usuário atualizou este card.');
    }

    if (opp.stageId === input.targetStageId) {
      // Mesmo estágio, sem transição
      return opp;
    }

    const targetStage = await prisma.commercialPipelineStage.findUnique({
      where: { id: input.targetStageId }
    });
    if (!targetStage) {
      throw new Error(`Estágio ${input.targetStageId} não existe.`);
    }

    if (targetStage.pipelineId !== opp.pipelineId) {
      throw new Error('O estágio de destino pertence a um pipeline diferente.');
    }

    // Se o estágio destino for WON, redireciona para fechamento como Ganho
    if (targetStage.stageType === 'WON') {
      return OpportunityClosingService.winOpportunity(
        {
          opportunityId: opp.id,
          expectedVersion: input.expectedVersion,
          notes: input.reason
        },
        user
      );
    }

    // Se o estágio destino for CLOSED, exige motivo e notas
    if (targetStage.stageType === 'CLOSED') {
      if (!input.closeReasonId || !input.closeNotes) {
        throw new Error('Para mover para estágio de perda/encerramento, selecione o motivo e informe a justificativa.');
      }
      return OpportunityClosingService.closeOpportunity(
        {
          opportunityId: opp.id,
          expectedVersion: input.expectedVersion,
          closeReasonId: input.closeReasonId,
          closeNotes: input.closeNotes
        },
        user
      );
    }

    // Transição entre estágios abertos
    const lastHistories = await prisma.opportunityStageHistory.findMany({
      where: { opportunityId: opp.id }
    });
    const lastHistory = lastHistories[lastHistories.length - 1];
    const prevTime = lastHistory ? new Date(lastHistory.changedAt).getTime() : new Date(opp.createdAt).getTime();
    const durationSeconds = Math.max(0, Math.floor((Date.now() - prevTime) / 1000));

    const updated = await prisma.commercialOpportunity.update({
      where: { id: opp.id, version: opp.version },
      data: {
        stageId: targetStage.id
      }
    });

    await prisma.opportunityStageHistory.create({
      data: {
        opportunityId: opp.id,
        fromStageId: opp.stageId,
        toStageId: targetStage.id,
        changedBy: user.id,
        changedByName: user.name,
        changedAt: new Date(),
        reason: input.reason || null,
        durationSeconds
      }
    });

    await AuditService.log({
      action: 'COMMERCIAL_OPPORTUNITY_STAGE_CHANGED',
      resource: `opportunity:${opp.id}`,
      userId: user.id,
      details: {
        fromStage: opp.stageId,
        toStage: targetStage.id,
        targetStageName: targetStage.name,
        durationSeconds,
        reason: input.reason
      }
    });

    return {
      id: updated.id,
      publicCode: updated.publicCode,
      producerId: updated.producerId || undefined,
      leadId: updated.leadId || undefined,
      pipelineId: updated.pipelineId,
      stageId: updated.stageId,
      stageName: targetStage.name,
      stageCode: targetStage.code,
      title: updated.title,
      description: updated.description || undefined,
      typeId: updated.typeId || undefined,
      ownerId: updated.ownerId,
      ownerName: updated.ownerName || undefined,
      estimatedValue: updated.estimatedValue !== null ? Number(updated.estimatedValue) : null,
      expectedDecisionAt: updated.expectedDecisionAt ? new Date(updated.expectedDecisionAt).toISOString() : undefined,
      status: updated.status,
      wonAt: updated.wonAt ? new Date(updated.wonAt).toISOString() : undefined,
      wonBy: updated.wonBy || undefined,
      closedAt: updated.closedAt ? new Date(updated.closedAt).toISOString() : undefined,
      closedBy: updated.closedBy || undefined,
      closeReasonId: updated.closeReasonId || undefined,
      closeNotes: updated.closeNotes || undefined,
      nextActionAt: updated.nextActionAt ? new Date(updated.nextActionAt).toISOString() : undefined,
      nextActionDescription: updated.nextActionDescription || undefined,
      version: updated.version,
      createdAt: new Date(updated.createdAt).toISOString(),
      updatedAt: new Date(updated.updatedAt).toISOString()
    };
  }
}
