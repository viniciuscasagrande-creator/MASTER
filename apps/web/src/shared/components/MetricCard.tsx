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
        'relative flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0F172A] p-4 shadow-sm min-h-[118px] max-h-[132px] h-full animate-pulse',
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 rounded bg-slate-800" />
          <div className="h-6 w-6 rounded bg-slate-800" />
        </div>
        <div className="my-auto py-0.5">
          <div className="h-6 w-28 rounded bg-slate-800" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 rounded bg-slate-800" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        'relative flex flex-col justify-between rounded-xl border border-rose-900/60 bg-[#0F172A] p-4 shadow-sm min-h-[118px] max-h-[132px] h-full',
        className
      )}>
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
            {title}
          </span>
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
        </div>
        <div className="my-auto py-0.5">
          <div className="text-xs font-semibold text-rose-300">
            Erro ao carregar
          </div>
          <div className="text-[10px] text-rose-400/80 truncate">
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
      'relative flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0F172A] p-4 sm:p-4.5 shadow-sm transition-all duration-150 hover:border-slate-700 hover:shadow-md min-h-[118px] max-h-[134px] h-full text-white',
      className
    )}>
      {/* Top: Label + Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-400 truncate" title={title}>
          {title}
        </span>
        {icon && (
          <div className="flex items-center justify-center text-slate-300 shrink-0">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="my-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white font-mono">
          {displayValue}
        </span>
      </div>

      {/* Bottom: Trend Variation / Subtitle + Optional Badge */}
      <div className="flex items-center justify-between text-xs gap-2 pt-0.5">
        {trend ? (
          <span className={cn(
            'inline-flex items-center text-xs font-bold shrink-0',
            trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
          )}>
            {trend.isPositive ? '↑ ' : '↓ '}
            {trend.value}
          </span>
        ) : subtitle ? (
          <span className="text-slate-400 text-[11px] truncate flex-1" title={subtitle}>
            {subtitle}
          </span>
        ) : <div />}

        {badge && (
          <span className={cn(
            'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold border shrink-0',
            badgeVariant === 'orange' && 'bg-orange-500/15 text-orange-400 border-orange-500/30',
            badgeVariant === 'emerald' && 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
            badgeVariant === 'amber' && 'bg-amber-500/15 text-amber-400 border-amber-500/30',
            badgeVariant === 'rose' && 'bg-rose-500/15 text-rose-400 border-rose-500/30',
            badgeVariant === 'cyan' && 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
            badgeVariant === 'purple' && 'bg-purple-500/15 text-purple-400 border-purple-500/30',
            badgeVariant === 'slate' && 'bg-slate-800 text-slate-300 border-slate-700'
          )}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
