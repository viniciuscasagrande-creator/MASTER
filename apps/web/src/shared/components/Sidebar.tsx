import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  Headphones,
  MessageSquare,
  RotateCcw,
  DollarSign,
  FileSpreadsheet,
  Megaphone,
  TrendingUp,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useCoreData } from '../../core/context/CoreDataContext';

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  subItems?: { id: string; label: string; badge?: number }[];
}

interface SidebarProps {
  activeModule: string;
  activeSubItem?: string;
  onNavigate: (moduleId: string, subItemId?: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  activeSubItem,
  onNavigate,
  isExpanded,
  onToggleExpanded
}) => {
  const { canAccessModule } = useAuth();
  const { refunds, incidents, sacTickets } = useCoreData();

  // Accordion state: holds which module submenus are expanded
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    [activeModule]: true
  });

  const pendingRefunds = refunds.filter(r => r.status === 'pending_approval').length;
  const openIncidents = incidents.filter(i => i.status !== 'resolved').length;
  const openSac = sacTickets.filter(s => s.status !== 'resolved').length;

  const NAVIGATION_ITEMS: NavigationItem[] = [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: <LayoutDashboard className="h-4 w-4" />
    },
    {
      id: 'events',
      label: 'Eventos',
      icon: <Calendar className="h-4 w-4" />,
      subItems: [
        { id: 'events-dashboard', label: 'Painel de Eventos' },
        { id: 'events-all', label: 'Todos os Eventos' },
        { id: 'events-create', label: 'Criar Evento' },
        { id: 'events-config', label: 'Configurações' },
        { id: 'events-lots', label: 'Lotes e Ingressos' },
        { id: 'events-sectors', label: 'Setores / Mapas' },
        { id: 'events-checkin', label: 'Check-in' },
        { id: 'events-complimentary', label: 'Cortesias' },
        { id: 'events-promoters', label: 'Promotores' },
        { id: 'events-channels', label: 'Canais de Venda' },
        { id: 'events-team', label: 'Equipe' },
        { id: 'events-realtime', label: 'Operação em Tempo Real' }
      ]
    },
    {
      id: 'commercial',
      label: 'Comercial',
      icon: <Briefcase className="h-4 w-4" />,
      subItems: [
        { id: 'commercial-dashboard', label: 'Painel Comercial' },
        { id: 'commercial-producers', label: 'Produtores' },
        { id: 'commercial-leads', label: 'Leads' },
        { id: 'commercial-opportunities', label: 'Oportunidades' },
        { id: 'commercial-funnel', label: 'Funil Comercial' },
        { id: 'commercial-proposals', label: 'Propostas' },
        { id: 'commercial-contracts', label: 'Contratos' },
        { id: 'commercial-goals', label: 'Metas' },
        { id: 'commercial-commissions', label: 'Comissões' },
        { id: 'commercial-pipeline', label: 'Pipeline' },
        { id: 'commercial-intelligence', label: 'Inteligência Comercial' }
      ]
    },
    {
      id: 'event-support',
      label: 'Suporte Eventos',
      icon: <Headphones className="h-4 w-4" />,
      badge: openIncidents > 0 ? openIncidents : undefined,
      subItems: [
        { id: 'support-dashboard', label: 'Painel Operacional' },
        { id: 'support-tickets', label: 'Chamados' },
        { id: 'support-active-events', label: 'Eventos em Operação' },
        { id: 'support-incidents', label: 'Incidentes', badge: openIncidents },
        { id: 'support-sla', label: 'SLA' },
        { id: 'support-teams', label: 'Equipes' },
        { id: 'support-escalations', label: 'Escalonamentos' },
        { id: 'support-kb', label: 'Base de Conhecimento' },
        { id: 'support-war-room', label: 'Sala de Operações' }
      ]
    },
    {
      id: 'sac',
      label: 'Atendimento SAC',
      icon: <MessageSquare className="h-4 w-4" />,
      badge: openSac > 0 ? openSac : undefined,
      subItems: [
        { id: 'sac-dashboard', label: 'Painel SAC' },
        { id: 'sac-query-center', label: 'Central de Consulta' },
        { id: 'sac-customers', label: 'Clientes' },
        { id: 'sac-orders', label: 'Pedidos' },
        { id: 'sac-tickets-list', label: 'Ingressos' },
        { id: 'sac-whatsapp', label: 'WhatsApp' },
        { id: 'sac-email', label: 'E-mail' },
        { id: 'sac-chat', label: 'Chat' },
        { id: 'sac-queue', label: 'Tickets' },
        { id: 'sac-sla', label: 'SLA' },
        { id: 'sac-csat', label: 'CSAT / NPS' },
        { id: 'sac-kb', label: 'Base de Conhecimento' }
      ]
    },
    {
      id: 'refunds',
      label: 'Estorno',
      icon: <RotateCcw className="h-4 w-4" />,
      badge: pendingRefunds > 0 ? pendingRefunds : undefined,
      subItems: [
        { id: 'refunds-dashboard', label: 'Painel de Estornos' },
        { id: 'refunds-requests', label: 'Solicitações' },
        { id: 'refunds-approvals', label: 'Aprovações', badge: pendingRefunds },
        { id: 'refunds-total', label: 'Estorno Total' },
        { id: 'refunds-partial', label: 'Estorno Parcial' },
        { id: 'refunds-chargebacks', label: 'Chargebacks' },
        { id: 'refunds-cancellations', label: 'Cancelamentos' },
        { id: 'refunds-audit', label: 'Auditoria' },
        { id: 'refunds-reports', label: 'Relatórios' }
      ]
    },
    {
      id: 'finance',
      label: 'Financeiro',
      icon: <DollarSign className="h-4 w-4" />,
      subItems: [
        { id: 'finance-dashboard', label: 'Painel Financeiro' },
        { id: 'finance-producer-account', label: 'Conta do Produtor' },
        { id: 'finance-event-balances', label: 'Saldos por Evento' },
        { id: 'finance-transfers', label: 'Transferência entre Eventos' },
        { id: 'finance-payables', label: 'Contas a Pagar' },
        { id: 'finance-receivables', label: 'Contas a Receber' },
        { id: 'finance-payouts', label: 'Repasses' },
        { id: 'finance-advances', label: 'Antecipações' },
        { id: 'finance-split', label: 'Split' },
        { id: 'finance-gateways', label: 'Gateways' },
        { id: 'finance-reconciliation', label: 'Conciliação' },
        { id: 'finance-cashflow', label: 'Fluxo de Caixa' },
        { id: 'finance-dre', label: 'DRE Gerencial' },
        { id: 'finance-treasury', label: 'Tesouraria' },
        { id: 'finance-pix-cnab', label: 'PIX / CNAB' },
        { id: 'finance-intelligence', label: 'Inteligência Financeira' }
      ]
    },
    {
      id: 'accounting',
      label: 'Contabilidade',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      subItems: [
        { id: 'accounting-dashboard', label: 'Painel Contábil' },
        { id: 'accounting-chart-of-accounts', label: 'Plano de Contas' },
        { id: 'accounting-entries', label: 'Lançamentos' },
        { id: 'accounting-ledger', label: 'Razão' },
        { id: 'accounting-trial-balance', label: 'Balancete' },
        { id: 'accounting-dre', label: 'DRE' },
        { id: 'accounting-balance-sheet', label: 'Balanço Patrimonial' },
        { id: 'accounting-reconciliation', label: 'Conciliação Contábil' },
        { id: 'accounting-obligations', label: 'Obrigações' },
        { id: 'accounting-closing', label: 'Fechamento' },
        { id: 'accounting-audit', label: 'Auditoria' },
        { id: 'accounting-reports', label: 'Relatórios' }
      ]
    },
    {
      id: 'marketing',
      label: 'Marketing',
      icon: <Megaphone className="h-4 w-4" />,
      subItems: [
        { id: 'marketing-dashboard', label: 'Painel de Marketing' },
        { id: 'marketing-campaigns', label: 'Campanhas' },
        { id: 'marketing-meta', label: 'Meta Ads' },
        { id: 'marketing-google', label: 'Google Ads' },
        { id: 'marketing-tiktok', label: 'TikTok Ads' },
        { id: 'marketing-spotify', label: 'Spotify Ads' },
        { id: 'marketing-whatsapp', label: 'WhatsApp' },
        { id: 'marketing-email', label: 'E-mail Marketing' },
        { id: 'marketing-coupons', label: 'Cupons' },
        { id: 'marketing-affiliates', label: 'Afiliados' },
        { id: 'marketing-links-utm', label: 'Links / UTM / QR' },
        { id: 'marketing-pixels', label: 'Pixels por Evento' },
        { id: 'marketing-audiences', label: 'Públicos' },
        { id: 'marketing-conversions', label: 'Conversões' },
        { id: 'marketing-analytics', label: 'Analytics' }
      ]
    },
    {
      id: 'remarketing',
      label: 'Remarketing',
      icon: <TrendingUp className="h-4 w-4" />,
      subItems: [
        { id: 'remarketing-dashboard', label: 'Painel de Remarketing' },
        { id: 'remarketing-abandoned-carts', label: 'Carrinhos Abandonados' },
        { id: 'remarketing-audiences', label: 'Públicos' },
        { id: 'remarketing-segments', label: 'Segmentos' },
        { id: 'remarketing-journeys', label: 'Jornadas' },
        { id: 'remarketing-automations', label: 'Automações' },
        { id: 'remarketing-recovery', label: 'Recuperação de Clientes' },
        { id: 'remarketing-whatsapp', label: 'WhatsApp' },
        { id: 'remarketing-email', label: 'E-mail' },
        { id: 'remarketing-ads', label: 'Ads' },
        { id: 'remarketing-conversions', label: 'Conversões' },
        { id: 'remarketing-roi', label: 'ROI' }
      ]
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: <Settings className="h-4 w-4" />
    }
  ];

  const toggleAccordion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleItemClick = (item: NavigationItem) => {
    if (!isExpanded) {
      // If collapsed, clicking expands sidebar and navigates
      onToggleExpanded();
      setOpenAccordions(prev => ({ ...prev, [item.id]: true }));
      onNavigate(item.id, item.subItems?.[0]?.id);
      return;
    }

    if (item.subItems && item.subItems.length > 0) {
      // Click opens / closes accordion
      setOpenAccordions(prev => ({
        ...prev,
        [item.id]: !prev[item.id]
      }));
      onNavigate(item.id, item.subItems[0].id);
    } else {
      onNavigate(item.id);
    }
  };

  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-slate-800/80 bg-slate-950/95 transition-all duration-300 select-none ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
    >
      {/* Header of Sidebar with expand/collapse toggle */}
      <div className="flex h-12 items-center justify-between px-3 border-b border-slate-800/60">
        {isExpanded ? (
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navegação Operacional
          </span>
        ) : <div />}

        <button
          onClick={onToggleExpanded}
          title={isExpanded ? 'Recolher Menu (Ícones)' : 'Expandir Menu Completo'}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
        >
          {isExpanded ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {NAVIGATION_ITEMS.map((item) => {
          const isAllowed = canAccessModule(item.id);
          const isActive = activeModule === item.id;
          const isAccordionOpen = !!openAccordions[item.id];
          const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);

          if (!isAllowed) return null;

          return (
            <div key={item.id} className="space-y-0.5">
              <button
                onClick={() => handleItemClick(item)}
                title={!isExpanded ? item.label : undefined}
                className={`group relative flex w-full items-center rounded-xl px-2.5 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-orange-500/10 text-orange-400 font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {/* Active Indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-orange-500 shadow-sm shadow-orange-500/50" />
                )}

                <div className={`flex items-center justify-center shrink-0 ${isActive ? 'text-orange-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.icon}
                </div>

                {isExpanded && (
                  <div className="ml-3 flex flex-1 items-center justify-between overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    <div className="flex items-center gap-1.5 ml-1.5">
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500/20 px-1 text-[10px] font-bold text-orange-400 border border-orange-500/30">
                          {item.badge}
                        </span>
                      )}
                      {hasSubItems && (
                        <span
                          onClick={(e) => toggleAccordion(item.id, e)}
                          className="p-0.5 hover:text-white text-slate-500 transition-colors"
                        >
                          {isAccordionOpen ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </button>

              {/* Sub-items (Accordion) */}
              {isExpanded && hasSubItems && isAccordionOpen && (
                <div className="ml-5 pl-2.5 border-l border-slate-800/80 space-y-0.5 py-1">
                  {item.subItems!.map((sub) => {
                    const isSubActive = isActive && activeSubItem === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => onNavigate(item.id, sub.id)}
                        className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-[11px] transition-colors ${
                          isSubActive
                            ? 'bg-orange-500/15 text-orange-300 font-semibold'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{sub.label}</span>
                        {sub.badge !== undefined && sub.badge > 0 && (
                          <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500/20 px-1 text-[9px] font-bold text-rose-400">
                            {sub.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      {isExpanded && (
        <div className="p-3 border-t border-slate-800/60 text-[11px] text-slate-500">
          <div className="flex items-center justify-between">
            <span>DiskIngressos PDT</span>
            <span className="text-[10px] font-mono text-slate-400">2026.1</span>
          </div>
        </div>
      )}
    </aside>
  );
};
