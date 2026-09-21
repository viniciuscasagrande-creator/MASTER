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
      'relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md',
      className
    )}>
      {/* Subtle brand glow accent */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-500/5 blur-2xl" />

      <div className="flex items-start justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 shadow-2xs">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-black tracking-tight text-slate-900 font-mono">
          {value}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {trend ? (
          <span className={cn(
            'inline-flex items-center font-bold',
            trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
          )}>
            {trend.isPositive ? '▲ ' : '▼ '}
            {trend.value}
          </span>
        ) : subtitle ? (
          <span className="text-slate-500 text-xs">{subtitle}</span>
        ) : <div />}

        {badge && (
          <span className={cn(
            'inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-bold border',
            badgeVariant === 'orange' && 'bg-orange-50 text-orange-700 border-orange-200',
            badgeVariant === 'emerald' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
            badgeVariant === 'amber' && 'bg-amber-50 text-amber-700 border-amber-200',
            badgeVariant === 'rose' && 'bg-rose-50 text-rose-700 border-rose-200',
            badgeVariant === 'cyan' && 'bg-cyan-50 text-cyan-700 border-cyan-200',
            badgeVariant === 'purple' && 'bg-purple-50 text-purple-700 border-purple-200',
            badgeVariant === 'slate' && 'bg-slate-100 text-slate-700 border-slate-200'
          )}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
