import React from 'react';
import { cn } from '../utils/cn';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
  heightClass?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
  loading = false,
  empty = false,
  emptyMessage = 'Sem dados suficientes para exibir o gráfico no período.',
  className,
  heightClass = 'h-[300px] sm:h-[340px]'
}) => {
  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 sm:p-5 shadow-xs transition-all duration-150 hover:border-slate-300 dark:hover:border-slate-700',
        heightClass,
        className
      )}
    >
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {/* Chart Body */}
      <div className="relative flex-1 w-full pt-3 flex items-center justify-center min-h-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FF7A00] border-t-transparent" />
            <span className="text-xs">Carregando gráfico...</span>
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center justify-center gap-1.5 text-center text-slate-400">
            <span className="text-xs">{emptyMessage}</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
