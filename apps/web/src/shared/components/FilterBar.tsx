import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '../utils/cn';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterSelectConfig {
  id: string;
  label?: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  width?: string;
}

export interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  selects?: FilterSelectConfig[];
  children?: React.ReactNode;
  actions?: React.ReactNode;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar registros...',
  selects = [],
  children,
  actions,
  onClearFilters,
  hasActiveFilters = false,
  className
}) => {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs',
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {/* Search Input */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-7 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Dropdown Selects */}
        {selects.map((sel) => (
          <div key={sel.id} className="relative shrink-0">
            <select
              value={sel.value}
              onChange={(e) => sel.onChange(e.target.value)}
              style={sel.width ? { width: sel.width } : undefined}
              className="rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-3 pr-7 text-xs font-medium text-slate-700 transition-colors focus:border-orange-500 focus:bg-white focus:outline-none cursor-pointer"
            >
              {sel.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Extra child filters */}
        {children}

        {/* Clear Filters Button */}
        {hasActiveFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Trailing Actions */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
