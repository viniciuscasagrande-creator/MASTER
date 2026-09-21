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
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20',
      borderHover: 'hover:border-emerald-500/40 hover:shadow-emerald-500/5',
      glow: 'bg-emerald-500/5'
    },
    purple: {
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20 group-hover:bg-purple-500/20',
      borderHover: 'hover:border-purple-500/40 hover:shadow-purple-500/5',
      glow: 'bg-purple-500/5'
    },
    blue: {
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover:bg-blue-500/20',
      borderHover: 'hover:border-blue-500/40 hover:shadow-blue-500/5',
      glow: 'bg-blue-500/5'
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover:bg-amber-500/20',
      borderHover: 'hover:border-amber-500/40 hover:shadow-amber-500/5',
      glow: 'bg-amber-500/5'
    },
    cyan: {
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover:bg-cyan-500/20',
      borderHover: 'hover:border-cyan-500/40 hover:shadow-cyan-500/5',
      glow: 'bg-cyan-500/5'
    },
    rose: {
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20 group-hover:bg-rose-500/20',
      borderHover: 'hover:border-rose-500/40 hover:shadow-rose-500/5',
      glow: 'bg-rose-500/5'
    },
    orange: {
      iconBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20 group-hover:bg-orange-500/20',
      borderHover: 'hover:border-orange-500/40 hover:shadow-orange-500/5',
      glow: 'bg-orange-500/5'
    }
  };

  const currentTheme = themeStyles[iconTheme];

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm transition-all duration-200 text-left',
        !disabled && 'cursor-pointer hover:-translate-y-1 hover:bg-slate-900/90',
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
              'flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-200 shadow-inner',
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
          <h3 className="text-sm sm:text-base font-bold text-white tracking-wide group-hover:text-emerald-300 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      {/* Card Footer: Live metric or direct arrow */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/50 flex items-center justify-between">
        {metricValue ? (
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              {metricLabel || 'Posição Atual'}
            </span>
            <span className="text-sm font-bold font-mono text-white tracking-tight">
              {metricValue}
            </span>
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-white transition-colors">
            Acessar Área
          </span>
        )}

        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60 text-slate-400 group-hover:border-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-all">
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
};
