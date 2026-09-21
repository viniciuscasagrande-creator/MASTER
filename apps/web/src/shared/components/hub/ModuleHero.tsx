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
        'relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs',
        className
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            {icon && (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-emerald-600 shadow-2xs">
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
                  {title}
                </h1>
                {badgeText && (
                  <Badge variant={badgeVariant} size="md">
                    {badgeText}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>

          {contextInfo && (
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
              {contextInfo}
            </div>
          )}
        </div>

        {/* Global Hub Actions */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            {actions}
          </div>
        )}
      </div>

      {/* Optional In-Hub Quick Search */}
      {searchPlaceholder && onSearchChange && (
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
            />
          </div>
        </div>
      )}
    </div>
  );
};
