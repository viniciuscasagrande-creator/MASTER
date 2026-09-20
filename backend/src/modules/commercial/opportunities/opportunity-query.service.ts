import { prisma } from '../../../core/database/prisma';
import { CommercialScopePolicy } from '../policies/commercial-scope.policy';
import { CommercialOpportunityDTO, OpportunityStageHistoryDTO } from '../../../../../shared/types';

export class OpportunityQueryService {
  /**
   * Lista oportunidades comerciais aplicando filtros e isolamento de escopo
   */
  public static async listOpportunities(
    filter: {
      pipelineId?: string;
      stageId?: string;
      producerId?: string;
      leadId?: string;
      ownerId?: string;
      status?: string;
      search?: string;
    },
    user: any
  ): Promise<CommercialOpportunityDTO[]> {
    let list = await prisma.commercialOpportunity.findMany();

    // 1. Aplica isolamento de escopo para produtores
    list = list.filter((o: any) => {
      if (o.producerId) {
        return CommercialScopePolicy.canAccessProducer(user, o.producerId);
      }
      // Se for lead sem produtor, apenas operadores comerciais e admins acessam
      return user.isSuperAdmin || (user.permissions && user.permissions.includes('comercial.oportunidades.visualizar'));
    });

    // 2. Filtros
    if (filter.pipelineId && filter.pipelineId !== 'ALL') {
      list = list.filter((o: any) => o.pipelineId === filter.pipelineId);
    }
    if (filter.stageId && filter.stageId !== 'ALL') {
      list = list.filter((o: any) => o.stageId === filter.stageId);
    }
    if (filter.producerId && filter.producerId !== 'ALL') {
      list = list.filter((o: any) => o.producerId === filter.producerId);
    }
    if (filter.leadId && filter.leadId !== 'ALL') {
      list = list.filter((o: any) => o.leadId === filter.leadId);
    }
    if (filter.ownerId && filter.ownerId !== 'ALL') {
      list = list.filter((o: any) => o.ownerId === filter.ownerId);
    }
    if (filter.status && filter.status !== 'ALL') {
      list = list.filter((o: any) => o.status === filter.status);
    }
    if (filter.search && filter.search.trim() !== '') {
      const s = filter.search.toLowerCase().trim();
      list = list.filter(
        (o: any) =>
          o.title.toLowerCase().includes(s) ||
          o.publicCode.toLowerCase().includes(s) ||
          (o.description && o.description.toLowerCase().includes(s)) ||
          (o.ownerName && o.ownerName.toLowerCase().includes(s))
      );
    }

    // 3. Carrega tabelas de apoio para enriquecimento
    const [producers, leads, stages, closeReasons, stageHistories] = await Promise.all([
      prisma.producer.findMany(),
      prisma.commercialLead.findMany(),
      prisma.commercialPipelineStage.findMany(),
      prisma.opportunityCloseReason.findMany(),
      prisma.opportunityStageHistory.findMany()
    ]);

    const producerMap = new Map<string, string>(producers.map((p: any) => [p.id, p.name]));
    const leadMap = new Map<string, string>(leads.map((l: any) => [l.id, l.tradeName || l.companyName]));
    const stageMap = new Map<string, any>(stages.map((s: any) => [s.id, s]));
    const reasonMap = new Map<string, string>(closeReasons.map((r: any) => [r.id, r.name]));

    const now = Date.now();

    return list.map((o: any) => {
      const stage = stageMap.get(o.stageId);
      const producerName = o.producerId ? producerMap.get(o.producerId) : undefined;
      const leadCompanyName = o.leadId ? leadMap.get(o.leadId) : undefined;
      const closeReasonName = o.closeReasonId ? reasonMap.get(o.closeReasonId) : undefined;

      // Calcula tempo no estágio atual
      const oppHistories = stageHistories.filter((h: any) => h.opportunityId === o.id);
      const lastHistory = oppHistories[oppHistories.length - 1];
      const stageStartTime = lastHistory ? new Date(lastHistory.changedAt).getTime() : new Date(o.createdAt).getTime();
      const timeInCurrentStageDays = Math.max(0, Math.floor((now - stageStartTime) / (1000 * 60 * 60 * 24)));

      return {
        id: o.id,
        publicCode: o.publicCode,
        producerId: o.producerId || undefined,
        producerName,
        leadId: o.leadId || undefined,
        leadCompanyName,
        pipelineId: o.pipelineId,
        stageId: o.stageId,
        stageName: stage?.name || 'Estágio',
        stageCode: stage?.code || '',
        stagePosition: stage?.position || 0,
        title: o.title,
        description: o.description || undefined,
        typeId: o.typeId || undefined,
        ownerId: o.ownerId,
        ownerName: o.ownerName || undefined,
        estimatedValue: o.estimatedValue !== null && o.estimatedValue !== undefined ? Number(o.estimatedValue) : null,
        expectedDecisionAt: o.expectedDecisionAt ? new Date(o.expectedDecisionAt).toISOString() : undefined,
        status: o.status,
        wonAt: o.wonAt ? new Date(o.wonAt).toISOString() : undefined,
        wonBy: o.wonBy || undefined,
        closedAt: o.closedAt ? new Date(o.closedAt).toISOString() : undefined,
        closedBy: o.closedBy || undefined,
        closeReasonId: o.closeReasonId || undefined,
        closeReasonName,
        closeNotes: o.closeNotes || undefined,
        timeInCurrentStageDays,
        nextActionAt: o.nextActionAt ? new Date(o.nextActionAt).toISOString() : undefined,
        nextActionDescription: o.nextActionDescription || undefined,
        version: o.version,
        createdAt: new Date(o.createdAt).toISOString(),
        updatedAt: new Date(o.updatedAt).toISOString()
      };
    });
  }

