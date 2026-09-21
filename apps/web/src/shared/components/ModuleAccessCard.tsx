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
  iconBg = 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-slate-800 dark:text-orange-400 dark:border-slate-700',
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
        'group relative flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-orange-400/60 hover:shadow-sm cursor-pointer select-none text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Icon container */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-xs transition-transform duration-150 group-hover:scale-105',
            iconBg
          )}
        >
          {icon}
        </div>

        {/* Text details */}
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#FF7A00] transition-colors whitespace-nowrap dark:text-white">
              {title}
            </h3>
            {badge && (
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border shrink-0',
                  badgeVariant === 'orange' && 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30',
                  badgeVariant === 'emerald' && 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
                  badgeVariant === 'amber' && 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
                  badgeVariant === 'rose' && 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30',
                  badgeVariant === 'cyan' && 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30',
                  badgeVariant === 'purple' && 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30',
                  badgeVariant === 'slate' && 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                )}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500 truncate dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      {/* Action chevron */}
      <div className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 group-hover:text-orange-600 group-hover:bg-orange-50 dark:group-hover:bg-slate-800 transition-colors shrink-0">
        <ChevronRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
      </div>
    </div>
  );
};
