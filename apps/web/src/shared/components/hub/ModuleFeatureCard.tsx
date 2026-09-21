import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge, BadgeVariant } from '../Badge';
import { cn } from '../../utils/cn';

export interface ModuleFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconTheme?: 'emerald' | 'purple' | 'blue' | 'amber' | 'cyan' | 'rose' | 'orange';
  metricValue?: string | number;
  metricLabel?: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const ModuleFeatureCard: React.FC<ModuleFeatureCardProps> = ({
  id,
  title,
  description,
  icon,
  iconTheme = 'emerald',
  metricValue,
  metricLabel,
  badge,
  badgeVariant = 'slate',
  onClick,
  disabled = false,
  className
}) => {
  const themeStyles = {
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/70 group-hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
      borderHover: 'hover:border-emerald-300 hover:shadow-emerald-500/10',
      glow: 'bg-emerald-500/5',
      titleHover: 'group-hover:text-emerald-700 dark:group-hover:text-emerald-400'
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200/70 group-hover:bg-purple-100/80 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/60',
      borderHover: 'hover:border-purple-300 hover:shadow-purple-500/10',
      glow: 'bg-purple-500/5',
      titleHover: 'group-hover:text-purple-700 dark:group-hover:text-purple-400'
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200/70 group-hover:bg-blue-100/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60',
      borderHover: 'hover:border-blue-300 hover:shadow-blue-500/10',
      glow: 'bg-blue-500/5',
      titleHover: 'group-hover:text-blue-700 dark:group-hover:text-blue-400'
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200/70 group-hover:bg-amber-100/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
      borderHover: 'hover:border-amber-300 hover:shadow-amber-500/10',
      glow: 'bg-amber-500/5',
      titleHover: 'group-hover:text-amber-700 dark:group-hover:text-amber-400'
    },
    cyan: {
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200/70 group-hover:bg-cyan-100/80 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800/60',
      borderHover: 'hover:border-cyan-300 hover:shadow-cyan-500/10',
      glow: 'bg-cyan-500/5',
      titleHover: 'group-hover:text-cyan-700 dark:group-hover:text-cyan-400'
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200/70 group-hover:bg-rose-100/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60',
      borderHover: 'hover:border-rose-300 hover:shadow-rose-500/10',
      glow: 'bg-rose-500/5',
      titleHover: 'group-hover:text-rose-700 dark:group-hover:text-rose-400'
    },
    orange: {
      iconBg: 'bg-orange-50 text-orange-600 border-orange-200/70 group-hover:bg-orange-100/80 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/60',
      borderHover: 'hover:border-orange-300 hover:shadow-orange-500/10',
      glow: 'bg-orange-500/5',
      titleHover: 'group-hover:text-orange-700 dark:group-hover:text-orange-400'
    }
  };

  const currentTheme = themeStyles[iconTheme];

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 text-left text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white',
        !disabled && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700',
        !disabled && currentTheme.borderHover,
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      {/* Background ambient accent on card hover */}
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          currentTheme.glow
        )}
      />

      <div className="space-y-4">
        {/* Card Header: Icon + Badge */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl border shadow-xs transition-all duration-200',
              currentTheme.iconBg
            )}
          >
            {icon}
          </div>
          {badge && (
            <Badge variant={badgeVariant} size="sm">
              {badge}
            </Badge>
          )}
        </div>

        {/* Title and description */}
        <div className="space-y-1.5">
          <h3 className={cn("text-sm sm:text-base font-bold text-slate-900 tracking-tight transition-colors dark:text-white", currentTheme.titleHover)}>
            {title}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      {/* Card Footer: Live metric or direct arrow */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {metricValue ? (
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              {metricLabel || 'Posição Atual'}
            </span>
            <span className="text-sm font-bold font-mono text-slate-900 dark:text-white tracking-tight">
              {metricValue}
            </span>
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 transition-colors">
            Acessar Área
          </span>
        )}

        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 group-hover:border-slate-300 group-hover:bg-slate-100 group-hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-all shadow-2xs">
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
};
