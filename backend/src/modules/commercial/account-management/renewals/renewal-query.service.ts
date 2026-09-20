import { prisma } from '../../../../core/database/prisma';
import { CommercialRenewalDTO, CommercialRenewalStatus, CommercialRenewalType } from '../../../../../../shared/types';
import { RenewalPolicy } from './renewal-policy';

export class RenewalQueryService {
  /**
   * Lista renovações ativas e contratos em janela de planejamento com filtros operacionais
   */
  public static async listRenewals(filters: {
    producerId?: string;
    status?: CommercialRenewalStatus;
    renewalType?: CommercialRenewalType;
    responsibleId?: string;
    onlyPlanningWindow?: boolean;
    onlyOverdue?: boolean;
  } = {}, user?: any): Promise<CommercialRenewalDTO[]> {
    const planningWindowDays = await RenewalPolicy.getPlanningWindowDays();

    // 1. Busca renovações existentes
    const existingRenewals = await prisma.contractRenewal.findMany({
      include: {
        contract: {
          include: { producer: true }
        },
        sourceOpportunity: true
      }
    });

    // 2. Busca contratos ativos para identificar contratos em janela que ainda não possuem ciclo iniciado
    const activeContracts = await prisma.commercialContract.findMany({
      where: {
        status: { in: ['ACTIVE', 'SIGNED'] }
      },
      include: { producer: true }
    });

    const resultList: CommercialRenewalDTO[] = [];
    const processedContractIds = new Set<string>();

    for (const r of existingRenewals) {
      const contract = r.contract || (await prisma.commercialContract.findUnique({ where: { id: r.contractId }, include: { producer: true } }));
      if (!contract) continue;

      processedContractIds.add(contract.id);

      const contractExpiresAt = (contract.effectiveUntil || r.targetEffectiveUntil || new Date()).toISOString ?
        (contract.effectiveUntil || r.targetEffectiveUntil || new Date()).toISOString() :
        new Date(contract.effectiveUntil || r.targetEffectiveUntil || Date.now()).toISOString();

      const daysUntilExpiration = RenewalPolicy.getDaysUntilExpiration(contractExpiresAt);
      const isWithinPlanningWindow = RenewalPolicy.isWithinPlanningWindow(contractExpiresAt, planningWindowDays);
      const isOverdue = RenewalPolicy.isOverdue(contractExpiresAt, r.status);

      const sourceOpp = r.sourceOpportunity || (r.sourceOpportunityId ? await prisma.commercialOpportunity.findUnique({ where: { id: r.sourceOpportunityId } }) : null);

      const dto: CommercialRenewalDTO = {
        id: r.id,
        contractId: contract.id,
        contractPublicCode: contract.publicCode,
        producerId: contract.producerId,
        producerName: contract.producer?.name || 'Produtor',
        renewalCycle: r.renewalCycle || 1,
        renewalType: (r.renewalType as CommercialRenewalType) || 'SIMPLE',
        status: (r.status as CommercialRenewalStatus) || 'NOT_STARTED',
        contractExpiresAt,
        targetEffectiveFrom: r.targetEffectiveFrom ? new Date(r.targetEffectiveFrom).toISOString() : null,
        targetEffectiveUntil: r.targetEffectiveUntil ? new Date(r.targetEffectiveUntil).toISOString() : null,
        daysUntilExpiration,
        isWithinPlanningWindow,
        isOverdue,
        sourceOpportunityId: r.sourceOpportunityId || null,
        sourceOpportunityPublicCode: sourceOpp?.publicCode || null,
        sourceProposalId: r.sourceProposalId || null,
        responsibleId: r.responsibleId || null,
        responsibleName: r.responsibleName || null,
        notes: r.notes || null,
        decisionReason: r.decisionReason || null,
        decisionNotes: r.decisionNotes || null,
        version: r.version || 1,
        createdAt: new Date(r.createdAt || Date.now()).toISOString(),
        updatedAt: new Date(r.updatedAt || r.createdAt || Date.now()).toISOString(),
        completedAt: r.completedAt ? new Date(r.completedAt).toISOString() : null
      };

      resultList.push(dto);
    }

    // 3. Descobre contratos sem renovação explícita que estão expirando na janela de planejamento
    for (const contract of activeContracts) {
      if (processedContractIds.has(contract.id)) continue;
      if (!contract.effectiveUntil) continue;

      const contractExpiresAt = new Date(contract.effectiveUntil).toISOString();
      const daysUntilExpiration = RenewalPolicy.getDaysUntilExpiration(contractExpiresAt);
      const isWithinPlanningWindow = RenewalPolicy.isWithinPlanningWindow(contractExpiresAt, planningWindowDays);
      const isOverdue = RenewalPolicy.isOverdue(contractExpiresAt, 'NOT_STARTED');

      // Se estiver na janela de planejamento ou overdue, exibimos como NOT_STARTED
      if (isWithinPlanningWindow || isOverdue) {
        resultList.push({
          id: `virtual_${contract.id}`,
          contractId: contract.id,
          contractPublicCode: contract.publicCode,
          producerId: contract.producerId,
          producerName: contract.producer?.name || 'Produtor',
          renewalCycle: 1,
          renewalType: 'SIMPLE',
          status: 'NOT_STARTED',
          contractExpiresAt,
          targetEffectiveFrom: null,
          targetEffectiveUntil: null,
          daysUntilExpiration,
          isWithinPlanningWindow,
          isOverdue,
          sourceOpportunityId: null,
          sourceOpportunityPublicCode: null,
          sourceProposalId: null,
          responsibleId: null,
          responsibleName: null,
          notes: null,
          decisionReason: null,
          decisionNotes: null,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null
        });
      }
    }

    // 4. Aplica filtros
    let filtered = resultList;

    if (filters.producerId) {
      filtered = filtered.filter(x => x.producerId === filters.producerId);
    }
    if (filters.status) {
      filtered = filtered.filter(x => x.status === filters.status);
    }
    if (filters.renewalType) {
      filtered = filtered.filter(x => x.renewalType === filters.renewalType);
    }
    if (filters.responsibleId) {
      filtered = filtered.filter(x => x.responsibleId === filters.responsibleId);
    }
    if (filters.onlyPlanningWindow) {
      filtered = filtered.filter(x => x.isWithinPlanningWindow);
    }
    if (filters.onlyOverdue) {
      filtered = filtered.filter(x => x.isOverdue);
    }

    // Ordena pelo vencimento mais próximo
    filtered.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);

