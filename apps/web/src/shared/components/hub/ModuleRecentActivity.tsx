import React from 'react';
import { Clock, ArrowUpRight } from 'lucide-react';
import { Badge, BadgeVariant } from '../Badge';
import { Button } from '../Button';
import { cn } from '../../utils/cn';

export interface ActivityFeedItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  amount?: string;
  status?: string;
  statusVariant?: BadgeVariant;
  icon?: React.ReactNode;
}

interface ModuleRecentActivityProps {
  activities: ActivityFeedItem[];
  title?: string;
  onViewAll?: () => void;
  className?: string;
}

export const ModuleRecentActivity: React.FC<ModuleRecentActivityProps> = ({
  activities,
  title = 'ATIVIDADES RECENTES & AUDITORIA',
  onViewAll,
  className
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-white">
            {title}
          </h3>
        </div>
        {onViewAll && (
          <Button
            size="sm"
            variant="outline"
            onClick={onViewAll}
            icon={<ArrowUpRight className="h-3 w-3" />}
          >
            Ver Extrato
          </Button>
        )}
      </div>

      <div className="divide-y divide-slate-800/50">
        {activities.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Nenhuma atividade registrada recentemente.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-800/20 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {act.icon && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60 text-slate-400">
                    {act.icon}
                  </div>
                )}
                <div className="min-w-0 space-y-0.5">
                  <span className="font-semibold text-white block truncate">
                    {act.title}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {act.subtitle}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-right">
                {act.amount && (
                  <span className="font-mono font-bold text-white text-xs">
                    {act.amount}
                  </span>
                )}
                {act.status && (
                  <Badge variant={act.statusVariant || 'slate'} size="sm">
                    {act.status}
                  </Badge>
                )}
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  {act.timestamp}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
