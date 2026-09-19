import { DashboardWidget, MetricDomain } from '@shared/types/index';

export class WidgetRegistry {
  private static instance: WidgetRegistry;
  private widgets: Map<string, DashboardWidget> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }

  private registerDefaults(): void {
    const defaultWidgets: DashboardWidget[] = [
      // Comercial
      {
        id: 'wdg-com-01',
        code: 'sales.summary',
        name: 'Resumo Geral de Vendas',
        category: 'COMERCIAL',
        metricCodes: ['sales.gross_amount', 'sales.net_amount', 'orders.paid', 'sales.average_ticket'],
        chartType: 'KPI',
        size: 'FULL',
        requiredPermission: 'relatorios.vendas.visualizar'
      },
      {
        id: 'wdg-com-02',
        code: 'sales.timeline',
        name: 'Evolução de Faturamento no Tempo',
        category: 'COMERCIAL',
        metricCodes: ['sales.gross_amount'],
        chartType: 'LINE',
        size: 'LARGE',
        requiredPermission: 'relatorios.vendas.visualizar'
      },
      {
        id: 'wdg-com-03',
        code: 'sales.by_channel',
        name: 'Mix de Vendas por Canal',
        category: 'COMERCIAL',
        metricCodes: ['sales.gross_amount'],
        chartType: 'DONUT',
        size: 'MEDIUM',
        requiredPermission: 'relatorios.vendas.visualizar'
      },

      // Eventos
      {
        id: 'wdg-evt-01',
        code: 'events.occupancy',
        name: 'Lotação & Ocupação de Evento',
        category: 'EVENTOS',
        metricCodes: ['tickets.sold', 'tickets.issued', 'events.occupancy_rate'],
        chartType: 'BAR',
        size: 'MEDIUM',
        requiredPermission: 'relatorios.eventos.visualizar'
      },
      {
        id: 'wdg-evt-02',
        code: 'events.checkin_flow',
        name: 'Fluxo de Check-in e Portaria',
        category: 'EVENTOS',
        metricCodes: ['checkin.completed', 'checkin.attendance_rate'],
        chartType: 'KPI',
        size: 'MEDIUM',
        requiredPermission: 'relatorios.eventos.visualizar'
      },

      // Financeiro
      {
        id: 'wdg-fin-01',
        code: 'finance.balance_overview',
        name: 'Saldos Disponíveis & Repasses',
        category: 'FINANCEIRO',
        metricCodes: ['finance.available_balance', 'finance.event_result'],
        chartType: 'KPI',
        size: 'MEDIUM',
        requiredPermission: 'relatorios.financeiro.visualizar'
      },

      // Marketing
      {
        id: 'wdg-mkt-01',
        code: 'marketing.roas_performance',
        name: 'Desempenho de Mídia & ROAS Multicanal',
        category: 'MARKETING',
        metricCodes: ['marketing.investment', 'marketing.attributed_revenue', 'marketing.roas'],
        chartType: 'BAR',
        size: 'LARGE',
        requiredPermission: 'relatorios.marketing.visualizar'
      },

      // SAC
      {
        id: 'wdg-sac-01',
        code: 'sac.sla_kpis',
        name: 'Indicadores de Atendimento & SLA',
        category: 'SAC',
        metricCodes: ['sac.tickets_total', 'sac.first_response_time', 'sac.sla_compliance_rate'],
        chartType: 'KPI',
        size: 'MEDIUM',
        requiredPermission: 'relatorios.sac.visualizar'
      },

      // Estorno
      {
        id: 'wdg-est-01',
        code: 'refunds.rate_gauge',
        name: 'Índice de Estornos & Volume',
        category: 'ESTORNO',
        metricCodes: ['refunds.executed_amount', 'refunds.rate'],
        chartType: 'DONUT',
        size: 'SMALL',
        requiredPermission: 'relatorios.financeiro.visualizar'
      },

      // Remarketing
      {
        id: 'wdg-rmk-01',
        code: 'remarketing.cart_recovery',
        name: 'Recuperação de Carrinhos Abandonados',
        category: 'REMARKETING',
        metricCodes: ['remarketing.recovered_revenue'],
        chartType: 'KPI',
        size: 'SMALL',
        requiredPermission: 'relatorios.marketing.visualizar'
      }
    ];

    for (const w of defaultWidgets) {
      this.widgets.set(w.code, w);
    }
  }

  public getWidget(code: string): DashboardWidget | undefined {
    return this.widgets.get(code);
  }

  public getWidgetsByCategory(category: MetricDomain): DashboardWidget[] {
    return Array.from(this.widgets.values()).filter(w => w.category === category);
  }

  public getAllWidgets(): DashboardWidget[] {
    return Array.from(this.widgets.values());
  }
}
