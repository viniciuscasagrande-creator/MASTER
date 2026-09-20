import { prisma } from '../../../core/database/prisma';
import { CommercialScopePolicy } from '../policies/commercial-scope.policy';
import { CommercialAccountService } from './commercial-account.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { ProducerCommercialSummaryDTO } from '../../../../../shared/types';

export class CommercialProducerQueryService {
  /**
   * Central de Produtores: Listagem filtrada, paginada e enriquecida com metadados comerciais
   */
  public static async listProducers(
    filter: {
      search?: string;
      segmentId?: string;
      classification?: string;
      ownerId?: string;
      commercialStatus?: string;
      page?: number;
      pageSize?: number;
    },
    user: any
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(filter.page || 1));
    const pageSize = Math.max(1, Math.min(100, Number(filter.pageSize || 10)));

    // 1. Busca todos os produtores no Core
    let allProducers = await prisma.producer.findMany();

    // 2. Aplica Data Scope
    allProducers = allProducers.filter((p: any) =>
      CommercialScopePolicy.canAccessProducer(user, p.id)
    );

    // 3. Carrega contas comerciais
    const allAccounts = await prisma.commercialAccount.findMany();
    const accountMap = new Map<string, any>();
    for (const acc of allAccounts) {
      accountMap.set(acc.producerId, acc);
    }

    // 4. Carrega eventos e oportunidades para enriquecer contadores
    const allEvents = await prisma.event.findMany();
    const allOpps = await prisma.commercialOpportunity.findMany({ where: { status: 'OPEN' } });

    // 5. Filtros em memória
    let filtered = allProducers.map((p: any) => {
      const acc = accountMap.get(p.id);
      const producerEvents = allEvents.filter((e: any) => e.producerId === p.id);
      const activeEvents = producerEvents.filter((e: any) =>
        e.status === 'ON_SALE' || e.status === 'IN_PROGRESS' || e.status === 'CONFIGURING'
      );
      const openOpps = allOpps.filter((o: any) => o.producerId === p.id);

      return {
        id: p.id,
        name: p.name,
        cnpj: p.cnpj,
        status: p.status,
        commercialStatus: acc?.commercialStatus || 'PROSPECT',
        commercialOwnerId: acc?.commercialOwnerId || null,
        commercialOwnerName: acc?.commercialOwnerName || 'Não atribuído',
        segmentId: acc?.segmentId || 'GERAL',
        commercialClassification: acc?.commercialClassification || 'STANDARD',
        eventsCount: producerEvents.length,
        activeEventsCount: activeEvents.length,
        openOpportunitiesCount: openOpps.length,
        lastContactAt: acc?.lastContactAt ? new Date(acc.lastContactAt).toISOString() : undefined,
        nextActionAt: acc?.nextActionAt ? new Date(acc.nextActionAt).toISOString() : undefined,
        nextActionDescription: acc?.nextActionDescription || null
      };
    });

    if (filter.search && filter.search.trim() !== '') {
      const searchLower = filter.search.toLowerCase().trim();
      const searchDigits = searchLower.replace(/\D/g, '');
      filtered = filtered.filter(
        (p: any) =>
          p.name.toLowerCase().includes(searchLower) ||
          (searchDigits.length >= 3 && p.cnpj && p.cnpj.replace(/\D/g, '').includes(searchDigits)) ||
          p.commercialOwnerName.toLowerCase().includes(searchLower)
      );
    }

    if (filter.segmentId && filter.segmentId !== 'ALL') {
      filtered = filtered.filter((p: any) => p.segmentId === filter.segmentId);
    }

    if (filter.classification && filter.classification !== 'ALL') {
      filtered = filtered.filter((p: any) => p.commercialClassification === filter.classification);
    }

    if (filter.commercialStatus && filter.commercialStatus !== 'ALL') {
      filtered = filtered.filter((p: any) => p.commercialStatus === filter.commercialStatus);
    }

    if (filter.ownerId && filter.ownerId !== 'ALL') {
      filtered = filtered.filter((p: any) => p.commercialOwnerId === filter.ownerId);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  /**
   * Visão Comercial do Produtor (consolidação objetiva e integrada sem duplicidade de entidades e sem termos 360)
   */
  public static async getProducerCommercialSummary(
    producerId: string,
    user: any
  ): Promise<ProducerCommercialSummaryDTO> {
    await CommercialScopePolicy.enforceScope(user, producerId);

    const producer = await prisma.producer.findUnique({ where: { id: producerId } });
    if (!producer) {
      throw new Error(`Produtor ${producerId} não encontrado.`);
    }

    const [account, portfolio, contacts, events, opportunities, tasks] = await Promise.all([
      CommercialAccountService.getCommercialAccount(producerId),
      PortfolioService.listAssignmentsForProducer(producerId),
      CommercialAccountService.listContacts(producerId),
      prisma.event.findMany({ where: { producerId } }),
      prisma.commercialOpportunity.findMany({ where: { producerId, status: 'OPEN' } }),
      prisma.task.findMany({ where: { producerId, status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING'] } } })
    ]);

    const activeEvents = events.filter((e: any) =>
      e.status === 'ON_SALE' || e.status === 'IN_PROGRESS' || e.status === 'CONFIGURING'
    );

    return {
      producer: {
        id: producer.id,
        name: producer.name,
        cnpj: producer.cnpj,
        email: producer.email || undefined,
        phone: producer.phone || undefined,
        status: producer.status
      },
      commercialAccount: account,
      portfolio,
      contacts,
      eventsCount: events.length,
      activeEventsCount: activeEvents.length,
      openOpportunitiesCount: opportunities.length,
      pendingTasksCount: tasks.length,
      lastContactAt: account?.lastContactAt,
      nextActionAt: account?.nextActionAt,
      nextActionDescription: account?.nextActionDescription || undefined
    };
  }
}
