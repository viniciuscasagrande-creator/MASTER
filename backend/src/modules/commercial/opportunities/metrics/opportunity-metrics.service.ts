import { prisma } from '../../../../core/database/prisma';
import { CommercialScopePolicy } from '../../policies/commercial-scope.policy';
import { CommercialOpportunityMetricsDTO } from '../../../../../../shared/types';

export class OpportunityMetricsService {
  /**
   * Consolida métricas objetivas e transparentes de negociações.
   * Regra estrita: Zero scores arbitrários ("lead score 87", "probabilidade de fechamento 78%").
   * Exibe exclusivamente contadores reais, tempos médios comprovados ou "—" quando insuficiente.
   */
  public static async getOpportunityMetrics(
    pipelineId?: string,
    user?: any
  ): Promise<CommercialOpportunityMetricsDTO> {
    let opportunities = await prisma.commercialOpportunity.findMany();

    if (pipelineId && pipelineId !== 'ALL') {
      opportunities = opportunities.filter((o: any) => o.pipelineId === pipelineId);
    }

    if (user && !user.isSuperAdmin) {
      opportunities = opportunities.filter((o: any) => {
        if (o.producerId) return CommercialScopePolicy.canAccessProducer(user, o.producerId);
        return true;
      });
    }

    const stages = await prisma.commercialPipelineStage.findMany();
    const stageMap = new Map<string, any>(stages.map((s: any) => [s.id, s]));

    const now = Date.now();
    let totalOpen = 0;
    let inNegotiation = 0;
    let withoutNextAction = 0;
    let overdueActions = 0;
    let wonInPeriod = 0;
    let closedInPeriod = 0;

    const completedCyclesDays: number[] = [];

    for (const opp of opportunities) {
      if (opp.status === 'OPEN') {
        totalOpen++;

        const stage = stageMap.get(opp.stageId);
        if (stage && (stage.code === 'NEGOTIATING' || stage.code === 'PROPOSAL' || stage.code === 'DECISION')) {
          inNegotiation++;
        }

        if (!opp.nextActionAt) {
          withoutNextAction++;
        } else if (new Date(opp.nextActionAt).getTime() < now) {
          overdueActions++;
        }
      } else if (opp.status === 'WON') {
        wonInPeriod++;
        if (opp.wonAt && opp.createdAt) {
          const cycleDays = Math.max(0, (new Date(opp.wonAt).getTime() - new Date(opp.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          completedCyclesDays.push(cycleDays);
        }
      } else if (opp.status === 'CLOSED') {
        closedInPeriod++;
        if (opp.closedAt && opp.createdAt) {
          const cycleDays = Math.max(0, (new Date(opp.closedAt).getTime() - new Date(opp.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          completedCyclesDays.push(cycleDays);
        }
      }
    }

    // Calcula duração média por estágio baseado em dados históricos reais
    const histories = await prisma.opportunityStageHistory.findMany();
    const stageDurations: Record<string, { totalSeconds: number; count: number }> = {};

    for (const h of histories) {
      if (h.fromStageId && h.durationSeconds && h.durationSeconds > 0) {
        if (!stageDurations[h.fromStageId]) {
          stageDurations[h.fromStageId] = { totalSeconds: 0, count: 0 };
        }
        stageDurations[h.fromStageId].totalSeconds += h.durationSeconds;
        stageDurations[h.fromStageId].count += 1;
      }
    }

    const averageStageDurationDays: Record<string, number> = {};
    for (const [stageId, data] of Object.entries(stageDurations)) {
      const avgDays = Math.round((data.totalSeconds / data.count / (24 * 3600)) * 10) / 10;
      averageStageDurationDays[stageId] = avgDays;
    }

    const averageCycleDurationDays =
      completedCyclesDays.length > 0
        ? Math.round((completedCyclesDays.reduce((a, b) => a + b, 0) / completedCyclesDays.length) * 10) / 10
        : 0;

    return {
      totalOpen,
      inNegotiation,
      withoutNextAction,
      overdueActions,
      wonInPeriod,
      closedInPeriod,
      averageStageDurationDays,
      averageCycleDurationDays
    };
  }
}
