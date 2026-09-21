import React from 'react';
import { cn } from '../utils/cn';

export type StatusBadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'
  | 'neutral'
  | 'purple';

export interface StatusBadgeProps {
  status?: string;
  variant?: StatusBadgeVariant;
  label?: string;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  label,
  dot = false,
  size = 'md',
  className
}) => {
  // Derive variant if not explicitly provided
  let effectiveVariant: StatusBadgeVariant = variant || 'neutral';
  if (!variant && status) {
    const s = status.toLowerCase();
    if (['paid', 'active', 'approved', 'resolved', 'completed', 'success', 'on_sale'].includes(s)) {
      effectiveVariant = 'success';
    } else if (['pending', 'in_review', 'pending_approval', 'warning', 'in_operation', 'aguardando cliente'].includes(s)) {
      effectiveVariant = 'warning';
    } else if (['rejected', 'cancelled', 'failed', 'danger', 'error', 'disputed'].includes(s)) {
      effectiveVariant = 'danger';
    } else if (['processing', 'info', 'running', 'em andamento'].includes(s)) {
      effectiveVariant = 'info';
    } else if (['featured', 'primary'].includes(s)) {
      effectiveVariant = 'primary';
    }
  }

  // Exact semantic colors from Reference Image:
  // Sucesso: #22C55E | Alerta: #F59E0B | Erro: #EF4444 | Info: #3B82F6
  const variantStyles: Record<StatusBadgeVariant, { bg: string; dot: string }> = {
    success: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-[#22C55E]'
    },
    warning: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-[#F59E0B]'
    },
    danger: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
      dot: 'bg-[#EF4444]'
    },
    info: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
      dot: 'bg-[#3B82F6]'
    },
    primary: {
      bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
      dot: 'bg-[#FF7A00]'
    },
    neutral: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400'
    },
    purple: {
      bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
      dot: 'bg-purple-500'
    }
  };

  const current = variantStyles[effectiveVariant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        current.bg,
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', current.dot)} />
      )}
      <span>{label || status}</span>
    </span>
  );
};
