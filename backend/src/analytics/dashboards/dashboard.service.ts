import {
  AnalyticsPeriod,
  AnalyticsGoal,
  DashboardWidget,
  MetricDomain,
  AnalyticsResult
} from '@shared/types/index';
import { AnalyticsService } from '../core/analytics.service';
import { WidgetRegistry } from './widget.registry';
import { prisma } from '../../core/database/prisma';

export interface DashboardViewResponse {
  domain: string;
  period: AnalyticsPeriod;
  widgets: DashboardWidget[];
  metricsResult: AnalyticsResult;
  goals?: AnalyticsGoal[];
  summary: Record<string, any>;
}

export class DashboardService {
  private analyticsService: AnalyticsService;
  private widgetRegistry: WidgetRegistry;

  constructor(analyticsService?: AnalyticsService) {
    this.analyticsService = analyticsService || new AnalyticsService();
    this.widgetRegistry = WidgetRegistry.getInstance();
  }

  /**
   * Executive Overview Dashboard: Top-level indicators for directors and executives
   */
  public async getExecutiveDashboard(
    period: AnalyticsPeriod = { type: 'THIS_MONTH', comparison: 'PREVIOUS_PERIOD' },
    user: any
  ): Promise<DashboardViewResponse> {
    const widgets = this.widgetRegistry.getAllWidgets();

    const executiveMetrics = [
      'sales.gross_amount',
      'sales.net_amount',
      'orders.paid',
      'tickets.sold',
      'sales.average_ticket',
      'refunds.executed_amount',
      'finance.available_balance'
    ];

    const result = await this.analyticsService.executeQuery(
      {
        metrics: executiveMetrics,
        dimensions: ['channel'],
        period
      },
      user
    );

    const goals = await this.listGoals();

    return {
      domain: 'EXECUTIVE',
      period,
      widgets,
      metricsResult: result,
      goals,
      summary: result.summary
    };
  }

  /**
   * Producer-level operational & commercial dashboard
   */
  public async getProducerDashboard(
    producerId: string,
    eventId?: string,
    period: AnalyticsPeriod = { type: 'THIS_MONTH' },
    user?: any
  ): Promise<DashboardViewResponse> {
    const producerMetrics = [
      'sales.gross_amount',
      'sales.net_amount',
      'tickets.sold',
      'events.occupancy_rate',
      'sales.average_ticket',
      'refunds.rate'
    ];

    const result = await this.analyticsService.executeQuery(
      {
        metrics: producerMetrics,
        dimensions: eventId ? ['lot', 'sector'] : ['event'],
        period,
        producerId,
        eventId
      },
      user
    );

    const goals = await this.listGoals({ producerId, eventId });

    return {
      domain: 'PRODUCER',
      period,
      widgets: this.widgetRegistry.getWidgetsByCategory('COMERCIAL').concat(
        this.widgetRegistry.getWidgetsByCategory('EVENTOS')
      ),
      metricsResult: result,
      goals,
      summary: result.summary
    };
  }

  /**
   * Domain-specific Operational BI Dashboard (Comercial, Eventos, Financeiro, SAC, etc.)
   */
  public async getDomainDashboard(
    domain: MetricDomain,
    period: AnalyticsPeriod = { type: 'THIS_MONTH' },
    user: any,
    filters?: { producerId?: string; eventId?: string }
  ): Promise<DashboardViewResponse> {
    const widgets = this.widgetRegistry.getWidgetsByCategory(domain);
    const domainMetricCodes = new Set<string>();
    for (const w of widgets) {
      for (const m of w.metricCodes) {
        domainMetricCodes.add(m);
      }
    }

    // Default dimensions based on domain
    let dimensions: string[] = ['channel'];
    if (domain === 'EVENTOS') dimensions = ['event', 'sector'];
    if (domain === 'FINANCEIRO' || domain === 'CONTABILIDADE') dimensions = ['gateway', 'payment_method'];
    if (domain === 'SAC') dimensions = ['status'];
    if (domain === 'MARKETING' || domain === 'REMARKETING') dimensions = ['campaign'];

    const result = await this.analyticsService.executeQuery(
      {
        metrics: Array.from(domainMetricCodes),
        dimensions,
        period,
        producerId: filters?.producerId,
        eventId: filters?.eventId
      },
      user
    );

    const goals = await this.listGoals({
      producerId: filters?.producerId,
      eventId: filters?.eventId
    });

    return {
      domain,
      period,
      widgets,
      metricsResult: result,
      goals,
      summary: result.summary
    };
  }

  /**
   * Goals Management (Realizado x Meta)
   */
  public async listGoals(filters?: {
    producerId?: string;
    eventId?: string;
    period?: string;
    metricCode?: string;
  }): Promise<AnalyticsGoal[]> {
    const records = await prisma.analyticsGoalModel.findMany({
      where: filters
    });

    return records.map((r: any) => this.mapGoalToDomain(r));
  }

  public async createGoal(goalData: {
    metricCode: string;
    name: string;
    targetValue: number;
    currentValue?: number;
    projectionValue?: number;
    unit?: string;
    period: string;
    producerId?: string | null;
    eventId?: string | null;
    channel?: string | null;
  }): Promise<AnalyticsGoal> {
    const target = goalData.targetValue || 1;
    const current = goalData.currentValue || 0;
    const progressPercent = Math.round((current / target) * 10000) / 100;

    const record = await prisma.analyticsGoalModel.create({
      data: {
        metricCode: goalData.metricCode,
        name: goalData.name,
        targetValue: goalData.targetValue,
        currentValue: current,
        progressPercent,
        projectionValue: goalData.projectionValue || null,
        unit: goalData.unit || 'BRL',
        period: goalData.period,
        producerId: goalData.producerId || null,
        eventId: goalData.eventId || null,
        channel: goalData.channel || null
      }
    });

    return this.mapGoalToDomain(record);
  }

  public async updateGoalProgress(
    id: string,
    currentValue: number,
    projectionValue?: number
  ): Promise<AnalyticsGoal> {
    const existing = await prisma.analyticsGoalModel.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Meta de analytics não encontrada: ${id}`);
    }

    const progressPercent = Math.round((currentValue / existing.targetValue) * 10000) / 100;

    const updated = await prisma.analyticsGoalModel.update({
      where: { id },
      data: {
        currentValue,
        progressPercent,
        projectionValue: projectionValue !== undefined ? projectionValue : existing.projectionValue
      }
    });

    return this.mapGoalToDomain(updated);
  }

  public async deleteGoal(id: string): Promise<boolean> {
    await prisma.analyticsGoalModel.delete({ where: { id } });
    return true;
  }

  private mapGoalToDomain(record: any): AnalyticsGoal {
    return {
      id: record.id,
      metricCode: record.metricCode,
      name: record.name,
      targetValue: record.targetValue,
      currentValue: record.currentValue,
      progressPercent: record.progressPercent,
      projectionValue: record.projectionValue,
      unit: record.unit,
      period: record.period,
      producerId: record.producerId,
      eventId: record.eventId,
      channel: record.channel,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : record.createdAt.toISOString(),
      updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : record.updatedAt.toISOString()
    };
  }
}
