import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Clock,
  Layers,
  Calendar,
  Ticket,
  DollarSign,
  Download,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Zap
} from 'lucide-react';
import { CommercialPerformanceDTO } from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { StatCard } from '../../../shared/components/StatCard';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { formatCurrency } from '../../../shared/utils/formatters';
import { useCoreData } from '../../../core/context/CoreDataContext';

interface CommercialSalesPageProps {
  onNavigateToEventsModule?: (subItem?: string) => void;
  onNavigateToOrders?: () => void;
}

type DrilldownTab = 'events' | 'sessions' | 'sections' | 'ticketTypes' | 'batches' | 'channels';

export const CommercialSalesPage: React.FC<CommercialSalesPageProps> = ({
  onNavigateToEventsModule,
  onNavigateToOrders
}) => {
  const { events, producers } = useCoreData();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CommercialPerformanceDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedProducerId, setSelectedProducerId] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<DrilldownTab>('events');

  const loadPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await CommercialApi.getPerformance({
        producerId: selectedProducerId || undefined,
        eventId: selectedEventId || undefined
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados de performance comercial.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformance();
  }, [selectedProducerId, selectedEventId]);

  const handleExportCsv = () => {
    const exportUrl = CommercialApi.getExportSalesUrl({
      producerId: selectedProducerId || undefined,
      eventId: selectedEventId || undefined
    });
    window.open(exportUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              CENTRAL DE VENDAS & PERFORMANCE
            </h1>
            <Badge variant="orange" size="sm">
              Fase 1.3.2 Comercial
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Velocidade de vendas em tempo real, ritmo de absorção de ingressos e drilldown multi-nível
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {producers.length > 1 && (
            <select
              value={selectedProducerId}
              onChange={(e) => {
                setSelectedProducerId(e.target.value);
                setSelectedEventId('');
              }}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Todos os Produtores</option>
              {producers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-orange-500 focus:outline-none"
          >
            <option value="">Todos os Eventos</option>
            {events
              .filter((ev) => !selectedProducerId || ev.producerId === selectedProducerId)
              .map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name || ev.title}
                </option>
              ))}
          </select>

          <Button
            size="sm"
            variant="secondary"
            onClick={loadPerformance}
            icon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCsv}
            icon={<Download className="h-3.5 w-3.5" />}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Sales Velocity Banner */}
      <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-slate-900/80 to-slate-900/80 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Velocidade de Comercialização em Tempo Real
            </h2>
          </div>
          <Badge variant="orange" size="sm">
            Live Stream
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-0.5">
            <div className="text-[11px] text-slate-400">Na Última Hora</div>
            <div className="text-xl font-bold font-mono text-orange-400">
              {loading ? '—' : data?.velocity.salesPerHour || 0}
              <span className="text-xs text-slate-400 font-normal ml-1">ing./h</span>
            </div>
            <div className="text-[10px] text-slate-500">Taxa horária atual</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-0.5">
            <div className="text-[11px] text-slate-400">Vendas Hoje</div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {loading ? '—' : data?.velocity.todayCount || 0}
              <span className="text-xs text-slate-400 font-normal ml-1">ingressos</span>
            </div>
            <div className="text-[10px] text-slate-500">Desde as 00:00</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-0.5">
            <div className="text-[11px] text-slate-400">Últimas 24 Horas</div>
            <div className="text-xl font-bold font-mono text-cyan-400">
              {loading ? '—' : data?.velocity.last24hCount || 0}
              <span className="text-xs text-slate-400 font-normal ml-1">ingressos</span>
            </div>
            <div className="text-[10px] text-slate-500">Janela contínua 24h</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-0.5">
            <div className="text-[11px] text-slate-400">Média Diária (7d)</div>
            <div className="text-xl font-bold font-mono text-purple-400">
              {loading ? '—' : data?.velocity.last7dDailyAverage || 0}
              <span className="text-xs text-slate-400 font-normal ml-1">ing./dia</span>
            </div>
            <div className="text-[10px] text-slate-500">Consistência semanal</div>
          </div>
        </div>
      </div>

      {/* Commercial Operational Alerts */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/60 p-4 shadow-lg space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4" />
            <span>Alertas Operacionais Comerciais ({data.alerts.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.alerts.map((alt) => (
              <div
                key={alt.id}
                className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2.5 text-xs"
              >
                <Badge
                  variant={
                    alt.severity === 'CRITICAL'
                      ? 'rose'
                      : alt.severity === 'HIGH'
                      ? 'orange'
                      : alt.severity === 'WARNING'
                      ? 'amber'
                      : 'slate'
                  }
                  size="sm"
                >
                  {alt.severity}
                </Badge>
                <div>
                  <div className="font-bold text-white">{alt.title}</div>
                  <div className="text-slate-300 text-[11px] mt-0.5">{alt.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Level Drilldown Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg overflow-hidden space-y-4 p-5">
        {/* Drilldown Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          {[
            { id: 'events', label: '1. Por Evento', count: data?.events.length },
            { id: 'sessions', label: '2. Por Sessão', count: data?.sessions.length },
            { id: 'sections', label: '3. Por Setor', count: data?.sections.length },
            { id: 'ticketTypes', label: '4. Por Tipo de Ingresso', count: data?.ticketTypes.length },
            { id: 'batches', label: '5. Por Lote', count: data?.batches.length },
            { id: 'channels', label: '6. Por Canal de Venda', count: data?.channels.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DrilldownTab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white font-bold shadow'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {tab.label} {tab.count !== undefined && <span className="opacity-70 font-mono ml-1">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* Tab 1: By Event */}
        {activeTab === 'events' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <tr>
                  <th className="py-2.5 px-3">Evento</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Pedidos</th>
                  <th className="py-2.5 px-3 text-center">Ingressos Vendidos</th>
                  <th className="py-2.5 px-3 text-center">Capacidade</th>
                  <th className="py-2.5 px-3 text-center">Ocupação (%)</th>
                  <th className="py-2.5 px-3 text-right">Volume Bruto</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.events.map((e) => (
                  <tr key={e.eventId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">
                      {e.eventName}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="emerald" size="sm">
                        {e.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-200">
                      {e.ordersCount}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-orange-400">
                      {e.ticketsSold.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      {e.capacity > 0 ? e.capacity.toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1 font-mono font-bold text-slate-200">
                        <span>{e.occupancyPercentage}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {e.grossSales !== null ? formatCurrency(e.grossSales) : 'Sigiloso'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {onNavigateToEventsModule && (
                        <button
                          onClick={() => onNavigateToEventsModule('events-all')}
                          className="inline-flex items-center gap-1 text-[11px] text-orange-400 hover:underline"
                        >
                          Ir ao Evento <ArrowUpRight className="h-3 w-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: By Session */}
        {activeTab === 'sessions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <tr>
                  <th className="py-2.5 px-3">Sessão</th>
                  <th className="py-2.5 px-3">Data da Apresentação</th>
                  <th className="py-2.5 px-3 text-center">Pedidos</th>
                  <th className="py-2.5 px-3 text-center">Ingressos Vendidos</th>
                  <th className="py-2.5 px-3 text-center">Capacidade</th>
                  <th className="py-2.5 px-3 text-center">Ocupação (%)</th>
                  <th className="py-2.5 px-3 text-right">Volume Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.sessions.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">{s.sessionName}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {new Date(s.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-200">{s.ordersCount}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-orange-400">{s.ticketsSold}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{s.capacity || '—'}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">{s.occupancyPercentage}%</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {s.grossSales !== null ? formatCurrency(s.grossSales) : 'Sigiloso'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: By Section */}
        {activeTab === 'sections' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <tr>
                  <th className="py-2.5 px-3">Setor Operacional</th>
                  <th className="py-2.5 px-3 text-center">Capacidade</th>
                  <th className="py-2.5 px-3 text-center">Vendidos</th>
                  <th className="py-2.5 px-3 text-center">Disponíveis</th>
                  <th className="py-2.5 px-3 text-center">Reservados</th>
                  <th className="py-2.5 px-3 text-center">Ocupação (%)</th>
                  <th className="py-2.5 px-3 text-right">Volume Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.sections.map((sec) => (
                  <tr key={sec.sectionId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">{sec.sectionName}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">{sec.capacity}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-orange-400">{sec.sold}</td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-400">{sec.available}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">{sec.reserved}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">{sec.occupancyPercentage}%</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {sec.grossSales !== null ? formatCurrency(sec.grossSales) : 'Sigiloso'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: By Ticket Type */}
        {activeTab === 'ticketTypes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <tr>
                  <th className="py-2.5 px-3">Tipo / Categoria de Ingresso</th>
                  <th className="py-2.5 px-3 text-center">Ingressos Vendidos</th>
                  <th className="py-2.5 px-3 text-right">Volume Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.ticketTypes.map((tt) => (
                  <tr key={tt.ticketTypeId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">{tt.ticketTypeName}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-orange-400">{tt.sold}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {tt.grossSales !== null ? formatCurrency(tt.grossSales) : 'Sigiloso'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 5: By Batch */}
        {activeTab === 'batches' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <tr>
                  <th className="py-2.5 px-3">Lote de Venda</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Vendidos</th>
                  <th className="py-2.5 px-3 text-center">Capacidade</th>
                  <th className="py-2.5 px-3 text-right">Volume Bruto</th>
                  <th className="py-2.5 px-3 text-right">Gestão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.batches.map((b) => (
                  <tr key={b.batchId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">{b.batchName}</td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={b.status === 'ACTIVE' ? 'emerald' : b.status === 'SOLD_OUT' ? 'slate' : 'amber'}
                        size="sm"
                      >
                        {b.status === 'ACTIVE' ? 'Ativo' : b.status === 'SOLD_OUT' ? 'Esgotado' : b.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-orange-400">{b.sold}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{b.capacity}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {b.grossSales !== null ? formatCurrency(b.grossSales) : 'Sigiloso'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {onNavigateToEventsModule && (
                        <button
                          onClick={() => onNavigateToEventsModule('events-batches')}
                          className="inline-flex items-center gap-1 text-[11px] text-orange-400 hover:underline"
                        >
                          Ver no Módulo Eventos <ArrowUpRight className="h-3 w-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 6: By Channel */}
        {activeTab === 'channels' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <tr>
                  <th className="py-2.5 px-3">Canal de Venda</th>
                  <th className="py-2.5 px-3 text-center">Pedidos Concluídos</th>
                  <th className="py-2.5 px-3 text-center">Ingressos Vendidos</th>
                  <th className="py-2.5 px-3 text-right">Volume Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data?.channels.map((ch) => (
                  <tr key={ch.channelId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">{ch.channelName}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-200">{ch.ordersCount}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-orange-400">{ch.ticketsSold}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {ch.grossSales !== null ? formatCurrency(ch.grossSales) : 'Sigiloso'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Operational Shortcuts Footer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          <strong>Atalhos Rápidos de Operação:</strong> Configure lotes, sessões e regras no módulo de Eventos sem duplicar governança.
        </div>
        <div className="flex items-center gap-2">
          {onNavigateToEventsModule && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onNavigateToEventsModule('events-batches')}
              >
                Matriz de Lotes
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onNavigateToEventsModule('events-capacity')}
              >
                Inventário & Capacidade
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
