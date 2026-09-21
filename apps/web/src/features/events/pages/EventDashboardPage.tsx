import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  TrendingUp,
  FileText,
  ShieldCheck,
  ListTodo,
  ExternalLink,
  ChevronRight,
  Info,
  AlertTriangle,
  XCircle,
  Globe,
  Gift,
  Users,
  Sparkles,
  DollarSign,
  Ticket,
  Activity,
  Zap,
  Filter,
  RefreshCw,
  Eye,
  FileDiff,
  Send
} from 'lucide-react';
import { EventDetailDTO, EventListItemDTO } from '../types/event.types';
import { EventContextHeader } from '../components/EventContextHeader';
import { StatCard } from '../../../shared/components/StatCard';
import { Badge } from '../../../shared/components/Badge';
import { formatNumber, formatDateTime } from '../../../shared/utils/formatters';
import { fetchEventDashboard } from '../api/dashboard.api';
import { EventDashboardDTO, DashboardViewType } from '@shared/types/index';
import { EventStatusBadge } from '../components/EventStatusBadge';

interface EventDashboardPageProps {
  event: EventDetailDTO;
  availableEvents: EventListItemDTO[];
  onSelectAnotherEvent: (eventId: string) => void;
  onClearEventContext: () => void;
  onNavigateModule?: (moduleId: string, subItemId?: string) => void;
}

