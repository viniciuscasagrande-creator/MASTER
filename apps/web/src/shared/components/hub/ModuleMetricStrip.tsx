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
            'group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white',
            m.onClick && 'cursor-pointer hover:-translate-y-0.5'
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              {m.label}
            </span>
            {m.icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-orange-600 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors">
                {m.icon}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {m.value}
            </span>
            {m.trend && (
              <span
                className={cn(
                  'text-xs font-semibold',
                  m.trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {m.trend.isPositive ? '↑' : '↓'} {m.trend.value}
              </span>
            )}
          </div>

          {(m.helper || m.badge) && (
            <div className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {m.helper && (
                <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                  {m.helper}
                </span>
              )}
              {m.badge && (
                <Badge variant={m.badgeVariant || 'slate'} size="sm">
                  {m.badge}
                </Badge>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
