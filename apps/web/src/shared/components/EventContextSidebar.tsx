import React from 'react';
import {
  ArrowLeft,
  LayoutDashboard,
  Calendar,
  MapPin,
  Layers,
  Ticket,
  DollarSign,
  Tag,
  BarChart3,
  Sliders,
  Gift,
  Share2,
  Users,
  FileText,
  CheckSquare,
  Sparkles,
  GitBranch,
  ShieldCheck,
  QrCode,
  Zap,
  Lock,
  FileSpreadsheet,
  AlertTriangle,
  Building2,
  TrendingUp,
  MessageSquare,
  ShoppingBag,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useDiskContext } from '../../core/context/DiskContext';
import { EventStatusBadge } from '../../features/events/components/EventStatusBadge';
import { formatDateTime } from '../utils/formatters';
import { PermissionString } from '@shared/types/index';

interface EventContextSidebarProps {
  activeSubItem?: string;
  onNavigate: (moduleId: string, subItemId?: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onExitEventContext: () => void;
}

interface EventContextNavSection {
  title: string;
  items: {
    id: string;
    moduleId: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    requiredPermission?: PermissionString;
  }[];
}

export const EventContextSidebar: React.FC<EventContextSidebarProps> = ({
  activeSubItem,
  onNavigate,
  isExpanded,
  onToggleExpanded,
  onExitEventContext
}) => {
  const { hasPermission, currentUser } = useAuth();
  const { activeEvent } = useDiskContext();

  const SECTIONS: EventContextNavSection[] = [
    {
      title: 'VISÃO GERAL',
      items: [
        {
          id: 'events-dashboard',
          moduleId: 'events',
          label: 'Painel do Evento',
          icon: <LayoutDashboard className="h-4 w-4" />
        }
      ]
    },
    {
      title: 'PLANEJAMENTO & ESTRUTURA',
      items: [
        {
          id: 'events-sessions',
          moduleId: 'events',
          label: 'Sessões & Agenda',
          icon: <Calendar className="h-4 w-4 text-cyan-400" />,
          requiredPermission: 'eventos.sessoes.visualizar'
        },
        {
          id: 'events-venues',
          moduleId: 'events',
          label: 'Locais & Plantas',
          icon: <MapPin className="h-4 w-4 text-amber-400" />,
          requiredPermission: 'eventos.locais.visualizar'
        }
      ]
    },
    {
      title: 'INGRESSOS & PRECIFICAÇÃO',
      items: [
        {
          id: 'events-sections',
          moduleId: 'events',
          label: 'Setores Operacionais',
          icon: <Layers className="h-4 w-4 text-emerald-400" />,
          requiredPermission: 'eventos.setor.visualizar'
        },
        {
          id: 'events-tickets',
          moduleId: 'events',
          label: 'Tipos de Ingresso',
          icon: <Ticket className="h-4 w-4 text-orange-400" />,
          requiredPermission: 'eventos.ingresso.visualizar'
        },
        {
          id: 'events-batches',
          moduleId: 'events',
          label: 'Lotes de Venda',
          icon: <Tag className="h-4 w-4 text-cyan-400" />,
          requiredPermission: 'eventos.lote.visualizar'
        },
        {
          id: 'events-pricing',
          moduleId: 'events',
          label: 'Matriz de Preços & Taxas',
          icon: <DollarSign className="h-4 w-4 text-emerald-400" />,
          requiredPermission: 'eventos.lote.gerenciar'
        },
        {
          id: 'events-capacity',
          moduleId: 'events',
          label: 'Inventário & Capacidade',
          icon: <BarChart3 className="h-4 w-4 text-purple-400" />,
          requiredPermission: 'eventos.sessoes.capacidade.visualizar'
        },
        {
          id: 'events-rules',
          moduleId: 'events',
          label: 'Regras de Venda',
          icon: <Sliders className="h-4 w-4 text-slate-400" />,
          requiredPermission: 'eventos.setores.configurar'
        },
        {
          id: 'events-complimentary',
          moduleId: 'events',
          label: 'Cortesias & Convites',
          icon: <Gift className="h-4 w-4 text-rose-400" />,
          requiredPermission: 'eventos.cortesias.visualizar'
        },
        {
          id: 'events-channels',
          moduleId: 'events',
          label: 'Canais de Venda',
          icon: <Share2 className="h-4 w-4 text-sky-400" />,
          requiredPermission: 'eventos.canais.visualizar'
        }
      ]
    },
    {
      title: 'EQUIPE & PRONTIDÃO',
      items: [
        {
          id: 'events-team',
          moduleId: 'events',
          label: 'Equipe & Escalas',
          icon: <Users className="h-4 w-4 text-indigo-400" />,
          requiredPermission: 'eventos.equipe.visualizar'
        },
        {
          id: 'events-documents',
          moduleId: 'events',
          label: 'Documentos do Evento',
          icon: <FileText className="h-4 w-4 text-cyan-400" />,
          requiredPermission: 'eventos.documentos.visualizar'
        },
        {
          id: 'events-tasks',
          moduleId: 'events',
          label: 'Pendências do Evento',
          icon: <CheckSquare className="h-4 w-4 text-amber-400" />,
          requiredPermission: 'eventos.pendencias.visualizar'
        },
        {
          id: 'events-readiness',
          moduleId: 'events',
          label: 'Central de Prontidão',
          icon: <Sparkles className="h-4 w-4 text-amber-300" />,
          requiredPermission: 'eventos.preparacao.visualizar'
        },
        {
          id: 'events-changes',
          moduleId: 'events',
          label: 'Central de Alterações',
          icon: <GitBranch className="h-4 w-4 text-orange-400" />,
          requiredPermission: 'eventos.alteracoes.visualizar'
        },
        {
          id: 'events-review-publication',
          moduleId: 'events',
          label: 'Revisão & Publicação',
          icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
          requiredPermission: 'eventos.lifecycle.review'
        }
      ]
    },
    {
      title: 'OPERAÇÃO AO VIVO & ENCERRAMENTO',
      items: [
        {
          id: 'events-checkin',
          moduleId: 'events',
          label: 'Check-in & Portaria',
          icon: <QrCode className="h-4 w-4 text-emerald-400" />,
          requiredPermission: 'eventos.checkin.operar'
        },
        {
          id: 'events-operation',
          moduleId: 'events',
          label: 'Operação ao Vivo',
          icon: <Zap className="h-4 w-4 text-amber-400" />,
          requiredPermission: 'eventos.operacao.visualizar'
        },
        {
          id: 'events-closure',
          moduleId: 'events',
          label: 'Encerramento de Sessões',
          icon: <Lock className="h-4 w-4 text-slate-400" />,
          requiredPermission: 'eventos.encerramento.sessao.encerrar'
        },
        {
          id: 'events-post-event',
          moduleId: 'events',
          label: 'Relatório Pós-Evento',
          icon: <FileSpreadsheet className="h-4 w-4 text-cyan-400" />,
          requiredPermission: 'eventos.pos_evento.visualizar'
        },
        {
          id: 'events-cancellation',
          moduleId: 'events',
          label: 'Gestão de Cancelamento',
          icon: <AlertTriangle className="h-4 w-4 text-rose-400" />,
          requiredPermission: 'eventos.cancelamento.solicitar'
        }
      ]
    },
    {
      title: 'MÓDULOS VINCULADOS AO EVENTO',
      items: [
        {
          id: 'finance-dashboard',
          moduleId: 'finance',
          label: 'Financeiro do Evento',
          icon: <DollarSign className="h-4 w-4 text-emerald-400" />,
          requiredPermission: 'financeiro.saldo.visualizar'
        },
        {
          id: 'marketing-dashboard',
          moduleId: 'marketing',
          label: 'Marketing do Evento',
          icon: <TrendingUp className="h-4 w-4 text-pink-400" />,
          requiredPermission: 'marketing.campanha.visualizar'
        },
        {
          id: 'commercial-orders',
          moduleId: 'commercial',
          label: 'Pedidos do Evento',
          icon: <ShoppingBag className="h-4 w-4 text-orange-400" />,
          requiredPermission: 'comercial.pedidos.visualizar'
        },
        {
          id: 'sac-dashboard',
          moduleId: 'sac',
          label: 'Atendimento SAC do Evento',
          icon: <MessageSquare className="h-4 w-4 text-cyan-400" />,
          requiredPermission: 'sac.consulta.acessar'
        }
      ]
    }
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-slate-800/80 bg-slate-950/95 transition-all duration-300 select-none ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
    >
      {/* Top Bar with Context Back Button and Expand Toggle */}
      <div className="flex h-12 items-center justify-between px-3 border-b border-slate-800/60">
        {isExpanded ? (
          <button
            onClick={onExitEventContext}
            title="Sair do contexto do evento e voltar ao catálogo geral"
            className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar aos Eventos</span>
          </button>
        ) : (
          <button
            onClick={onExitEventContext}
            title="Voltar aos Eventos"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-orange-400 hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={onToggleExpanded}
          title={isExpanded ? 'Recolher Menu' : 'Expandir Menu'}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
        >
          {isExpanded ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Active Event Mini Summary Card (When Expanded) */}
      {isExpanded && activeEvent && (
        <div className="p-3 mx-2 my-2 rounded-xl border border-slate-800 bg-slate-900/70 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-orange-400 tracking-wider truncate">
              {(activeEvent as any).publicCode || activeEvent.id || 'EVENTO ATIVO'}
            </span>
            <EventStatusBadge status={(activeEvent as any).status || 'PUBLISHED'} size="sm" />
          </div>

          <div
            className="font-bold text-xs text-white leading-tight truncate"
            title={activeEvent.title || (activeEvent as any).name}
          >
            {activeEvent.title || (activeEvent as any).name}
          </div>

          {(activeEvent as any).producerName && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
              <Building2 className="h-3 w-3 text-cyan-400 shrink-0" />
              <span className="truncate">{(activeEvent as any).producerName}</span>
            </div>
          )}

          {activeEvent.date && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Calendar className="h-3 w-3 text-orange-400 shrink-0" />
              <span>{activeEvent.date}</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {SECTIONS.map((sec) => {
          // Filter items by permission
          const visibleItems = sec.items.filter(
            (item) => !item.requiredPermission || hasPermission(item.requiredPermission)
          );

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
                  const isActive = activeSubItem === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.moduleId, item.id)}
                      title={!isExpanded ? item.label : undefined}
                      className={`group relative flex w-full items-center rounded-xl px-2.5 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-orange-500/15 text-orange-400 font-semibold shadow-sm'
                          : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-orange-500 shadow-sm shadow-orange-500/50" />
                      )}

                      <div
                        className={`flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'text-orange-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {item.icon}
                      </div>

                      {isExpanded && (
                        <div className="ml-3 flex flex-1 items-center justify-between overflow-hidden">
                          <span className="truncate text-left">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500/20 px-1 text-[10px] font-bold text-orange-400 border border-orange-500/30">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info displaying current User Profile and Scope */}
      {isExpanded && (
        <div className="p-3 border-t border-slate-800/60 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300 truncate">{currentUser.roleName}</span>
            <span className="text-[10px] font-mono text-cyan-400 uppercase">Contexto Evento</span>
          </div>
          <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
        </div>
      )}
    </aside>
  );
};
