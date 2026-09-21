import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

export interface LoadingStateProps {
  message?: string;
  rows?: number;
  type?: 'spinner' | 'skeleton' | 'cards';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando dados...',
  rows = 3,
  type = 'spinner',
  className
}) => {
  if (type === 'skeleton') {
    return (
      <div className={cn('space-y-3 p-4 animate-pulse', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 w-full rounded-xl bg-slate-200/70" />
        ))}
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200/70" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center select-none',
        className
      )}
    >
      <Loader2 className="h-8 w-8 text-orange-500 animate-spin mb-3" />
      <p className="text-xs font-semibold text-slate-600">{message}</p>
    </div>
  );
};
