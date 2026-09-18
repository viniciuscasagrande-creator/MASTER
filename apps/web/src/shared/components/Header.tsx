import React, { useState } from 'react';
import {
  Search,
  Bell,
  Activity,
  PlusCircle,
  Building2,
  Calendar,
  ChevronDown,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useScope } from '../../core/context/ScopeContext';
import { useCoreData } from '../../core/context/CoreDataContext';
import { Button } from './Button';
import { Badge } from './Badge';

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  onOpenAudit: () => void;
  onOpenNewSale: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenAudit,
  onOpenNewSale
}) => {
  const { user, setRole, allRoles } = useAuth();
  const {
    producers,
    selectedProducerId,
    selectedEventId,
    setSelectedProducerId,
    setSelectedEventId,
    availableEvents,
    resetScope
  } = useScope();
  const { notifications, auditLogs } = useCoreData();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isScopeDropdownOpen, setIsScopeDropdownOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const isFiltered = selectedProducerId !== 'all' || selectedEventId !== 'all';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/85 px-4 backdrop-blur-md">
      {/* Left: Brand & Live Indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-md shadow-orange-500/20">
            <span className="font-black tracking-tighter text-white text-base">DK</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">DISK INTERNO</span>
              <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400 border border-orange-500/20">
                PDT CORE
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Core v1.1 • Conectado</span>
            </div>
          </div>
        </div>

        {/* Global Context Selector (Producer & Event) */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
          {/* Producer selector */}
          <div className="flex items-center gap-1 px-2 text-xs text-slate-400">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedProducerId}
              onChange={(e) => setSelectedProducerId(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-slate-200">Todos os Produtores</option>
              {producers.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Event selector */}
          <div className="flex items-center gap-1 px-2 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="all" className="bg-slate-900 text-slate-200">Todos os Eventos</option>
              {availableEvents.map(e => (
                <option key={e.id} value={e.id} className="bg-slate-900 text-slate-200">
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          {isFiltered && (
            <button
              onClick={resetScope}
              title="Limpar filtros globais"
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={onOpenCommandPalette}
          className="flex h-9 w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 text-xs text-slate-400 transition-all hover:border-slate-700 hover:bg-slate-900/90"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Buscar pedidos, ingressos, clientes ou comandos...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Notifications, Audit & Role Switcher */}
      <div className="flex items-center gap-2.5">
        {/* Quick Simulator Button */}
        <Button
          onClick={onOpenNewSale}
          size="sm"
          variant="primary"
          icon={<PlusCircle className="h-3.5 w-3.5" />}
          className="hidden sm:inline-flex"
        >
          Simular Venda
        </Button>

        {/* Audit Trail Button */}
        <button
          onClick={onOpenAudit}
          title="Trilha de Auditoria Inter-Módulos"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white"
        >
          <Layers className="h-4 w-4" />
          {auditLogs.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-bold text-slate-950">
              {auditLogs.length}
            </span>
          )}
        </button>

        {/* Notifications Button */}
        <button
          onClick={onOpenNotifications}
          title="Notificações em Tempo Real"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="h-6 w-px bg-slate-800" />

        {/* User Profile & RBAC Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-900/40 p-1.5 text-left transition-colors hover:border-slate-700 hover:bg-slate-900"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-orange-400 border border-slate-700">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-slate-200 leading-none">{user.name}</div>
              <div className="text-[10px] text-orange-400 font-medium mt-0.5">{allRoles.find(r => r.role === user.role)?.label}</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Role selection dropdown */}
          {isRoleDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Simular Papel / Permissão (RBAC)
              </div>
              <div className="mt-1 space-y-1">
                {allRoles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      setRole(r.role);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`flex w-full items-start gap-2 rounded-lg p-2 text-left text-xs transition-colors ${
                      user.role === r.role
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30 font-medium'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold leading-tight">{r.label}</div>
                      <div className="text-[10px] text-slate-400">{r.department}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
