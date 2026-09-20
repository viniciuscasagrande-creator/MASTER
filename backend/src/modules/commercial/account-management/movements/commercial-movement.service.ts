import { prisma } from '../../../../core/database/prisma';
import { AuditService } from '../../../audit/audit.service';
import {
  CommercialMovementDTO,
  CommercialMovementType,
  CreateCommercialMovementDTO
} from '../../../../../../shared/types';

export class CommercialMovementService {
  /**
   * Mapeia o tipo de movimentação da 1.3.9 para o typeId legado de oportunidade quando aplicável
   */
  private static mapMovementTypeToLegacyTypeId(type: CommercialMovementType): string {
    switch (type) {
      case 'RENEWAL': return 'CONTRACT_RENEWAL';
      case 'UPGRADE': return 'PACKAGE_UPGRADE';
      case 'DOWNGRADE': return 'PACKAGE_UPGRADE';
      case 'ADDITIONAL_SERVICE': return 'EXTRA_SERVICES';
      case 'EXPANSION': return 'NEW_EVENT';
      default: return 'OTHER';
    }
  }

  /**
   * Lista movimentações comerciais (oportunidades qualificadas de renovação, expansão, upgrade e novos serviços)
   */
  public static async listMovements(filters: {
    producerId?: string;
    movementType?: CommercialMovementType;
    status?: 'OPEN' | 'WON' | 'CLOSED';
    ownerId?: string;
  } = {}, user?: any): Promise<CommercialMovementDTO[]> {
    const where: any = {};

    if (filters.producerId) where.producerId = filters.producerId;
    if (filters.status) where.status = filters.status;
    if (filters.ownerId) where.ownerId = filters.ownerId;

    const opportunities = await prisma.commercialOpportunity.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Filtra oportunidades que correspondam a movimentações de contas existentes
    let movements = opportunities.filter((o: any) => {
      if (filters.movementType) {
        return o.movementType === filters.movementType;
      }
      return !!o.movementType || ['CONTRACT_RENEWAL', 'PACKAGE_UPGRADE', 'EXTRA_SERVICES'].includes(o.typeId);
    });

    // Hidratação
    const result: CommercialMovementDTO[] = [];

    for (const opp of movements) {
      const producer = opp.producerId ? await prisma.producer.findUnique({ where: { id: opp.producerId } }) : null;
      const contract = opp.originContractId ? await prisma.commercialContract.findUnique({ where: { id: opp.originContractId } }) : null;
      const currentOffering = opp.currentOfferingId ? await prisma.commercialOffering.findUnique({ where: { id: opp.currentOfferingId } }) : null;
      const proposedOffering = opp.proposedOfferingId ? await prisma.commercialOffering.findUnique({ where: { id: opp.proposedOfferingId } }) : null;

      // Pipeline stage
      const pipeline = opp.pipelineId ? await prisma.commercialPipeline.findUnique({ where: { id: opp.pipelineId } }) : null;
      const stages = (pipeline as any)?.stages || [];
      const stage = stages.find((s: any) => s.id === opp.stageId) || { name: 'Em Negociação', code: 'NEGOTIATION' };

      const mType = (opp.movementType ||
        (opp.typeId === 'CONTRACT_RENEWAL' ? 'RENEWAL' :
         opp.typeId === 'PACKAGE_UPGRADE' ? 'UPGRADE' :
         opp.typeId === 'EXTRA_SERVICES' ? 'ADDITIONAL_SERVICE' : 'EXPANSION')) as CommercialMovementType;

      result.push({
        id: opp.id,
        publicCode: opp.publicCode,
        producerId: opp.producerId || '',
        producerName: producer?.name || 'Produtor',
        title: opp.title,
        description: opp.description || null,
        movementType: mType,
        stageId: opp.stageId,
        stageName: stage.name,
        stageCode: stage.code,
        status: opp.status || 'OPEN',
        originContractId: opp.originContractId || null,
        originContractPublicCode: contract?.publicCode || null,
        contractRenewalId: opp.contractRenewalId || null,
        currentOfferingId: opp.currentOfferingId || null,
        currentOfferingName: currentOffering?.name || null,
        proposedOfferingId: opp.proposedOfferingId || null,
        proposedOfferingName: proposedOffering?.name || null,
        changeReason: opp.changeReason || null,
        ownerId: opp.ownerId,
        ownerName: opp.ownerName || null,
        estimatedValue: opp.estimatedValue || null,
        expectedDecisionAt: opp.expectedDecisionAt ? new Date(opp.expectedDecisionAt).toISOString() : null,
        version: opp.version || 1,
        createdAt: new Date(opp.createdAt || Date.now()).toISOString(),
        updatedAt: new Date(opp.updatedAt || opp.createdAt || Date.now()).toISOString()
      });
    }

    return result;
  }

  /**
   * Cria uma nova oportunidade formal de movimentação de conta vinculada ao produtor
   */
  public static async createMovement(
    input: CreateCommercialMovementDTO,
    user: any
  ): Promise<CommercialMovementDTO> {
    const producer = await prisma.producer.findUnique({
      where: { id: input.producerId }
    });

    if (!producer) {
      const err: any = new Error(`Produtor ${input.producerId} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    // Resolve pipeline e etapa inicial
    const pipeline = await prisma.commercialPipeline.findFirst({
      where: { isDefault: true, active: true }
    }) || await prisma.commercialPipeline.findFirst();

    const pipelineId = pipeline?.id || 'pipeline_default';
    const stage = (pipeline as any)?.stages?.find((s: any) => s.code === 'NEGOTIATION') ||
                  (pipeline as any)?.stages?.[0] || { id: 'stage_negotiation', name: 'Negociação', code: 'NEGOTIATION' };

    const now = new Date();
    const oppCount = (await prisma.commercialOpportunity.count()) + 1;
    const publicCode = `OPP-${now.getFullYear()}-${String(oppCount).padStart(5, '0')}`;

    const opp = await prisma.commercialOpportunity.create({
      data: {
        publicCode,
        producerId: producer.id,
        pipelineId,
        stageId: stage.id,
        title: input.title,
        description: input.description || null,
        typeId: this.mapMovementTypeToLegacyTypeId(input.movementType),
        movementType: input.movementType,
        originContractId: input.originContractId || null,
        currentOfferingId: input.currentOfferingId || null,
        proposedOfferingId: input.proposedOfferingId || null,
        changeReason: input.changeReason || null,
        estimatedValue: input.estimatedValue || null,
        expectedDecisionAt: input.expectedDecisionAt ? new Date(input.expectedDecisionAt) : null,
        ownerId: input.ownerId || user.id,
        ownerName: user.name,
        status: 'OPEN'
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'MOVIMENTACAO_COMERCIAL_CRIADA',
      resource: 'OPORTUNIDADE_COMERCIAL',
      resourceId: opp.id,
      producerId: producer.id,
      details: {
        publicCode: opp.publicCode,
        movementType: input.movementType,
        title: input.title,
        originContractId: input.originContractId
      }
    });

    const list = await this.listMovements({ producerId: producer.id });
    const found = list.find(x => x.id === opp.id);
    return found!;
  }
}
