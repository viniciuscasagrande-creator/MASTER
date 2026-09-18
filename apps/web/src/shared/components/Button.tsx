import React from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500 shadow-md shadow-orange-500/20 active:translate-y-px',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 focus-visible:ring-slate-400',
    outline: 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700/80 focus-visible:ring-slate-400',
    danger: 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 focus-visible:ring-rose-500',
    ghost: 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 focus-visible:ring-slate-400',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-3.5 py-2 rounded-lg gap-2',
    lg: 'text-sm px-5 py-2.5 rounded-xl gap-2.5 font-semibold',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 select-none outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
