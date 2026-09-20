import { prisma } from '../../../core/database/prisma';
import { AuditService } from '../../audit/audit.service';
import { CommercialOpportunityDTO } from '../../../../../shared/types';

export class OpportunityService {
  /**
   * Gera código público sequencial único e auditável: OPC-YYYY-XXXXXX
   */
  public static async generatePublicCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.commercialOpportunity.count();
    const sequence = String(count + 101).padStart(6, '0');
    return `OPC-${year}-${sequence}`;
  }

  /**
   * Cria uma nova negociação/oportunidade vinculada a Produtor ou Prospecção
   */
  public static async createOpportunity(
    input: {
      producerId?: string;
      leadId?: string;
      pipelineId: string;
      stageId: string;
      title: string;
      description?: string;
      typeId?: string;
      ownerId?: string;
      ownerName?: string;
      estimatedValue?: number | null;
      expectedDecisionAt?: string;
      nextActionAt?: string;
      nextActionDescription?: string;
    },
    user: any
  ): Promise<CommercialOpportunityDTO> {
    if (!input.title || input.title.trim() === '') {
      throw new Error('Título da oportunidade é obrigatório.');
    }

    if (!input.producerId && !input.leadId) {
      throw new Error('A oportunidade deve estar vinculada a um Produtor ou Prospecção.');
    }

    if (!input.pipelineId || !input.stageId) {
      throw new Error('Pipeline e Estágio inicial são obrigatórios.');
    }

    const publicCode = await this.generatePublicCode();

    const created = await prisma.commercialOpportunity.create({
      data: {
        publicCode,
        producerId: input.producerId || null,
        leadId: input.leadId || null,
        pipelineId: input.pipelineId,
        stageId: input.stageId,
        title: input.title.trim(),
        description: input.description || null,
        typeId: input.typeId || 'NEW_EVENT',
        ownerId: input.ownerId || user.id,
        ownerName: input.ownerName || user.name,
        estimatedValue: input.estimatedValue !== undefined && input.estimatedValue !== null ? Number(input.estimatedValue) : null,
        expectedDecisionAt: input.expectedDecisionAt ? new Date(input.expectedDecisionAt) : null,
        status: 'OPEN',
        nextActionAt: input.nextActionAt ? new Date(input.nextActionAt) : null,
        nextActionDescription: input.nextActionDescription || null,
        version: 1
      }
    });

    // Registra entrada inicial no histórico de estágios
    await prisma.opportunityStageHistory.create({
      data: {
        opportunityId: created.id,
        fromStageId: null,
        toStageId: created.stageId,
        changedBy: user.id,
        changedByName: user.name,
        changedAt: new Date(),
        reason: 'Criação inicial da oportunidade.',
        durationSeconds: 0
      }
    });

    await AuditService.log({
      action: 'COMMERCIAL_OPPORTUNITY_CREATED',
      resource: `opportunity:${created.id}`,
      userId: user.id,
      details: {
        publicCode,
        title: created.title,
        producerId: created.producerId,
        leadId: created.leadId,
        estimatedValue: created.estimatedValue
      }
    });

    const stage = await prisma.commercialPipelineStage.findUnique({ where: { id: created.stageId } });

    return {
      id: created.id,
      publicCode: created.publicCode,
      producerId: created.producerId || undefined,
      leadId: created.leadId || undefined,
      pipelineId: created.pipelineId,
      stageId: created.stageId,
      stageName: stage?.name,
      stageCode: stage?.code,
      title: created.title,
      description: created.description || undefined,
      typeId: created.typeId || undefined,
      ownerId: created.ownerId,
      ownerName: created.ownerName || undefined,
      estimatedValue: created.estimatedValue !== null ? Number(created.estimatedValue) : null,
      expectedDecisionAt: created.expectedDecisionAt ? new Date(created.expectedDecisionAt).toISOString() : undefined,
      status: 'OPEN',
      nextActionAt: created.nextActionAt ? new Date(created.nextActionAt).toISOString() : undefined,
      nextActionDescription: created.nextActionDescription || undefined,
      version: created.version,
      createdAt: new Date(created.createdAt).toISOString(),
      updatedAt: new Date(created.updatedAt).toISOString()
    };
  }

  /**
   * Atualiza dados cadastrais da oportunidade (sem transicionar estágio)
   */
  public static async updateOpportunity(
    id: string,
    data: {
      title?: string;
      description?: string;
      typeId?: string;
      ownerId?: string;
      ownerName?: string;
      estimatedValue?: number | null;
      expectedDecisionAt?: string | null;
      nextActionAt?: string | null;
      nextActionDescription?: string | null;
      expectedVersion?: number;
    },
    user: any
  ): Promise<CommercialOpportunityDTO> {
    const opp = await prisma.commercialOpportunity.findUnique({ where: { id } });
    if (!opp) throw new Error(`Oportunidade ${id} não encontrada.`);

    if (data.expectedVersion !== undefined && opp.version !== data.expectedVersion) {
      throw new Error('Conflito de concorrência ao atualizar oportunidade (409).');
    }

    const updated = await prisma.commercialOpportunity.update({
      where: { id, version: opp.version },
      data: {
        ...(data.title && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.typeId !== undefined && { typeId: data.typeId }),
        ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
        ...(data.ownerName !== undefined && { ownerName: data.ownerName }),
        ...(data.estimatedValue !== undefined && { estimatedValue: data.estimatedValue !== null ? Number(data.estimatedValue) : null }),
        ...(data.expectedDecisionAt !== undefined && { expectedDecisionAt: data.expectedDecisionAt ? new Date(data.expectedDecisionAt) : null }),
        ...(data.nextActionAt !== undefined && { nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : null }),
        ...(data.nextActionDescription !== undefined && { nextActionDescription: data.nextActionDescription })
      }
    });

    await AuditService.log({
      action: 'COMMERCIAL_OPPORTUNITY_UPDATED',
      resource: `opportunity:${id}`,
      userId: user.id,
      details: { changes: data }
    });

    const stage = await prisma.commercialPipelineStage.findUnique({ where: { id: updated.stageId } });

    return {
      id: updated.id,
      publicCode: updated.publicCode,
      producerId: updated.producerId || undefined,
      leadId: updated.leadId || undefined,
      pipelineId: updated.pipelineId,
      stageId: updated.stageId,
      stageName: stage?.name,
      stageCode: stage?.code,
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
