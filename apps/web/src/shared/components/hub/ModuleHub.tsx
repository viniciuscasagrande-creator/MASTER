import React from 'react';
import { cn } from '../../utils/cn';

interface ModuleHubProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'emerald' | 'purple' | 'blue' | 'amber' | 'cyan' | 'rose' | 'orange';
}

export const ModuleHub: React.FC<ModuleHubProps> = ({
  children,
  className,
  glowColor = 'emerald'
}) => {
  const glowStyles = {
    emerald: 'bg-emerald-500/5',
    purple: 'bg-purple-500/5',
    blue: 'bg-blue-500/5',
    amber: 'bg-amber-500/5',
    cyan: 'bg-cyan-500/5',
    rose: 'bg-rose-500/5',
    orange: 'bg-orange-500/5'
  };

  return (
    <div className={cn('relative min-h-screen pb-16 space-y-8 animate-fadeIn', className)}>
      {/* Ambient background glow effects */}
      <div
        className={cn(
          'pointer-events-none absolute -top-12 left-1/4 h-96 w-96 rounded-full blur-3xl opacity-60',
          glowStyles[glowColor]
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute top-48 right-10 h-80 w-80 rounded-full blur-3xl opacity-40',
          glowStyles[glowColor]
        )}
      />

      <div className="relative z-10 space-y-8">
        {children}
      </div>
    </div>
  );
};
