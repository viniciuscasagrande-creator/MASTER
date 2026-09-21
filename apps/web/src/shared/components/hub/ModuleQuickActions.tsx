import React from 'react';
import { cn } from '../../utils/cn';

export interface QuickActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'outline' | 'emerald' | 'purple' | 'amber' | 'cyan';
  badge?: string;
  disabled?: boolean;
}

interface ModuleQuickActionsProps {
  actions: QuickActionItem[];
  title?: string;
  className?: string;
}

export const ModuleQuickActions: React.FC<ModuleQuickActionsProps> = ({
  actions,
  title = 'AÇÕES RÁPIDAS',
  className
}) => {
  const variantStyles = {
    primary: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/40',
    outline: 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/40',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/40'
  };

  return (
    <div className={cn('space-y-3', className)}>
      {title && (
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block px-1">
          {title}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-2.5">
        {actions.map((act) => (
          <button
            key={act.id}
            onClick={act.onClick}
            disabled={act.disabled}
            className={cn(
              'group flex items-center gap-2.5 px-4 py-2 rounded-xl border text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs',
              variantStyles[act.variant || 'outline']
            )}
          >
            <span className="shrink-0 group-hover:scale-110 transition-transform">
              {act.icon}
            </span>
            <span>{act.label}</span>
            {act.badge && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                {act.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
