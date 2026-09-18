import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Activity,
  PlusCircle,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  Lock,
  LogOut,
  UserCheck,
  Users,
  Check,
  Filter
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { useDiskContext } from '../../core/context/DiskContext';
import { useCoreData } from '../../core/context/CoreDataContext';
import { Button } from './Button';
import { Badge } from './Badge';

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  onOpenAudit: () => void;
  onOpenNewSale: () => void;
  onNavigateToAdmin?: () => void;
  activeModuleName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenAudit,
  onOpenNewSale,
  onNavigateToAdmin,
  activeModuleName = 'Visão Geral'
}) => {
  const { currentUser, users, switchUser, logout, hasPermission } = useAuth();
  const {
    activeProducer,
    activeEvent,
    selectedProducerId,
    selectedEventId,
    availableProducers,
    availableEvents,
    isLockedToSingleProducer,
    isLockedToSingleEvent,
    setProducer,
    setEvent,
    clearProducer,
    clearEvent,
    resetScope
  } = useDiskContext();

  const { notifications, auditLogs } = useCoreData();

  // Dropdown popover states
  const [isProducerPopoverOpen, setIsProducerPopoverOpen] = useState(false);
  const [isEventPopoverOpen, setIsEventPopoverOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Search filters inside popovers
  const [producerSearch, setProducerSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');

  const producerPopoverRef = useRef<HTMLDivElement>(null);
  const eventPopoverRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (producerPopoverRef.current && !producerPopoverRef.current.contains(e.target as Node)) {
        setIsProducerPopoverOpen(false);
      }
      if (eventPopoverRef.current && !eventPopoverRef.current.contains(e.target as Node)) {
        setIsEventPopoverOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const isFiltered = selectedProducerId !== 'all' || selectedEventId !== 'all';

  const filteredProducers = availableProducers.filter(p =>
    p.name.toLowerCase().includes(producerSearch.toLowerCase()) ||
    p.cnpj.toLowerCase().includes(producerSearch.toLowerCase())
  );

  const filteredEvents = availableEvents.filter(e =>
    e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
    e.venue.toLowerCase().includes(eventSearch.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-30 flex flex-col w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      {/* Top Bar: Brand, Global Search, Popover Selectors, Actions, Persona */}
      <div className="flex h-16 w-full items-center justify-between px-4">
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
                <span>Node Core Real • v1.1.5</span>
              </div>
            </div>
          </div>

          {/* Global Popover Selector (Producer & Event) */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/70 p-1">
            {/* Searchable Producer Popover */}
            <div className="relative" ref={producerPopoverRef}>
              <button
                onClick={() => !isLockedToSingleProducer && setIsProducerPopoverOpen(!isProducerPopoverOpen)}
                disabled={isLockedToSingleProducer}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  isProducerPopoverOpen
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                } ${isLockedToSingleProducer ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
              >
                <Building2 className="h-3.5 w-3.5 text-orange-400" />
                <span className="max-w-[140px] truncate">
                  {activeProducer ? activeProducer.name : 'Todas as Produtoras'}
                </span>
                {isLockedToSingleProducer ? (
                  <span title="Escopo travado à sua organização" className="text-amber-400 ml-1">
                    <Lock className="h-3 w-3" />
                  </span>
                ) : (
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                )}
              </button>

              {isProducerPopoverOpen && !isLockedToSingleProducer && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in duration-150">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar produtores..."
                      value={producerSearch}
                      onChange={(e) => setProducerSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1">
                    <button
                      onClick={() => {
                        setProducer('all');
                        setIsProducerPopoverOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left transition-colors ${
                        selectedProducerId === 'all'
                          ? 'bg-orange-500/15 text-orange-400 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>Todas as Produtoras (Visão Geral)</span>
                      {selectedProducerId === 'all' && <Check className="h-3.5 w-3.5" />}
                    </button>

                    {filteredProducers.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setProducer(p.id);
                          setIsProducerPopoverOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs text-left transition-colors ${
                          selectedProducerId === p.id
                            ? 'bg-orange-500/15 text-orange-400 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="overflow-hidden pr-2">
                          <div className="font-medium text-white truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.cnpj}</div>
                        </div>
                        {selectedProducerId === p.id && <Check className="h-3.5 w-3.5 text-orange-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-800" />

            {/* Searchable Event Popover */}
            <div className="relative" ref={eventPopoverRef}>
              <button
                onClick={() => !isLockedToSingleEvent && setIsEventPopoverOpen(!isEventPopoverOpen)}
                disabled={isLockedToSingleEvent}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  isEventPopoverOpen
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                } ${isLockedToSingleEvent ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
              >
                <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                <span className="max-w-[170px] truncate">
                  {activeEvent ? activeEvent.title : 'Todos os Eventos'}
                </span>
                {isLockedToSingleEvent ? (
                  <span title="Escopo travado ao seu evento" className="text-amber-400 ml-1">
                    <Lock className="h-3 w-3" />
                  </span>
                ) : (
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                )}
              </button>

              {isEventPopoverOpen && !isLockedToSingleEvent && (
                <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in duration-150">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar eventos..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1">
                    <button
                      onClick={() => {
                        setEvent('all');
                        setIsEventPopoverOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left transition-colors ${
                        selectedEventId === 'all'
                          ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>Todos os Eventos do Produtor</span>
                      {selectedEventId === 'all' && <Check className="h-3.5 w-3.5" />}
                    </button>

                    {filteredEvents.map(e => (
                      <button
                        key={e.id}
                        onClick={() => {
                          setEvent(e.id);
                          setIsEventPopoverOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs text-left transition-colors ${
                          selectedEventId === e.id
                            ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="overflow-hidden pr-2">
                          <div className="font-medium text-white truncate">{e.title}</div>
                          <div className="text-[10px] text-slate-400 truncate">{e.venue}</div>
                        </div>
                        {selectedEventId === e.id && <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isFiltered && !isLockedToSingleProducer && (
              <button
                onClick={resetScope}
                title="Limpar filtros operacionais globais"
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ml-1"
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

        {/* Right: Actions, Notifications, Audit & Persona Switcher */}
        <div className="flex items-center gap-2.5">
          <Button
            onClick={onOpenNewSale}
            size="sm"
            variant="primary"
            icon={<PlusCircle className="h-3.5 w-3.5" />}
            className="hidden sm:inline-flex"
          >
            Simular Venda
          </Button>

          {/* Audit Trail Slide-over button */}
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

          {/* Notifications button */}
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

          {/* User Persona Switcher */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-900/40 p-1.5 text-left transition-colors hover:border-slate-700 hover:bg-slate-900"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-orange-400 border border-slate-700">
                {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-semibold text-slate-200 leading-none">{currentUser.name}</div>
                <div className="text-[10px] text-orange-400 font-medium mt-0.5 flex items-center gap-1">
                  <span>{currentUser.roleName}</span>
                  {currentUser.twoFactorEnforced && (
                    <span className="rounded bg-cyan-500/10 px-1 text-[8px] font-bold text-cyan-400 border border-cyan-500/20">
                      2FA
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in duration-150">
                <div className="px-2 py-1.5 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Simular Perfil / Usuário</span>
                  <span className="text-[10px] text-orange-400 font-mono">Fase 1.1.5</span>
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
                        className={`flex w-full items-start gap-2.5 rounded-xl p-2 text-left text-xs transition-colors ${
                          isCurrent
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30 font-medium'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300 mt-0.5 border border-slate-700">
                          {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-semibold text-white leading-tight truncate">{u.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{u.roleName}</div>
                          <div className="text-[9px] text-cyan-400 font-mono mt-0.5">
                            Escopo: {u.scope.type} {u.scope.producerIds.length > 0 ? `(${u.scope.producerIds.join(',')})` : ''}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between px-1">
                  {hasPermission('admin.usuarios.visualizar') && onNavigateToAdmin && (
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onNavigateToAdmin();
                      }}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-orange-400" />
                      Painel Admin
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      logout();
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 ml-auto"
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

      {/* Operational Breadcrumb Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950/90 border-t border-slate-800/40 text-[11px] text-slate-400 overflow-x-auto select-none">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="font-bold text-slate-300">Disk Interno</span>
          <ChevronRight className="h-3 w-3 text-slate-600" />

          {/* Producer Segment */}
          {activeProducer ? (
            <div className="flex items-center gap-1 text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
              <Building2 className="h-3 w-3" />
              <span>{activeProducer.name}</span>
              {!isLockedToSingleProducer && (
                <button
                  onClick={clearProducer}
                  title="Remover filtro de produtora"
                  className="hover:text-white ml-0.5"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <span className="text-slate-400">Todas as Produtoras</span>
          )}

          <ChevronRight className="h-3 w-3 text-slate-600" />

          {/* Event Segment */}
          {activeEvent ? (
            <div className="flex items-center gap-1 text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
              <Calendar className="h-3 w-3" />
              <span>{activeEvent.title}</span>
              {!isLockedToSingleEvent && (
                <button
                  onClick={clearEvent}
                  title="Remover filtro de evento"
                  className="hover:text-white ml-0.5"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <span className="text-slate-400">Todos os Eventos</span>
          )}

          <ChevronRight className="h-3 w-3 text-slate-600" />

          {/* Active Module Segment */}
          <span className="font-semibold text-white">{activeModuleName}</span>
        </div>

        {/* Active Context Indicators */}
        <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] text-slate-500">
          <span>Produtores: {availableProducers.length}</span>
          <span>•</span>
          <span>Eventos Ativos: {availableEvents.length}</span>
          {isFiltered && (
            <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
              Filtro Ativo
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
