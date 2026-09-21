import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Layers,
  PlusCircle,
  Menu,
  ChevronDown,
  ShieldCheck,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useCoreData } from '../../core/context/CoreDataContext';
import { useNotifications } from '../../core/context/NotificationContext';
import { Button } from './Button';
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
    <header className={cn('sticky top-0 z-30 flex flex-col w-full border-b border-slate-200 bg-white shadow-2xs select-none', className)}>
      {/* Main Bar */}
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile hamburger + Disk Interno brand */}
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              title="Abrir Menu Lateral"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-slate-900">
                  Disk Interno
                </span>
                <span className="hidden sm:inline-flex rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 border border-orange-200">
                  PDT CORE
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    connectionStatus === 'CONNECTED'
                      ? 'bg-emerald-500 animate-pulse'
                      : connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="truncate">
                  {connectionStatus === 'CONNECTED' ? 'Realtime Conectado' : 'Node Core Real'} • v1.1.5
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            onClick={onOpenCommandPalette}
            title="Buscar no sistema (Ctrl + K)"
            className="flex h-9 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-500 transition-all hover:border-slate-300 hover:bg-white hover:shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">Buscar pedidos, ingressos, clientes ou comandos...</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500 shadow-2xs">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Notifications, Audit, User Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Search icon on small screens */}
          <button
            onClick={onOpenCommandPalette}
            title="Buscar no sistema"
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white transition-colors cursor-pointer"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Quick Action: Simular Venda */}
          <button
            onClick={onOpenNewSale}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-orange-600 transition-colors cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Simular Venda</span>
          </button>

          {/* Audit Logs button */}
          <button
            onClick={onOpenAudit}
            title="Trilha de Auditoria Inter-Módulos"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 shadow-2xs cursor-pointer"
          >
            <Layers className="h-4 w-4" />
            {auditLogs.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-600 px-1 text-[9px] font-bold text-white shadow-xs">
                {auditLogs.length}
              </span>
            )}
          </button>

          {/* Notifications button */}
          <button
            onClick={onOpenNotifications}
            title="Notificações em Tempo Real"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 shadow-2xs cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[9px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* User Persona Switcher */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-1.5 text-left transition-all hover:border-slate-300 hover:bg-white hover:shadow-xs cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-xs font-bold text-orange-700 border border-orange-200">
                {currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="hidden md:block pr-1">
                <div className="text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-orange-600 font-semibold mt-0.5">
                  {currentUser.roleName}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in duration-150">
                <div className="px-2 py-1.5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Simular Perfil / Usuário</span>
                  <span className="text-[10px] text-orange-600 font-mono">RBAC</span>
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
                            ? 'bg-orange-50 text-orange-700 border border-orange-200 font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-700 mt-0.5 border border-slate-200">
                          {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-slate-900 leading-tight truncate">{u.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{u.roleName}</div>
                          <div className="text-[9px] text-cyan-700 font-mono mt-0.5">
                            Escopo: {u.scope.type}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between px-1">
                  {hasPermission('admin.usuarios.visualizar') && onNavigateToAdmin && (
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onNavigateToAdmin();
                      }}
                      className="text-[11px] text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer"
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
        <div className="flex items-center justify-between px-4 py-2 bg-orange-50 border-t border-b border-orange-200 text-xs text-slate-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping shrink-0" />
            <span className="font-bold text-orange-700 shrink-0">[{toastNotification.module}]</span>
            <span className="font-bold text-slate-900 truncate">{toastNotification.title}:</span>
            <span className="text-slate-600 truncate max-w-lg hidden sm:inline">{toastNotification.description}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              onClick={() => {
                dismissToast();
                onOpenNotifications();
              }}
              className="px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-800 hover:bg-orange-200 text-[11px] font-bold border border-orange-200 transition-colors cursor-pointer"
            >
              Ver Alerta
            </button>
            <button
              onClick={dismissToast}
              className="text-slate-400 hover:text-slate-700 text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
