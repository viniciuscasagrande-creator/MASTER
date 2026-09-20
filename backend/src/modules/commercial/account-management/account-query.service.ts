import { prisma } from '../../../core/database/prisma';
import {
  CommercialAccountSummaryDTO,
  CommercialAccountDetailsDTO,
  AccountManagementMetricsDTO,
  AccountCommercialStatus
} from '../../../../../shared/types';
import { RenewalPolicy } from './renewals/renewal-policy';
import { RenewalQueryService } from './renewals/renewal-query.service';
import { CommercialMovementService } from './movements/commercial-movement.service';
import { EntitlementService } from '../../entitlements/entitlement.service';
import { AccountCommercialAlertsProvider } from './alerts/account-commercial-alerts.provider';

export class AccountQueryService {
  /**
   * Lista o resumo factual de todas as contas da carteira comercial
   */
  public static async listAccounts(filters: {
    search?: string;
    responsibleId?: string;
    commercialStatus?: AccountCommercialStatus;
    onlyWithExpiringContracts?: boolean;
  } = {}, user?: any): Promise<CommercialAccountSummaryDTO[]> {
    const producers = await prisma.producer.findMany({
      where: {
        ...(filters.search ? {
          OR: [
            { name: { contains: filters.search } },
            { tradeName: { contains: filters.search } },
            { document: { contains: filters.search } }
          ]
        } : {})
      },
      orderBy: { name: 'asc' }
    });

    const planningWindowDays = await RenewalPolicy.getPlanningWindowDays();
    const result: CommercialAccountSummaryDTO[] = [];

    for (const p of producers) {
      // 1. Atribuição de Carteira (1.3.3)
      const assignment = await (prisma as any).commercialPortfolioAssignment?.findFirst({
        where: { producerId: p.id, active: true }
      });

      // Filtro por responsável
      if (filters.responsibleId && assignment?.responsibleId !== filters.responsibleId) {
        continue;
      }

      // 2. Contratos Ativos e Vencimentos (1.3.6)
      const contracts = await prisma.commercialContract.findMany({
        where: { producerId: p.id }
      });

      const activeContracts = contracts.filter((c: any) => c.status === 'ACTIVE' || c.status === 'SIGNED');
      let expiringCount = 0;
      let nearestExpiration: Date | null = null;

      for (const c of activeContracts) {
        if (c.effectiveUntil) {
          const expDate = new Date(c.effectiveUntil);
          if (RenewalPolicy.isWithinPlanningWindow(expDate, planningWindowDays)) {
            expiringCount++;
          }
          if (!nearestExpiration || expDate < nearestExpiration) {
            nearestExpiration = expDate;
          }
        }
      }

      if (filters.onlyWithExpiringContracts && expiringCount === 0) {
        continue;
      }

      // 3. Oportunidades Abertas (1.3.4 & 1.3.9)
      const openOpportunities = await prisma.commercialOpportunity.findMany({
        where: { producerId: p.id, status: 'OPEN' }
      });

      // 4. Renovações Pendentes (1.3.9)
      const renewals = await prisma.contractRenewal.findMany({
        where: {
          contractId: { in: contracts.map(c => c.id) },
          status: { in: ['NOT_STARTED', 'PLANNED', 'IN_PROGRESS', 'PROPOSAL', 'AWAITING_DECISION'] }
        }
      });

      // 5. Atividades e Tarefas de Relacionamento (1.3.3)
      const activities = await prisma.commercialActivity.findMany({
        where: { producerId: p.id },
        orderBy: { occurredAt: 'desc' }
      });

      const lastActivity = activities[0] || null;
      const now = new Date();
      let openTasksCount = 0;
      let overdueTasksCount = 0;

      for (const act of activities) {
        if (act.nextActionAt) {
          openTasksCount++;
          if (new Date(act.nextActionAt) < now) {
            overdueTasksCount++;
          }
        }
      }

      // 6. Produtos Contratados (1.3.8)
      const entitlements = await prisma.producerEntitlement.findMany({
        where: { producerId: p.id, status: 'ACTIVE' }
      });
      const distinctOfferings = new Set(entitlements.map((e: any) => e.offeringId).filter(Boolean));

      // 7. Status Comercial
      let commercialStatus: AccountCommercialStatus = 'ACTIVE';
      if (p.status === 'INACTIVE' || p.status === 'SUSPENDED') {
        commercialStatus = p.status as AccountCommercialStatus;
      } else if (activeContracts.length === 0) {
        commercialStatus = 'PROSPECT';
      }

      if (filters.commercialStatus && commercialStatus !== filters.commercialStatus) {
        continue;
      }

      result.push({
        producerId: p.id,
        producerName: p.name,
        tradeName: p.tradeName || null,
        document: p.document || null,
        commercialStatus,
        responsibleId: assignment?.responsibleId || null,
        responsibleName: assignment?.responsibleName || null,
        assignedAt: assignment?.assignedAt ? new Date(assignment.assignedAt).toISOString() : null,
        activeContractsCount: activeContracts.length,
        expiringContractsCount: expiringCount,
        contractedOfferingsCount: distinctOfferings.size,
        openOpportunitiesCount: openOpportunities.length,
        pendingRenewalsCount: renewals.length,
        openTasksCount,
        overdueTasksCount,
        lastActivityAt: lastActivity?.occurredAt ? new Date(lastActivity.occurredAt).toISOString() : null,
        lastActivitySubject: lastActivity?.subject || null,
        nearestContractExpiration: nearestExpiration ? nearestExpiration.toISOString() : null
      });
    }

    return result;
  }

