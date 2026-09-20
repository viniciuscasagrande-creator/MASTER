import { prisma } from '../../../../core/database/prisma';
import { AuditService } from '../../../audit/audit.service';
import { CommercialOpportunityDTO } from '../../../../../../shared/types';

export class OpportunityClosingService {
  /**
   * Marca uma oportunidade como Ganha (WON).
   * Conforme diretriz: Ganhar uma negociação NÃO cria automaticamente evento nem contrato.
   */
  public static async winOpportunity(
    input: {
      opportunityId: string;
      expectedVersion?: number;
      notes?: string;
    },
    user: any
  ): Promise<CommercialOpportunityDTO> {
    const opp = await prisma.commercialOpportunity.findUnique({ where: { id: input.opportunityId } });
    if (!opp) throw new Error(`Oportunidade ${input.opportunityId} não encontrada.`);
    if (opp.status !== 'OPEN') {
      throw new Error(`Oportunidade já está finalizada como "${opp.status}".`);
    }

    if (input.expectedVersion !== undefined && opp.version !== input.expectedVersion) {
      throw new Error('Conflito de concorrência ao finalizar oportunidade (409).');
    }

    // Busca estágio do tipo WON no pipeline da oportunidade
    const wonStage = await prisma.commercialPipelineStage.findFirst({
      where: { pipelineId: opp.pipelineId, stageType: 'WON', active: true }
    });

    if (!wonStage) {
      throw new Error('Estágio de vitória (WON) não configurado para este pipeline.');
    }

    // Calcula duração no estágio anterior
    const lastHistories = await prisma.opportunityStageHistory.findMany({
      where: { opportunityId: opp.id }
    });
    const lastHistory = lastHistories[lastHistories.length - 1];
    const prevTime = lastHistory ? new Date(lastHistory.changedAt).getTime() : new Date(opp.createdAt).getTime();
    const durationSeconds = Math.max(0, Math.floor((Date.now() - prevTime) / 1000));

    // Atualiza oportunidade
    const updated = await prisma.commercialOpportunity.update({
      where: { id: opp.id, version: opp.version },
      data: {
        stageId: wonStage.id,
        status: 'WON',
        wonAt: new Date(),
        wonBy: user.id
      }
    });

    // Registra histórico
    await prisma.opportunityStageHistory.create({
      data: {
        opportunityId: opp.id,
        fromStageId: opp.stageId,
        toStageId: wonStage.id,
        changedBy: user.id,
        changedByName: user.name,
        changedAt: new Date(),
        reason: input.notes || 'Negociação concluída com sucesso (Ganha).',
        durationSeconds
      }
    });

    await AuditService.log({
      action: 'COMMERCIAL_OPPORTUNITY_WON',
      resource: `opportunity:${opp.id}`,
      userId: user.id,
      details: {
        publicCode: opp.publicCode,
        title: opp.title,
        estimatedValue: opp.estimatedValue,
        notes: input.notes
      }
    });

    return {
      id: updated.id,
      publicCode: updated.publicCode,
      producerId: updated.producerId || undefined,
      leadId: updated.leadId || undefined,
      pipelineId: updated.pipelineId,
      stageId: updated.stageId,
      stageName: wonStage.name,
      stageCode: wonStage.code,
      title: updated.title,
      description: updated.description || undefined,
      typeId: updated.typeId || undefined,
      ownerId: updated.ownerId,
      ownerName: updated.ownerName || undefined,
      estimatedValue: updated.estimatedValue !== null ? Number(updated.estimatedValue) : null,
      expectedDecisionAt: updated.expectedDecisionAt ? new Date(updated.expectedDecisionAt).toISOString() : undefined,
      status: 'WON',
      wonAt: updated.wonAt ? new Date(updated.wonAt).toISOString() : undefined,
      wonBy: updated.wonBy || undefined,
      closedAt: undefined,
      closedBy: undefined,
      closeReasonId: undefined,
      closeReasonName: undefined,
      closeNotes: undefined,
      nextActionAt: updated.nextActionAt ? new Date(updated.nextActionAt).toISOString() : undefined,
      nextActionDescription: updated.nextActionDescription || undefined,
      version: updated.version,
      createdAt: new Date(updated.createdAt).toISOString(),
      updatedAt: new Date(updated.updatedAt).toISOString()
    };
  }

