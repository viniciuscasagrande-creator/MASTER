import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Calendar,
  ChevronDown,
  Search,
  Check,
  RotateCcw,
  Lock,
  Filter
} from 'lucide-react';
import { useDiskContext } from '../../core/context/DiskContext';
import { cn } from '../utils/cn';

interface ContextSelectorProps {
  onNavigate?: (moduleId: string, subItemId?: string) => void;
  className?: string;
}

export const ContextSelector: React.FC<ContextSelectorProps> = ({
  onNavigate,
  className
}) => {
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

  const [isProducerOpen, setIsProducerOpen] = useState(false);
  const [isEventOpen, setIsEventOpen] = useState(false);
  const [producerSearch, setProducerSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');

  const producerRef = useRef<HTMLDivElement>(null);
  const eventRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (producerRef.current && !producerRef.current.contains(e.target as Node)) {
        setIsProducerOpen(false);
      }
      if (eventRef.current && !eventRef.current.contains(e.target as Node)) {
        setIsEventOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isFiltered = selectedProducerId !== 'all' || selectedEventId !== 'all';

  const filteredProducers = availableProducers.filter(
    (p) =>
      p.name.toLowerCase().includes(producerSearch.toLowerCase()) ||
      p.cnpj.toLowerCase().includes(producerSearch.toLowerCase())
  );

  const filteredEvents = availableEvents.filter(
    (e) =>
      e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.venue.toLowerCase().includes(eventSearch.toLowerCase())
  );

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200 select-none shadow-2xs',
        className
      )}
    >
      {/* Left: Dual Context Selectors (Produtor x Evento) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* PRODUTOR SELECTOR */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            PRODUTOR
          </span>

          <div className="relative" ref={producerRef}>
            <button
              onClick={() => !isLockedToSingleProducer && setIsProducerOpen(!isProducerOpen)}
              disabled={isLockedToSingleProducer}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer',
                isProducerOpen
                  ? 'border-orange-500 bg-orange-50/50 text-slate-900 shadow-xs ring-1 ring-orange-500/20'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white',
                isLockedToSingleProducer && 'cursor-default opacity-85'
              )}
            >
              <Building2 className="h-3.5 w-3.5 text-orange-600 shrink-0" />
              <span className="max-w-[150px] sm:max-w-[180px] truncate">
                {activeProducer ? activeProducer.name : 'Todas as Produtoras'}
              </span>
              {isLockedToSingleProducer ? (
                <Lock className="h-3 w-3 text-amber-600 ml-0.5 shrink-0" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              )}
            </button>

            {isProducerOpen && !isLockedToSingleProducer && (
              <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in duration-150">
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
                      setIsProducerOpen(false);
                      if (onNavigate) onNavigate('overview', 'overview-main');
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer',
                      selectedProducerId === 'all'
                        ? 'bg-orange-50 text-orange-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <span>Todas as Produtoras (Visão Global)</span>
                    {selectedProducerId === 'all' && <Check className="h-3.5 w-3.5 text-orange-600" />}
                  </button>

                  {filteredProducers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setProducer(p.id);
                        setIsProducerOpen(false);
                        if (onNavigate) onNavigate('events', 'events-all');
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs text-left transition-colors cursor-pointer',
                        selectedProducerId === p.id
                          ? 'bg-orange-50 text-orange-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      )}
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
        </div>

        <div className="hidden sm:block h-5 w-px bg-slate-200" />

        {/* EVENTO SELECTOR */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            EVENTO
          </span>

          <div className="relative" ref={eventRef}>
            <button
              onClick={() => !isLockedToSingleEvent && setIsEventOpen(!isEventOpen)}
              disabled={isLockedToSingleEvent}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer',
                isEventOpen
                  ? 'border-cyan-500 bg-cyan-50/50 text-slate-900 shadow-xs ring-1 ring-cyan-500/20'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white',
                isLockedToSingleEvent && 'cursor-default opacity-85'
              )}
            >
              <Calendar className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
              <span className="max-w-[160px] sm:max-w-[200px] truncate">
                {activeEvent ? activeEvent.title : 'Todos os Eventos'}
              </span>
              {isLockedToSingleEvent ? (
                <Lock className="h-3 w-3 text-amber-600 ml-0.5 shrink-0" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              )}
            </button>

            {isEventOpen && !isLockedToSingleEvent && (
              <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in duration-150">
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
                      setIsEventOpen(false);
                      if (onNavigate) onNavigate('events', 'events-all');
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer',
                      selectedEventId === 'all'
                        ? 'bg-cyan-50 text-cyan-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <span>Todos os Eventos do Produtor</span>
                    {selectedEventId === 'all' && <Check className="h-3.5 w-3.5 text-cyan-600" />}
                  </button>

                  {filteredEvents.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        setEvent(e.id);
                        setIsEventOpen(false);
                        if (onNavigate) onNavigate('events', 'events-dashboard');
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs text-left transition-colors cursor-pointer',
                        selectedEventId === e.id
                          ? 'bg-cyan-50 text-cyan-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      )}
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
        </div>

        {/* Clear Filter button */}
        {isFiltered && !isLockedToSingleProducer && (
          <button
            onClick={() => {
              resetScope();
              if (onNavigate) onNavigate('overview', 'overview-main');
            }}
            title="Limpar filtros operacionais"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        )}
      </div>

      {/* Right: Operational Status & Counts */}
      <div className="hidden md:flex items-center gap-3 font-mono text-[11px] text-slate-500">
        <span>Produtores: <strong className="text-slate-700">{availableProducers.length}</strong></span>
        <span>•</span>
        <span>Eventos: <strong className="text-slate-700">{availableEvents.length}</strong></span>
        {isFiltered && (
          <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[10px]">
            Filtro Ativo
          </span>
        )}
      </div>
    </div>
  );
};
