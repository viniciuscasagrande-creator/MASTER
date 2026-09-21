import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

export interface ModuleAccessCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg?: string;
  badge?: string;
  badgeVariant?: 'orange' | 'emerald' | 'amber' | 'rose' | 'slate' | 'cyan' | 'purple';
  onClick: () => void;
  className?: string;
}

export const ModuleAccessCard: React.FC<ModuleAccessCardProps> = ({
  id,
  title,
  description,
  icon,
  iconBg = 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  badge,
  badgeVariant = 'slate',
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
        'group relative flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-orange-500/40 hover:shadow-sm cursor-pointer select-none dark:bg-slate-800 dark:border-slate-700 dark:hover:border-orange-500/40',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Icon container */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 shadow-2xs transition-transform duration-150 group-hover:scale-105 dark:border-slate-700',
            iconBg
          )}
        >
          {icon}
        </div>

        {/* Text details */}
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#FF7A00] dark:group-hover:text-[#FF7A00] transition-colors whitespace-nowrap">
              {title}
            </h3>
            {badge && (
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold border shrink-0',
                  badgeVariant === 'orange' && 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
                  badgeVariant === 'emerald' && 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
                  badgeVariant === 'amber' && 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
                  badgeVariant === 'rose' && 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
                  badgeVariant === 'cyan' && 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800',
                  badgeVariant === 'purple' && 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
                  badgeVariant === 'slate' && 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'
                )}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {description}
          </p>
        </div>
      </div>

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 group-hover:text-[#FF7A00] group-hover:translate-x-0.5 transition-all dark:text-slate-500">
        <ChevronRight className="h-4 w-4" />
      </div>
    </div>
  );
};
