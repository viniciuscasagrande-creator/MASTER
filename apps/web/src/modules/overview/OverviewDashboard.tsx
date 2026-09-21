import React from 'react';
import {
  DollarSign,
  Ticket,
  Calendar,
  Percent,
  ArrowRight,
  Briefcase,
  Headphones,
  MessageSquare,
  RotateCcw,
  FileSpreadsheet,
  Megaphone,
  TrendingUp,
  ShieldCheck,
  Settings,
  Activity
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { useScope } from '../../core/context/ScopeContext';
import { useAuth } from '../../core/auth/AuthContext';
import { MetricCard } from '../../shared/components/MetricCard';
import { ModuleAccessCard } from '../../shared/components/ModuleAccessCard';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { EmptyState } from '../../shared/components/EmptyState';
import { SectionCard } from '../../shared/components/SectionCard';
import { formatCurrency, formatNumber } from '../../shared/utils/formatters';

interface OverviewDashboardProps {
  onNavigate: (moduleId: string, subItemId?: string) => void;
  onOpenNewSale?: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigate
}) => {
  const {
    events,
    orders,
    producers,
    refunds,
    incidents
  } = useCoreData();
  const { selectedProducerId, selectedEventId, currentProducer, currentEvent } = useScope();
  const { canAccessModule, hasPermission } = useAuth();

  // Filter based on selected scope
  const filteredEvents = events.filter((e) => {
    if (selectedProducerId !== 'all' && e.producerId !== selectedProducerId) return false;
    if (selectedEventId !== 'all' && e.id !== selectedEventId) return false;
    return true;
  });

  const totalGross = filteredEvents.reduce((acc, e) => acc + (e.grossRevenue || 0), 0);
  const totalTickets = filteredEvents.reduce((acc, e) => acc + (e.ticketsSold || 0), 0);
  const totalCapacity = filteredEvents.reduce((acc, e) => acc + (e.totalCapacity || 0), 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalTickets / totalCapacity) * 100) : 0;

  const pendingRefundsCount = refunds.filter((r) => r.status === 'pending_approval').length;
  const activeIncidentsCount = incidents.filter((i) => i.status !== 'resolved').length;
  const openSacCount = 0; // Sac tickets awaiting resolution

  // Module access list per Section 15
  const MODULE_ITEMS = [
    {
      id: 'events',
      title: 'Eventos',
      description: 'Gestão de eventos, locais e sessões de vendas',
      icon: <Calendar className="h-5 w-5 text-cyan-600" />,
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200',
      badge: `${filteredEvents.length} eventos`,
      badgeVariant: 'cyan' as const,
      requiredPermission: 'eventos.evento.visualizar'
    },
    {
      id: 'commercial',
      title: 'Comercial',
      description: 'Canais, pedidos, vendas e condições de produtores',
      icon: <Briefcase className="h-5 w-5 text-amber-600" />,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      badge: undefined,
      requiredPermission: 'comercial.dashboard.visualizar'
    },
    {
      id: 'event-support',
      title: 'Suporte Eventos',
      description: 'Incidentes operacionais e war room em tempo real',
      icon: <Headphones className="h-5 w-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badge: activeIncidentsCount > 0 ? `${activeIncidentsCount} alertas` : undefined,
      badgeVariant: 'amber' as const,
      requiredPermission: 'suporte.incidentes.visualizar'
    },
    {
      id: 'sac',
      title: 'Atendimento SAC',
      description: 'Consultas de ingressos, clientes e tickets de suporte',
      icon: <MessageSquare className="h-5 w-5 text-cyan-600" />,
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200',
      badge: openSacCount > 0 ? `${openSacCount} fila` : undefined,
      badgeVariant: 'cyan' as const,
      requiredPermission: 'sac.consulta.acessar'
    },
    {
      id: 'refunds',
      title: 'Estorno',
      description: 'Aprovação de reembolsos, chargebacks e disputas',
      icon: <RotateCcw className="h-5 w-5 text-rose-600" />,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
      badge: pendingRefundsCount > 0 ? `${pendingRefundsCount} pendentes` : undefined,
      badgeVariant: 'rose' as const,
      requiredPermission: 'estorno.solicitacao.visualizar'
    },
    {
      id: 'finance',
      title: 'Financeiro',
      description: 'Saldos, repasses, extratos bancários e conciliação',
      icon: <DollarSign className="h-5 w-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badge: undefined,
      requiredPermission: 'financeiro.saldo.visualizar'
    },
    {
      id: 'accounting',
      title: 'Contabilidade',
      description: 'Livro diário, lançamentos e DRE gerencial',
      icon: <FileSpreadsheet className="h-5 w-5 text-blue-600" />,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
      badge: undefined,
      requiredPermission: 'contabilidade.diario.visualizar'
    },
    {
      id: 'marketing',
      title: 'Marketing',
      description: 'Campanhas publicitárias, análise de ROAS e pixels',
      icon: <Megaphone className="h-5 w-5 text-pink-600" />,
      iconBg: 'bg-pink-50 text-pink-600 border-pink-200',
      badge: undefined,
      requiredPermission: 'marketing.campanha.visualizar'
    },
    {
      id: 'remarketing',
      title: 'Remarketing',
      description: 'Carrinhos abandonados e réguas automatizadas',
      icon: <TrendingUp className="h-5 w-5 text-purple-600" />,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
      badge: undefined,
      requiredPermission: 'remarketing.carrinhos.visualizar'
    },
    {
      id: 'admin',
      title: 'Administração',
      description: 'Controle de usuários, perfis de acesso e auditoria',
      icon: <ShieldCheck className="h-5 w-5 text-indigo-600" />,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      badge: undefined,
      requiredPermission: 'admin.usuarios.visualizar'
    },
    {
      id: 'settings',
      title: 'Configurações',
      description: 'Parâmetros gerais do sistema e políticas operacionais',
      icon: <Settings className="h-5 w-5 text-slate-600" />,
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      badge: undefined,
      requiredPermission: 'admin.configuracoes.editar'
    }
  ];

  const visibleModules = MODULE_ITEMS.filter((item) => {
    if (!canAccessModule(item.id)) return false;
    if (item.requiredPermission && !hasPermission(item.requiredPermission as any)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header da Página: Título e Descrição Aprovados */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Visão Geral
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {currentProducer
              ? `Acompanhe seus eventos e acesse os principais módulos • Filtrado por: ${currentProducer.name} ${
                  currentEvent ? `• ${currentEvent.title}` : ''
                }`
              : 'Acompanhe seus eventos e acesse os principais módulos.'}
          </p>
        </div>
      </div>

      {/* 2. Indicadores Executivos (Dados Reais via MetricCard) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Receita Total"
          value={formatCurrency(totalGross)}
          subtitle={`${filteredEvents.length} eventos somados`}
          icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
          badge="Faturamento"
          badgeVariant="emerald"
        />

        <MetricCard
          title="Ingressos Vendidos"
          value={formatNumber(totalTickets)}
          subtitle={`Capacidade: ${formatNumber(totalCapacity)}`}
          icon={<Ticket className="h-4 w-4 text-cyan-600" />}
          badge="Total Emitido"
          badgeVariant="cyan"
        />

        <MetricCard
          title="Taxa de Ocupação"
          value={`${occupancyRate}%`}
          subtitle={occupancyRate > 0 ? 'Média ponderada do escopo' : 'Aguardando aberturas'}
          icon={<Percent className="h-4 w-4 text-orange-500" />}
          badge={occupancyRate >= 70 ? 'Alta' : 'Normal'}
          badgeVariant={occupancyRate >= 70 ? 'orange' : 'slate'}
        />

        <MetricCard
          title="Eventos Ativos"
          value={filteredEvents.length}
          subtitle={`${producers.length} produtores cadastrados`}
          icon={<Calendar className="h-4 w-4 text-amber-500" />}
          badge="No Escopo"
          badgeVariant="amber"
        />
      </div>

      {/* 3. Acesso Rápido aos Módulos (Section 15 & 16) */}
      <SectionCard
        title="Acesso rápido aos módulos"
        description="Navegue diretamente pelos módulos operacionais e de gestão do Disk Interno"
        badge={
          <span className="text-xs font-mono text-slate-500">
            {visibleModules.length} módulos habilitados
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {visibleModules.map((mod) => (
            <ModuleAccessCard
              key={mod.id}
              id={mod.id}
              title={mod.title}
              description={mod.description}
              icon={mod.icon}
              iconBg={mod.iconBg}
              badge={mod.badge}
              badgeVariant={mod.badgeVariant}
              onClick={() => onNavigate(mod.id)}
            />
          ))}
        </div>
      </SectionCard>

      {/* 4. Eventos Recentes & Atividades Recentes (Section 17 & 18) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Eventos Recentes (2 Colunas) */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Eventos Recentes"
            description="Status de vendas e operação dos eventos cadastrados"
            actions={
              <button
                onClick={() => onNavigate('events', 'events-all')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
              >
                <span>Ver todos ({filteredEvents.length})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            }
          >
            {filteredEvents.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-6 w-6 text-slate-400" />}
                title="Nenhum evento encontrado"
                description="Não há eventos cadastrados para a produtora selecionada."
                actionLabel="Cadastrar Evento"
                onAction={() => onNavigate('events', 'events-create')}
              />
            ) : (
              <div className="space-y-3">
                {filteredEvents.slice(0, 5).map((evt) => {
                  const percentSold =
                    evt.totalCapacity > 0
                      ? Math.round((evt.ticketsSold / evt.totalCapacity) * 100)
                      : 0;

                  return (
                    <div
                      key={evt.id}
                      onClick={() => onNavigate('events', 'events-dashboard')}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:border-orange-500/40 hover:bg-white hover:shadow-xs cursor-pointer select-none"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 truncate">
                              {evt.title}
                            </span>
                            <StatusBadge
                              status={evt.status}
                              size="sm"
                              dot
                            />
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate">
                            {evt.venue} • {evt.city}/{evt.state} • {evt.producerName}
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <div className="text-sm font-bold text-slate-900 font-mono">
                            {formatCurrency(evt.grossRevenue)}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {formatNumber(evt.ticketsSold)} / {formatNumber(evt.totalCapacity)} ingressos ({percentSold}%)
                          </div>
                        </div>
                      </div>

                      {/* Capacity progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>Ocupação da Capacidade</span>
                          <span className="font-mono font-semibold text-slate-700">{percentSold}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentSold}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Atividades Recentes (1 Coluna) */}
        <div className="lg:col-span-1">
          <SectionCard
            title="Atividades Recentes"
            description="Últimas transações e operações processadas"
            actions={
              <Activity className="h-4 w-4 text-orange-600" />
            }
          >
            {orders.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-6 w-6 text-slate-400" />}
                title="Nenhuma atividade disponível"
                description="Não há transações ou eventos registrados recentemente."
              />
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((ord) => (
                  <div
                    key={ord.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1 hover:bg-slate-100/80 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono">{ord.orderNumber}</span>
                      <StatusBadge status={ord.status} size="sm" />
                    </div>
                    <div className="text-slate-700 font-medium truncate">
                      {ord.customerName}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                      <span>{ord.paymentMethod.toUpperCase()}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(ord.totalAmount)}</span>
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Transações Operacionais</span>
                  <button
                    onClick={() => onNavigate('sac', 'sac-orders')}
                    className="text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
                  >
                    Ver detalhes →
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
