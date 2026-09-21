import React from 'react';
import { ChevronRight, Home, Building2, Calendar } from 'lucide-react';
import { useDiskContext } from '../../core/context/DiskContext';
import { cn } from '../utils/cn';

const MODULE_LABELS: Record<string, string> = {
  overview: 'Visão Geral',
  events: 'Eventos',
  commercial: 'Comercial',
  'event-support': 'Suporte Eventos',
  sac: 'Atendimento SAC',
  refunds: 'Estorno',
  finance: 'Financeiro',
  accounting: 'Contabilidade',
  marketing: 'Marketing',
  remarketing: 'Remarketing',
  admin: 'Administração',
  settings: 'Configurações',
  search: 'Central de Consulta',
  notifications: 'Notificações',
  approvals: 'Aprovações',
  documents: 'Documentos',
  tasks: 'Central de Trabalho'
};

const SUBITEM_LABELS: Record<string, string> = {
  // Financeiro
  'finance-hub': 'Hub Financeiro',
  'finance-event-balances': 'Saldos por Evento',
  'finance-transfers': 'Transferências',
  'finance-receivables-payables': 'Contas a Pagar/Receber',
  'finance-payouts': 'Repasses Programados',
  'finance-reports': 'Extrato da Conta',
  'finance-reconciliation': 'Conciliação',
  // Eventos
  'events-dashboard': 'Painel de Eventos',
  'events-all': 'Todos os Eventos',
  'events-create': 'Criar Evento',
  'events-venues': 'Locais & Plantas',
  'events-sessions': 'Sessões & Calendário',
  // Comercial
  'commercial-dashboard': 'Visão Geral',
  'commercial-orders': 'Central de Pedidos',
  'commercial-sales': 'Central de Vendas',
  'commercial-conditions': 'Condições & Taxas',
  'commercial-producers': 'Carteira de Produtores',
  // Suporte
  'support-dashboard': 'Painel Operacional',
  'support-war-room': 'Sala de Operações',
  'support-incidents': 'Incidentes',
  // SAC
  'sac-dashboard': 'Painel SAC',
  'sac-query-center': 'Central de Atendimento',
  'sac-queue': 'Fila de Atendimento',
  // Estorno
  'refunds-dashboard': 'Painel de Estornos',
  'refunds-approvals': 'Fila de Aprovação',
  'refunds-chargebacks': 'Chargebacks',
  // Admin
  'admin-dashboard': 'Painel Administrativo',
  'admin-users': 'Usuários & Perfis',
  'admin-permissions': 'Permissões',
  'admin-security': 'Segurança & 2FA',
  'admin-audit': 'Auditoria do Sistema',
  'config-parameters': 'Regras & Políticas'
};

interface AppBreadcrumbProps {
  activeModule: string;
  activeSubItem?: string;
  onNavigate: (moduleId: string, subItemId?: string) => void;
  className?: string;
}

export const AppBreadcrumb: React.FC<AppBreadcrumbProps> = ({
  activeModule,
  activeSubItem,
  onNavigate,
  className
}) => {
  const { activeProducer, activeEvent, clearProducer, clearEvent, isLockedToSingleProducer, isLockedToSingleEvent } = useDiskContext();

  const moduleName = MODULE_LABELS[activeModule] || activeModule;
  const subItemName = activeSubItem ? SUBITEM_LABELS[activeSubItem] || activeSubItem : undefined;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center justify-between px-4 sm:px-6 py-2 bg-slate-100/70 border-b border-slate-200/80 text-xs text-slate-600 overflow-x-auto select-none',
        className
      )}
    >
      <ol className="flex items-center gap-1.5 whitespace-nowrap">
        {/* Início (Root) */}
        <li className="flex items-center">
          <button
            onClick={() => onNavigate('overview', 'overview-main')}
            className="flex items-center gap-1 font-medium text-slate-600 hover:text-orange-600 transition-colors cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Início</span>
          </button>
        </li>

        {/* Produtor (if filtered and not in overview) */}
        {activeProducer && (
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <div className="flex items-center gap-1 text-slate-600">
              <Building2 className="h-3 w-3 text-orange-600" />
              <button
                onClick={() => onNavigate('events', 'events-all')}
                className="hover:text-orange-600 transition-colors font-medium max-w-[140px] truncate cursor-pointer"
              >
                {activeProducer.name}
              </button>
            </div>
          </li>
        )}

        {/* Evento (if selected) */}
        {activeEvent && (
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <div className="flex items-center gap-1 text-slate-600">
              <Calendar className="h-3 w-3 text-cyan-600" />
              <button
                onClick={() => onNavigate('events', 'events-dashboard')}
                className="hover:text-cyan-600 transition-colors font-medium max-w-[160px] truncate cursor-pointer"
              >
                {activeEvent.title}
              </button>
            </div>
          </li>
        )}

        {/* Module Segment */}
        {activeModule !== 'overview' && (
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <button
              onClick={() => onNavigate(activeModule)}
              className={cn(
                'font-medium transition-colors cursor-pointer',
                !subItemName ? 'font-bold text-slate-900' : 'text-slate-600 hover:text-orange-600'
              )}
            >
              {moduleName}
            </button>
          </li>
        )}

        {/* Sub-item Segment (if any) */}
        {subItemName && subItemName !== moduleName && activeSubItem !== `${activeModule}-main` && (
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
              {subItemName}
            </span>
          </li>
        )}

        {/* If Overview without sub-item */}
        {activeModule === 'overview' && !activeProducer && !activeEvent && (
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
              Visão Geral
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
};