  /**
   * Obtém detalhes completos da oportunidade com histórico de estágios e atividades
   */
  public static async getOpportunityById(id: string, user: any): Promise<{
    opportunity: CommercialOpportunityDTO;
    stageHistory: OpportunityStageHistoryDTO[];
    activities: any[];
    tasks: any[];
  }> {
    const opp = await prisma.commercialOpportunity.findUnique({ where: { id } });
    if (!opp) throw new Error(`Oportunidade ${id} não encontrada.`);

    if (opp.producerId) {
      await CommercialScopePolicy.enforceScope(user, opp.producerId);
    }

    const [stages, closeReasons, stageHistories, activities, tasks, producer, lead] = await Promise.all([
      prisma.commercialPipelineStage.findMany(),
      prisma.opportunityCloseReason.findMany(),
      prisma.opportunityStageHistory.findMany({ where: { opportunityId: opp.id } }),
      prisma.commercialActivity.findMany({ where: { opportunityId: opp.id } }),
      prisma.task.findMany(),
      opp.producerId ? prisma.producer.findUnique({ where: { id: opp.producerId } }) : null,
      opp.leadId ? prisma.commercialLead.findUnique({ where: { id: opp.leadId } }) : null
    ]);

    const stageMap = new Map<string, any>(stages.map((s: any) => [s.id, s]));
    const reasonMap = new Map<string, string>(closeReasons.map((r: any) => [r.id, r.name]));
    const stage = stageMap.get(opp.stageId);

    const now = Date.now();
    const lastHistory = stageHistories[stageHistories.length - 1];
    const stageStartTime = lastHistory ? new Date(lastHistory.changedAt).getTime() : new Date(opp.createdAt).getTime();
    const timeInCurrentStageDays = Math.max(0, Math.floor((now - stageStartTime) / (1000 * 60 * 60 * 24)));

    const oppDto: CommercialOpportunityDTO = {
      id: opp.id,
      publicCode: opp.publicCode,
      producerId: opp.producerId || undefined,
      producerName: producer?.name,
      leadId: opp.leadId || undefined,
      leadCompanyName: lead?.tradeName || lead?.companyName,
      pipelineId: opp.pipelineId,
      stageId: opp.stageId,
      stageName: stage?.name || 'Estágio',
      stageCode: stage?.code || '',
      stagePosition: stage?.position || 0,
      title: opp.title,
      description: opp.description || undefined,
      typeId: opp.typeId || undefined,
      ownerId: opp.ownerId,
      ownerName: opp.ownerName || undefined,
      estimatedValue: opp.estimatedValue !== null && opp.estimatedValue !== undefined ? Number(opp.estimatedValue) : null,
      expectedDecisionAt: opp.expectedDecisionAt ? new Date(opp.expectedDecisionAt).toISOString() : undefined,
      status: opp.status,
      wonAt: opp.wonAt ? new Date(opp.wonAt).toISOString() : undefined,
      wonBy: opp.wonBy || undefined,
      closedAt: opp.closedAt ? new Date(opp.closedAt).toISOString() : undefined,
      closedBy: opp.closedBy || undefined,
      closeReasonId: opp.closeReasonId || undefined,
      closeReasonName: opp.closeReasonId ? reasonMap.get(opp.closeReasonId) : undefined,
      closeNotes: opp.closeNotes || undefined,
      timeInCurrentStageDays,
      nextActionAt: opp.nextActionAt ? new Date(opp.nextActionAt).toISOString() : undefined,
      nextActionDescription: opp.nextActionDescription || undefined,
      version: opp.version,
      createdAt: new Date(opp.createdAt).toISOString(),
      updatedAt: new Date(opp.updatedAt).toISOString()
    };

    const historyDtos: OpportunityStageHistoryDTO[] = stageHistories.map((h: any) => ({
      id: h.id,
      opportunityId: h.opportunityId,
      fromStageId: h.fromStageId || undefined,
      fromStageName: h.fromStageId ? stageMap.get(h.fromStageId)?.name : undefined,
      toStageId: h.toStageId,
      toStageName: stageMap.get(h.toStageId)?.name,
      changedBy: h.changedBy,
      changedByName: h.changedByName,
      changedAt: new Date(h.changedAt).toISOString(),
      reason: h.reason || undefined,
      durationSeconds: h.durationSeconds !== undefined ? h.durationSeconds : undefined
    }));

    // Filtra tarefas relacionadas a esta oportunidade
    const relatedTasks = tasks.filter((t: any) => {
      if (t.metadata) {
        try {
          const parsed = JSON.parse(t.metadata);
          return parsed.opportunityId === opp.id;
        } catch {
          return false;
        }
      }
      return false;
    });

    return {
      opportunity: oppDto,
      stageHistory: historyDtos,
      activities: activities.sort((a: any, b: any) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()),
      tasks: relatedTasks
    };
  }
}
