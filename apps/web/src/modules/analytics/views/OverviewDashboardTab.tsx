import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Ticket,
  ShoppingCart,
  RotateCcw,
  Wallet,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  HelpCircle,
  BarChart3,
  Layers
} from 'lucide-react';
import { AnalyticsPeriod, PeriodType, ComparisonType } from '@shared/types/index';
import { MetricCard } from '../components/MetricCard';
import { Button } from '../../../shared/components/Button';
import { ExecutiveSummaryStats, ChannelMixItem } from '../analytics.types';

interface OverviewDashboardTabProps {
  period: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  summary: ExecutiveSummaryStats;
  channelMix: ChannelMixItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onExplainMetric: (metricCode: string) => void;
  onQuickExport: (format: 'CSV' | 'XLSX' | 'PDF') => void;
  onNavigateToBuilder: () => void;
}

export const OverviewDashboardTab: React.FC<OverviewDashboardTabProps> = ({
  period,
  onPeriodChange,
  summary,
  channelMix,
  isLoading,
  onRefresh,
  onExplainMetric,
  onQuickExport,
  onNavigateToBuilder
}) => {
  return (
    <div className="space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="h-4 w-4 text-orange-400" />
            <span className="font-semibold uppercase tracking-wider">Período:</span>
          </div>

          <select
            value={period.type}
            onChange={(e) =>
              onPeriodChange({
                ...period,
                type: e.target.value as PeriodType
              })
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-orange-500"
          >
            <option value="TODAY">Hoje</option>
            <option value="YESTERDAY">Ontem</option>
            <option value="LAST_7_DAYS">Últimos 7 dias</option>
            <option value="LAST_30_DAYS">Últimos 30 dias</option>
            <option value="THIS_MONTH">Este Mês (Setembro 2026)</option>
            <option value="LAST_MONTH">Mês Anterior (Agosto 2026)</option>
            <option value="THIS_YEAR">Este Ano (2026)</option>
          </select>

          <div className="flex items-center gap-1.5 pl-2 text-xs text-slate-400 border-l border-slate-800">
            <span className="font-semibold uppercase tracking-wider">Comparar:</span>
          </div>

          <select
            value={period.comparison || 'NONE'}
            onChange={(e) =>
              onPeriodChange({
                ...period,
                comparison: e.target.value === 'NONE' ? undefined : (e.target.value as ComparisonType)
              })
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-orange-500"
          >
            <option value="NONE">Sem comparação</option>
            <option value="PREVIOUS_PERIOD">Período Anterior (MoM)</option>
            <option value="PREVIOUS_YEAR">Mesmo Período do Ano Anterior (YoY)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Actions */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-0.5">
            <button
              onClick={() => onQuickExport('CSV')}
              className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              title="Exportar dados consolidados em CSV"
            >
              <Download className="h-3.5 w-3.5 text-blue-400" />
              CSV
            </button>
            <button
              onClick={() => onQuickExport('XLSX')}
              className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              title="Exportar planilha formatada em Excel"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              Excel
            </button>
            <button
              onClick={() => onQuickExport('PDF')}
              className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              title="Exportar relatório gerencial em PDF"
            >
              <FileText className="h-3.5 w-3.5 text-rose-400" />
              PDF
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateToBuilder}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Criar Relatório
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Faturamento Bruto (GMV)"
          code="sales.gross_amount"
          value={summary.grossSalesFormatted}
          changePercent={summary.grossSalesChangeMoM}
          comparisonLabel="vs. mês anterior"
          domain="COMERCIAL"
          icon={<DollarSign className="h-5 w-5" />}
          onExplainClick={onExplainMetric}
        />

        <MetricCard
          title="Faturamento Líquido"
          code="sales.net_amount"
          value={summary.netSalesFormatted}
          domain="COMERCIAL"
          subtitle="Após taxas e estornos"
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          onExplainClick={onExplainMetric}
        />

        <MetricCard
          title="Ingressos Emitidos / Vendidos"
          code="tickets.sold"
          value={summary.ticketsSold.toLocaleString('pt-BR')}
          changePercent={summary.ticketsSoldChangeMoM}
          comparisonLabel="vs. mês anterior"
          domain="EVENTOS"
          icon={<Ticket className="h-5 w-5 text-blue-400" />}
          onExplainClick={onExplainMetric}
        />

        <MetricCard
          title="Ticket Médio"
          code="sales.average_ticket"
          value={summary.averageTicketFormatted}
          domain="COMERCIAL"
          subtitle={`${summary.paidOrders.toLocaleString('pt-BR')} pedidos concluídos`}
          icon={<ShoppingCart className="h-5 w-5 text-purple-400" />}
          onExplainClick={onExplainMetric}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Índice de Estornos"
          code="refunds.rate"
          value={`${summary.refundRate.toFixed(2)}%`}
          domain="ESTORNO"
          subtitle={`Total: ${summary.refundAmountFormatted}`}
          icon={<RotateCcw className="h-5 w-5 text-rose-400" />}
          onExplainClick={onExplainMetric}
        />

        <MetricCard
          title="Saldo Líquido Disponível"
          code="finance.available_balance"
          value={summary.availableBalanceFormatted}
          domain="FINANCEIRO"
          subtitle="Disponível para repasses e liquidações"
          icon={<Wallet className="h-5 w-5 text-amber-400" />}
          onExplainClick={onExplainMetric}
        />

        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Governança & Linhagem
              </span>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                PADRÃO PDT
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Todas as métricas seguem regras oficiais versionadas e blindadas contra divergências entre Comercial e Financeiro.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs">
            <span className="text-slate-400">Status do Motor:</span>
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Operacional (Tempo Real)
            </span>
          </div>
        </div>
      </div>

      {/* Channel Mix Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Mix de Faturamento por Canal de Venda</h3>
              <p className="text-xs text-slate-400">Distribuição percentual e volume financeiro por canal</p>
            </div>
            <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300">
              5 canais ativos
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {channelMix.map((item) => (
              <div key={item.channel} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-slate-200">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.channelName}</span>
                    <span className="text-slate-500">
                      ({item.ticketsSold.toLocaleString('pt-BR')} ingressos)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-white">
                      {item.grossAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <span className="w-12 text-right font-mono font-bold text-orange-400">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Insights / BI Tips */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-white">
              <Layers className="h-5 w-5 text-orange-400" />
              Diretrizes do BI Operacional
            </h3>
            <ul className="mt-4 space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-400"></span>
                <span>
                  <strong>Anti-SQL Injection:</strong> O construtor analítico aceita apenas consultas declarativas via JSON estruturado.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-400"></span>
                <span>
                  <strong>Compartilhamento Seguro:</strong> Compartilhar relatórios com terceiros <u>nunca</u> eleva a permissão do destinatário.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-400"></span>
                <span>
                  <strong>Exportação Auditada:</strong> Todo CSV, XLSX e PDF possui carimbo d'água com identificação do operador e ID da solicitação.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-400"></span>
                <span>
                  <strong>Snapshots Históricos:</strong> Fechamentos contábeis são fotos estáticas imutáveis preservadas para auditoria.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 border-t border-slate-800/80 pt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
              onClick={onNavigateToBuilder}
            >
              Construir Relatório Personalizado
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
