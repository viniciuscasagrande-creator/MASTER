import React from 'react';
import { cn } from '../utils/cn';

export interface SectionCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  actions,
  badge,
  children,
  className,
  headerClassName,
  bodyClassName,
  noPadding = false
}) => {
  const hasHeader = Boolean(title || description || actions || badge);

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white shadow-xs',
        className
      )}
    >
      {hasHeader && (
        <div
          className={cn(
            'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100',
            headerClassName
          )}
        >
          <div>
            <div className="flex items-center gap-2">
              {typeof title === 'string' ? (
                <h2 className="text-sm font-bold text-slate-900">{title}</h2>
              ) : (
                title
              )}
              {badge}
            </div>
            {description && (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      )}

      <div className={cn(noPadding ? '' : 'p-5', bodyClassName)}>
        {children}
      </div>
    </div>
  );
};
