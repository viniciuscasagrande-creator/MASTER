import { prisma } from '../../../../core/database/prisma';
import { AuditService } from '../../../audit/audit.service';
import {
  CreateRenewalNegotiationDTO,
  UpdateRenewalStatusDTO,
  CommercialRenewalDTO,
  CommercialRenewalStatus
} from '../../../../../../shared/types';
import { RenewalQueryService } from './renewal-query.service';

export class RenewalOrchestratorService {
  /**
   * Inicia formalmente a negociação de renovação (idempotente por contrato e ciclo)
   */
  public static async startRenewalNegotiation(
    input: CreateRenewalNegotiationDTO,
    user: any
  ): Promise<CommercialRenewalDTO> {
    const contract = await prisma.commercialContract.findUnique({
      where: { id: input.contractId },
      include: { producer: true }
    });

    if (!contract) {
      const err: any = new Error(`Contrato ${input.contractId} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    // 1. Verifica se já existe uma renovação em andamento para este contrato
    const activeRenewals = await prisma.contractRenewal.findMany({
      where: {
        contractId: contract.id,
        status: { in: ['PLANNED', 'IN_PROGRESS', 'PROPOSAL', 'AWAITING_DECISION'] }
      }
    });

    if (activeRenewals.length > 0) {
      const existing = activeRenewals[0];

      if (input.renewalType === 'RENEGOTIATION' && !existing.sourceOpportunityId) {
        const now = new Date();
        const oppCount = (await prisma.commercialOpportunity.count()) + 1;
        const publicCode = `OPP-${now.getFullYear()}-${String(oppCount).padStart(5, '0')}`;

        const pipeline = await prisma.commercialPipeline.findFirst({
          where: { isDefault: true, active: true }
        }) || await prisma.commercialPipeline.findFirst();

        const pipelineId = pipeline?.id || 'pipeline_default';
        const stage = (pipeline as any)?.stages?.find((s: any) => s.code === 'NEGOTIATION') ||
                      (pipeline as any)?.stages?.[0] || { id: 'stage_negotiation' };

        const opportunity = await prisma.commercialOpportunity.create({
          data: {
            publicCode,
            producerId: contract.producerId,
            pipelineId,
            stageId: stage.id,
            title: `Renegociação de Contrato — ${contract.publicCode} (${contract.producer?.name || 'Produtor'})`,
            description: input.notes || `Processo de renegociação das condições comerciais do contrato ${contract.publicCode}.`,
            typeId: 'CONTRACT_RENEWAL',
            movementType: 'RENEWAL',
            originContractId: contract.id,
            contractRenewalId: existing.id,
            estimatedValue: input.estimatedValue || null,
            expectedDecisionAt: input.targetEffectiveUntil ? new Date(input.targetEffectiveUntil) : null,
            ownerId: user.id,
            ownerName: user.name,
            status: 'OPEN'
          }
        });

        await prisma.contractRenewal.update({
          where: { id: existing.id },
          data: {
            renewalType: 'RENEGOTIATION',
            sourceOpportunityId: opportunity.id
          }
        });
      }

      const dto = await RenewalQueryService.getRenewalById(existing.id);
      if (dto) return dto;
    }

    // 2. Determina o próximo ciclo de renovação
    const allRenewals = await prisma.contractRenewal.findMany({
      where: { contractId: contract.id }
    });
    const maxCycle = allRenewals.reduce((max: number, r: any) => Math.max(max, r.renewalCycle || 1), 0);
    const renewalCycle = maxCycle + 1;

    let sourceOpportunityId: string | null = null;

    // 3. Se for renegociação ou solicitado, cria Oportunidade no CRM unificado (1.3.4)
    if (input.renewalType === 'RENEGOTIATION' || input.estimatedValue) {
      const now = new Date();
      const oppCount = (await prisma.commercialOpportunity.count()) + 1;
      const publicCode = `OPP-${now.getFullYear()}-${String(oppCount).padStart(5, '0')}`;

      // Localiza pipeline padrão
      const pipeline = await prisma.commercialPipeline.findFirst({
        where: { isDefault: true, active: true }
      }) || await prisma.commercialPipeline.findFirst();

      const pipelineId = pipeline?.id || 'pipeline_default';
      const stage = (pipeline as any)?.stages?.find((s: any) => s.code === 'NEGOTIATION') ||
                    (pipeline as any)?.stages?.[0] || { id: 'stage_negotiation' };

      const opportunity = await prisma.commercialOpportunity.create({
        data: {
          publicCode,
          producerId: contract.producerId,
          pipelineId,
          stageId: stage.id,
          title: `Renovação de Contrato — ${contract.publicCode} (${contract.producer?.name || 'Produtor'})`,
          description: input.notes || `Processo de renovação/renegociação das condições comerciais do contrato ${contract.publicCode}.`,
          typeId: 'CONTRACT_RENEWAL',
          movementType: 'RENEWAL',
          originContractId: contract.id,
          estimatedValue: input.estimatedValue || null,
          expectedDecisionAt: input.targetEffectiveUntil ? new Date(input.targetEffectiveUntil) : null,
          ownerId: user.id,
          ownerName: user.name,
          status: 'OPEN'
        }
      });

      sourceOpportunityId = opportunity.id;
    }

    // 4. Cria o registro de renovação contratual com idempotência de ciclo
    const renewal = await prisma.contractRenewal.create({
      data: {
        contractId: contract.id,
        renewalCycle,
        renewalType: input.renewalType,
        status: input.renewalType === 'SIMPLE' ? 'PLANNED' : 'IN_PROGRESS',
        targetEffectiveFrom: input.targetEffectiveFrom ? new Date(input.targetEffectiveFrom) : (contract.effectiveUntil || new Date()),
        targetEffectiveUntil: input.targetEffectiveUntil ? new Date(input.targetEffectiveUntil) : null,
        sourceOpportunityId,
        responsibleId: user.id,
        responsibleName: user.name,
        notes: input.notes,
        version: 1,
        createdBy: user.id,
        createdByName: user.name
      }
    });

    // Se criou oportunidade, vincula o ID da renovação
    if (sourceOpportunityId) {
      await prisma.commercialOpportunity.update({
        where: { id: sourceOpportunityId },
        data: { contractRenewalId: renewal.id }
      });
    }

    // 5. Trilha de auditoria obrigatória
    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CONTRATO_RENOVACAO_INICIADA',
      resource: 'CONTRATO_COMERCIAL',
      resourceId: contract.id,
      producerId: contract.producerId,
      details: {
        renewalId: renewal.id,
        renewalCycle,
        renewalType: input.renewalType,
        sourceOpportunityId,
        targetEffectiveUntil: input.targetEffectiveUntil
      }
    });

    const resultDTO = await RenewalQueryService.getRenewalById(renewal.id);
    return resultDTO!;
  }

  /**
   * Atualiza status operacional da renovação com controle estrito de concorrência por version
   */
  public static async updateRenewalStatus(
    renewalId: string,
    input: UpdateRenewalStatusDTO,
    user: any
  ): Promise<CommercialRenewalDTO> {
    const renewal = await prisma.contractRenewal.findUnique({
      where: { id: renewalId },
      include: { contract: true }
    });

    if (!renewal) {
      const err: any = new Error(`Renovação ${renewalId} não encontrada.`);
      err.statusCode = 404;
      throw err;
    }

    // Concorrência otimista (optimistic locking)
    if (input.version !== undefined && renewal.version !== input.version) {
      const err: any = new Error(
        `Conflito de versão (409): O registro de renovação foi alterado por outro usuário (versão atual: ${renewal.version}, enviada: ${input.version}). Atualize a página e tente novamente.`
      );
      err.statusCode = 409;
      throw err;
    }

    const updated = await prisma.contractRenewal.update({
      where: { id: renewalId, version: input.version },
      data: {
        status: input.status,
        notes: input.notes !== undefined ? input.notes : renewal.notes,
        decisionReason: input.decisionReason || renewal.decisionReason,
        decisionNotes: input.decisionNotes || renewal.decisionNotes,
        targetEffectiveUntil: input.targetEffectiveUntil ? new Date(input.targetEffectiveUntil) : renewal.targetEffectiveUntil
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CONTRATO_RENOVACAO_STATUS_ATUALIZADO',
      resource: 'CONTRATO_COMERCIAL',
      resourceId: renewal.contractId,
      producerId: renewal.contract?.producerId,
      details: {
        renewalId,
        previousStatus: renewal.status,
        newStatus: input.status,
        newVersion: updated.version
      }
    });

    const result = await RenewalQueryService.getRenewalById(renewalId);
    return result!;
  }

  /**
   * Registra a decisão formal de renovação (Concluído, Não Renovado, Cancelado)
   */
  public static async decideRenewal(
    renewalId: string,
    decision: {
      status: 'COMPLETED' | 'NOT_RENEWED' | 'CANCELLED';
      decisionReason?: string;
      decisionNotes?: string;
      targetEffectiveUntil?: string;
      version: number;
    },
    user: any
  ): Promise<CommercialRenewalDTO> {
    const renewal = await prisma.contractRenewal.findUnique({
      where: { id: renewalId },
      include: { contract: true }
    });

    if (!renewal) {
      const err: any = new Error(`Renovação ${renewalId} não encontrada.`);
      err.statusCode = 404;
      throw err;
    }

    // Concorrência otimista
    if (decision.version !== undefined && renewal.version !== decision.version) {
      const err: any = new Error(
        `Conflito de versão (409): O registro de renovação foi alterado por outro usuário (versão atual: ${renewal.version}, enviada: ${decision.version}).`
      );
      err.statusCode = 409;
      throw err;
    }

    const now = new Date();
    const targetUntil = decision.targetEffectiveUntil
      ? new Date(decision.targetEffectiveUntil)
      : renewal.targetEffectiveUntil;

    // Se a decisão for COMPLETED e renovação SIMPLES, estende a vigência do contrato
    if (decision.status === 'COMPLETED' && renewal.renewalType === 'SIMPLE') {
      if (!targetUntil) {
        const err: any = new Error('Para concluir uma renovação simples, é obrigatório informar a nova data de vigência (targetEffectiveUntil).');
        err.statusCode = 400;
        throw err;
      }

      await prisma.commercialContract.update({
        where: { id: renewal.contractId },
        data: {
          effectiveUntil: targetUntil,
          updatedAt: now
        }
      });
    }

    // Atualiza o registro de renovação
    const updated = await prisma.contractRenewal.update({
      where: { id: renewalId, version: decision.version },
      data: {
        status: decision.status,
        decisionReason: decision.decisionReason || null,
        decisionNotes: decision.decisionNotes || null,
        completedAt: decision.status === 'COMPLETED' ? now : null,
        targetEffectiveUntil: targetUntil
      }
    });

    // Se houver oportunidade vinculada e for finalizado, atualiza status da oportunidade
    if (renewal.sourceOpportunityId) {
      if (decision.status === 'COMPLETED') {
        await prisma.commercialOpportunity.update({
          where: { id: renewal.sourceOpportunityId },
          data: {
            status: 'WON',
            wonAt: now,
            wonBy: user.id
          }
        });
      } else if (decision.status === 'NOT_RENEWED' || decision.status === 'CANCELLED') {
        await prisma.commercialOpportunity.update({
          where: { id: renewal.sourceOpportunityId },
          data: {
            status: 'CLOSED',
            closedAt: now,
            closedBy: user.id,
            closeNotes: decision.decisionNotes || decision.decisionReason
          }
        });
      }
    }

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CONTRATO_RENOVACAO_DECISAO_REGISTRADA',
      resource: 'CONTRATO_COMERCIAL',
      resourceId: renewal.contractId,
      producerId: renewal.contract?.producerId,
      details: {
        renewalId,
        decision: decision.status,
        reason: decision.decisionReason,
        targetEffectiveUntil: targetUntil
      }
    });

    const result = await RenewalQueryService.getRenewalById(renewalId);
    return result!;
  }
}
