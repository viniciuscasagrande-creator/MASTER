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
    primary: 'bg-orange-500/20 text-orange-400 border-orange-500/40 hover:bg-orange-500/30',
    outline: 'bg-[#0F172A] text-slate-200 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800 hover:text-white shadow-xs',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/40 hover:bg-purple-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/30'
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
              'group flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs',
              variantStyles[act.variant || 'outline']
            )}
          >
            <span className="shrink-0 group-hover:scale-110 transition-transform">
              {act.icon}
            </span>
            <span>{act.label}</span>
            {act.badge && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {act.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
