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
import { useNotifications } from '../../core/context/NotificationContext';
import { Button } from './Button';
import { Badge } from './Badge';

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  onOpenAudit: () => void;
  onOpenNewSale: () => void;
  onNavigateToAdmin?: () => void;
  onNavigate?: (moduleId: string, subItemId?: string) => void;
  activeModuleName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenAudit,
  onOpenNewSale,
  onNavigateToAdmin,
  onNavigate,
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

  const { auditLogs } = useCoreData();
  const { unreadCount, connectionStatus, toastNotification, dismissToast } = useNotifications();

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
    <header className="sticky top-0 z-30 flex flex-col w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
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
                <span className="text-sm font-black tracking-tight text-slate-900">DISK INTERNO</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className={`h-1.5 w-1.5 rounded-full ${
                  connectionStatus === 'CONNECTED'
                    ? 'bg-emerald-500 animate-pulse'
                    : connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-slate-400'
                }`} />
                <span>Gestão Operacional</span>
              </div>
            </div>
          </div>

          {/* Global Popover Selector (Producer & Event) */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
            {/* Searchable Producer Popover */}
            <div className="relative" ref={producerPopoverRef}>
              <button
                onClick={() => !isLockedToSingleProducer && setIsProducerPopoverOpen(!isProducerPopoverOpen)}
                disabled={isLockedToSingleProducer}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  isProducerPopoverOpen
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-700 hover:bg-white/80 hover:text-slate-900'
                } ${isLockedToSingleProducer ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
              >
                <Building2 className="h-3.5 w-3.5 text-orange-600" />
                <span className="max-w-[140px] truncate">
                  {activeProducer ? activeProducer.name : 'Todas as Produtoras'}
                </span>
                {isLockedToSingleProducer ? (
                  <span title="Escopo travado à sua organização" className="text-amber-600 ml-1">
                    <Lock className="h-3 w-3" />
                  </span>
                ) : (
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                )}
              </button>

              {isProducerPopoverOpen && !isLockedToSingleProducer && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in duration-150">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar produtores..."
                      value={producerSearch}
                      onChange={(e) => setProducerSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-orange-500 focus:bg-white"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1">
                    <button
                      onClick={() => {
                        setProducer('all');
                        setIsProducerPopoverOpen(false);
                        if (onNavigate) onNavigate('overview', 'overview-main');
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left transition-colors ${
                        selectedProducerId === 'all'
                          ? 'bg-orange-50 text-orange-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>Todas as Produtoras (Visão Geral)</span>
                      {selectedProducerId === 'all' && <Check className="h-3.5 w-3.5 text-orange-600" />}
                    </button>

                    {filteredProducers.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setProducer(p.id);
                          setIsProducerPopoverOpen(false);
                          if (onNavigate) onNavigate('events', 'events-all');
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs text-left transition-colors ${
                          selectedProducerId === p.id
                            ? 'bg-orange-50 text-orange-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="overflow-hidden pr-2">
                          <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{p.cnpj}</div>
                        </div>
                        {selectedProducerId === p.id && <Check className="h-3.5 w-3.5 text-orange-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-300" />

            {/* Searchable Event Popover */}
            <div className="relative" ref={eventPopoverRef}>
              <button
                onClick={() => !isLockedToSingleEvent && setIsEventPopoverOpen(!isEventPopoverOpen)}
                disabled={isLockedToSingleEvent}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  isEventPopoverOpen
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-700 hover:bg-white/80 hover:text-slate-900'
                } ${isLockedToSingleEvent ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
              >
                <Calendar className="h-3.5 w-3.5 text-cyan-600" />
                <span className="max-w-[170px] truncate">
                  {activeEvent ? activeEvent.title : 'Todos os Eventos'}
                </span>
                {isLockedToSingleEvent ? (
                  <span title="Escopo travado ao seu evento" className="text-amber-600 ml-1">
                    <Lock className="h-3 w-3" />
                  </span>
                ) : (
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                )}
              </button>

              {isEventPopoverOpen && !isLockedToSingleEvent && (
                <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in duration-150">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar eventos..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:bg-white"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1">
                    <button
                      onClick={() => {
                        setEvent('all');
                        setIsEventPopoverOpen(false);
                        if (onNavigate) onNavigate('events', 'events-all');
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left transition-colors ${
                        selectedEventId === 'all'
                          ? 'bg-cyan-50 text-cyan-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>Todos os Eventos do Produtor</span>
                      {selectedEventId === 'all' && <Check className="h-3.5 w-3.5 text-cyan-600" />}
                    </button>

                    {filteredEvents.map(e => (
                      <button
                        key={e.id}
                        onClick={() => {
                          setEvent(e.id);
                          setIsEventPopoverOpen(false);
                          if (onNavigate) onNavigate('events', 'events-dashboard');
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs text-left transition-colors ${
                          selectedEventId === e.id
                            ? 'bg-cyan-50 text-cyan-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="overflow-hidden pr-2">
                          <div className="font-semibold text-slate-900 truncate">{e.title}</div>
                          <div className="text-[10px] text-slate-500 truncate">{e.venue}</div>
                        </div>
                        {selectedEventId === e.id && <Check className="h-3.5 w-3.5 text-cyan-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isFiltered && !isLockedToSingleProducer && (
              <button
                onClick={() => {
                  resetScope();
                  if (onNavigate) onNavigate('overview', 'overview-main');
                }}
                title="Limpar filtros operacionais globais"
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 transition-colors ml-1 shadow-2xs"
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
            title="Buscar no Disk Interno • Central de Consulta (Ctrl + K)"
            className="flex h-9 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-100/80 px-3 text-xs text-slate-500 transition-all hover:border-slate-300 hover:bg-white hover:shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">Buscar pedidos, ingressos, clientes ou comandos...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500 shadow-2xs">
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
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 shadow-2xs"
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
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 shadow-2xs"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[9px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-slate-200" />

          {/* User Persona Switcher */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-1.5 text-left transition-all hover:border-slate-300 hover:bg-white hover:shadow-xs"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-xs font-bold text-orange-700 border border-orange-200">
                {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-slate-800 leading-none">{currentUser.name}</div>
                <div className="text-[10px] text-orange-600 font-semibold mt-0.5 flex items-center gap-1">
                  <span>{currentUser.roleName}</span>
                  {currentUser.twoFactorEnforced && (
                    <span className="rounded bg-cyan-50 px-1 text-[8px] font-bold text-cyan-700 border border-cyan-200">
                      2FA
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in duration-150">
                <div className="px-2 py-1.5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Simular Perfil / Usuário</span>
                  <span className="text-[10px] text-orange-600 font-mono">Fase 1.1.5</span>
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
                            ? 'bg-orange-50 text-orange-700 border border-orange-200 font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-700 mt-0.5 border border-slate-200">
                          {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-slate-900 leading-tight truncate">{u.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{u.roleName}</div>
                          <div className="text-[9px] text-cyan-700 font-mono mt-0.5">
                            Escopo: {u.scope.type} {u.scope.producerIds.length > 0 ? `(${u.scope.producerIds.join(',')})` : ''}
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
                      className="text-[11px] text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
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
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 ml-auto"
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

      {/* Real-time Alert Toast Banner */}
      {toastNotification && (
        <div className="flex items-center justify-between px-4 py-2 bg-orange-50 border-t border-b border-orange-200 text-xs text-slate-800 animate-in slide-in-from-top duration-200">
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
              className="px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-800 hover:bg-orange-200 text-[11px] font-bold border border-orange-200 transition-colors"
            >
              Ver Alerta
            </button>
            <button
              onClick={dismissToast}
              className="text-slate-400 hover:text-slate-700 text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Operational Breadcrumb Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 overflow-x-auto select-none">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            onClick={() => {
              if (onNavigate) onNavigate('overview', 'overview-main');
            }}
            className="font-bold text-slate-800 hover:text-orange-600 transition-colors"
          >
            Disk Interno
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />

          {/* Producer Segment */}
          {activeProducer ? (
            <div className="flex items-center gap-1 text-orange-700 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200 font-medium">
              <Building2 className="h-3 w-3" />
              <span>{activeProducer.name}</span>
              {!isLockedToSingleProducer && (
                <button
                  onClick={() => {
                    clearProducer();
                    if (onNavigate) onNavigate('overview', 'overview-main');
                  }}
                  title="Remover filtro de produtora"
                  className="hover:text-orange-900 ml-0.5"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <span className="text-slate-500">Todas as Produtoras</span>
          )}

          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />

          {/* Event Segment */}
          {activeEvent ? (
            <div className="flex items-center gap-1 text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-200 font-medium">
              <Calendar className="h-3 w-3" />
              <span>{activeEvent.title}</span>
              {!isLockedToSingleEvent && (
                <button
                  onClick={() => {
                    clearEvent();
                    if (onNavigate) onNavigate('events', 'events-all');
                  }}
                  title="Remover filtro de evento"
                  className="hover:text-cyan-900 ml-0.5"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <span className="text-slate-500">Todos os Eventos</span>
          )}

          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />

          {/* Active Module Segment */}
          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
            {activeModuleName}
          </span>
        </div>

        {/* Active Context Indicators */}
        <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-slate-500">
          <span>Produtores: {availableProducers.length}</span>
          <span>•</span>
          <span>Eventos Ativos: {availableEvents.length}</span>
          {isFiltered && (
            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Filtro Ativo
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
