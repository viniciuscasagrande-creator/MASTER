import React, { useState } from 'react';
import {
  LayoutDashboard,
  Search,
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
  ShieldCheck,
  Bell,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useCoreData } from '../../core/context/CoreDataContext';
import { useNotifications } from '../../core/context/NotificationContext';
import { PermissionString } from '@shared/types/index';

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  requiredPermission?: PermissionString;
  subItems?: { id: string; label: string; badge?: number; requiredPermission?: PermissionString }[];
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
  const { canAccessModule, currentUser, hasPermission } = useAuth();
  const { refunds, incidents, sacTickets } = useCoreData();
  const { unreadCount } = useNotifications();

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    [activeModule]: true
  });

  const pendingRefunds = refunds.filter(r => r.status === 'pending_approval').length;
  const openIncidents = incidents.filter(i => i.status !== 'resolved').length;
  const openSac = sacTickets.filter(s => s.status !== 'resolved').length;

  const isProducer = currentUser.roleSlug === 'produtor';

  const ALL_NAVIGATION_ITEMS: NavigationItem[] = [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: <LayoutDashboard className="h-4 w-4" />
    },
    {
      id: 'search',
      label: 'Central de Consulta',
      icon: <Search className="h-4 w-4 text-orange-400" />
    },
    {
      id: 'notifications',
      label: 'Notificações',
      icon: <Bell className="h-4 w-4" />,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      id: 'approvals',
      label: 'Aprovações',
      icon: <CheckSquare className="h-4 w-4 text-emerald-400" />,
      requiredPermission: 'aprovacoes.solicitacao.visualizar',
      subItems: [
        { id: 'approvals-inbox', label: 'Minha Caixa de Entrada' },
        { id: 'approvals-my-requests', label: 'Minhas Solicitações' },
        { id: 'approvals-history', label: 'Histórico de Decisões' },
        { id: 'approvals-rules', label: 'Regras de Aprovação', requiredPermission: 'aprovacoes.regra.visualizar' },
        { id: 'approvals-thresholds', label: 'Alçadas de Aprovação', requiredPermission: 'aprovacoes.alcada.visualizar' }
      ]
    },
    {
      id: 'events',
      label: isProducer ? 'Meus Eventos' : 'Eventos',
      icon: <Calendar className="h-4 w-4" />,
      requiredPermission: 'eventos.evento.visualizar',
      subItems: [
        { id: 'events-dashboard', label: isProducer ? 'Painel do Produtor' : 'Painel de Eventos' },
        { id: 'events-all', label: isProducer ? 'Eventos Cadastrados' : 'Todos os Eventos' },
        { id: 'events-create', label: 'Criar Evento', requiredPermission: 'eventos.evento.criar' },
        { id: 'events-lots', label: 'Lotes e Ingressos', requiredPermission: 'eventos.setores.configurar' },
        { id: 'events-checkin', label: 'Check-in e Portaria', requiredPermission: 'eventos.checkin.operar' },
        { id: 'events-realtime', label: 'Operação em Tempo Real' }
      ]
    },
    {
      id: 'commercial',
      label: 'Comercial',
      icon: <Briefcase className="h-4 w-4" />,
      requiredPermission: 'comercial.produtores.visualizar',
      subItems: [
        { id: 'commercial-dashboard', label: 'Painel Comercial' },
        { id: 'commercial-producers', label: 'Produtores' },
        { id: 'commercial-pipeline', label: 'Pipeline & Funil', requiredPermission: 'comercial.propostas.gerenciar' },
        { id: 'commercial-goals', label: 'Metas e Comissões', requiredPermission: 'comercial.metas.visualizar' }
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
        { id: 'sac-query-center', label: 'Central de Consulta 360°' },
        { id: 'sac-customers', label: 'Clientes' },
        { id: 'sac-orders', label: 'Pedidos e Ingressos' },
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
    },
    {
      id: 'finance',
      label: 'Financeiro',
      icon: <DollarSign className="h-4 w-4" />,
      requiredPermission: 'financeiro.saldo.visualizar',
      subItems: [
        { id: 'finance-dashboard', label: 'Painel Financeiro' },
        { id: 'finance-event-balances', label: 'Saldos por Evento' },
        { id: 'finance-payouts', label: 'Repasses', requiredPermission: 'financeiro.repasses.visualizar' },
        { id: 'finance-reconciliation', label: 'Conciliação', requiredPermission: 'financeiro.conciliacao.executar' },
        { id: 'finance-reports', label: 'Relatórios', requiredPermission: 'financeiro.relatorio.exportar' }
      ]
    },
    {
      id: 'accounting',
      label: 'Contabilidade',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      requiredPermission: 'contabilidade.diario.visualizar',
      subItems: [
        { id: 'accounting-dashboard', label: 'Painel Contábil' },
        { id: 'accounting-entries', label: 'Livro Diário' },
        { id: 'accounting-dre', label: 'DRE Gerencial', requiredPermission: 'contabilidade.dre.visualizar' }
      ]
    },
    {
      id: 'marketing',
      label: 'Marketing',
      icon: <Megaphone className="h-4 w-4" />,
      requiredPermission: 'marketing.campanha.visualizar',
      subItems: [
        { id: 'marketing-dashboard', label: 'Painel de Marketing' },
        { id: 'marketing-campaigns', label: 'Campanhas e ROAS' },
        { id: 'marketing-pixels', label: 'Pixels por Evento', requiredPermission: 'marketing.pixel.configurar' }
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
        { id: 'remarketing-journeys', label: 'Réguas de Automação', requiredPermission: 'remarketing.regua.configurar' }
      ]
    },
    {
      id: 'admin',
      label: 'Administração',
      icon: <ShieldCheck className="h-4 w-4" />,
      requiredPermission: 'admin.usuarios.visualizar',
      subItems: [
        { id: 'admin-dashboard', label: 'Painel Administrativo' },
        { id: 'admin-users', label: 'Usuários' },
        { id: 'admin-roles', label: 'Perfis de Acesso' },
        { id: 'admin-permissions', label: 'Permissões' },
        { id: 'admin-sessions', label: 'Sessões Ativas' },
        { id: 'admin-security', label: 'Segurança & 2FA' },
        { id: 'admin-notifications', label: 'Regras de Alerta' },
        { id: 'admin-approval-rules', label: 'Regras de Aprovação' },
        { id: 'admin-approval-thresholds', label: 'Alçadas de Aprovação' },
        { id: 'admin-audit', label: 'Auditoria' }
      ]
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: <Settings className="h-4 w-4" />,
      requiredPermission: 'admin.configuracoes.editar'
    }
  ];

  // Filter items dynamically: only render modules the user is allowed to access
  const visibleItems = ALL_NAVIGATION_ITEMS.filter(item => {
    if (!canAccessModule(item.id)) return false;
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) return false;
    return true;
  });

  const toggleAccordion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleItemClick = (item: NavigationItem) => {
    if (!isExpanded) {
      onToggleExpanded();
      setOpenAccordions(prev => ({ ...prev, [item.id]: true }));
      onNavigate(item.id, item.subItems?.[0]?.id);
      return;
    }

    if (item.subItems && item.subItems.length > 0) {
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
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              {isProducer ? 'Menu do Produtor' : 'Navegação Operacional'}
            </span>
          </div>
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

      {/* Navigation Links - Dynamically Rendered */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {visibleItems.map((item) => {
          const isActive = activeModule === item.id;
          const isAccordionOpen = !!openAccordions[item.id];

          // Filter subitems that user has permission for
          const filteredSubItems = (item.subItems || []).filter(sub => {
            if (sub.requiredPermission && !hasPermission(sub.requiredPermission)) return false;
            return true;
          });

          const hasSubItems = filteredSubItems.length > 0;

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
                  {filteredSubItems.map((sub) => {
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

      {/* Footer Info displaying current User Profile and Scope */}
      {isExpanded && (
        <div className="p-3 border-t border-slate-800/60 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300 truncate">{currentUser.roleName}</span>
            <span className="text-[10px] font-mono text-cyan-400 uppercase">{currentUser.scope.type}</span>
          </div>
          <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
        </div>
      )}
    </aside>
  );
};
