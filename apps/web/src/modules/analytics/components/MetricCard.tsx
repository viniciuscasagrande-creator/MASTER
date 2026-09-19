import React from 'react';
import { HelpCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '../../../shared/components/Badge';

interface MetricCardProps {
  title: string;
  code: string;
  value: string | number;
  changePercent?: number;
  comparisonLabel?: string;
  domain?: string;
  icon?: React.ReactNode;
  onExplainClick?: (code: string) => void;
  subtitle?: string;
  isSensitive?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  code,
  value,
  changePercent,
  comparisonLabel,
  domain,
  icon,
  onExplainClick,
  subtitle,
  isSensitive
}) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg transition-all hover:border-slate-700">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {title}
            </span>
            {isSensitive && (
              <Badge variant="warning" size="sm">
                LGPD
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">
              {value}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onExplainClick && (
            <button
              onClick={() => onExplainClick(code)}
              title="Como este indicador é calculado?"
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-orange-400"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          )}
          {icon && (
            <div className="rounded-lg bg-slate-800/80 p-2 text-orange-400">
              {icon}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs">
        {changePercent !== undefined ? (
          <div className="flex items-center gap-1">
            {changePercent > 0 ? (
              <span className="flex items-center font-medium text-emerald-400">
                <TrendingUp className="mr-0.5 h-3.5 w-3.5" />
                +{changePercent.toFixed(1)}%
              </span>
            ) : changePercent < 0 ? (
              <span className="flex items-center font-medium text-rose-400">
                <TrendingDown className="mr-0.5 h-3.5 w-3.5" />
                {changePercent.toFixed(1)}%
              </span>
            ) : (
              <span className="flex items-center font-medium text-slate-400">
                <Minus className="mr-0.5 h-3.5 w-3.5" />
                0.0%
              </span>
            )}
            <span className="text-slate-500">
              {comparisonLabel || 'vs. período anterior'}
            </span>
          </div>
        ) : subtitle ? (
          <span className="text-slate-400">{subtitle}</span>
        ) : (
          <code className="text-[10px] text-slate-500">{code}</code>
        )}

        {domain && (
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            {domain}
          </span>
        )}
      </div>
    </div>
  );
};
