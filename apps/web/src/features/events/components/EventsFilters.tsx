import React from 'react';
import { Search, X, LayoutGrid, List, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { EventStatus, EventsViewMode, ListEventsFilter } from '../types/event.types';
import { EVENT_STATUS_LABELS } from '../utils/event-status';

interface EventsFiltersProps {
  filters: ListEventsFilter;
  onChangeFilter: (key: keyof ListEventsFilter, value: any) => void;
  onClearFilters: () => void;
  viewMode: EventsViewMode;
  onChangeViewMode: (mode: EventsViewMode) => void;
  totalResults: number;
}

export const EventsFilters: React.FC<EventsFiltersProps> = ({
  filters,
  onChangeFilter,
  onClearFilters,
  viewMode,
  onChangeViewMode,
  totalResults
}) => {
  const hasActiveFilters = Boolean(
    filters.search ||
    (filters.status && filters.status !== 'ALL') ||
    (filters.period && filters.period !== 'all')
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, código público (EVT-...), local ou cidade..."
            value={filters.search || ''}
            onChange={(e) => onChangeFilter('search', e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 shadow-xs transition-colors dark:bg-slate-900 dark:border-slate-800 dark:text-white"
          />
          {filters.search && (
            <button
              onClick={() => onChangeFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter dropdowns & controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs shadow-xs text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filters.status || 'ALL'}
              onChange={(e) => onChangeFilter('status', e.target.value as EventStatus | 'ALL')}
              className="bg-transparent text-slate-700 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Todos os status</option>
              {Object.entries(EVENT_STATUS_LABELS).map(([statusKey, label]) => (
                <option key={statusKey} value={statusKey} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs shadow-xs text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
            <span className="text-slate-400">Período:</span>
            <select
              value={filters.period || 'all'}
              onChange={(e) => onChangeFilter('period', e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Todo o período</option>
              <option value="upcoming" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Eventos futuros</option>
              <option value="today" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Hoje</option>
              <option value="next7days" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Próximos 7 dias</option>
              <option value="next30days" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Próximos 30 dias</option>
              <option value="thisMonth" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Este mês</option>
              <option value="past" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Encerrados / Passados</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs shadow-xs text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filters.sortBy || 'date_asc'}
              onChange={(e) => onChangeFilter('sortBy', e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="date_asc" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Data (Mais próximos)</option>
              <option value="date_desc" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Data (Mais distantes)</option>
              <option value="name_asc" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Nome (A - Z)</option>
              <option value="name_desc" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Nome (Z - A)</option>
              <option value="created_recent" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">Mais recentes criados</option>
            </select>
          </div>

          {/* Cards / Table Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs dark:bg-slate-900 dark:border-slate-800">
            <button
              onClick={() => onChangeViewMode('cards')}
              title="Visualização em Cards"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-orange-50 text-orange-600 font-bold dark:bg-orange-950/60 dark:text-orange-400'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onChangeViewMode('table')}
              title="Visualização em Tabela"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-orange-50 text-orange-600 font-bold dark:bg-orange-950/60 dark:text-orange-400'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results counter and clear filter button */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 dark:text-slate-400">
        <div>
          Exibindo <span className="font-semibold text-slate-900 dark:text-white">{totalResults}</span> {totalResults === 1 ? 'evento' : 'eventos'}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
};
