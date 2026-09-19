import {
  MetricDomain,
  MetricFormat,
  MetricUpdateFrequency,
  ExportFormat,
  ExportJobStatus,
  ReportVisibility,
  ChartType,
  ComparisonType,
  PeriodType,
  AnalyticsPeriod,
  AnalyticsQuery,
  AnalyticsResult,
  MetricDefinition,
  DimensionDefinition,
  FilterDefinition,
  SavedReport,
  ReportExportJob,
  ReportSchedule,
  ReportSnapshot,
  AnalyticsGoal,
  DashboardWidget
} from '@shared/types/index';

export type AnalyticsTab =
  | 'overview'
  | 'builder'
  | 'reports'
  | 'exports'
  | 'schedules'
  | 'dictionary'
  | 'goals'
  | 'snapshots'
  | 'domains';

export interface ReportBuilderFormState {
  title: string;
  description: string;
  domain: MetricDomain;
  metrics: string[];
  dimensions: string[];
  filters: FilterDefinition[];
  period: AnalyticsPeriod;
  chartType: ChartType;
  visibility: ReportVisibility;
  sharedWithUserIds: string[];
  sharedWithRoleCodes: string[];
}

export interface MetricExplanationData {
  metric: MetricDefinition;
  calculationExplanation: string;
}

export interface ChannelMixItem {
  channel: string;
  channelName: string;
  grossAmount: number;
  ticketsSold: number;
  percentage: number;
  color: string;
}

export interface ExecutiveSummaryStats {
  grossSales: number;
  grossSalesFormatted: string;
  grossSalesChangeMoM: number;
  netSales: number;
  netSalesFormatted: string;
  ticketsSold: number;
  ticketsSoldChangeMoM: number;
  averageTicket: number;
  averageTicketFormatted: string;
  paidOrders: number;
  refundRate: number;
  refundAmount: number;
  refundAmountFormatted: string;
  availableBalance: number;
  availableBalanceFormatted: string;
}
