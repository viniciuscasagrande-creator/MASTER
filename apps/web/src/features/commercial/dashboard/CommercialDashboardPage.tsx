import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Ticket,
  DollarSign,
  Percent,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
  Clock,
  Layers,
  CheckCircle2,
  Calendar,
  Filter
} from 'lucide-react';
import { CommercialDashboardDTO, OrderDTO } from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { StatCard } from '../../../shared/components/StatCard';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { formatCurrency } from '../../../shared/utils/formatters';
import { useCoreData } from '../../../core/context/CoreDataContext';

interface CommercialDashboardPageProps {
  onNavigateToOrders: () => void;
  onNavigateToSales: () => void;
  onSelectOrder: (orderId: string) => void;
  onNavigateToRemarketing?: () => void;
}

export const CommercialDashboardPage: React.FC<CommercialDashboardPageProps> = ({
  onNavigateToOrders,
  onNavigateToSales,
  onSelectOrder,
  onNavigateToRemarketing
}) => {
  const { events, producers } = useCoreData();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CommercialDashboardDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedProducerId, setSelectedProducerId] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await CommercialApi.getDashboard({
        producerId: selectedProducerId || undefined,
        eventId: selectedEventId || undefined
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar indicadores comerciais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [selectedProducerId, selectedEventId]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              VISÃO GERAL COMERCIAL
            </h1>
            <Badge variant="orange" size="sm">
              Core Comercial Real
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Indicadores executivos consolidados, vendas confirmadas, ritmo de comercialização e canais
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
            onClick={loadDashboard}
            icon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={onNavigateToOrders}
            icon={<ShoppingBag className="h-3.5 w-3.5" />}
          >
            Central de Pedidos
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="PEDIDOS CONFIRMADOS"
          value={loading ? '—' : (data?.summary.ordersCount?.toLocaleString('pt-BR') || '0')}
          subtitle="Transações liquidadas com sucesso"
          icon={<ShoppingBag className="h-4 w-4 text-emerald-400" />}
          badge="Vendas"
          badgeVariant="emerald"
        />

        <StatCard
          title="INGRESSOS VENDIDOS"
          value={loading ? '—' : (data?.summary.ticketsSold?.toLocaleString('pt-BR') || '0')}
          subtitle="Total de ingressos emitidos"
          icon={<Ticket className="h-4 w-4 text-orange-400" />}
          badge="Emissões"
          badgeVariant="orange"
        />

        <StatCard
          title="VOLUME BRUTO VENDIDO"
          value={
            loading
              ? '—'
              : data?.summary.grossSales !== null && data?.summary.grossSales !== undefined
              ? formatCurrency(data.summary.grossSales)
              : 'Sigiloso'
          }
          subtitle={
            data?.summary.grossSales === null
              ? 'Requer permissão de valores'
              : 'Receita total comercial confirmada'
          }
          icon={<DollarSign className="h-4 w-4 text-cyan-400" />}
          badge="Faturamento"
          badgeVariant="cyan"
        />

        <StatCard
          title="TICKET MÉDIO (AOV)"
          value={
            loading
              ? '—'
              : data?.summary.averageOrderValue !== null && data?.summary.averageOrderValue !== undefined
              ? formatCurrency(data.summary.averageOrderValue)
              : 'Sigiloso'
          }
          subtitle="Média ponderada por pedido"
          icon={<TrendingUp className="h-4 w-4 text-purple-400" />}
          badge="Média"
          badgeVariant="purple"
        />

        <StatCard
          title="OCUPAÇÃO COMERCIAL"
          value={loading ? '—' : `${data?.summary.commercialOccupancyPercentage || 0}%`}
          subtitle="Sobre a capacidade total disponível"
          icon={<Percent className="h-4 w-4 text-amber-400" />}
          badge="Capacidade"
          badgeVariant="amber"
        />
      </div>

      {/* Remarketing Opportunity Alert Card (Strictly aggregated preview, NO PII, NO cart manipulation) */}
      {data?.opportunities && Number(data.opportunities.abandonedCarts) > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-slate-900/60 p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Oportunidades de Recuperação Comercial (Remarketing)
                </h2>
                <Badge variant="amber" size="sm">
                  Origem: Módulo Remarketing
                </Badge>
              </div>
              <p className="text-xs text-slate-300">
                Existem <strong className="text-amber-300 font-mono">{data.opportunities.abandonedCarts} pedidos/carrinhos</strong> em aberto aguardando conversão
                {data.opportunities.potentialValue !== null && (
                  <span>, totalizando potencial de <strong className="text-emerald-300 font-mono">{formatCurrency(data.opportunities.potentialValue)}</strong></span>
                )}.
              </p>
              <p className="text-[11px] text-slate-400 italic">
                * Conforme diretriz de governança, o módulo Comercial expõe apenas indicadores agregados sem PII. A régua de recuperação e contatos são geridos no módulo Remarketing.
              </p>
            </div>

            {onNavigateToRemarketing && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onNavigateToRemarketing}
                icon={<ArrowUpRight className="h-3.5 w-3.5 text-amber-400" />}
              >
                Ver no Remarketing
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Trends & Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend (7 days) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white">Ritmo Diário de Vendas (Últimos 7 Dias)</h2>
                <p className="text-xs text-slate-400">Transações e ingressos emitidos por data oficial</p>
              </div>
              <Badge variant="slate" size="sm">
                Real time
              </Badge>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-2">
              {data?.trend?.map((t, idx) => {
                const maxTickets = Math.max(...(data.trend.map((x) => x.tickets) || [1]), 1);
                const heightPct = Math.max(12, Math.round((t.tickets / maxTickets) * 100));

                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className="text-[10px] text-slate-400 font-mono">{t.tickets} ing.</div>
                    <div className="w-full bg-slate-800/80 rounded-t-lg h-28 flex items-end justify-center p-1">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-orange-500/80 hover:bg-orange-400 rounded-t transition-all duration-300"
                        title={`${t.label}: ${t.orders} pedidos, ${t.tickets} ingressos${t.grossSales !== null ? ` (${formatCurrency(t.grossSales)})` : ''}`}
                      />
                    </div>
                    <div className="text-[11px] font-bold text-slate-300">{t.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Filtro ativo: {data?.period.label || 'Sem restrição'}</span>
            <button
              onClick={onNavigateToSales}
              className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors"
            >
              Ver Performance Completa & Drilldown <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Orders Status Distribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Status dos Pedidos</h2>
            <p className="text-xs text-slate-400">Distribuição no período selecionado</p>
          </div>

          <div className="space-y-3">
            {data?.ordersByStatus.map((st) => (
              <div key={st.status} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{st.label}</span>
                  <span className="font-mono text-white font-semibold">
                    {st.count} <span className="text-slate-500 font-normal">({st.percentage}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${st.percentage}%` }}
                    className={`h-full rounded-full ${
                      st.status === 'CONFIRMED'
                        ? 'bg-emerald-500'
                        : st.status === 'PENDING'
                        ? 'bg-amber-500'
                        : st.status === 'PROCESSING'
                        ? 'bg-cyan-500'
                        : 'bg-slate-600'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Canais de Venda</h3>
            <div className="space-y-2">
              {data?.salesByChannel.map((ch) => (
                <div
                  key={ch.channelId}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 p-2.5 text-xs"
                >
                  <div className="font-medium text-slate-200">{ch.channelName}</div>
                  <div className="text-right font-mono">
                    <div className="text-white font-bold">{ch.ticketsSold} ingressos</div>
                    <div className="text-[10px] text-slate-400">{ch.sharePercentage}% do total</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Últimos Pedidos Comerciais</h2>
            <p className="text-xs text-slate-400">Transações recentes registradas no sistema</p>
          </div>
          <Button size="sm" variant="secondary" onClick={onNavigateToOrders}>
            Ver Todos os Pedidos
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3">Código</th>
                <th className="pb-3">Data</th>
                <th className="pb-3">Evento</th>
                <th className="pb-3">Comprador</th>
                <th className="pb-3">Canal</th>
                <th className="pb-3 text-center">Ingressos</th>
                <th className="pb-3 text-right">Total</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.recentOrders?.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-mono font-bold text-orange-400">
                    <button
                      onClick={() => onSelectOrder(order.id)}
                      className="hover:underline text-left"
                    >
                      {order.publicCode}
                    </button>
                  </td>
                  <td className="py-3 text-slate-400 font-mono">
                    {new Date(order.createdAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3 font-medium text-slate-200">
                    {order.eventName || 'Evento'}
                  </td>
                  <td className="py-3">
                    <div className="text-slate-200 font-medium">
                      {order.buyerSnapshot?.name || 'Cliente'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {order.buyerSnapshot?.documentMasked || '***'}
                    </div>
                  </td>
                  <td className="py-3 text-slate-400">
                    {order.salesChannelName || 'Online'}
                  </td>
                  <td className="py-3 text-center font-mono font-bold text-slate-200">
                    {order.totalTicketsCount || order.itemsCount || 1}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-white">
                    {order.totalAmount > 0 ? formatCurrency(order.totalAmount) : '—'}
                  </td>
                  <td className="py-3 text-center">
                    <Badge
                      variant={
                        order.status === 'CONFIRMED'
                          ? 'emerald'
                          : order.status === 'PENDING'
                          ? 'amber'
                          : order.status === 'PROCESSING'
                          ? 'cyan'
                          : 'rose'
                      }
                      size="sm"
                    >
                      {order.status === 'CONFIRMED'
                        ? 'Confirmado'
                        : order.status === 'PENDING'
                        ? 'Pendente'
                        : order.status === 'PROCESSING'
                        ? 'Processando'
                        : order.status === 'CANCELLED'
                        ? 'Cancelado'
                        : order.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onSelectOrder(order.id)}
                      className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      Ver Detalhes
                    </button>
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
