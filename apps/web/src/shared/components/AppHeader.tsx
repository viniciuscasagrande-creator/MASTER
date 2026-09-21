import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Layers,
  Menu,
  ChevronDown,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useCoreData } from '../../core/context/CoreDataContext';
import { useNotifications } from '../../core/context/NotificationContext';
import { ThemeToggle } from '../../core/context/ThemeContext';
import { cn } from '../utils/cn';

interface AppHeaderProps {
  onToggleMobileSidebar?: () => void;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  onOpenAudit: () => void;
  onOpenNewSale: () => void;
  onNavigateToAdmin?: () => void;
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onToggleMobileSidebar,
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenAudit,
  onOpenNewSale,
  onNavigateToAdmin,
  className
}) => {
  const { currentUser, users, switchUser, logout, hasPermission } = useAuth();
  const { auditLogs } = useCoreData();
  const { unreadCount, connectionStatus, toastNotification, dismissToast } = useNotifications();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={cn('sticky top-0 z-30 flex flex-col w-full border-b border-slate-200/90 bg-white dark:bg-slate-900 dark:border-slate-800 select-none shadow-2xs', className)}>
      {/* Main Bar */}
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 gap-4">
        {/* Left: Mobile hamburger + System Status Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Abrir Menu Lateral"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                connectionStatus === 'CONNECTED'
                  ? 'bg-emerald-500'
                  : connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-slate-400'
              }`}
              title={connectionStatus === 'CONNECTED' ? 'Sistema Online e Integrado' : 'Conectando...'}
            />
            <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-300">
              Disk MASTER
            </span>
          </div>
        </div>

        {/* Center: Global Search Bar (Matching Reference Image) */}
        <div className="flex-1 max-w-xl mx-auto">
          <button
            onClick={onOpenCommandPalette}
            title="Buscar no sistema (Ctrl + K)"
            className="flex h-9 w-full items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 text-xs text-slate-500 transition-all hover:border-slate-300 hover:bg-white hover:shadow-xs dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:border-slate-600 cursor-pointer"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Buscar clientes, pedidos, atendimentos...</span>
            </div>
            <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500 shadow-2xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 shrink-0">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right: Theme Toggle + Audit + Notifications + User Avatar */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Segmented Theme Switcher [ Claro | Escuro | Sistema ] */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Audit Logs button */}
          <button
            onClick={onOpenAudit}
            title="Trilha de Auditoria Inter-Módulos"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-slate-50 text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
          >
            <Layers className="h-4 w-4" />
            {auditLogs.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF7A00] px-1 text-[9px] font-bold text-white shadow-xs">
                {auditLogs.length}
              </span>
            )}
          </button>

          {/* Notifications button */}
          <button
            onClick={onOpenNotifications}
            title="Notificações em Tempo Real"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-slate-50 text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block" />

          {/* User Persona Switcher */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 p-1.5 text-left transition-all hover:border-slate-300 hover:bg-white hover:shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/80 cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-xs font-bold text-orange-700 border border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800/50">
                {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'JS'}
              </div>
              <div className="hidden md:block pr-1">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[110px]">
                  {currentUser.name || 'João Silva'}
                </div>
                <div className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold mt-0.5">
                  {currentUser.roleName || 'Administrador'}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-2 shadow-2xl z-50 animate-in fade-in duration-150">
                <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Simular Perfil / Usuário</span>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-mono">RBAC</span>
                </div>

                <div className="mt-1.5 space-y-1 max-h-72 overflow-y-auto">
                  {users.map((u) => {
                    const isCurrent = currentUser.id === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setIsUserDropdownOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-start gap-2.5 rounded-xl p-2 text-left text-xs transition-colors cursor-pointer',
                          isCurrent
                            ? 'bg-orange-50 text-orange-700 border border-orange-200 font-medium dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                        )}
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-700 mt-0.5 border border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">
                          {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">{u.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{u.roleName}</div>
                          <div className="text-[9px] text-cyan-700 dark:text-cyan-400 font-mono mt-0.5">
                            Escopo: {u.scope.type}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between px-1">
                  {hasPermission('admin.usuarios.visualizar') && onNavigateToAdmin && (
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onNavigateToAdmin();
                      }}
                      className="text-[11px] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-orange-600" />
                      Painel Admin
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      logout();
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Realtime Alert Toast Banner (if any) */}
      {toastNotification && (
        <div className="flex items-center justify-between px-4 py-2 bg-orange-50 border-t border-b border-orange-200 text-xs text-slate-800 dark:bg-orange-950/40 dark:border-orange-900 dark:text-slate-200">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping shrink-0" />
            <span className="font-bold text-orange-700 dark:text-orange-400 shrink-0">[{toastNotification.module}]</span>
            <span className="font-bold text-slate-900 dark:text-white truncate">{toastNotification.title}:</span>
            <span className="text-slate-600 dark:text-slate-300 truncate max-w-lg hidden sm:inline">{toastNotification.description}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              onClick={() => {
                dismissToast();
                onOpenNotifications();
              }}
              className="px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-800 hover:bg-orange-200 text-[11px] font-bold border border-orange-200 transition-colors cursor-pointer dark:bg-orange-900/60 dark:text-orange-200 dark:border-orange-700"
            >
              Ver Alerta
            </button>
            <button
              onClick={dismissToast}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
