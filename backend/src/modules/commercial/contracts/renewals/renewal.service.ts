import { prisma } from '../../../../core/database/prisma';
import { AuditService } from '../../../audit/audit.service';
import { CreateContractRenewalDTO, ContractRenewalDTO } from '../../../../../../shared/types';

export class ContractRenewalService {
  /**
   * Registra uma solicitação de renovação do contrato (Simples ou Renegociação Completa via Oportunidade)
   */
  public static async createRenewal(
    contractId: string,
    input: CreateContractRenewalDTO,
    user: any
  ): Promise<ContractRenewalDTO> {
    const contract = await prisma.commercialContract.findUnique({
      where: { id: contractId },
      include: { producer: true }
    });

    if (!contract) {
      const err: any = new Error(`Contrato ${contractId} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    let sourceOpportunityId: string | null = null;

    // Se o tipo for RENEGOTIATION, abrimos uma nova Oportunidade Comercial formal na esteira 1.3.4
    if (input.renewalType === 'RENEGOTIATION') {
      const now = new Date();
      const oppCount = (await prisma.commercialOpportunity.count()) + 1;
      const publicCode = `OPP-${now.getFullYear()}-${String(oppCount).padStart(5, '0')}`;

      const opportunity = await prisma.commercialOpportunity.create({
        data: {
          publicCode,
          producerId: contract.producerId,
          title: `Renegociação Contratual — ${contract.publicCode} (${contract.producer?.name || 'Produtor'})`,
          description: `Processo de renegociação das condições comerciais do contrato ${contract.publicCode}. ${input.notes || ''}`,
          stage: 'NEGOTIATION',
          estimatedCloseDate: new Date(input.targetEffectiveFrom),
          ownerId: user.id,
          source: 'RENEWAL'
        }
      });

      sourceOpportunityId = opportunity.id;
    }

    const renewal = await prisma.contractRenewal.create({
      data: {
        contractId: contract.id,
        renewalType: input.renewalType,
        status: input.renewalType === 'SIMPLE' ? 'PENDING_APPROVAL' : 'IN_NEGOTIATION',
        targetEffectiveFrom: new Date(input.targetEffectiveFrom),
        targetEffectiveUntil: new Date(input.targetEffectiveUntil),
        sourceOpportunityId,
        notes: input.notes,
        createdBy: user.id,
        createdByName: user.name
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CONTRATO_RENOVACAO_INICIADA',
      resource: 'CONTRATO_COMERCIAL',
      resourceId: contract.id,
      producerId: contract.producerId,
      details: {
        renewalId: renewal.id,
        renewalType: input.renewalType,
        sourceOpportunityId,
        targetEffectiveUntil: input.targetEffectiveUntil
      }
    });

    return {
      ...renewal,
      createdAt: renewal.createdAt.toISOString(),
      completedAt: renewal.completedAt ? renewal.completedAt.toISOString() : null,
      targetEffectiveFrom: renewal.targetEffectiveFrom ? renewal.targetEffectiveFrom.toISOString() : null,
      targetEffectiveUntil: renewal.targetEffectiveUntil ? renewal.targetEffectiveUntil.toISOString() : null
    };
  }

  /**
   * Conclui a renovação simples, estendendo a data de término do contrato
   */
  public static async completeSimpleRenewal(renewalId: string, user: any): Promise<ContractRenewalDTO> {
    const renewal = await prisma.contractRenewal.findUnique({
      where: { id: renewalId },
      include: { contract: true }
    });

    if (!renewal) {
      const err: any = new Error(`Renovação ${renewalId} não encontrada.`);
      err.statusCode = 404;
      throw err;
    }

    if (renewal.renewalType !== 'SIMPLE') {
      const err: any = new Error('Apenas renovações do tipo SIMPLE podem ser concluídas diretamente. Renegociações geram novo contrato.');
      err.statusCode = 400;
      throw err;
    }

    // Atualiza contrato estendendo a vigência
    if (renewal.targetEffectiveUntil) {
      await prisma.commercialContract.update({
        where: { id: renewal.contractId },
        data: {
          effectiveUntil: new Date(renewal.targetEffectiveUntil)
        }
      });
    }

    const updated = await prisma.contractRenewal.update({
      where: { id: renewalId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CONTRATO_RENOVACAO_CONCLUIDA',
      resource: 'CONTRATO_COMERCIAL',
      resourceId: renewal.contractId,
      details: {
        renewalId: renewal.id,
        newEffectiveUntil: renewal.targetEffectiveUntil
      }
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
      targetEffectiveFrom: updated.targetEffectiveFrom ? updated.targetEffectiveFrom.toISOString() : null,
      targetEffectiveUntil: updated.targetEffectiveUntil ? updated.targetEffectiveUntil.toISOString() : null
    };
  }
}
