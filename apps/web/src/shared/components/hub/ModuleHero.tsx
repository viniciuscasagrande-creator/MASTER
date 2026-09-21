import React from 'react';
import { Search } from 'lucide-react';
import { Badge, BadgeVariant } from '../Badge';
import { cn } from '../../utils/cn';

interface ModuleHeroProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeVariant?: BadgeVariant;
  icon?: React.ReactNode;
  contextInfo?: React.ReactNode;
  actions?: React.ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  className?: string;
}

export const ModuleHero: React.FC<ModuleHeroProps> = ({
  title,
  subtitle,
  badgeText,
  badgeVariant = 'emerald',
  icon,
  contextInfo,
  actions,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  className
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white',
        className
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            {icon && (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 text-orange-600 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400">
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">
                  {title}
                </h1>
                {badgeText && (
                  <Badge variant={badgeVariant} size="md">
                    {badgeText}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>

          {contextInfo && (
            <div className="pt-1">
              {contextInfo}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          {searchPlaceholder && onSearchChange && (
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-orange-500 focus:bg-white transition-all dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
              />
            </div>
          )}

          {actions && (
            <div className="flex items-center gap-2 flex-wrap">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
