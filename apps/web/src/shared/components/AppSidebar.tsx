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
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  Search,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useCoreData } from '../../core/context/CoreDataContext';
import { useDiskContext } from '../../core/context/DiskContext';
import { PermissionString } from '@shared/types/index';
import { cn } from '../utils/cn';

export interface AppNavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  requiredPermission?: PermissionString;
  subItems?: { id: string; label: string; badge?: number; requiredPermission?: PermissionString }[];
}

export interface AppNavSection {
  title: string;
  items: AppNavigationItem[];
}

interface AppSidebarProps {
  activeModule: string;
  activeSubItem?: string;
  onNavigate: (moduleId: string, subItemId?: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  className?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeModule,
  activeSubItem,
  onNavigate,
  isExpanded,
  onToggleExpanded,
  className
}) => {
  const { canAccessModule, currentUser, hasPermission } = useAuth();
  const { refunds, incidents, sacTickets } = useCoreData();
  const { activeEvent, selectedEventId, clearEvent } = useDiskContext();

  const isEventContextActive = Boolean(selectedEventId && selectedEventId !== 'all' && activeEvent);

  // Accordion open/close state
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    [activeModule]: true
  });

  // Search inside sidebar
  const [sidebarSearch, setSidebarSearch] = useState('');

  const pendingRefunds = refunds.filter((r) => r.status === 'pending_approval').length;
  const openIncidents = incidents.filter((i) => i.status !== 'resolved').length;
  const openSac = sacTickets.filter((s) => s.status !== 'resolved').length;

  const SECTIONS: AppNavSection[] = [
    {
      title: 'VISÃO GERAL',
      items: [
        {
          id: 'overview',
          label: 'Visão Geral',
          icon: <LayoutDashboard className="h-4 w-4" />
        }
      ]
    },
    {
      title: 'OPERAÇÃO',
      items: [
        {
          id: 'events',
          label: 'Eventos',
          icon: <Calendar className="h-4 w-4" />,
          requiredPermission: 'eventos.evento.visualizar',
          subItems: [
            { id: 'events-dashboard', label: 'Painel de Eventos' },
            { id: 'events-all', label: 'Todos os Eventos' },
            { id: 'events-create', label: 'Criar Evento', requiredPermission: 'eventos.evento.criar' },
            { id: 'events-venues', label: 'Locais & Plantas', requiredPermission: 'eventos.locais.visualizar' },
            { id: 'events-sessions', label: 'Sessões & Calendário', requiredPermission: 'eventos.sessoes.visualizar' }
          ]
        },
        {
          id: 'commercial',
          label: 'Comercial',
          icon: <Briefcase className="h-4 w-4" />,
          requiredPermission: 'comercial.dashboard.visualizar',
          subItems: [
            { id: 'commercial-dashboard', label: 'Visão Geral' },
            { id: 'commercial-orders', label: 'Central de Pedidos', requiredPermission: 'comercial.pedidos.visualizar' },
            { id: 'commercial-sales', label: 'Central de Vendas', requiredPermission: 'comercial.vendas.visualizar' },
            { id: 'commercial-conditions', label: 'Condições & Taxas', requiredPermission: 'comercial.contratos.visualizar' },
            { id: 'commercial-producers', label: 'Carteira de Produtores', requiredPermission: 'comercial.produtores.visualizar' }
          ]
        },
        {
          id: 'event-support',
          label: 'Suporte Eventos',
          icon: <Headphones className="h-4 w-4" />,
          requiredPermission: 'suporte.incidentes.visualizar',
          badge: openIncidents > 0 ? openIncidents : undefined,
          subItems: [
            { id: 'support-dashboard', label: 'Painel Operacional' },
            { id: 'support-war-room', label: 'Sala de Operações', requiredPermission: 'suporte.war_room.acessar' },
            { id: 'support-incidents', label: 'Incidentes', badge: openIncidents }
          ]
        },
        {
          id: 'sac',
          label: 'Atendimento SAC',
          icon: <MessageSquare className="h-4 w-4" />,
          requiredPermission: 'sac.consulta.acessar',
          badge: openSac > 0 ? openSac : undefined,
          subItems: [
            { id: 'sac-dashboard', label: 'Painel SAC' },
            { id: 'sac-query-center', label: 'Central de Atendimento' },
            { id: 'sac-queue', label: 'Fila de Atendimento', badge: openSac }
          ]
        },
        {
          id: 'refunds',
          label: 'Estorno',
          icon: <RotateCcw className="h-4 w-4" />,
          requiredPermission: 'estorno.solicitacao.visualizar',
          badge: pendingRefunds > 0 ? pendingRefunds : undefined,
          subItems: [
            { id: 'refunds-dashboard', label: 'Painel de Estornos' },
            { id: 'refunds-approvals', label: 'Fila de Aprovação', badge: pendingRefunds, requiredPermission: 'estorno.solicitacao.aprovar' },
            { id: 'refunds-chargebacks', label: 'Chargebacks', requiredPermission: 'estorno.chargeback.gerenciar' }
          ]
        }
      ]
    },
    {
      title: 'GESTÃO',
      items: [
        {
          id: 'finance',
          label: 'Financeiro',
          icon: <DollarSign className="h-4 w-4" />,
          requiredPermission: 'financeiro.saldo.visualizar',
          subItems: [
            { id: 'finance-hub', label: 'Hub Financeiro' },
            { id: 'finance-dashboard', label: 'Dashboard Financeiro' },
            { id: 'finance-event-balances', label: 'Saldos por Evento' },
            { id: 'finance-transfers', label: 'Transferências', requiredPermission: 'financeiro.transferencia.criar' },
            { id: 'finance-receivables-payables', label: 'Contas a Pagar/Receber' },
            { id: 'finance-treasury', label: 'Tesouraria & Caixa' },
            { id: 'finance-payouts', label: 'Repasses Programados', requiredPermission: 'financeiro.repasses.visualizar' },
            { id: 'finance-statement', label: 'Extrato da Conta', requiredPermission: 'financeiro.relatorio.exportar' },
            { id: 'finance-reconciliation', label: 'Conciliação', requiredPermission: 'financeiro.conciliacao.executar' },
            { id: 'finance-advances', label: 'Antecipações' },
            { id: 'finance-bordero', label: 'Borderô de Fechamento' }
          ]
        },
        {
          id: 'accounting',
          label: 'Contabilidade',
          icon: <FileSpreadsheet className="h-4 w-4" />,
          requiredPermission: 'contabilidade.diario.visualizar',
          subItems: [
            { id: 'accounting-dashboard', label: 'Painel Contábil' },
            { id: 'accounting-chart-of-accounts', label: 'Plano de Contas' },
            { id: 'accounting-entries', label: 'Livro Diário' },
            { id: 'accounting-reconciliation', label: 'Conciliação' },
            { id: 'accounting-closing', label: 'Fechamento' },
            { id: 'accounting-trial-balance', label: 'Balancete' },
            { id: 'accounting-dre', label: 'DRE Gerencial', requiredPermission: 'contabilidade.dre.visualizar' },
            { id: 'accounting-balance-sheet', label: 'Balanço Patrimonial' }
          ]
        }
      ]
    },
    {
      title: 'CRESCIMENTO',
      items: [
        {
          id: 'marketing',
          label: 'Marketing',
          icon: <Megaphone className="h-4 w-4" />,
          requiredPermission: 'marketing.campanha.visualizar',
          subItems: [
            { id: 'marketing-dashboard', label: 'Painel de Marketing' },
            { id: 'marketing-campaigns', label: 'Campanhas Multicanais' },
            { id: 'marketing-ready-campaigns', label: 'Campanhas Prontas' },
            { id: 'marketing-status', label: 'Status em Tempo Real' },
            { id: 'marketing-whatsapp', label: 'WhatsApp Marketing' },
            { id: 'marketing-email', label: 'E-mail Marketing' },
            { id: 'marketing-automations', label: 'Automações & Jornadas' },
            { id: 'marketing-coupons', label: 'Cupons & Descontos' },
            { id: 'marketing-utm', label: 'Central UTM & Links' },
            { id: 'marketing-affiliates', label: 'Afiliados' },
            { id: 'marketing-pixels', label: 'Pixels & Conversões' },
            { id: 'marketing-spotify', label: 'Spotify Ads' }
          ]
        },
        {
          id: 'remarketing',
          label: 'Remarketing',
          icon: <TrendingUp className="h-4 w-4" />,
          requiredPermission: 'remarketing.carrinhos.visualizar',
          subItems: [
            { id: 'remarketing-dashboard', label: 'Painel de Remarketing' },
            { id: 'remarketing-abandoned-carts', label: 'Carrinhos Abandonados' },
            { id: 'remarketing-sales-recovery', label: 'Recuperação de Vendas' },
            { id: 'remarketing-payment-recovery', label: 'Recuperação de Pagamentos' },
            { id: 'remarketing-journeys', label: 'Jornadas & Automações' },
            { id: 'remarketing-whatsapp', label: 'WhatsApp Remarketing' },
            { id: 'remarketing-email', label: 'E-mail Remarketing' }
          ]
        }
      ]
    },
    {
      title: 'SISTEMA',
      items: [
        {
          id: 'admin',
          label: 'Administração',
          icon: <ShieldCheck className="h-4 w-4" />,
          requiredPermission: 'admin.usuarios.visualizar',
          subItems: [
            { id: 'admin-dashboard', label: 'Painel Administrativo' },
            { id: 'admin-users', label: 'Usuários & Perfis' },
            { id: 'admin-permissions', label: 'Permissões' },
            { id: 'admin-security', label: 'Segurança & 2FA' },
            { id: 'admin-audit', label: 'Auditoria do Sistema' },
            { id: 'config-parameters', label: 'Regras & Políticas' }
          ]
        },
        {
          id: 'settings',
          label: 'Configurações',
          icon: <Settings className="h-4 w-4" />,
          requiredPermission: 'admin.configuracoes.editar'
        }
      ]
    }
  ];

  const toggleAccordion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenAccordions((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleItemClick = (item: AppNavigationItem) => {
    if (!isExpanded) {
      onToggleExpanded();
      setOpenAccordions((prev) => ({ ...prev, [item.id]: true }));
      onNavigate(item.id, item.subItems?.[0]?.id);
      return;
    }

    if (item.subItems && item.subItems.length > 0) {
      setOpenAccordions((prev) => ({
        ...prev,
        [item.id]: !prev[item.id]
      }));
      onNavigate(item.id, item.subItems[0].id);
    } else {
      onNavigate(item.id);
    }
  };

  const query = sidebarSearch.trim().toLowerCase();

  return (
    <aside
      className={cn(
        'relative z-20 flex flex-col h-full border-r border-slate-200/90 bg-white dark:bg-slate-900 dark:border-slate-800 transition-all duration-300 select-none shrink-0 shadow-xs',
        isExpanded ? 'w-[250px]' : 'w-[68px]',
        className
      )}
    >
      {/* Top Header: Disk MASTER Logo + Collapse Button */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Official Orange Disk Logo */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF7A00] text-white shadow-xs shadow-orange-500/25">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 3a9 9 0 0 1 9 9" />
            </svg>
          </div>

          {isExpanded && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Disk
                </span>
                <span className="text-base font-extrabold text-[#FF7A00] tracking-tight">
                  MASTER
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
                Gestão Integrada
              </span>
            </div>
          )}
        </div>

        {isExpanded && (
          <button
            onClick={onToggleExpanded}
            title="Recolher Menu Lateral"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Bar inside Sidebar (as shown in Reference Image) */}
      {isExpanded && (
        <div className="px-3 pt-3 pb-1 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Buscar no menu..."
              className="w-full h-8 pl-8 pr-7 rounded-lg border border-slate-200 bg-slate-50/80 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#FF7A00] focus:outline-none focus:ring-1 focus:ring-orange-500/20 transition-all dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
            {sidebarSearch && (
              <button
                onClick={() => setSidebarSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Event Context Banner (when an event is selected) */}
      {isEventContextActive && (
        <div className="p-2 border-b border-orange-100 bg-orange-50/50 dark:border-orange-950 dark:bg-orange-950/20">
          {isExpanded ? (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-orange-200/80 dark:border-orange-800/40 text-xs shadow-2xs">
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 tracking-wider">
                  Evento Ativo
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {activeEvent?.title}
                </div>
              </div>
              <button
                onClick={() => {
                  clearEvent();
                  onNavigate('events', 'events-all');
                }}
                title="Voltar para Todos os Eventos"
                className="p-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors shrink-0 dark:text-orange-400"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div
              title={`Evento: ${activeEvent?.title} (Clique para sair)`}
              onClick={() => {
                clearEvent();
                onNavigate('events', 'events-all');
              }}
              className="flex items-center justify-center h-8 w-8 mx-auto rounded-lg bg-orange-100 text-orange-700 border border-orange-200 cursor-pointer hover:bg-orange-200/60 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800/50"
            >
              <Calendar className="h-4 w-4" />
            </div>
          )}
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-2.5 px-2.5 space-y-3">
        {SECTIONS.map((sec) => {
          // Filter items based on RBAC & search
          const visibleItems = sec.items.filter((item) => {
            if (!canAccessModule(item.id)) return false;
            if (item.requiredPermission && !hasPermission(item.requiredPermission)) return false;
            if (query) {
              const matchesSelf = item.label.toLowerCase().includes(query);
              const matchesSub = (item.subItems || []).some((s) => s.label.toLowerCase().includes(query));
              return matchesSelf || matchesSub;
            }
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={sec.title} className="space-y-0.5">
              {isExpanded && (
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {sec.title}
                </div>
              )}

              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = activeModule === item.id;
                  const isAccordionOpen = !!openAccordions[item.id] || Boolean(query);

                  const filteredSubItems = (item.subItems || []).filter((sub) => {
                    if (sub.requiredPermission && !hasPermission(sub.requiredPermission)) return false;
                    if (query) {
                      return sub.label.toLowerCase().includes(query) || item.label.toLowerCase().includes(query);
                    }
                    return true;
                  });

                  const hasSubItems = filteredSubItems.length > 0;

                  return (
                    <div key={item.id} className="space-y-0.5">
                      <button
                        onClick={() => handleItemClick(item)}
                        title={!isExpanded ? item.label : undefined}
                        className={cn(
                          'group relative flex w-full items-center rounded-xl px-2.5 py-2 text-xs font-medium transition-all cursor-pointer',
                          isActive
                            ? 'bg-[#FFF7ED] text-[#EA580C] font-semibold dark:bg-orange-950/40 dark:text-orange-300'
                            : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200',
                          !isExpanded && 'justify-center px-0'
                        )}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#FF7A00]" />
                        )}

                        <div
                          className={cn(
                            'flex items-center justify-center shrink-0',
                            isActive
                              ? 'text-[#FF7A00]'
                              : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                          )}
                        >
                          {item.icon}
                        </div>

                        {isExpanded && (
                          <div className="ml-2.5 flex flex-1 items-center justify-between overflow-hidden">
                            <span className="truncate text-left text-xs">{item.label}</span>
                            <div className="flex items-center gap-1.5 ml-1">
                              {item.badge !== undefined && item.badge > 0 && (
                                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-100 px-1 text-[10px] font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                                  {item.badge}
                                </span>
                              )}
                              {hasSubItems && (
                                <span
                                  onClick={(e) => toggleAccordion(item.id, e)}
                                  className="p-0.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors"
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

                      {/* Sub-items accordion (only when expanded) */}
                      {isExpanded && hasSubItems && isAccordionOpen && (
                        <div className="ml-4 pl-2.5 border-l border-slate-200 dark:border-slate-800 space-y-0.5 py-0.5">
                          {filteredSubItems.map((sub) => {
                            const isSubActive = isActive && activeSubItem === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => onNavigate(item.id, sub.id)}
                                className={cn(
                                  'flex w-full items-center justify-between rounded-lg px-2 py-1 text-[11px] transition-colors cursor-pointer',
                                  isSubActive
                                    ? 'bg-[#FFF7ED] text-[#EA580C] font-semibold dark:bg-orange-950/60 dark:text-orange-300'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200'
                                )}
                              >
                                <span className="truncate">{sub.label}</span>
                                {sub.badge !== undefined && sub.badge > 0 && (
                                  <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-100 px-1 text-[9px] font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
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
            </div>
          );
        })}
      </div>

      {/* Footer: User Profile Card (As shown in Reference Image: "João Silva - Administrador") */}
      <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 shrink-0">
        {isExpanded ? (
          <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-bold text-xs">
                {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'JS'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {currentUser?.name || 'João Silva'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {currentUser?.roleName || 'Administrador'}
                </span>
              </div>
            </div>

            <button
              onClick={onToggleExpanded}
              title="Recolher Menu"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onToggleExpanded}
            title="Expandir Menu"
            className="flex h-10 w-full items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        )}
      </div>
    </aside>
  );
};
