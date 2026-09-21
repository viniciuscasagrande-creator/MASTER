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
    } else if (['pending', 'in_review', 'pending_approval', 'warning', 'in_operation'].includes(s)) {
      effectiveVariant = 'warning';
    } else if (['rejected', 'cancelled', 'failed', 'danger', 'error', 'disputed'].includes(s)) {
      effectiveVariant = 'danger';
    } else if (['processing', 'info', 'running'].includes(s)) {
      effectiveVariant = 'info';
    } else if (['featured', 'primary'].includes(s)) {
      effectiveVariant = 'primary';
    }
  }

  const variantStyles: Record<StatusBadgeVariant, { bg: string; dot: string }> = {
    success: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500'
    },
    warning: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500'
    },
    danger: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500'
    },
    info: {
      bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      dot: 'bg-cyan-500'
    },
    primary: {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      dot: 'bg-orange-500'
    },
    neutral: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400'
    },
    purple: {
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500'
    }
  };

  const current = variantStyles[effectiveVariant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold border rounded-lg',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        current.bg,
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse shrink-0', current.dot)} />
      )}
      <span>{label || status}</span>
    </span>
  );
};
