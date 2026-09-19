import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  BookOpen,
  Target,
  Camera,
  Layers,
  Plus,
  Sparkles,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useDiskContext } from '../../core/context/DiskContext';
import {
  MetricDomain,
  AnalyticsPeriod,
  SavedReport,
  ReportExportJob,
  ReportSchedule,
  ReportSnapshot,
  AnalyticsGoal,
  MetricDefinition,
  DimensionDefinition,
  AnalyticsResult,
  DashboardWidget
} from '@shared/types/index';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';

// Tab Views
import { OverviewDashboardTab } from './views/OverviewDashboardTab';
import { ReportBuilderTab } from './views/ReportBuilderTab';
import { SavedReportsTab } from './views/SavedReportsTab';
import { ExportsCenterTab } from './views/ExportsCenterTab';
import { SchedulesTab } from './views/SchedulesTab';
import { MetricsCatalogTab } from './views/MetricsCatalogTab';
import { GoalsTab } from './views/GoalsTab';
import { SnapshotsTab } from './views/SnapshotsTab';
import { DomainDashboardsTab } from './views/DomainDashboardsTab';

// Modals
import { MetricExplainModal } from './components/MetricExplainModal';
import { ReportViewerModal } from './components/ReportViewerModal';
import { ShareReportModal } from './components/ShareReportModal';
import { SnapshotModal } from './components/SnapshotModal';
import { CreateGoalModal } from './components/CreateGoalModal';

import {
  AnalyticsTab,
  ExecutiveSummaryStats,
  ChannelMixItem
} from './analytics.types';

interface AnalyticsCenterViewProps {
  initialSubItem?: string;
  onNavigate?: (moduleId: string, subItemId?: string) => void;
}

