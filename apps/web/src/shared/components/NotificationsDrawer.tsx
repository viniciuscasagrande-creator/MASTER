import React from 'react';
import { X, Bell, CheckCheck, AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { formatDateTime } from '../utils/formatters';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (moduleId: string, subItemId?: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useCoreData();

  if (!isOpen) return null;

  const getIcon = (type: string, severity: string) => {
    if (severity === 'critical' || severity === 'warning') {
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    }
    if (severity === 'success') {
      return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    }
    return <Info className="h-4 w-4 text-cyan-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md h-full border-l border-slate-800 bg-slate-950 p-6 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                Notificações em Tempo Real
              </h2>
              <p className="text-[11px] text-slate-400">
                Alertas operacionais, vendas, estornos e portaria
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsAsRead}
              title="Marcar todas como lidas"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationAsRead(notif.id)}
              className={`rounded-xl border p-3.5 space-y-1.5 transition-all cursor-pointer ${
                notif.read
                  ? 'border-slate-800/60 bg-slate-900/30 opacity-70'
                  : 'border-slate-800 bg-slate-900/80 shadow-sm hover:border-orange-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIcon(notif.type, notif.severity)}
                  <span className="text-xs font-semibold text-white">
                    {notif.title}
                  </span>
                </div>
                {!notif.read && (
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                )}
              </div>

              <p className="text-xs text-slate-300">
                {notif.description}
              </p>

              <div className="text-[10px] text-slate-500 font-mono">
                {formatDateTime(notif.timestamp)}
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-500">
              Nenhuma notificação recente.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Eventos transmitidos via WebSocket / EventBus Central
        </div>
      </div>
    </div>
  );
};
