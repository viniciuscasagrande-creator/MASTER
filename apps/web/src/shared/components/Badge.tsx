import React from 'react';
import { cn } from '../utils/cn';

export type BadgeVariant =
  | 'orange'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'slate'
  | 'purple'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'
  | 'default'
  | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  dot = false,
  className,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    primary: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
    default: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  const dotStyles: Record<BadgeVariant, string> = {
    orange: 'bg-orange-400',
    primary: 'bg-orange-400',
    emerald: 'bg-emerald-400',
    success: 'bg-emerald-400',
    amber: 'bg-amber-400',
    warning: 'bg-amber-400',
    rose: 'bg-rose-400',
    danger: 'bg-rose-400',
    cyan: 'bg-cyan-400',
    info: 'bg-cyan-400',
    slate: 'bg-slate-400',
    neutral: 'bg-slate-400',
    default: 'bg-slate-400',
    purple: 'bg-purple-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', dotStyles[variant])} />
      )}
      {children}
    </span>
  );
};
