import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Filter,
  Search,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Lock,
  ExternalLink,
  Archive,
  RefreshCw,
  Sliders,
  Shield,
  Activity,
  Radio,
  Send,
  Building2,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useNotifications } from '../../core/context/NotificationContext';
import { useDiskContext } from '../../core/context/DiskContext';
import { NotificationItem, NotificationPriority } from '../../core/realtime/realtime.types';
import { formatDateTime } from '../../shared/utils/formatters';

interface NotificationCenterViewProps {
  onNavigate?: (moduleId: string, subItemId?: string) => void;
}

export const NotificationCenterView: React.FC<NotificationCenterViewProps> = ({ onNavigate }) => {
  const {
    notifications,
    unreadCount,
    connectionStatus,
    latencyMs,
    preferences,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    updatePreference,
    refreshNotifications,
    simulateIncomingNotification
  } = useNotifications();

  const { activeProducer, activeEvent } = useDiskContext();

  // Active top-level tab
  const [activeTab, setActiveTab] = useState<'alerts' | 'preferences' | 'rules'>('alerts');

  // Filters for alerts tab
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ' | 'ARCHIVED'>('ALL');

  // Stats
  const totalCount = notifications.length;
  const criticalCount = notifications.filter(n => n.priority === 'CRITICAL' || n.priority === 'HIGH').length;
  const readCount = notifications.filter(n => n.status === 'READ').length;

  // Filtered list
  const filteredNotifications = notifications.filter(n => {
    // Status filter
    if (statusFilter !== 'ALL' && n.status !== statusFilter) return false;

    // Module filter
    if (moduleFilter !== 'ALL' && n.module !== moduleFilter) return false;

    // Priority filter
    if (priorityFilter !== 'ALL' && n.priority !== priorityFilter) return false;

    // Search query
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchDesc = n.description.toLowerCase().includes(q);
      const matchRes = n.resourceId?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchRes) return false;
    }

    return true;
  });

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-400 border border-rose-500/30">
            <Flame className="h-3.5 w-3.5" />
            Crítico
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/30">
            <AlertTriangle className="h-3.5 w-3.5" />
            Alta
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-cyan-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-400 border border-cyan-500/30">
            Normal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Baixa
          </span>
        );
    }
  };

  const getModuleLabel = (module: string) => {
    const map: Record<string, string> = {
      FINANCE: 'Financeiro',
      EVENTS: 'Eventos',
      SAC: 'Atendimento SAC',
      REFUNDS: 'Estorno',
      COMMERCIAL: 'Comercial',
      SUPPORT: 'Suporte Eventos',
      MARKETING: 'Marketing',
      REMARKETING: 'Remarketing',
      SECURITY: 'Segurança',
      ACCOUNTING: 'Contabilidade'
    };
    return map[module] || module;
  };

  const handleAction = (notif: NotificationItem) => {
    if (notif.status === 'UNREAD') {
      markAsRead(notif.id);
    }

    if (notif.actionUrl && onNavigate) {
      const parts = notif.actionUrl.replace(/^\//, '').split('/');
      const mod = parts[0] || 'overview';
      const sub = parts[1] || `${mod}-main`;
      onNavigate(mod, sub);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-md shadow-orange-500/10">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Central de Notificações & Alertas
                <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/20">
                  REALTIME CORE
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Supervisão de eventos operacionais, SLAs, transferências financeiras e telemetria de segurança em tempo real.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => simulateIncomingNotification({
              title: 'Alerta Operacional Simulado',
              description: 'Demonstração de push em tempo real no canal seguro do produtor.',
              module: 'FINANCE',
              priority: 'HIGH'
            })}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Send className="h-3.5 w-3.5 text-orange-400" />
            <span>Simular Evento</span>
          </button>

          <button
            onClick={() => markAllAsRead()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Marcar Todas como Lidas</span>
          </button>

          <button
            onClick={() => refreshNotifications()}
            title="Atualizar lista"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total de Ocorrências</span>
            <Layers className="h-4 w-4 text-slate-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalCount}</span>
            <span className="text-[11px] text-slate-400">({readCount} lidas)</span>
          </div>
        </div>

        {/* Unread */}
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-orange-400">Alertas Não Lidos</span>
            <Bell className="h-4 w-4 text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-400">{unreadCount}</span>
            <span className="text-[11px] text-orange-300/80">requerem atenção</span>
          </div>
        </div>

        {/* Critical */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-400">Críticas / Alta Prioridade</span>
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400">{criticalCount}</span>
            <span className="text-[11px] text-rose-300/80">SLAs & Transferências</span>
          </div>
        </div>

        {/* Real-time Connection */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Motor de WebSocket</span>
            <Radio className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            {connectionStatus === 'CONNECTED' ? (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-bold text-emerald-400">Conectado ({latencyMs > 0 ? `${latencyMs}ms` : '<10ms'})</span>
              </>
            ) : connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING' ? (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-sm font-bold text-amber-400">Reconectando...</span>
              </>
            ) : (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                <span className="text-sm font-bold text-slate-400">Modo Standalone / Cache</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'alerts'
              ? 'border-orange-500 text-orange-400 bg-orange-500/5'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Alertas & Ocorrências</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-orange-500/20 px-1.5 text-[10px] font-bold text-orange-400">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'preferences'
              ? 'border-orange-500 text-orange-400 bg-orange-500/5'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Preferências de Notificação</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'rules'
              ? 'border-orange-500 text-orange-400 bg-orange-500/5'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Políticas de Disparo & Anti-Ruído (Core)</span>
        </button>
      </div>

      {/* TAB 1: ALERTS & EVENTS */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por texto, título, recurso ou palavra-chave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Module Filter */}
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none focus:border-orange-500"
              >
                <option value="ALL">Todos os Módulos</option>
                <option value="FINANCE">Financeiro</option>
                <option value="EVENTS">Eventos</option>
                <option value="SAC">Atendimento SAC</option>
                <option value="REFUNDS">Estorno</option>
                <option value="SUPPORT">Suporte Operacional</option>
                <option value="COMMERCIAL">Comercial</option>
                <option value="MARKETING">Marketing</option>
                <option value="SECURITY">Segurança</option>
                <option value="ACCOUNTING">Contabilidade</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none focus:border-orange-500"
              >
                <option value="ALL">Todas as Prioridades</option>
                <option value="CRITICAL">Crítica</option>
                <option value="HIGH">Alta</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Baixa</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none focus:border-orange-500"
              >
                <option value="ALL">Todos os Status</option>
                <option value="UNREAD">Apenas Não Lidas</option>
                <option value="READ">Lidas</option>
                <option value="ARCHIVED">Arquivadas</option>
              </select>
            </div>
          </div>

          {/* Notifications Card List */}
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const isUnread = notif.status === 'UNREAD';
              return (
                <div
                  key={notif.id}
                  className={`rounded-2xl border p-4 transition-all duration-150 ${
                    isUnread
                      ? 'border-slate-700/80 bg-slate-900/80 shadow-md hover:border-orange-500/40'
                      : 'border-slate-800/40 bg-slate-950/40 opacity-75 hover:opacity-100 hover:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      {/* Meta badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                          {getModuleLabel(notif.module)}
                        </span>
                        {getPriorityBadge(notif.priority)}

                        {notif.producerId && (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400 font-mono">
                            <Building2 className="h-3 w-3 text-orange-400" />
                            {notif.producerId}
                          </span>
                        )}

                        {notif.eventId && (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400 font-mono">
                            <Calendar className="h-3 w-3 text-cyan-400" />
                            {notif.eventId}
                          </span>
                        )}

                        {isUnread && (
                          <span className="rounded bg-orange-500/20 px-1.5 py-0.2 text-[10px] font-bold text-orange-400 border border-orange-500/30">
                            NÃO LIDA
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white leading-snug">
                        {notif.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                        {notif.description}
                      </p>

                      {notif.resourceId && (
                        <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>Recurso: <span className="text-slate-400 font-semibold">{notif.resourceType || 'OBJ'}#{notif.resourceId}</span></span>
                          {notif.groupKey && <span>• Agrupamento: {notif.groupKey}</span>}
                        </div>
                      )}
                    </div>

                    {/* Actions on right */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatDateTime(notif.createdAt)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {notif.actionUrl && (
                          <button
                            onClick={() => handleAction(notif)}
                            className="flex items-center gap-1 rounded-xl bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 transition-colors"
                          >
                            <span>Acessar</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}

                        {isUnread && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            title="Marcar como lida"
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => archiveNotification(notif.id)}
                          title="Arquivar ocorrência"
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredNotifications.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-400/40 mx-auto" />
                <h4 className="text-sm font-semibold text-white">Nenhuma notificação encontrada</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Todos os alertas para os filtros selecionados foram processados ou estão arquivados.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-bold text-white">Canais de Entrega & Matriz de Preferências</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalize como você deseja ser alertado para cada área operacional. Alertas críticos de segurança e auditoria são protegidos por conformidade.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Módulo Operacional</th>
                    <th className="py-3 px-4 text-center">In-App (Sino & Drawer)</th>
                    <th className="py-3 px-4 text-center">E-mail Corporativo</th>
                    <th className="py-3 px-4 text-center">Push Navegador</th>
                    <th className="py-3 px-4 text-center">SMS / WhatsApp</th>
                    <th className="py-3 px-4 text-right">Status de Política</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {preferences.map((pref) => {
                    const isMandatory = pref.mandatory || pref.module === 'SECURITY';
                    return (
                      <tr key={pref.module} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-sans font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>{getModuleLabel(pref.module)}</span>
                            {isMandatory && (
                              <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.2 text-[9px] font-bold text-rose-400 border border-rose-500/20 font-sans">
                                <Lock className="h-2.5 w-2.5" />
                                Obrigatório
                              </span>
                            )}
                          </div>
                        </td>

                        {/* InApp */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={pref.inApp}
                            disabled={isMandatory}
                            onChange={(e) => updatePreference(pref.module, 'inApp', e.target.checked)}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-0 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={pref.email}
                            disabled={isMandatory}
                            onChange={(e) => updatePreference(pref.module, 'email', e.target.checked)}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-0 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>

                        {/* Push */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={pref.push}
                            disabled={isMandatory}
                            onChange={(e) => updatePreference(pref.module, 'push', e.target.checked)}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-0 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>

                        {/* SMS */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={pref.sms}
                            disabled={isMandatory}
                            onChange={(e) => updatePreference(pref.module, 'sms', e.target.checked)}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-0 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>

                        {/* Policy info */}
                        <td className="py-3.5 px-4 text-right font-sans text-[11px]">
                          {isMandatory ? (
                            <span className="text-amber-400 font-medium">Bloqueado por Compliance</span>
                          ) : (
                            <span className="text-emerald-400 font-medium">Customizável</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISPATCH RULES & ANTI-NOISE POLICIES */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-bold text-white">Regras de Negócio do Motor Central & Janelas Anti-Ruído</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Políticas ativas no Node.js EventBus. Notificações redundantes com a mesma chave de agrupamento são condensadas para prevenir fadiga de alertas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rule 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">RULE_FINANCE_TRANSFER_HIGH_VALUE</span>
                <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20">
                  CRÍTICO
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Dispara notificação imediata quando uma transferência bancária ou repasse ultrapassa o teto operacional de R$ 50.000,00.
              </p>
              <div className="text-[11px] text-slate-500 font-mono space-y-0.5 pt-1 border-t border-slate-800">
                <div>Perfis: ADMIN_GERAL, DIRETORIA_FINANCEIRA</div>
                <div>Janela Anti-Ruído: 0 min (Entrega Imediata)</div>
                <div>Requer Step-Up: Sim</div>
              </div>
            </div>

            {/* Rule 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">RULE_SAC_SLA_BREACH</span>
                <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                  ALTA
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Alerta supervisores e atendentes caso um ticket permaneça em espera sem resposta por mais de 30 minutos.
              </p>
              <div className="text-[11px] text-slate-500 font-mono space-y-0.5 pt-1 border-t border-slate-800">
                <div>Perfis: ADMIN_GERAL, ATENDIMENTO_SAC</div>
                <div>Janela Anti-Ruído: 10 min por ticket</div>
                <div>Template: Template SAC SLA Warning</div>
              </div>
            </div>

            {/* Rule 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">RULE_EVENT_CAPACITY_ALERT</span>
                <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/20">
                  NORMAL
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Notifica produtores e gestores quando a ocupação do evento ou setor ultrapassa 90% da capacidade permitida.
              </p>
              <div className="text-[11px] text-slate-500 font-mono space-y-0.5 pt-1 border-t border-slate-800">
                <div>Perfis: ADMIN_GERAL, GERENTE_EVENTOS, PRODUTOR</div>
                <div>Janela Anti-Ruído: 15 min por setor</div>
                <div>Escopo: Estritamente filtrado por produtor e evento</div>
              </div>
            </div>

            {/* Rule 4 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">RULE_SECURITY_BRUTE_FORCE</span>
                <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20">
                  CRÍTICO
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Alerta de telemetria imediato para detecção de credenciais forçadas (mais de 5 tentativas inválidas consecutivas).
              </p>
              <div className="text-[11px] text-slate-500 font-mono space-y-0.5 pt-1 border-t border-slate-800">
                <div>Perfis: ADMIN_GERAL</div>
                <div>Janela Anti-Ruído: 5 min por IP de origem</div>
                <div>Status: Bloqueio automático de IP ativo</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
