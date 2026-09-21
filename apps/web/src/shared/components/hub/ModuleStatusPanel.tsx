import React from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StatusIndicatorItem {
  label: string;
  statusText: string;
  isHealthy: boolean;
  detail?: string;
}

interface ModuleStatusPanelProps {
  title?: string;
  items: StatusIndicatorItem[];
  className?: string;
}

export const ModuleStatusPanel: React.FC<ModuleStatusPanelProps> = ({
  title = 'STATUS OPERACIONAL & GOVERNANÇA',
  items,
  className
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
          {title}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
            <div className="mt-0.5 shrink-0">
              {item.isHealthy ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">
                {item.label}
              </span>
              <span
                className={cn(
                  'text-[11px] font-semibold block',
                  item.isHealthy ? 'text-emerald-700' : 'text-amber-700'
                )}
              >
                {item.statusText}
              </span>
              {item.detail && (
                <span className="text-[10px] text-slate-500 block truncate">
                  {item.detail}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