    return filtered;
  }

  /**
   * Obtém os detalhes completos de uma renovação por ID
   */
  public static async getRenewalById(id: string): Promise<CommercialRenewalDTO | null> {
    const r = await prisma.contractRenewal.findUnique({
      where: { id },
      include: {
        contract: {
          include: { producer: true }
        },
        sourceOpportunity: true
      }
    });

    if (!r) return null;

    const contract = r.contract || (await prisma.commercialContract.findUnique({ where: { id: r.contractId }, include: { producer: true } }));
    const contractExpiresAt = contract?.effectiveUntil ? new Date(contract.effectiveUntil).toISOString() : new Date().toISOString();
    const planningWindowDays = await RenewalPolicy.getPlanningWindowDays();
    const daysUntilExpiration = RenewalPolicy.getDaysUntilExpiration(contractExpiresAt);
    const isWithinPlanningWindow = RenewalPolicy.isWithinPlanningWindow(contractExpiresAt, planningWindowDays);
    const isOverdue = RenewalPolicy.isOverdue(contractExpiresAt, r.status);

    const sourceOpp = r.sourceOpportunity || (r.sourceOpportunityId ? await prisma.commercialOpportunity.findUnique({ where: { id: r.sourceOpportunityId } }) : null);

    return {
      id: r.id,
      contractId: r.contractId,
      contractPublicCode: contract?.publicCode || '',
      producerId: contract?.producerId || '',
      producerName: contract?.producer?.name || 'Produtor',
      renewalCycle: r.renewalCycle || 1,
      renewalType: (r.renewalType as CommercialRenewalType) || 'SIMPLE',
      status: (r.status as CommercialRenewalStatus) || 'NOT_STARTED',
      contractExpiresAt,
      targetEffectiveFrom: r.targetEffectiveFrom ? new Date(r.targetEffectiveFrom).toISOString() : null,
      targetEffectiveUntil: r.targetEffectiveUntil ? new Date(r.targetEffectiveUntil).toISOString() : null,
      daysUntilExpiration,
      isWithinPlanningWindow,
      isOverdue,
      sourceOpportunityId: r.sourceOpportunityId || null,
      sourceOpportunityPublicCode: sourceOpp?.publicCode || null,
      sourceProposalId: r.sourceProposalId || null,
      responsibleId: r.responsibleId || null,
      responsibleName: r.responsibleName || null,
      notes: r.notes || null,
      decisionReason: r.decisionReason || null,
      decisionNotes: r.decisionNotes || null,
      version: r.version || 1,
      createdAt: new Date(r.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(r.updatedAt || r.createdAt || Date.now()).toISOString(),
      completedAt: r.completedAt ? new Date(r.completedAt).toISOString() : null
    };
  }
}