  /**
   * Obtém os detalhes completos de uma conta de produtor para a ficha executiva
   */
  public static async getAccountDetails(producerId: string, user?: any): Promise<CommercialAccountDetailsDTO> {
    const list = await this.listAccounts({}, user);
    let summary = list.find(x => x.producerId === producerId);

    if (!summary) {
      const producer = await prisma.producer.findUnique({ where: { id: producerId } });
      if (!producer) {
        const err: any = new Error(`Produtor ${producerId} não encontrado.`);
        err.statusCode = 404;
        throw err;
      }
      summary = {
        producerId: producer.id,
        producerName: producer.name,
        tradeName: producer.tradeName || null,
        document: producer.document || null,
        commercialStatus: (producer.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE') as AccountCommercialStatus,
        responsibleId: null,
        responsibleName: null,
        assignedAt: null,
        activeContractsCount: 0,
        expiringContractsCount: 0,
        contractedOfferingsCount: 0,
        openOpportunitiesCount: 0,
        pendingRenewalsCount: 0,
        openTasksCount: 0,
        overdueTasksCount: 0,
        lastActivityAt: null,
        lastActivitySubject: null,
        nearestContractExpiration: null
      };
    }

    // 1. Contratos da conta
    const contracts = await prisma.commercialContract.findMany({
      where: { producerId },
      include: { amendments: true, renewals: true }
    });

    // 2. Produtos contratados e Entitlements vigentes (1.3.8)
    const contractedProducts = await EntitlementService.listContractedProducts(producerId);
    const entitlementsRaw = await EntitlementService.listProducerEntitlements(producerId);

    const entitlements = entitlementsRaw.map(e => ({
      featureKey: e.featureCode,
      featureName: e.featureName || e.featureCode,
      category: e.featureCategory || 'GERAL',
      granted: e.status === 'ACTIVE',
      limits: (e.limits || []).map(l => ({
        limitKey: l.limitKey,
        limitValue: l.value,
        unit: l.unit
      }))
    }));

    // 3. Renovações ativas
    const activeRenewals = await RenewalQueryService.listRenewals({ producerId });

    // 4. Movimentações recentes
    const recentOpportunities = await CommercialMovementService.listMovements({ producerId });

    // 5. Atividades recentes e tarefas
    const recentActivities = await prisma.commercialActivity.findMany({
      where: { producerId },
      orderBy: { occurredAt: 'desc' }
    });

    const pendingTasks = recentActivities
      .filter((a: any) => !!a.nextActionAt)
      .map((a: any) => ({
        id: `task_${a.id}`,
        subject: a.nextActionDescription || a.subject,
        dueDate: new Date(a.nextActionAt).toISOString(),
        isOverdue: new Date(a.nextActionAt) < new Date(),
        assignedTo: a.createdByName || 'Executivo de Contas',
        activityId: a.id
      }));

    // 6. Alertas factuais da conta
    const alerts = await AccountCommercialAlertsProvider.getAlertsForProducer(producerId);

    return {
      ...summary,
      contracts,
      contractedProducts,
      entitlements,
      activeRenewals,
      recentOpportunities,
      recentActivities,
      pendingTasks,
      alerts
    };
  }

  /**
   * Computa métricas operacionais consolidadas para o painel de Gestão de Contas
   */
  public static async getMetrics(user?: any): Promise<AccountManagementMetricsDTO> {
    const producers = await prisma.producer.findMany();
    const planningWindowDays = await RenewalPolicy.getPlanningWindowDays();

    const contracts = await prisma.commercialContract.findMany();
    const activeContracts = contracts.filter((c: any) => c.status === 'ACTIVE' || c.status === 'SIGNED');

    let contractsInRenewalWindow = 0;
    let overdueContracts = 0;

    for (const c of activeContracts) {
      if (c.effectiveUntil) {
        const expDate = new Date(c.effectiveUntil);
        if (RenewalPolicy.isWithinPlanningWindow(expDate, planningWindowDays)) {
          contractsInRenewalWindow++;
        }
        if (RenewalPolicy.isOverdue(expDate)) {
          overdueContracts++;
        }
      }
    }

    // Cobertura de carteira
    const assignments = await (prisma as any).commercialPortfolioAssignment?.findMany({
      where: { active: true }
    }) || [];
    const assignedProducerIds = new Set(assignments.map((a: any) => a.producerId));
    const activeProducersCount = producers.filter((p: any) => p.status === 'ACTIVE').length;
    const portfolioCoveragePercentage = activeProducersCount > 0
      ? Math.round((assignedProducerIds.size / activeProducersCount) * 100)
      : 0;

    // Renovações
    const renewals = await prisma.contractRenewal.findMany();
    const ongoingRenewals = renewals.filter((r: any) =>
      ['PLANNED', 'IN_PROGRESS', 'PROPOSAL', 'AWAITING_DECISION'].includes(r.status)
    ).length;
    const completedRenewals = renewals.filter((r: any) => r.status === 'COMPLETED').length;
    const notRenewed = renewals.filter((r: any) => r.status === 'NOT_RENEWED').length;

    const totalDecided = completedRenewals + notRenewed;
    const renewalRetentionRate = totalDecided > 0
      ? Math.round((completedRenewals / totalDecided) * 100)
      : 100;

    // Movimentações abertas por tipo
    const openOpps = await prisma.commercialOpportunity.findMany({
      where: { status: 'OPEN' }
    });

    const openMovementsCount = {
      renewals: openOpps.filter((o: any) => o.movementType === 'RENEWAL' || o.typeId === 'CONTRACT_RENEWAL').length,
      expansions: openOpps.filter((o: any) => o.movementType === 'EXPANSION' || o.typeId === 'NEW_EVENT').length,
      upgrades: openOpps.filter((o: any) => o.movementType === 'UPGRADE').length,
      downgrades: openOpps.filter((o: any) => o.movementType === 'DOWNGRADE').length,
      additionalServices: openOpps.filter((o: any) => o.movementType === 'ADDITIONAL_SERVICE' || o.typeId === 'EXTRA_SERVICES').length
    };

    return {
      totalProducers: producers.length,
      activeProducers: activeProducersCount,
      portfolioCoveragePercentage,
      activeContracts: activeContracts.length,
      contractsInRenewalWindow,
      overdueContracts,
      ongoingRenewals,
      completedRenewals,
      renewalRetentionRate,
      openMovementsCount
    };
  }
}
