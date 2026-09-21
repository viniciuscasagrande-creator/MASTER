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
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useCoreData } from '../../core/context/CoreDataContext';
import { useNotifications } from '../../core/context/NotificationContext';
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
          icon: <Calendar className="h-4 w-4 text-cyan-400" />,
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
          icon: <Briefcase className="h-4 w-4 text-amber-400" />,
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
          icon: <Headphones className="h-4 w-4 text-emerald-400" />,
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
          icon: <MessageSquare className="h-4 w-4 text-cyan-400" />,
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
          icon: <RotateCcw className="h-4 w-4 text-rose-400" />,
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
          icon: <DollarSign className="h-4 w-4 text-emerald-400" />,
          requiredPermission: 'financeiro.saldo.visualizar',
          subItems: [
            { id: 'finance-hub', label: 'Hub Financeiro' },
            { id: 'finance-event-balances', label: 'Saldos por Evento' },
            { id: 'finance-transfers', label: 'Transferências', requiredPermission: 'financeiro.transferencia.criar' },
            { id: 'finance-receivables-payables', label: 'Contas a Pagar/Receber' },
            { id: 'finance-payouts', label: 'Repasses Programados', requiredPermission: 'financeiro.repasses.visualizar' },
            { id: 'finance-reports', label: 'Extrato da Conta', requiredPermission: 'financeiro.relatorio.exportar' },
            { id: 'finance-reconciliation', label: 'Conciliação', requiredPermission: 'financeiro.conciliacao.executar' }
          ]
        },
        {
          id: 'accounting',
          label: 'Contabilidade',
          icon: <FileSpreadsheet className="h-4 w-4 text-blue-400" />,
          requiredPermission: 'contabilidade.diario.visualizar',
          subItems: [
            { id: 'accounting-dashboard', label: 'Painel Contábil' },
            { id: 'accounting-entries', label: 'Livro Diário' },
            { id: 'accounting-dre', label: 'DRE Gerencial', requiredPermission: 'contabilidade.dre.visualizar' }
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
          icon: <Megaphone className="h-4 w-4 text-pink-400" />,
          requiredPermission: 'marketing.campanha.visualizar',
          subItems: [
            { id: 'marketing-dashboard', label: 'Painel de Marketing' },
            { id: 'marketing-campaigns', label: 'Campanhas & ROAS' }
          ]
        },
        {
          id: 'remarketing',
          label: 'Remarketing',
          icon: <TrendingUp className="h-4 w-4 text-purple-400" />,
          requiredPermission: 'remarketing.carrinhos.visualizar',
          subItems: [
            { id: 'remarketing-dashboard', label: 'Painel de Remarketing' },
            { id: 'remarketing-abandoned-carts', label: 'Carrinhos Abandonados' }
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
          icon: <ShieldCheck className="h-4 w-4 text-indigo-400" />,
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
          icon: <Settings className="h-4 w-4 text-slate-400" />,
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

  return (
    <aside
      className={cn(
        'relative z-20 flex flex-col h-full border-r border-slate-800 bg-[#0F172A] transition-all duration-300 select-none shrink-0',
        isExpanded ? 'w-[260px]' : 'w-[72px]',
        className
      )}
    >
      {/* Top Header: Logo + Disk Interno + Collapse Button */}
      <div className="flex h-16 items-center justify-between px-3.5 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-md shadow-orange-500/20">
            <span className="font-black tracking-tighter text-white text-base">DK</span>
          </div>

          {isExpanded && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black tracking-tight text-white truncate">
                DISK INTERNO
              </span>
              <span className="text-[10px] font-semibold text-orange-400 tracking-wider">
                PDT CORE
              </span>
            </div>
          )}
        </div>

        {isExpanded && (
          <button
            onClick={onToggleExpanded}
            title="Recolher Menu Lateral"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Active Event Context Banner (when an event is selected) */}
      {isEventContextActive && (
        <div className="p-2 border-b border-slate-800 bg-cyan-950/40">
          {isExpanded ? (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-cyan-900/30 border border-cyan-800/40 text-xs">
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  Evento Ativo
                </div>
                <div className="text-xs font-semibold text-cyan-200 truncate">
                  {activeEvent?.title}
                </div>
              </div>
              <button
                onClick={() => {
                  clearEvent();
                  onNavigate('events', 'events-all');
                }}
                title="Voltar para Todos os Eventos"
                className="p-1 text-cyan-400 hover:text-white hover:bg-cyan-800/50 rounded transition-colors shrink-0"
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
              className="flex items-center justify-center h-8 w-8 mx-auto rounded-lg bg-cyan-900/40 text-cyan-300 border border-cyan-800/50 cursor-pointer hover:bg-cyan-800/60"
            >
              <Calendar className="h-4 w-4" />
            </div>
          )}
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {SECTIONS.map((sec) => {
          // Filter items based on RBAC & permissions
          const visibleItems = sec.items.filter((item) => {
            if (!canAccessModule(item.id)) return false;
            if (item.requiredPermission && !hasPermission(item.requiredPermission)) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={sec.title} className="space-y-1">
              {isExpanded && (
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {sec.title}
                </div>
              )}

              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = activeModule === item.id;
                  const isAccordionOpen = !!openAccordions[item.id];

                  const filteredSubItems = (item.subItems || []).filter((sub) => {
                    if (sub.requiredPermission && !hasPermission(sub.requiredPermission)) return false;
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
                            ? 'bg-orange-500/15 text-white font-semibold shadow-sm'
                            : 'text-slate-300 hover:bg-slate-800/70 hover:text-white',
                          !isExpanded && 'justify-center px-0'
                        )}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-orange-500 shadow-sm shadow-orange-500/50" />
                        )}

                        <div
                          className={cn(
                            'flex items-center justify-center shrink-0',
                            isActive
                              ? 'text-orange-400'
                              : 'text-slate-400 group-hover:text-slate-200'
                          )}
                        >
                          {item.icon}
                        </div>

                        {isExpanded && (
                          <div className="ml-3 flex flex-1 items-center justify-between overflow-hidden">
                            <span className="truncate text-left">{item.label}</span>
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

                      {/* Sub-items accordion (only when expanded) */}
                      {isExpanded && hasSubItems && isAccordionOpen && (
                        <div className="ml-5 pl-2.5 border-l border-slate-800/80 space-y-0.5 py-1">
                          {filteredSubItems.map((sub) => {
                            const isSubActive = isActive && activeSubItem === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => onNavigate(item.id, sub.id)}
                                className={cn(
                                  'flex w-full items-center justify-between rounded-lg px-2 py-1 text-[11px] transition-colors cursor-pointer',
                                  isSubActive
                                    ? 'bg-orange-500/20 text-orange-300 font-semibold'
                                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                                )}
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
            </div>
          );
        })}
      </div>

      {/* Footer: User role + Recolher button */}
      <div className="p-2.5 border-t border-slate-800 shrink-0 space-y-2">
        {isExpanded ? (
          <>
            <div className="px-2 py-1 text-[11px] text-slate-400">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 truncate">{currentUser.name}</span>
                <span className="text-[9px] font-mono text-orange-400 uppercase">{currentUser.roleName}</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
            </div>

            <button
              onClick={onToggleExpanded}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <PanelLeftClose className="h-4 w-4" />
              <span>Recolher</span>
            </button>
          </>
        ) : (
          <button
            onClick={onToggleExpanded}
            title="Expandir Menu"
            className="flex h-10 w-full items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        )}
      </div>
    </aside>
  );
};