  /**
   * Encerra/Perde uma oportunidade comercial (CLOSED).
   * Exige motivo de encerramento do catálogo objetivo e justificativa.
   */
  public static async closeOpportunity(
    input: {
      opportunityId: string;
      closeReasonId: string;
      closeNotes: string;
      expectedVersion?: number;
    },
    user: any
  ): Promise<CommercialOpportunityDTO> {
    if (!input.closeReasonId || input.closeReasonId.trim() === '') {
      throw new Error('Motivo de encerramento é obrigatório.');
    }
    if (!input.closeNotes || input.closeNotes.trim().length < 5) {
      throw new Error('Justificativa de encerramento detalhada (mínimo 5 caracteres) é obrigatória.');
    }

    const reason = await prisma.opportunityCloseReason.findUnique({ where: { id: input.closeReasonId } });
    if (!reason) {
      throw new Error(`Motivo de encerramento ${input.closeReasonId} inválido.`);
    }

    const opp = await prisma.commercialOpportunity.findUnique({ where: { id: input.opportunityId } });
    if (!opp) throw new Error(`Oportunidade ${input.opportunityId} não encontrada.`);
    if (opp.status !== 'OPEN') {
      throw new Error(`Oportunidade já está finalizada como "${opp.status}".`);
    }

    if (input.expectedVersion !== undefined && opp.version !== input.expectedVersion) {
      throw new Error('Conflito de concorrência ao encerrar oportunidade (409).');
    }

    // Busca estágio do tipo CLOSED no pipeline
    const closedStage = await prisma.commercialPipelineStage.findFirst({
      where: { pipelineId: opp.pipelineId, stageType: 'CLOSED', active: true }
    });

    if (!closedStage) {
      throw new Error('Estágio de encerramento (CLOSED) não configurado para este pipeline.');
    }

    // Duração no estágio anterior
    const lastHistories = await prisma.opportunityStageHistory.findMany({
      where: { opportunityId: opp.id }
    });
    const lastHistory = lastHistories[lastHistories.length - 1];
    const prevTime = lastHistory ? new Date(lastHistory.changedAt).getTime() : new Date(opp.createdAt).getTime();
    const durationSeconds = Math.max(0, Math.floor((Date.now() - prevTime) / 1000));

    // Atualiza oportunidade
    const updated = await prisma.commercialOpportunity.update({
      where: { id: opp.id, version: opp.version },
      data: {
        stageId: closedStage.id,
        status: 'CLOSED',
        closedAt: new Date(),
        closedBy: user.id,
        closeReasonId: reason.id,
        closeNotes: input.closeNotes.trim()
      }
    });

    // Registra histórico
    await prisma.opportunityStageHistory.create({
      data: {
        opportunityId: opp.id,
        fromStageId: opp.stageId,
        toStageId: closedStage.id,
        changedBy: user.id,
        changedByName: user.name,
        changedAt: new Date(),
        reason: `Encerrado: ${reason.name}. Notas: ${input.closeNotes.trim()}`,
        durationSeconds
      }
    });

    await AuditService.log({
      action: 'COMMERCIAL_OPPORTUNITY_CLOSED',
      resource: `opportunity:${opp.id}`,
      userId: user.id,
      details: {
        publicCode: opp.publicCode,
        title: opp.title,
        closeReason: reason.name,
        closeNotes: input.closeNotes
      }
    });

    return {
      id: updated.id,
      publicCode: updated.publicCode,
      producerId: updated.producerId || undefined,
      leadId: updated.leadId || undefined,
      pipelineId: updated.pipelineId,
      stageId: updated.stageId,
      stageName: closedStage.name,
      stageCode: closedStage.code,
      title: updated.title,
      description: updated.description || undefined,
      typeId: updated.typeId || undefined,
      ownerId: updated.ownerId,
      ownerName: updated.ownerName || undefined,
      estimatedValue: updated.estimatedValue !== null ? Number(updated.estimatedValue) : null,
      expectedDecisionAt: updated.expectedDecisionAt ? new Date(updated.expectedDecisionAt).toISOString() : undefined,
      status: 'CLOSED',
      wonAt: undefined,
      wonBy: undefined,
      closedAt: updated.closedAt ? new Date(updated.closedAt).toISOString() : undefined,
      closedBy: updated.closedBy || undefined,
      closeReasonId: reason.id,
      closeReasonName: reason.name,
      closeNotes: updated.closeNotes || undefined,
      nextActionAt: updated.nextActionAt ? new Date(updated.nextActionAt).toISOString() : undefined,
      nextActionDescription: updated.nextActionDescription || undefined,
      version: updated.version,
      createdAt: new Date(updated.createdAt).toISOString(),
      updatedAt: new Date(updated.updatedAt).toISOString()
    };
  }
}
