import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  ExternalLink,
  Archive,
  Wifi,
  WifiOff,
  Flame,
  Check,
  SlidersHorizontal
} from 'lucide-react';
import { useNotifications } from '../../core/context/NotificationContext';
import { NotificationItem, NotificationPriority } from '../../core/realtime/realtime.types';
import { formatDateTime } from '../utils/formatters';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (moduleId: string, subItemId?: string) => void;
  onOpenFullCenter?: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenFullCenter
}) => {
  const {
    notifications,
    unreadCount,
    connectionStatus,
    latencyMs,
    markAsRead,
    markAllAsRead,
    archiveNotification
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'critical'>('unread');

  if (!isOpen) return null;

  // Filter notifications based on tab
  const filteredNotifications = notifications.filter(item => {
    if (item.status === 'ARCHIVED') return false;
    if (activeTab === 'unread') return item.status === 'UNREAD';
    if (activeTab === 'critical') return item.priority === 'CRITICAL' || item.priority === 'HIGH';
    return true;
  });

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 border border-rose-500/20">
            <Flame className="h-3 w-3" />
            Crítico
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            Alta
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/20">
            Normal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
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

  const handleActionClick = (notif: NotificationItem) => {
    if (notif.status === 'UNREAD') {
      markAsRead(notif.id);
    }

    if (notif.actionUrl) {
      const parts = notif.actionUrl.replace(/^\//, '').split('/');
      const mod = parts[0] || 'overview';
      const sub = parts[1] || `${mod}-main`;
      onNavigate(mod, sub);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md h-full border-l border-slate-800 bg-slate-950 p-6 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white leading-tight">
                  Notificações & Alertas
                </h2>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                {connectionStatus === 'CONNECTED' ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 font-mono text-[10px]">WebSocket Ativo ({latencyMs > 0 ? `${latencyMs}ms` : '<10ms'})</span>
                  </>
                ) : connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING' ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-400 font-mono text-[10px]">Conectando...</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                    <span className="text-slate-500 font-mono text-[10px]">Offline (Modo Cache)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => markAllAsRead()}
              title="Marcar todas como lidas"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-800/80 py-2.5">
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'unread'
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <span>Não Lidas</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-orange-500/20 px-1.5 text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('critical')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'critical'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            Críticas / Altas
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            Todas
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {filteredNotifications.map((notif) => {
            const isUnread = notif.status === 'UNREAD';
            return (
              <div
                key={notif.id}
                className={`rounded-xl border p-3.5 space-y-2 transition-all group ${
                  isUnread
                    ? 'border-slate-700/80 bg-slate-900/90 shadow-sm hover:border-orange-500/40'
                    : 'border-slate-800/40 bg-slate-950/60 opacity-70 hover:opacity-100 hover:border-slate-800'
                }`}
              >
                {/* Meta header: Module + Priority + Timestamp */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                      {getModuleLabel(notif.module)}
                    </span>
                    {getPriorityBadge(notif.priority)}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatDateTime(notif.createdAt)}
                    </span>
                    {isUnread && (
                      <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0 ml-1" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-xs font-semibold text-white leading-snug">
                    {notif.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {notif.description}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
                  {notif.actionUrl ? (
                    <button
                      onClick={() => handleActionClick(notif)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300 hover:underline"
                    >
                      <span>Acessar no Módulo</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    {isUnread && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        title="Marcar como lida"
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-[10px] flex items-center gap-1 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span className="text-[10px]">Lida</span>
                      </button>
                    )}
                    <button
                      onClick={() => archiveNotification(notif.id)}
                      title="Arquivar notificação"
                      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-[10px] transition-colors"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredNotifications.length === 0 && (
            <div className="py-16 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto opacity-40" />
              <p className="text-xs font-medium text-slate-400">
                {activeTab === 'unread'
                  ? 'Você não tem alertas pendentes no momento.'
                  : 'Nenhuma notificação encontrada nesta categoria.'}
              </p>
              <p className="text-[11px] text-slate-600">
                Novos eventos operacionais aparecerão automaticamente em tempo real.
              </p>
            </div>
          )}
        </div>

        {/* Footer with link to Full Notification Hub */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          {onOpenFullCenter && (
            <button
              onClick={() => {
                onClose();
                onOpenFullCenter();
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-all"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-orange-400" />
              <span>Abrir Central Completa de Notificações</span>
            </button>
          )}

          <div className="text-[10px] text-slate-500 text-center font-mono">
            EventBus Central • Node.js WebSocket /realtime
          </div>
        </div>
      </div>
    </div>
  );
};
