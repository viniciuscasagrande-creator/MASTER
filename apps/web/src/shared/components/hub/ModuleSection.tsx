import React from 'react';
import { Badge, BadgeVariant } from '../Badge';
import { cn } from '../../utils/cn';

interface ModuleSectionProps {
  title: string;
  description?: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export const ModuleSection: React.FC<ModuleSectionProps> = ({
  title,
  description,
  badge,
  badgeVariant = 'slate',
  children,
  columns = 3,
  className
}) => {
  const colClassMap = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-4 w-1.5 rounded-full bg-orange-500" />
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-900">
                {title}
              </h2>
              {badge && (
                <Badge variant={badgeVariant} size="sm">
                  {badge}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={cn('grid gap-4 sm:gap-5', colClassMap[columns])}>
        {children}
      </div>
    </section>
  );
};