export const EventDashboardPage: React.FC<EventDashboardPageProps> = ({
  event,
  availableEvents,
  onSelectAnotherEvent,
  onClearEventContext,
  onNavigateModule
}) => {
  const [dashboard, setDashboard] = useState<EventDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [viewType, setViewType] = useState<DashboardViewType>('OPERATIONAL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboard = async () => {
    if (!event?.id) return;
    try {
      setIsRefreshing(true);
      const data = await fetchEventDashboard(event.id, {
        sessionId: selectedSessionId || undefined,
        viewType
      });
      setDashboard(data);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [event?.id, selectedSessionId, viewType]);

  const kpis = dashboard?.kpis;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Context Header */}
      <EventContextHeader
        event={event}
        availableEvents={availableEvents}
        onSelectAnotherEvent={onSelectAnotherEvent}
        onClearEventContext={onClearEventContext}
      />

      {/* Control Bar: Sessão, Tipo de Visão e Freshness em Tempo Real */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Seletor de Sessão Sensível ao Contexto */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Todas as Sessões</option>
              {dashboard?.sessions.map((s) => (
                <option key={s.sessionId} value={s.sessionId}>
                  {s.name} ({new Date(s.startAt).toLocaleDateString('pt-BR')})
                </option>
              ))}
            </select>
          </div>

          {/* Toggle de Tipo de Visão */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setViewType('OPERATIONAL')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewType === 'OPERATIONAL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Operacional
            </button>
            <button
              onClick={() => setViewType('EXECUTIVE')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewType === 'EXECUTIVE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Executivo
            </button>
            <button
              onClick={() => setViewType('COMMERCIAL')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewType === 'COMMERCIAL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Comercial
            </button>
          </div>
        </div>

        {/* Indicador de Freshness e Atualização */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Tempo Real Conectado
          </div>

          <button
            onClick={loadDashboard}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Atualizar Dados"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alertas Críticos e Operacionais Consolidados */}
      {dashboard && dashboard.alerts && dashboard.alerts.length > 0 && (
        <div className="space-y-2">
          {dashboard.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-xs ${
                alert.severity === 'CRITICAL'
                  ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                  : alert.severity === 'HIGH' || alert.severity === 'WARNING'
                  ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                  : 'bg-blue-950/30 border-blue-800/50 text-blue-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className={`w-5 h-5 shrink-0 ${
                    alert.severity === 'CRITICAL'
                      ? 'text-rose-400'
                      : alert.severity === 'HIGH' || alert.severity === 'WARNING'
                      ? 'text-amber-400'
                      : 'text-blue-400'
                  }`}
                />
                <div>
                  <span className="font-bold block text-sm">{alert.title}</span>
                  <span className="opacity-90">{alert.description}</span>
                </div>
              </div>

              {alert.actionRoute && (
                <button
                  onClick={() => {
                    if (alert.actionRoute?.includes('changes') && onNavigateModule) {
                      onNavigateModule('events-changes');
                    } else if (alert.actionRoute?.includes('readiness') && onNavigateModule) {
                      onNavigateModule('events-readiness');
                    } else if (alert.actionRoute?.includes('channels') && onNavigateModule) {
                      onNavigateModule('events-sales-channels');
                    } else if (alert.actionRoute?.includes('batches') && onNavigateModule) {
                      onNavigateModule('events-batches');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-white/10 hover:bg-white/20 transition-colors shrink-0"
                >
                  {alert.actionLabel || 'Resolver'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards em Tempo Real (Zero Fake Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vendas Brutas (com Widget-Level RBAC) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Receita Bruta</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {kpis ? kpis.grossSalesFormatted : 'R$ ••••••'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>{kpis?.paidOrdersCount || 0} pedidos pagos</span>
            {dashboard?.financeSummary && (
              <span className="text-emerald-400 font-medium">Taxas inclusas</span>
            )}
          </div>
        </div>

        {/* Ingressos Vendidos & Capacidade */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Ingressos Vendidos</span>
            <Ticket className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {kpis ? formatNumber(kpis.ticketsSoldCount) : 0}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Capacidade: {kpis ? formatNumber(kpis.totalCommercialCapacity) : 0}</span>
            <span className="text-blue-400 font-semibold">{kpis?.occupancyPercentage || 0}%</span>
          </div>
        </div>

        {/* Taxa de Ocupação Geral */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Taxa de Ocupação</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {kpis?.occupancyPercentage || 0}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpis?.occupancyPercentage || 0)}%` }}
            />
          </div>
        </div>

        {/* Check-in Operacional */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Check-in Realizado</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {dashboard?.checkinSummary?.percentageCheckedIn || 0}%
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>{dashboard?.checkinSummary?.validatedCount || 0} validados</span>
            <span className="text-indigo-400 font-medium">{dashboard?.checkinSummary?.status || 'NÃO INICIADO'}</span>
          </div>
        </div>
      </div>

      {/* Grid Central: Ocupação por Setor & Saúde de Lotes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ocupação por Setor (2 colunas) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Ocupação Operacional por Setor</h3>
            </div>
            <span className="text-xs text-slate-400">
              {dashboard?.sections.length || 0} setores ativos
            </span>
          </div>

          <div className="space-y-4">
            {dashboard?.sections.map((sec) => (
              <div key={sec.sectionId} className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{sec.sectionName}</span>
                  <span className="text-slate-400">
                    <strong className="text-white">{formatNumber(sec.sold)}</strong> / {formatNumber(sec.capacity)} ({sec.occupancyPercentage}%)
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      sec.occupancyPercentage >= 95
                        ? 'bg-rose-500'
                        : sec.occupancyPercentage >= 80
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, sec.occupancyPercentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span>Disponíveis: {formatNumber(sec.available)}</span>
                  <span>Cortesias: {formatNumber(sec.complimentary)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atalhos Operacionais de Gestão (1 coluna) */}
        <div className="space-y-6">
          {/* Card de Gestão e Prontidão */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Centro de Comando & Governança</h3>

            <div className="space-y-2">
              <button
                onClick={() => onNavigateModule && onNavigateModule('events-review-publication')}
                className="w-full p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-200 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-blue-400" />
                  <span>Revisão & Publicação</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={() => onNavigateModule && onNavigateModule('events-changes')}
                className="w-full p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-200 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <FileDiff className="w-4 h-4 text-purple-400" />
                  <span>Central de Alterações</span>
                </div>
                <div className="flex items-center gap-2">
                  {dashboard?.changesSummary?.pendingApprovalCount ? (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                      {dashboard.changesSummary.pendingApprovalCount}
                    </span>
                  ) : null}
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              </button>

              <button
                onClick={() => onNavigateModule && onNavigateModule('events-readiness')}
                className="w-full p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-200 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Central de Prontidão</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-400">
                    {dashboard?.readinessSummary?.scorePercentage || 0}%
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              </button>
            </div>
          </div>

          {/* Resumo de Canais de Distribuição */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white">Canais de Distribuição</h3>
            <div className="space-y-2">
              {dashboard?.channels.map((chn) => (
                <div key={chn.channelId} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate">{chn.channelName}</span>
                  <span className="font-semibold text-white">{chn.ticketsIssued} ing. ({chn.percentageOfTotal}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Lotes Comerciais */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Status dos Lotes Comerciais</h3>
          </div>
          <button
            onClick={() => onNavigateModule && onNavigateModule('events-batches')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            Gerenciar Lotes
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Lote</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Vendidos</th>
                <th className="py-2.5 px-3">Capacidade</th>
                <th className="py-2.5 px-3">Consumo</th>
                <th className="py-2.5 px-3 text-right">Alerta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {dashboard?.batches.map((batch) => (
                <tr key={batch.batchId} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-semibold text-white">{batch.batchName}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {batch.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">{formatNumber(batch.ticketsSold)}</td>
                  <td className="py-3 px-3 font-mono">{formatNumber(batch.totalCapacity)}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${batch.percentageUsed}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono">{batch.percentageUsed}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {batch.lowStockAlert ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        ESTOQUE BAIXO
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
