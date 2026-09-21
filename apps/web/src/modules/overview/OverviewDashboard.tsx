import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  MessageSquare,
  Calendar,
  DollarSign,
  Briefcase,
  Headphones,
  RotateCcw,
  FileSpreadsheet,
  Megaphone,
  ShieldCheck,
  Settings,
  ChevronDown,
  CheckSquare,
  Square,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { useScope } from '../../core/context/ScopeContext';
import { useAuth } from '../../core/auth/AuthContext';
import { MetricCard } from '../../shared/components/MetricCard';
import { ModuleAccessCard } from '../../shared/components/ModuleAccessCard';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { ChartCard } from '../../shared/components/ChartCard';
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
    refunds,
    incidents,
    sacTickets
  } = useCoreData();
  const { selectedProducerId, selectedEventId, currentProducer, currentEvent } = useScope();
  const { canAccessModule, currentUser, hasPermission } = useAuth();

  // State for interactive checklist (matching "Próximas ações" in Reference Image)
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Retornar para Maria Oliveira', time: 'Hoje às 10:00', done: false },
    { id: '2', title: 'Aprovar pedido #4587', time: 'Hoje às 11:30', done: false },
    { id: '3', title: 'Reunião com equipe de marketing', time: 'Hoje às 14:00', done: false },
    { id: '4', title: 'Revisar fluxo de automações', time: 'Hoje às 16:00', done: false }
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  // Filter based on selected scope
  const filteredEvents = events.filter((e) => {
    if (selectedProducerId !== 'all' && e.producerId !== selectedProducerId) return false;
    if (selectedEventId !== 'all' && e.id !== selectedEventId) return false;
    return true;
  });

  const totalGross = filteredEvents.reduce((acc, e) => acc + (e.grossRevenue || 0), 0);
  const totalTickets = filteredEvents.reduce((acc, e) => acc + (e.ticketsSold || 0), 0);
  const pendingRefundsCount = refunds.filter((r) => r.status === 'pending_approval').length;
  const activeIncidentsCount = incidents.filter((i) => i.status !== 'resolved').length;
  const openSacCount = sacTickets ? sacTickets.filter((s) => s.status !== 'resolved').length : 0;

  // Real KPIs with reference fallback values for display completeness
  const displayRevenue = totalGross > 0 ? totalGross : 125430;
  const displayOrders = totalTickets > 0 ? totalTickets : orders.length > 0 ? orders.length : 342;
  const displayCustomers = orders.length > 0 ? orders.length * 4 : 1284;
  const displayTickets = openSacCount + pendingRefundsCount + activeIncidentsCount > 0
    ? openSacCount + pendingRefundsCount + activeIncidentsCount
    : 28;

  // Module access list for navigation
  const MODULE_ITEMS = [
    {
      id: 'events',
      title: 'Eventos',
      description: 'Gestão de eventos, locais e sessões de vendas',
      icon: <Calendar className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />,
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-950/40 dark:border-cyan-800',
      badge: `${filteredEvents.length} eventos`,
      badgeVariant: 'cyan' as const,
      requiredPermission: 'eventos.evento.visualizar'
    },
    {
      id: 'commercial',
      title: 'Comercial',
      description: 'Canais, pedidos, vendas e condições de produtores',
      icon: <Briefcase className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800',
      badge: undefined,
      requiredPermission: 'comercial.dashboard.visualizar'
    },
    {
      id: 'event-support',
      title: 'Suporte Eventos',
      description: 'Incidentes operacionais e war room em tempo real',
      icon: <Headphones className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800',
      badge: activeIncidentsCount > 0 ? `${activeIncidentsCount} alertas` : undefined,
      badgeVariant: 'amber' as const,
      requiredPermission: 'suporte.incidentes.visualizar'
    },
    {
      id: 'sac',
      title: 'Atendimento SAC',
      description: 'Consultas de ingressos, clientes e tickets de suporte',
      icon: <MessageSquare className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />,
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-950/40 dark:border-cyan-800',
      badge: openSacCount > 0 ? `${openSacCount} fila` : undefined,
      badgeVariant: 'cyan' as const,
      requiredPermission: 'sac.consulta.acessar'
    },
    {
      id: 'refunds',
      title: 'Estorno',
      description: 'Aprovação de reembolsos, chargebacks e disputas',
      icon: <RotateCcw className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800',
      badge: pendingRefundsCount > 0 ? `${pendingRefundsCount} pendentes` : undefined,
      badgeVariant: 'rose' as const,
      requiredPermission: 'estorno.solicitacao.visualizar'
    },
    {
      id: 'finance',
      title: 'Financeiro',
      description: 'Saldos, repasses, extratos bancários e conciliação',
      icon: <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800',
      badge: undefined,
      requiredPermission: 'financeiro.saldo.visualizar'
    },
    {
      id: 'accounting',
      title: 'Contabilidade',
      description: 'Livro diário, plano de contas e demonstrações financeiras',
      icon: <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800',
      badge: undefined,
      requiredPermission: 'contabilidade.diario.visualizar'
    },
    {
      id: 'marketing',
      title: 'Marketing',
      description: 'Campanhas publicitárias, cupons, links UTM e canais',
      icon: <Megaphone className="h-5 w-5 text-pink-600 dark:text-pink-400" />,
      iconBg: 'bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-950/40 dark:border-pink-800',
      badge: undefined,
      requiredPermission: 'marketing.campanha.visualizar'
    },
    {
      id: 'remarketing',
      title: 'Remarketing',
      description: 'Carrinhos abandonados e recuperação de vendas',
      icon: <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800',
      badge: undefined,
      requiredPermission: 'remarketing.carrinhos.visualizar'
    },
    {
      id: 'admin',
      title: 'Administração',
      description: 'Controle de usuários, perfis de acesso e auditoria',
      icon: <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800',
      badge: undefined,
      requiredPermission: 'admin.usuarios.visualizar'
    },
    {
      id: 'settings',
      title: 'Configurações',
      description: 'Parâmetros gerais do sistema e políticas operacionais',
      icon: <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />,
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
      badge: undefined,
      requiredPermission: 'admin.configuracoes.editar'
    }
  ];

  const visibleModules = MODULE_ITEMS.filter((item) => {
    if (!canAccessModule(item.id)) return false;
    if (item.requiredPermission && !hasPermission(item.requiredPermission as any)) return false;
    return true;
  });

  // Recent customer tickets (exact structure from Reference Image)
  const recentTickets = [
    {
      id: 't1',
      name: 'Maria Oliveira',
      desc: 'Problema com emissão de nota',
      status: 'Em andamento',
      time: 'há 12 min'
    },
    {
      id: 't2',
      name: 'Carlos Mendes',
      desc: 'Dúvida sobre o plano',
      status: 'Resolvido',
      time: 'há 28 min'
    },
    {
      id: 't3',
      name: 'Ana Costa',
      desc: 'Erro no pagamento',
      status: 'Aguardando cliente',
      time: 'há 1 hora'
    },
    {
      id: 't4',
      name: 'Pedro Lima',
      desc: 'Solicitação de reembolso',
      status: 'Em andamento',
      time: 'há 2 horas'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header da Página: Título e Período (Conforme Referência Oficial: Olá, João! 👋) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Olá, {currentUser?.name?.split(' ')[0] || 'João'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Aqui está um resumo da sua empresa hoje.
          </p>
        </div>

        {/* Dropdown de Período (Hoje, 24 de Ago de 2025 v) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            <span>Hoje, 24 de Ago de 2025</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 2. Grid de 4 KPIs (Cards Pequenos e Proporcionais da Referência) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Receita */}
        <MetricCard
          title="Receita"
          value={formatCurrency(displayRevenue)}
          trend={{ value: '+12%', isPositive: true }}
          icon={<TrendingUp className="h-4 w-4 text-[#FF7A00]" />}
        />

        {/* Pedidos */}
        <MetricCard
          title="Pedidos"
          value={formatNumber(displayOrders)}
          trend={{ value: '+8%', isPositive: true }}
          icon={<ShoppingCart className="h-4 w-4 text-blue-500" />}
        />

        {/* Clientes */}
        <MetricCard
          title="Clientes"
          value={formatNumber(displayCustomers)}
          trend={{ value: '+15%', isPositive: true }}
          icon={<Users className="h-4 w-4 text-purple-500" />}
        />

        {/* Tickets (SAC) */}
        <MetricCard
          title="Tickets (SAC)"
          value={formatNumber(displayTickets)}
          trend={{ value: '-20%', isPositive: false }}
          icon={<MessageSquare className="h-4 w-4 text-rose-500" />}
        />
      </div>

      {/* 3. Linha de Gráficos (Receita nos últimos 30 dias + Atendimentos por status) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Gráfico de Área: Receita nos últimos 30 dias (7 Colunas) */}
        <div className="lg:col-span-8">
          <ChartCard
            title="Receita nos últimos 30 dias"
            heightClass="h-[310px]"
            actions={
              <button className="flex items-center gap-1 text-xs text-slate-300 hover:text-white border border-slate-700 rounded-lg px-2 py-1 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer">
                <span>Últimos 30 dias</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            }
          >
            <div className="h-full w-full flex flex-col justify-between py-1">
              <div className="relative flex-1 w-full pl-8">
                {/* SVG Area Chart with Disk Orange Gradient */}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="diskOrangeArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="20" x2="500" y2="20" stroke="#F1F5F9" className="dark:stroke-slate-800" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="#F1F5F9" className="dark:stroke-slate-800" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="#F1F5F9" className="dark:stroke-slate-800" strokeDasharray="3 3" />
                  <line x1="0" y1="140" x2="500" y2="140" stroke="#F1F5F9" className="dark:stroke-slate-800" strokeDasharray="3 3" />

                  {/* Area fill */}
                  <path
                    d="M 0 130 Q 50 110, 100 125 T 200 95 T 300 85 T 400 80 T 500 45 L 500 155 L 0 155 Z"
                    fill="url(#diskOrangeArea)"
                  />

                  {/* Smooth curve line in Disk Orange */}
                  <path
                    d="M 0 130 Q 50 110, 100 125 T 200 95 T 300 85 T 400 80 T 500 45"
                    fill="none"
                    stroke="#FF7A00"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Active highlight point on the curve */}
                  <circle cx="500" cy="45" r="4.5" fill="#FF7A00" stroke="#FFFFFF" className="dark:stroke-slate-900" strokeWidth="2" />
                </svg>

                {/* Y-Axis Labels */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 pointer-events-none">
                  <span>200k</span>
                  <span>150k</span>
                  <span>100k</span>
                  <span>50k</span>
                  <span>0</span>
                </div>
              </div>

              {/* X-Axis Dates */}
              <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-2 pl-8 border-t border-slate-100 dark:border-slate-800">
                <span>25/07</span>
                <span>01/08</span>
                <span>08/08</span>
                <span>15/08</span>
                <span>22/08</span>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Gráfico Donut: Atendimentos por status (5 Colunas) */}
        <div className="lg:col-span-4">
          <ChartCard
            title="Atendimentos por status"
            heightClass="h-[310px]"
          >
            <div className="h-full w-full flex items-center justify-between gap-4 px-2">
              {/* Donut Chart SVG */}
              <div className="relative w-36 h-36 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#F1F5F9"
                    className="dark:stroke-slate-800"
                    strokeWidth="3.8"
                  />
                  {/* Segment 1: Resolvidos 48% (Emerald) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="4"
                    strokeDasharray="48, 100"
                    strokeDashoffset="0"
                  />
                  {/* Segment 2: Em andamento 32% (Blue) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="4"
                    strokeDasharray="32, 100"
                    strokeDashoffset="-48"
                  />
                  {/* Segment 3: Aguardando cliente 12% (Amber) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="4"
                    strokeDasharray="12, 100"
                    strokeDashoffset="-80"
                  />
                  {/* Segment 4: Não atribuídos 8% (Orange) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#FF7A00"
                    strokeWidth="4"
                    strokeDasharray="8, 100"
                    strokeDashoffset="-92"
                  />
                </svg>
              </div>

              {/* Legend with exact labels & percentages */}
              <div className="space-y-2.5 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E] shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">Resolvidos</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">48%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6] shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">Em andamento</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">32%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B] shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">Aguardando cliente</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">12%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF7A00] shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">Não atribuídos</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">8%</span>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* 4. Linha de Listas Operacionais: Últimos atendimentos + Próximas ações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Últimos Atendimentos (Conforme Referência) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Últimos atendimentos
            </h3>
            <button
              onClick={() => onNavigate('sac', 'sac-queue')}
              className="text-xs font-semibold text-[#FF7A00] hover:underline cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-1">
            {recentTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => onNavigate('sac', 'sac-query-center')}
                className="flex items-center justify-between py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 px-1 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600 font-bold text-xs border border-orange-100 dark:bg-slate-800 dark:text-orange-400 dark:border-slate-700">
                    {t.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {t.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {t.desc}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <StatusBadge status={t.status} size="sm" />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                    {t.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Próximas Ações (Checklist interativo da Referência) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Próximas ações
            </h3>
            <span className="text-xs font-semibold text-[#FF7A00] hover:underline cursor-pointer">
              Ver todas
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="flex items-start gap-3 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 px-1 rounded-lg transition-colors cursor-pointer"
              >
                <div className="mt-0.5 text-slate-400 hover:text-orange-500 transition-colors shrink-0">
                  {task.done ? (
                    <CheckSquare className="h-4 w-4 text-[#FF7A00]" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-semibold ${task.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'} truncate`}>
                    {task.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {task.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Acesso Rápido a Todos os Módulos do Sistema */}
      <SectionCard
        title="Acesso aos Módulos"
        description="Navegue diretamente pelos módulos operacionais e de gestão do Disk Interno"
        badge={
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {visibleModules.length} módulos ativos
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
    </div>
  );
};
