import React from 'react';
import {
  DollarSign,
  Ticket,
  Users,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { useScope } from '../../core/context/ScopeContext';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { formatCurrency, formatNumber, formatDateTime } from '../../shared/utils/formatters';

interface OverviewDashboardProps {
  onNavigate: (moduleId: string, subItemId?: string) => void;
  onOpenNewSale: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigate,
  onOpenNewSale
}) => {
  const {
    events,
    orders,
    producers,
    refunds,
    incidents,
    auditLogs
  } = useCoreData();
  const { selectedProducerId, selectedEventId, currentProducer, currentEvent } = useScope();

  // Filter based on scope
  const filteredEvents = events.filter(e => {
    if (selectedProducerId !== 'all' && e.producerId !== selectedProducerId) return false;
    if (selectedEventId !== 'all' && e.id !== selectedEventId) return false;
    return true;
  });

  const totalGross = filteredEvents.reduce((acc, e) => acc + e.grossRevenue, 0);
  const totalTickets = filteredEvents.reduce((acc, e) => acc + e.ticketsSold, 0);
  const totalBalance = selectedProducerId !== 'all' && currentProducer
    ? currentProducer.availableBalance
    : producers.reduce((acc, p) => acc + p.availableBalance, 0);
  const pendingRefundsCount = refunds.filter(r => r.status === 'pending_approval').length;
  const activeIncidentsCount = incidents.filter(i => i.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Scope feedback */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Visão Geral do Disk Interno
            </h1>
            <Badge variant="orange" size="sm" dot>
              Core Ativo
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {currentProducer
              ? `Filtrado por: ${currentProducer.name} ${currentEvent ? `• ${currentEvent.title}` : ''}`
              : 'Monitoramento unificado de todos os produtores, eventos e operações financeiras.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenNewSale}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            Simular Venda Real
          </button>
        </div>
      </div>

      {/* 4 Main Executive KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Receita Bruta Total"
          value={formatCurrency(totalGross)}
          trend={{ value: '14,8% vs mês ant.', isPositive: true }}
          icon={<DollarSign className="h-4 w-4 text-orange-400" />}
          badge="Global"
          badgeVariant="orange"
        />

        <StatCard
          title="Ingressos Emitidos"
          value={formatNumber(totalTickets)}
          trend={{ value: '8,2% este mês', isPositive: true }}
          icon={<Ticket className="h-4 w-4 text-cyan-400" />}
          subtitle={`${filteredEvents.length} eventos no escopo`}
        />

        <StatCard
          title="Saldo Produtores"
          value={formatCurrency(totalBalance)}
          trend={{ value: 'R$ 387 mil repasses hoje', isPositive: true }}
          icon={<Users className="h-4 w-4 text-emerald-400" />}
          badge="Disponível"
          badgeVariant="emerald"
        />

        <StatCard
          title="Atenção Operacional"
          value={`${pendingRefundsCount + activeIncidentsCount} itens`}
          subtitle={`${pendingRefundsCount} estornos • ${activeIncidentsCount} chamados`}
          icon={<ShieldAlert className="h-4 w-4 text-amber-400" />}
          badge={pendingRefundsCount > 0 ? 'Pendente' : 'Normal'}
          badgeVariant={pendingRefundsCount > 0 ? 'amber' : 'slate'}
        />
      </div>

      {/* Cross-Module Operational Matrix */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Status dos 9 Módulos Conectados</h2>
            <p className="text-xs text-slate-400">Todos sincronizados sobre a mesma base relacional</p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Conexão em Tempo Real Ativa
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
          {[
            { id: 'events', name: 'Eventos', count: `${filteredEvents.length} ativos`, status: 'Normal', color: 'emerald' },
            { id: 'commercial', name: 'Comercial', count: `${producers.length} produtores`, status: 'Ativo', color: 'emerald' },
            { id: 'event-support', name: 'Suporte', count: `${activeIncidentsCount} alertas`, status: activeIncidentsCount > 0 ? 'Alerta' : 'OK', color: activeIncidentsCount > 0 ? 'amber' : 'emerald' },
            { id: 'sac', name: 'SAC', count: 'Fila 3min', status: '98% SLA', color: 'emerald' },
            { id: 'refunds', name: 'Estorno', count: `${pendingRefundsCount} pendentes`, status: pendingRefundsCount > 0 ? 'Ação' : 'OK', color: pendingRefundsCount > 0 ? 'rose' : 'emerald' },
            { id: 'finance', name: 'Financeiro', count: 'R$ 1,84 mi', status: 'Conciliado', color: 'emerald' },
            { id: 'accounting', name: 'Contábil', count: 'Partidas OK', status: 'Equilibrado', color: 'emerald' },
            { id: 'marketing', name: 'Marketing', count: 'ROAS 18.2x', status: 'Alto Desemp.', color: 'emerald' },
            { id: 'remarketing', name: 'Remarketing', count: '24% recup.', status: 'Automático', color: 'emerald' },
          ].map((mod) => (
            <div
              key={mod.id}
              onClick={() => onNavigate(mod.id)}
              className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 hover:border-orange-500/50 hover:bg-slate-900 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 group-hover:text-white">
                <span className="truncate">{mod.name}</span>
                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-orange-400 transition-opacity" />
              </div>
              <div className="mt-2 text-xs font-bold text-white font-mono">{mod.count}</div>
              <div className="mt-1 text-[10px] text-slate-500">{mod.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns: Live Stream & Active Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Events Snapshot */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Eventos em Operação</h2>
              <p className="text-xs text-slate-400">Status de vendas e check-in em tempo real</p>
            </div>
            <button
              onClick={() => onNavigate('events')}
              className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
            >
              Ver todos ({filteredEvents.length}) →
            </button>
          </div>

          <div className="space-y-3">
            {filteredEvents.map((evt) => {
              const percentSold = Math.round((evt.ticketsSold / evt.totalCapacity) * 100);
              const percentCheckIn = evt.ticketsSold > 0 ? Math.round((evt.checkInCount / evt.ticketsSold) * 100) : 0;

              return (
                <div
                  key={evt.id}
                  onClick={() => onNavigate('events')}
                  className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 transition-all hover:border-slate-700 cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{evt.title}</span>
                        <Badge
                          variant={evt.status === 'in_operation' ? 'orange' : evt.status === 'on_sale' ? 'emerald' : 'slate'}
                          size="sm"
                        >
                          {evt.status === 'in_operation' ? 'Em Andamento' : evt.status === 'on_sale' ? 'Vendas Abertas' : 'Publicado'}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {evt.venue} • {evt.city}/{evt.state} • {evt.producerName}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-white font-mono">
                        {formatCurrency(evt.grossRevenue)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {formatNumber(evt.ticketsSold)} / {formatNumber(evt.totalCapacity)} ingressos ({percentSold}%)
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Ocupação da Capacidade</span>
                      <span className="font-mono">{percentSold}% vendido</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentSold}%` }}
                      />
                    </div>
                  </div>

                  {evt.status === 'in_operation' && (
                    <div className="mt-2 text-[11px] text-cyan-400 flex items-center justify-between font-mono">
                      <span>Portaria & Check-in: {formatNumber(evt.checkInCount)} validados</span>
                      <span>{percentCheckIn}% do público presente</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Real-time Transaction & Audit Stream */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Fluxo do Core</h2>
              <p className="text-xs text-slate-400">Últimas transações interconectadas</p>
            </div>
            <Activity className="h-4 w-4 text-orange-400" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[420px]">
            {orders.slice(0, 5).map((ord) => (
              <div
                key={ord.id}
                className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-3 text-xs space-y-1 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono">{ord.orderNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    ord.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {ord.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-slate-300 font-medium truncate">
                  {ord.customerName}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{ord.paymentMethod.toUpperCase()}</span>
                  <span className="font-bold text-white">{formatCurrency(ord.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Transações automáticas</span>
            <button
              onClick={() => onNavigate('sac', 'sac-orders')}
              className="text-orange-400 hover:text-orange-300 font-medium"
            >
              Consultar no SAC →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
