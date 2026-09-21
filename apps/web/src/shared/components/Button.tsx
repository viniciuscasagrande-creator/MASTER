import React from 'react';
import { cn } from '../utils/cn';
import { RefreshCw } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  disabled,
  isLoading = false,
  loading = false,
  ...props
}) => {
  const isBusy = isLoading || loading;

  const variantStyles = {
    // Botão Primário Laranja Disk (#FF7A00)
    primary: 'bg-[#FF7A00] text-white hover:bg-[#EA580C] focus-visible:ring-orange-500 shadow-xs active:translate-y-px',
    // Botão Secundário Claro (conforme Imagem de Referência)
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90 shadow-2xs focus-visible:ring-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700/80',
    outline: 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-slate-200/90 focus-visible:ring-slate-400 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white',
    danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 focus-visible:ring-rose-500 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
    ghost: 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 focus-visible:ring-slate-400 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50',
    success: 'bg-[#22C55E] text-white hover:bg-emerald-600 shadow-xs active:translate-y-px',
    warning: 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 focus-visible:ring-amber-500 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900'
  };

  const sizeStyles = {
    xs: 'text-[11px] px-2 py-1 rounded-md gap-1',
    sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 py-2 rounded-lg gap-2 font-medium',
    lg: 'text-sm px-5 py-2.5 rounded-xl gap-2.5 font-semibold',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-all duration-150 select-none outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isBusy}
      {...props}
    >
      {isBusy && <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5 shrink-0" />}
      {!isBusy && icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
