import React from 'react';
import { cn } from '../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: 'orange' | 'emerald' | 'amber' | 'rose' | 'slate' | 'cyan' | 'purple';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  badge,
  badgeVariant = 'slate',
  className
}) => {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-slate-700/80 hover:bg-slate-900/90',
      className
    )}>
      {/* Subtle brand glow accent */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-500/5 blur-2xl" />

      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/50 text-slate-300">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white font-mono">
          {value}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {trend ? (
          <span className={cn(
            'inline-flex items-center font-semibold',
            trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
          )}>
            {trend.isPositive ? '▲ ' : '▼ '}
            {trend.value}
          </span>
        ) : subtitle ? (
          <span className="text-slate-400">{subtitle}</span>
        ) : <div />}

        {badge && (
          <span className={cn(
            'inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium',
            badgeVariant === 'orange' && 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
            badgeVariant === 'emerald' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
            badgeVariant === 'amber' && 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
            badgeVariant === 'rose' && 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
            badgeVariant === 'cyan' && 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
            badgeVariant === 'purple' && 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
            badgeVariant === 'slate' && 'bg-slate-800 text-slate-300 border border-slate-700'
          )}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
