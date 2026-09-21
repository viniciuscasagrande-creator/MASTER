import React from 'react';
import { Badge, BadgeVariant } from '../Badge';
import { cn } from '../../utils/cn';

export interface ModuleMetricItem {
  id: string;
  label: string;
  value: string | number;
  helper?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  badge?: string;
  badgeVariant?: BadgeVariant;
  onClick?: () => void;
}

interface ModuleMetricStripProps {
  metrics: ModuleMetricItem[];
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export const ModuleMetricStrip: React.FC<ModuleMetricStripProps> = ({
  metrics,
  columns = 4,
  className
}) => {
  const colClassMap = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
  };

  return (
    <div className={cn('grid gap-4', colClassMap[columns], className)}>
      {metrics.map((m) => (
        <div
          key={m.id}
          onClick={m.onClick}
          className={cn(
            'group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0F172A] p-5 shadow-sm transition-all duration-200 hover:border-slate-700 hover:shadow-md text-white',
            m.onClick && 'cursor-pointer hover:-translate-y-0.5'
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              {m.label}
            </span>
            {m.icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200 shadow-xs transition-colors">
                {m.icon}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
              {m.value}
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-800">
            {m.helper && (
              <span className="text-[11px] text-slate-400 truncate max-w-[70%]">
                {m.helper}
              </span>
            )}
            {m.trend && (
              <span
                className={cn(
                  'text-[11px] font-bold font-mono inline-flex items-center',
                  m.trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {m.trend.isPositive ? '▲ ' : '▼ '}
                {m.trend.value}
              </span>
            )}
            {m.badge && (
              <Badge variant={m.badgeVariant || 'slate'} size="sm">
                {m.badge}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
