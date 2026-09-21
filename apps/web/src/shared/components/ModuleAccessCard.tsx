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
        'group relative flex items-center justify-between rounded-xl border border-slate-800 bg-[#0F172A] p-3.5 sm:p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-orange-500/50 hover:shadow-md cursor-pointer select-none text-white',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Icon container */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-orange-400 shadow-xs transition-transform duration-150 group-hover:scale-105',
            iconBg
          )}
        >
          {icon}
        </div>

        {/* Text details */}
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-white group-hover:text-[#FF7A00] transition-colors whitespace-nowrap">
              {title}
            </h3>
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
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {description}
          </p>
        </div>
      </div>

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 group-hover:text-[#FF7A00] group-hover:translate-x-0.5 transition-all">
        <ChevronRight className="h-4 w-4" />
      </div>
    </div>
  );
};
