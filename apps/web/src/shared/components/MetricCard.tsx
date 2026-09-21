import React from 'react';
import { cn } from '../utils/cn';
import { AlertCircle } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value?: string | number | null;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: 'orange' | 'emerald' | 'amber' | 'rose' | 'slate' | 'cyan' | 'purple';
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  badge,
  badgeVariant = 'slate',
  loading = false,
  empty = false,
  error = null,
  className
}) => {
  if (loading) {
    return (
      <div className={cn(
        'relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-xs min-h-[118px] max-h-[132px] h-full animate-pulse',
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-6 w-6 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="my-auto py-0.5">
          <div className="h-6 w-28 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        'relative flex flex-col justify-between rounded-xl border border-rose-200 bg-white dark:border-rose-900/60 dark:bg-slate-900 p-4 shadow-xs min-h-[118px] max-h-[132px] h-full',
        className
      )}>
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            {title}
          </span>
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
        </div>
        <div className="my-auto py-0.5">
          <div className="text-xs font-semibold text-rose-700 dark:text-rose-300">
            Erro ao carregar
          </div>
          <div className="text-[10px] text-rose-500/80 truncate">
            {error}
          </div>
        </div>
        <div className="h-2" />
      </div>
    );
  }

  const displayValue = empty || value === undefined || value === null ? '—' : value;

  return (
    <div className={cn(
      'relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 sm:p-4.5 shadow-xs transition-all duration-150 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm min-h-[118px] max-h-[134px] h-full',
      className
    )}>
      {/* Top: Label + Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate" title={title}>
          {title}
        </span>
        {icon && (
          <div className="flex items-center justify-center text-slate-400 dark:text-slate-400 shrink-0">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="my-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
          {displayValue}
        </span>
      </div>

      {/* Bottom: Trend Variation / Subtitle + Optional Badge */}
      <div className="flex items-center justify-between text-xs gap-2 pt-0.5">
        {trend ? (
          <span className={cn(
            'inline-flex items-center text-xs font-semibold shrink-0',
            trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          )}>
            {trend.isPositive ? '↑ ' : '↓ '}
            {trend.value}
          </span>
        ) : subtitle ? (
          <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate flex-1" title={subtitle}>
            {subtitle}
          </span>
        ) : <div />}

        {badge && (
          <span className={cn(
            'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border shrink-0',
            badgeVariant === 'orange' && 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30',
            badgeVariant === 'emerald' && 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
            badgeVariant === 'amber' && 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
            badgeVariant === 'rose' && 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30',
            badgeVariant === 'cyan' && 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30',
            badgeVariant === 'purple' && 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30',
            badgeVariant === 'slate' && 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
          )}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