export const AnalyticsCenterView: React.FC<AnalyticsCenterViewProps> = ({
  initialSubItem,
  onNavigate
}) => {
  const { currentUser, hasPermission } = useAuth();
  const { isGlobalScope, activeProducer, activeEvent } = useDiskContext();

  // Active Tab Mapping
  const mapSubItemToTab = (subItem?: string): AnalyticsTab => {
    switch (subItem) {
      case 'analytics-builder': return 'builder';
      case 'analytics-reports': return 'reports';
      case 'analytics-exports': return 'exports';
      case 'analytics-schedules': return 'schedules';
      case 'analytics-dictionary': return 'dictionary';
      case 'analytics-goals': return 'goals';
      case 'analytics-snapshots': return 'snapshots';
      case 'analytics-domains': return 'domains';
      case 'analytics-overview':
      default: return 'overview';
    }
  };

  const [activeTab, setActiveTab] = useState<AnalyticsTab>(mapSubItemToTab(initialSubItem));

  useEffect(() => {
    if (initialSubItem) {
      setActiveTab(mapSubItemToTab(initialSubItem));
    }
  }, [initialSubItem]);

  // Executive Overview State
  const [period, setPeriod] = useState<AnalyticsPeriod>({
    type: 'THIS_MONTH',
    comparison: 'PREVIOUS_PERIOD'
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Metrics Catalog & Dimensions State
  const [metricsCatalog, setMetricsCatalog] = useState<MetricDefinition[]>([
    {
      id: 'met-com-01',
      code: 'sales.gross_amount',
      name: 'Vendas Brutas (GMV)',
      description: 'Volume financeiro bruto total de ingressos e produtos faturados antes de descontos ou estornos.',
      domain: 'COMERCIAL',
      format: 'CURRENCY',
      formula: 'SUM(orders.total_amount) WHERE orders.status = "PAID"',
      source: 'Pedidos (Orders / Payments)',
      updateFrequency: 'REAL_TIME',
      responsible: 'Comercial & Financeiro',
      version: 2,
      requiredPermission: 'relatorios.vendas.visualizar',
      lineage: [
        { step: 'Checkout Cliente', source: 'Web / App / PDV', details: 'Transação iniciada pelo comprador' },
        { step: 'Aprovação de Pagamento', source: 'Gateway / Adquirente', details: 'Confirmação bancária de PIX ou cartão' },
        { step: 'Consolidação de Pedido', source: 'OrderService', details: 'Status atualizado para PAID e emissão de ingressos' }
      ],
      supportedDimensions: ['time', 'producer', 'event', 'channel', 'payment_method', 'gateway', 'status'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z'
    },
    {
      id: 'met-com-02',
      code: 'sales.net_amount',
      name: 'Vendas Líquidas',
      description: 'Receita líquida auferida após dedução de taxas de conveniência, cortesias e estornos.',
      domain: 'COMERCIAL',
      format: 'CURRENCY',
      formula: 'SUM(orders.net_amount) WHERE orders.status = "PAID"',
      source: 'Financeiro / Pedidos',
      updateFrequency: 'REAL_TIME',
      responsible: 'Financeiro',
      version: 1,
      requiredPermission: 'relatorios.vendas.visualizar',
      supportedDimensions: ['time', 'channel', 'producer', 'event'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'met-evt-01',
      code: 'tickets.sold',
      name: 'Ingressos Emitidos / Vendidos',
      description: 'Total de ingressos emitidos vinculados a pedidos concluídos.',
      domain: 'EVENTOS',
      format: 'NUMBER',
      formula: 'COUNT(tickets.id) WHERE tickets.status = "ISSUED"',
      source: 'Ingressos (TicketService)',
      updateFrequency: 'REAL_TIME',
      responsible: 'Operações & Eventos',
      version: 1,
      requiredPermission: 'relatorios.eventos.visualizar',
      supportedDimensions: ['event', 'sector', 'lot', 'channel'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'met-com-04',
      code: 'sales.average_ticket',
      name: 'Ticket Médio de Venda',
      description: 'Média de gasto do comprador por pedido pago.',
      domain: 'COMERCIAL',
      format: 'CURRENCY',
      formula: 'SUM(orders.total_amount) / COUNT(orders.id)',
      source: 'Pedidos (OrderService)',
      updateFrequency: 'REAL_TIME',
      responsible: 'Comercial',
      version: 1,
      requiredPermission: 'relatorios.vendas.visualizar',
      supportedDimensions: ['channel', 'payment_method'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'met-est-02',
      code: 'refunds.rate',
      name: 'Taxa de Estorno & Chargeback',
      description: 'Percentual do faturamento estornado em relação ao faturamento bruto total.',
      domain: 'ESTORNO',
      format: 'PERCENTAGE',
      formula: '(SUM(refunds.amount) / SUM(orders.total_amount)) * 100',
      source: 'Módulo de Estornos & Financeiro',
      updateFrequency: 'REAL_TIME',
      responsible: 'Risco & Financeiro',
      version: 1,
      requiredPermission: 'relatorios.financeiro.visualizar',
      supportedDimensions: ['channel', 'gateway', 'payment_method'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'met-fin-01',
      code: 'finance.available_balance',
      name: 'Saldo Líquido Disponível',
      description: 'Saldo financeiro livre para repasse e transferências após reserva legal de segurança.',
      domain: 'FINANCEIRO',
      format: 'CURRENCY',
      formula: 'account.balance - account.blocked_reserve',
      source: 'Módulo Financeiro / Saldos',
      updateFrequency: 'REAL_TIME',
      responsible: 'Tesouraria',
      version: 1,
      requiredPermission: 'relatorios.financeiro.visualizar',
      isSensitive: true,
      supportedDimensions: ['producer', 'event', 'gateway'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'met-mkt-03',
      code: 'marketing.roas',
      name: 'Retorno Sobre Investimento (ROAS)',
      description: 'Multiplicador de receita atribuída em relação ao valor investido em mídia paga.',
      domain: 'MARKETING',
      format: 'NUMBER',
      formula: 'SUM(orders.attributed_amount) / SUM(marketing.spend)',
      source: 'Módulo de Marketing / UTMs',
      updateFrequency: 'NEAR_REAL_TIME',
      responsible: 'Tráfego & Growth',
      version: 1,
      requiredPermission: 'relatorios.marketing.visualizar',
      supportedDimensions: ['campaign', 'channel', 'event'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'met-rmk-01',
      code: 'remarketing.recovered_revenue',
      name: 'Receita Recuperada de Carrinhos',
      description: 'Volume financeiro salvo através de disparos automáticos de WhatsApp e e-mail.',
      domain: 'REMARKETING',
      format: 'CURRENCY',
      formula: 'SUM(recovered_carts.amount)',
      source: 'Motor de Remarketing',
      updateFrequency: 'NEAR_REAL_TIME',
      responsible: 'Growth & CRM',
      version: 1,
      requiredPermission: 'relatorios.marketing.visualizar',
      supportedDimensions: ['channel', 'event'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }
  ]);

  const [availableDimensions] = useState<DimensionDefinition[]>([
    { id: 'dim-1', code: 'channel', name: 'Canal de Venda', type: 'ENUM' },
    { id: 'dim-2', code: 'payment_method', name: 'Forma de Pagamento', type: 'ENUM' },
    { id: 'dim-3', code: 'gateway', name: 'Gateway / Adquirente', type: 'ENUM' },
    { id: 'dim-4', code: 'status', name: 'Status do Pedido', type: 'ENUM' },
    { id: 'dim-5', code: 'producer', name: 'Produtor', type: 'ENTITY' },
    { id: 'dim-6', code: 'event', name: 'Evento', type: 'ENTITY' },
    { id: 'dim-7', code: 'sector', name: 'Setor / Área', type: 'STRING' },
    { id: 'dim-8', code: 'lot', name: 'Lote de Ingressos', type: 'STRING' },
    { id: 'dim-9', code: 'campaign', name: 'Campanha de Tráfego', type: 'STRING' }
  ]);

  // Executive Stats State
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummaryStats>({
    grossSales: 2845000,
    grossSalesFormatted: 'R$ 2.845.000,00',
    grossSalesChangeMoM: 14.8,
    netSales: 2588950,
    netSalesFormatted: 'R$ 2.588.950,00',
    ticketsSold: 28940,
    ticketsSoldChangeMoM: 12.2,
    averageTicket: 172.5,
    averageTicketFormatted: 'R$ 172,50',
    paidOrders: 16492,
    refundRate: 1.84,
    refundAmount: 52348,
    refundAmountFormatted: 'R$ 52.348,00',
    availableBalance: 1984250,
    availableBalanceFormatted: 'R$ 1.984.250,00'
  });

  const [channelMix] = useState<ChannelMixItem[]>([
    { channel: 'WEB_DESKTOP', channelName: 'Site Disk Ingressos', grossAmount: 1450950, ticketsSold: 14750, percentage: 51.0, color: '#f97316' },
    { channel: 'APP_MOBILE', channelName: 'Aplicativo Mobile', grossAmount: 768150, ticketsSold: 7810, percentage: 27.0, color: '#38bdf8' },
    { channel: 'PDV_BILHETERIA', channelName: 'PDV & Bilheterias', grossAmount: 398300, ticketsSold: 4050, percentage: 14.0, color: '#10b981' },
    { channel: 'PROMOTER', channelName: 'Rede de Promoters', grossAmount: 142250, ticketsSold: 1450, percentage: 5.0, color: '#a855f7' },
    { channel: 'CORPORATE', channelName: 'Vendas Corporativas', grossAmount: 85350, ticketsSold: 880, percentage: 3.0, color: '#fbbf24' }
  ]);

  // Saved Reports State
  const [savedReports, setSavedReports] = useState<SavedReport[]>([
    {
      id: 'rep-01',
      title: 'Faturamento Bruto e Ingressos por Canal',
      description: 'Relatório consolidado de vendas online vs PDV para prestação de contas',
      domain: 'COMERCIAL',
      queryDefinition: {
        metrics: ['sales.gross_amount', 'tickets.sold', 'sales.average_ticket'],
        dimensions: ['channel'],
        period: { type: 'THIS_MONTH' }
      },
      chartType: 'BAR',
      visibility: 'TEAM',
      creatorUserId: 'usr-admin-1',
      creatorUserName: 'Carlos Administrador',
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-18T14:30:00Z'
    },
    {
      id: 'rep-02',
      title: 'Demonstrativo de Saldos e Repasses por Evento',
      description: 'Visão de tesouraria com saldos disponíveis e reservas de estorno',
      domain: 'FINANCEIRO',
      queryDefinition: {
        metrics: ['finance.available_balance', 'refunds.rate'],
        dimensions: ['event'],
        period: { type: 'THIS_MONTH' }
      },
      chartType: 'TABLE',
      visibility: 'ROLE',
      sharedWithRoleCodes: ['analista_financeiro'],
      creatorUserId: 'usr-fin-roberto',
      creatorUserName: 'Roberto Finanças',
      createdAt: '2026-09-05T09:00:00Z',
      updatedAt: '2026-09-19T08:00:00Z'
    },
    {
      id: 'rep-03',
      title: 'Desempenho de Mídia Paga & ROAS por Campanha',
      description: 'Retorno sobre investimento em campanhas de Meta Ads e Google Ads',
      domain: 'MARKETING',
      queryDefinition: {
        metrics: ['marketing.roas', 'marketing.attributed_revenue'],
        dimensions: ['campaign'],
        period: { type: 'LAST_30_DAYS' }
      },
      chartType: 'DONUT',
      visibility: 'PRIVATE',
      creatorUserId: currentUser.id,
      creatorUserName: currentUser.name,
      createdAt: '2026-09-10T16:20:00Z',
      updatedAt: '2026-09-19T11:00:00Z'
    }
  ]);

  // Export Jobs State
  const [exportJobs, setExportJobs] = useState<ReportExportJob[]>([
    {
      id: 'exp_20260919_001',
      reportTitle: 'Faturamento Bruto e Ingressos por Canal',
      format: 'XLSX',
      status: 'COMPLETED',
      userId: currentUser.id,
      userName: currentUser.name,
      recordCount: 4520,
      fileSizeBytes: 245760,
      downloadUrl: '#',
      expiresAt: '2026-09-26T18:00:00Z',
      watermark: `Disk Interno | ${currentUser.name} | 19/09/2026`,
      createdAt: '2026-09-19T14:20:00Z'
    },
    {
      id: 'exp_20260919_002',
      reportTitle: 'Relatório Executivo Mensal',
      format: 'PDF',
      status: 'COMPLETED',
      userId: currentUser.id,
      userName: currentUser.name,
      recordCount: 125,
      fileSizeBytes: 1048576,
      downloadUrl: '#',
      expiresAt: '2026-09-26T18:00:00Z',
      watermark: `Disk Interno | ${currentUser.name} | 19/09/2026`,
      createdAt: '2026-09-19T15:10:00Z'
    }
  ]);

  // Schedules State
  const [schedules, setSchedules] = useState<ReportSchedule[]>([
    {
      id: 'sch-01',
      reportId: 'rep-01',
      reportTitle: 'Faturamento Bruto e Ingressos por Canal',
      frequency: 'WEEKLY',
      dayOfWeek: 1,
      timeOfDay: '08:00',
      format: 'XLSX',
      recipients: [
        { type: 'EMAIL', target: 'diretoria@diskingressos.com.br' },
        { type: 'USER', target: currentUser.id }
      ],
      active: true,
      creatorUserId: currentUser.id,
      nextRunAt: '2026-09-21T08:00:00Z',
      lastRunAt: '2026-09-14T08:00:00Z',
      lastRunStatus: 'SUCCESS',
      createdAt: '2026-09-01T00:00:00Z'
    }
  ]);

  // Goals State
  const [goals, setGoals] = useState<AnalyticsGoal[]>([
    {
      id: 'goal-01',
      metricCode: 'sales.gross_amount',
      name: 'Meta de Faturamento Setembro 2026',
      targetValue: 3500000,
      currentValue: 2845000,
      progressPercent: 81.3,
      projectionValue: 3750000,
      unit: 'BRL',
      period: '2026-09',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-19T12:00:00Z'
    },
    {
      id: 'goal-02',
      metricCode: 'tickets.sold',
      name: 'Meta de Ingressos do Festival Primavera',
      targetValue: 30000,
      currentValue: 28940,
      progressPercent: 96.5,
      projectionValue: 31200,
      unit: 'UNIDADES',
      period: '2026-09',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-19T12:00:00Z'
    }
  ]);

  // Snapshots State
  const [snapshots, setSnapshots] = useState<ReportSnapshot[]>([
    {
      id: 'snp-agosto-2026',
      reportId: 'rep-02',
      title: 'Snapshot Fechamento Contábil Agosto 2026',
      snapshotDate: '2026-08-31T23:59:59Z',
      frozenData: {},
      creatorUserId: 'usr-fin-roberto',
      creatorUserName: 'Roberto Finanças',
      notes: 'Fechamento auditado e conciliado com as adquirentes Stone e Cielo.',
      createdAt: '2026-09-01T10:00:00Z'
    }
  ]);

  // Domain Dashboard State
  const [selectedDomain, setSelectedDomain] = useState<MetricDomain>('COMERCIAL');
  const [domainResult, setDomainResult] = useState<AnalyticsResult | null>({
    metrics: [
      { code: 'sales.gross_amount', name: 'Vendas Brutas', format: 'CURRENCY', total: 2845000, formattedTotal: 'R$ 2.845.000,00' },
      { code: 'sales.net_amount', name: 'Vendas Líquidas', format: 'CURRENCY', total: 2588950, formattedTotal: 'R$ 2.588.950,00' },
      { code: 'tickets.sold', name: 'Ingressos Vendidos', format: 'NUMBER', total: 28940, formattedTotal: '28.940' },
      { code: 'sales.average_ticket', name: 'Ticket Médio', format: 'CURRENCY', total: 172.5, formattedTotal: 'R$ 172,50' }
    ],
    dimensions: ['channel'],
    rows: [
      { channel: 'WEB_DESKTOP', channelLabel: 'Site Disk Ingressos', 'sales.gross_amount': 1450950, 'sales.gross_amount_formatted': 'R$ 1.450.950,00', 'tickets.sold': 14750, 'tickets.sold_formatted': '14.750' },
      { channel: 'APP_MOBILE', channelLabel: 'Aplicativo Mobile', 'sales.gross_amount': 768150, 'sales.gross_amount_formatted': 'R$ 768.150,00', 'tickets.sold': 7810, 'tickets.sold_formatted': '7.810' },
      { channel: 'PDV_BILHETERIA', channelLabel: 'PDV & Bilheterias', 'sales.gross_amount': 398300, 'sales.gross_amount_formatted': 'R$ 398.300,00', 'tickets.sold': 4050, 'tickets.sold_formatted': '4.050' }
    ],
    summary: {},
    freshness: { status: 'REAL_TIME', updatedAt: new Date().toISOString() },
    cached: false,
    executionTimeMs: 18
  });

  // Modal State
  const [selectedExplainMetric, setSelectedExplainMetric] = useState<MetricDefinition | null>(null);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState<boolean>(false);

  const [activeViewerReport, setActiveViewerReport] = useState<SavedReport | null>(null);
  const [viewerResult, setViewerResult] = useState<AnalyticsResult | null>(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState<boolean>(false);

  const [activeShareReport, setActiveShareReport] = useState<SavedReport | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const [activeSnapshotReport, setActiveSnapshotReport] = useState<SavedReport | null>(null);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState<boolean>(false);

  const [isCreateGoalModalOpen, setIsCreateGoalModalOpen] = useState<boolean>(false);

  // Handlers
  const handleExplainMetric = (code: string) => {
    const found = metricsCatalog.find((m) => m.code === code);
    if (found) {
      setSelectedExplainMetric(found);
      setIsExplainModalOpen(true);
    }
  };

  const handleExecuteReport = (report: SavedReport) => {
    setActiveViewerReport(report);
    // Simulate query result with Brazilian formatting
    const mockRes: AnalyticsResult = {
      metrics: report.queryDefinition.metrics.map((mCode) => {
        const def = metricsCatalog.find((m) => m.code === mCode);
        return {
          code: mCode,
          name: def?.name || mCode,
          format: def?.format || 'CURRENCY',
          total: mCode === 'tickets.sold' ? 28940 : 2845000,
          formattedTotal: mCode === 'tickets.sold' ? '28.940' : 'R$ 2.845.000,00'
        };
      }),
      dimensions: report.queryDefinition.dimensions,
      rows: channelMix.map((c) => ({
        channel: c.channel,
        channelLabel: c.channelName,
        'sales.gross_amount': c.grossAmount,
        'sales.gross_amount_formatted': c.grossAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        'tickets.sold': c.ticketsSold,
        'tickets.sold_formatted': c.ticketsSold.toLocaleString('pt-BR'),
        'sales.average_ticket': 172.5,
        'sales.average_ticket_formatted': 'R$ 172,50'
      })),
      summary: {},
      freshness: { status: 'REAL_TIME', updatedAt: new Date().toISOString() },
      cached: true,
      executionTimeMs: 14
    };

    setViewerResult(mockRes);
    setIsViewerModalOpen(true);
  };

  const handleQuickExport = (format: 'CSV' | 'XLSX' | 'PDF') => {
    const exportId = `exp_${Date.now()}`;
    const newJob: ReportExportJob = {
      id: exportId,
      reportTitle: 'Resumo Geral Executivo',
      format,
      status: 'COMPLETED',
      userId: currentUser.id,
      userName: currentUser.name,
      recordCount: 5,
      fileSizeBytes: format === 'PDF' ? 512000 : 32000,
      downloadUrl: '#',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      watermark: `Gerado por Disk Interno | Operador: ${currentUser.name} | ${new Date().toLocaleString('pt-BR')}`,
      createdAt: new Date().toISOString()
    };

    setExportJobs([newJob, ...exportJobs]);
    showToast(`Arquivo ${format} gerado com sucesso! Disponível na Central de Exportações.`);
  };

  const handleDownloadExport = (jobId: string) => {
    const job = exportJobs.find((j) => j.id === jobId);
    if (!job) return;

    // Trigger browser mock download
    const blob = new Blob(
      [`ID;Relatório;GeradoEm;Operador\n${job.id};${job.reportTitle};${job.createdAt};${job.userName}`],
      { type: 'text/csv;charset=utf-8;' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${job.reportTitle.toLowerCase().replace(/\s+/g, '_')}.${job.format.toLowerCase()}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Download de "${job.reportTitle}.${job.format.toLowerCase()}" iniciado.`);
  };

  const handleSaveReport = async (data: any) => {
    const newRep: SavedReport = {
      id: `rep_${Date.now()}`,
      title: data.title,
      description: data.description,
      domain: data.domain,
      queryDefinition: data.queryDefinition,
      chartType: data.chartType,
      visibility: data.visibility,
      creatorUserId: currentUser.id,
      creatorUserName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSavedReports([newRep, ...savedReports]);
    showToast(`Relatório "${data.title}" salvo com sucesso!`);
    setActiveTab('reports');
  };

  const handleSaveShare = async (
    reportId: string,
    visibility: any,
    sharedWithUserIds: string[],
    sharedWithRoleCodes: string[]
  ) => {
    setSavedReports(
      savedReports.map((r) =>
        r.id === reportId
          ? { ...r, visibility, sharedWithUserIds, sharedWithRoleCodes, updatedAt: new Date().toISOString() }
          : r
      )
    );
    showToast('Preferências de compartilhamento atualizadas.');
  };

  const handleConfirmSnapshot = async (reportId: string, snapTitle: string, notes?: string) => {
    const newSnap: ReportSnapshot = {
      id: `snp_${Date.now()}`,
      reportId,
      title: snapTitle,
      snapshotDate: new Date().toISOString(),
      frozenData: {},
      creatorUserId: currentUser.id,
      creatorUserName: currentUser.name,
      notes: notes || null,
      createdAt: new Date().toISOString()
    };

    setSnapshots([newSnap, ...snapshots]);
    showToast(`Snapshot "${snapTitle}" congelado com sucesso!`);
  };

  const handleSaveGoal = async (data: any) => {
    const target = data.targetValue || 1;
    const current = data.currentValue || 0;
    const progressPercent = Math.round((current / target) * 10000) / 100;

    const newGoal: AnalyticsGoal = {
      id: `goal_${Date.now()}`,
      metricCode: data.metricCode,
      name: data.name,
      targetValue: data.targetValue,
      currentValue: current,
      progressPercent,
      projectionValue: data.projectionValue,
      unit: data.unit || 'BRL',
      period: data.period,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setGoals([newGoal, ...goals]);
    showToast(`Meta "${data.name}" cadastrada com sucesso!`);
  };

  const handleDeleteGoal = async (id: string) => {
    setGoals(goals.filter((g) => g.id !== id));
    showToast('Meta operacional removida.');
  };

  const handleDuplicateReport = (report: SavedReport) => {
    const copy: SavedReport = {
      ...report,
      id: `rep_${Date.now()}`,
      title: `Cópia de ${report.title}`,
      visibility: 'PRIVATE',
      creatorUserId: currentUser.id,
      creatorUserName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSavedReports([copy, ...savedReports]);
    showToast(`Relatório duplicado: "${copy.title}"`);
  };

  const handleDeleteReport = (report: SavedReport) => {
    setSavedReports(savedReports.filter((r) => r.id !== report.id));
    showToast(`Relatório "${report.title}" excluído.`);
  };

  const handleRunScheduleNow = async (scheduleId: string) => {
    const sch = schedules.find((s) => s.id === scheduleId);
    if (!sch) return;

    // Simulate export job generation
    handleQuickExport(sch.format);
    setSchedules(
      schedules.map((s) =>
        s.id === scheduleId
          ? { ...s, lastRunAt: new Date().toISOString(), lastRunStatus: 'SUCCESS' }
          : s
      )
    );
    showToast(`Agendamento "${sch.reportTitle}" executado com sucesso.`);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    setSchedules(schedules.filter((s) => s.id !== scheduleId));
    showToast('Agendamento removido.');
  };

  return (
    <div className="min-h-full space-y-6 p-6 lg:p-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-slate-900 px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Context */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-orange-500/10 px-2.5 py-0.5 text-xs font-bold text-orange-400">
              FASE 1.1.5.13
            </span>
            <span className="text-xs text-slate-500">&bull;</span>
            <span className="text-xs font-medium text-slate-400">Camada Analítica & BI Operacional</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Central de Relatórios, Exportações & BI
          </h1>
          <p className="text-xs text-slate-400">
            Métricas unificadas, governança de indicadores, exportações auditadas e fechamentos históricos
          </p>
        </div>

        {/* Current Scope Badge */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs">
          <Building className="h-4 w-4 text-orange-400" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Escopo Atual</div>
            <div className="font-semibold text-white">
              {isGlobalScope ? 'Global (Disk Ingressos)' : activeProducer?.name || 'Produtor Específico'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'overview', label: 'Visão Geral Executiva', icon: <BarChart3 className="h-4 w-4" /> },
          { id: 'builder', label: 'Criar Relatório', icon: <Sparkles className="h-4 w-4 text-orange-400" /> },
          { id: 'reports', label: 'Relatórios Salvos', icon: <FileText className="h-4 w-4" />, count: savedReports.length },
          { id: 'exports', label: 'Central de Exportações', icon: <Download className="h-4 w-4" />, count: exportJobs.length },
          { id: 'schedules', label: 'Agendamentos', icon: <Calendar className="h-4 w-4" />, count: schedules.length },
          { id: 'dictionary', label: 'Dicionário de Indicadores', icon: <BookOpen className="h-4 w-4" />, count: metricsCatalog.length },
          { id: 'goals', label: 'Metas (Realizado x Meta)', icon: <Target className="h-4 w-4" />, count: goals.length },
          { id: 'snapshots', label: 'Fechamentos & Snapshots', icon: <Camera className="h-4 w-4" />, count: snapshots.length },
          { id: 'domains', label: 'BI por Domínio', icon: <Layers className="h-4 w-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as AnalyticsTab);
              if (onNavigate) {
                onNavigate('analytics', `analytics-${tab.id}`);
              }
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Tab Views */}
      {activeTab === 'overview' && (
        <OverviewDashboardTab
          period={period}
          onPeriodChange={setPeriod}
          summary={executiveSummary}
          channelMix={channelMix}
          isLoading={isLoading}
          onRefresh={() => showToast('Dados executivos atualizados em tempo real.')}
          onExplainMetric={handleExplainMetric}
          onQuickExport={handleQuickExport}
          onNavigateToBuilder={() => setActiveTab('builder')}
        />
      )}

      {activeTab === 'builder' && (
        <ReportBuilderTab
          availableMetrics={metricsCatalog}
          availableDimensions={availableDimensions}
          onSaveReport={handleSaveReport}
          onPreviewQuery={(query) => {
            const previewReport: SavedReport = {
              id: 'preview',
              title: 'Pré-visualização do Relatório',
              domain: 'COMERCIAL',
              queryDefinition: query,
              chartType: 'TABLE',
              visibility: 'PRIVATE',
              creatorUserId: currentUser.id,
              creatorUserName: currentUser.name,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            handleExecuteReport(previewReport);
          }}
          onExplainMetric={handleExplainMetric}
        />
      )}

      {activeTab === 'reports' && (
        <SavedReportsTab
          reports={savedReports}
          currentUserId={currentUser.id}
          onExecuteReport={handleExecuteReport}
          onShareReport={(report) => {
            setActiveShareReport(report);
            setIsShareModalOpen(true);
          }}
          onDuplicateReport={handleDuplicateReport}
          onSnapshotReport={(report) => {
            setActiveSnapshotReport(report);
            setIsSnapshotModalOpen(true);
          }}
          onDeleteReport={handleDeleteReport}
          onNavigateToBuilder={() => setActiveTab('builder')}
        />
      )}

      {activeTab === 'exports' && (
        <ExportsCenterTab
          exports={exportJobs}
          isLoading={isLoading}
          onRefresh={() => showToast('Lista de exportações atualizada.')}
          onDownload={handleDownloadExport}
        />
      )}

      {activeTab === 'schedules' && (
        <SchedulesTab
          schedules={schedules}
          onRunNow={handleRunScheduleNow}
          onDeleteSchedule={handleDeleteSchedule}
          onNavigateToBuilder={() => setActiveTab('builder')}
        />
      )}

      {activeTab === 'dictionary' && (
        <MetricsCatalogTab
          metrics={metricsCatalog}
          onExplainMetric={handleExplainMetric}
        />
      )}

      {activeTab === 'goals' && (
        <GoalsTab
          goals={goals}
          onOpenCreateGoal={() => setIsCreateGoalModalOpen(true)}
          onUpdateGoalProgress={async (id, current, proj) => {
            setGoals(
              goals.map((g) =>
                g.id === id
                  ? {
                      ...g,
                      currentValue: current,
                      projectionValue: proj,
                      progressPercent: Math.round((current / g.targetValue) * 10000) / 100
                    }
                  : g
              )
            );
            showToast('Progresso da meta atualizado.');
          }}
          onDeleteGoal={handleDeleteGoal}
        />
      )}

      {activeTab === 'snapshots' && (
        <SnapshotsTab
          snapshots={snapshots}
          onViewSnapshot={(snap) => {
            showToast(`Snapshot "${snap.title}" carregado para inspeção.`);
          }}
          onExportSnapshot={(snap) => {
            handleQuickExport('PDF');
          }}
        />
      )}

      {activeTab === 'domains' && (
        <DomainDashboardsTab
          currentDomain={selectedDomain}
          onSelectDomain={setSelectedDomain}
          widgets={[]}
          result={domainResult}
          isLoading={isLoading}
          onRefresh={() => showToast(`Indicadores do setor ${selectedDomain} atualizados.`)}
          onExplainMetric={handleExplainMetric}
        />
      )}

      {/* Global Modals */}
      <MetricExplainModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        metric={selectedExplainMetric}
      />

      <ReportViewerModal
        isOpen={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
        report={activeViewerReport}
        result={viewerResult}
        isLoading={isLoading}
        onRefresh={() => {
          if (activeViewerReport) handleExecuteReport(activeViewerReport);
        }}
        onExport={(format) => handleQuickExport(format)}
        onCreateSnapshot={() => {
          if (activeViewerReport) {
            setActiveSnapshotReport(activeViewerReport);
            setIsSnapshotModalOpen(true);
          }
        }}
      />

      <ShareReportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        report={activeShareReport}
        onSaveShare={handleSaveShare}
      />

      <SnapshotModal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        report={activeSnapshotReport}
        onConfirmSnapshot={handleConfirmSnapshot}
      />

      <CreateGoalModal
        isOpen={isCreateGoalModalOpen}
        onClose={() => setIsCreateGoalModalOpen(false)}
        onSaveGoal={handleSaveGoal}
      />
    </div>
  );
};
