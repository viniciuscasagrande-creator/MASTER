import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

export interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg?: string;
  badge?: string;
  badgeVariant?: 'orange' | 'emerald' | 'amber' | 'rose' | 'slate' | 'cyan' | 'purple';
  actionLabel?: string;
  onClick: () => void;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  iconBg = 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  badge,
  badgeVariant = 'slate',
  actionLabel,
  onClick,
  className
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0F172A] p-4 sm:p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-orange-500/50 hover:shadow-md cursor-pointer select-none min-h-[145px] max-h-[175px] h-full text-white',
        className
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-orange-400 shadow-xs transition-transform duration-150 group-hover:scale-105',
              iconBg
            )}
          >
            {icon}
          </div>

          {badge && (
            <span
              className={cn(
                'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold border shrink-0',
                badgeVariant === 'orange' && 'bg-orange-500/15 text-orange-400 border-orange-500/30',
                badgeVariant === 'emerald' && 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                badgeVariant === 'amber' && 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                badgeVariant === 'rose' && 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                badgeVariant === 'cyan' && 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
                badgeVariant === 'purple' && 'bg-purple-500/15 text-purple-400 border-purple-500/30',
                badgeVariant === 'slate' && 'bg-slate-800 text-slate-300 border-slate-700'
              )}
            >
              {badge}
            </span>
          )}
        </div>

        <h3 className="mt-3 text-sm font-bold text-white transition-colors group-hover:text-[#FF7A00] line-clamp-1">
          {title}
        </h3>

        <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2.5 text-xs font-semibold text-slate-300 group-hover:text-[#FF7A00] transition-colors">
        <span>{actionLabel || 'Acessar ferramenta'}</span>
        <ChevronRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
      </div>
    </div>
  );
};
