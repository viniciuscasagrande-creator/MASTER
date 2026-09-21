import React from 'react';
import { ChevronRight, ArrowUpRight } from 'lucide-react';
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
  iconBg = 'bg-slate-100 text-slate-700',
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
        'group relative flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500/40 hover:shadow-md cursor-pointer select-none',
        className
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Icon container */}
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 shadow-2xs transition-transform duration-200 group-hover:scale-105',
            iconBg
          )}
        >
          {icon}
        </div>

        {/* Text details */}
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-orange-600 transition-colors">
              {title}
            </h3>
            {badge && (
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold border shrink-0',
                  badgeVariant === 'orange' && 'bg-orange-50 text-orange-700 border-orange-200',
                  badgeVariant === 'emerald' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  badgeVariant === 'amber' && 'bg-amber-50 text-amber-700 border-amber-200',
                  badgeVariant === 'rose' && 'bg-rose-50 text-rose-700 border-rose-200',
                  badgeVariant === 'cyan' && 'bg-cyan-50 text-cyan-700 border-cyan-200',
                  badgeVariant === 'purple' && 'bg-purple-50 text-purple-700 border-purple-200',
                  badgeVariant === 'slate' && 'bg-slate-100 text-slate-700 border-slate-200'
                )}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1 group-hover:text-slate-600">
            {description}
          </p>
        </div>
      </div>

      {/* Trailing arrow button */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors group-hover:bg-orange-50 group-hover:text-orange-600">
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
};
