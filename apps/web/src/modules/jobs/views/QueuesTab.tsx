import React from 'react';
import { JobQueueMetrics, JobQueue } from '../jobs.types';
import { QueueBadge } from '../components/QueueBadge';
import { Button } from '../../../shared/components/Button';
import {
  Layers,
  Activity,
  Clock,
  Zap,
  Users,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  BarChart3
} from 'lucide-react';

interface QueuesTabProps {
  metrics: JobQueueMetrics[];
  onRefresh?: () => void;
  onFilterQueue?: (queue: JobQueue) => void;
}

export const QueuesTab: React.FC<QueuesTabProps> = ({
  metrics,
  onRefresh,
  onFilterQueue
}) => {
  const totalDepth = metrics.reduce((acc, m) => acc + m.depth, 0);
  const totalRunning = metrics.reduce((acc, m) => acc + m.runningCount, 0);
  const totalRate = metrics.reduce((acc, m) => acc + m.processingRatePerMinute, 0);
  const totalWorkers = metrics.reduce((acc, m) => acc + m.activeWorkers, 0);

  const formatAge = (seconds: number) => {
    if (seconds === 0) return '0s (Vazia)';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  const getStatusBadge = (status: 'HEALTHY' | 'WARNING' | 'CRITICAL') => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Normal
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Atenção
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Sobrecarga
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-orange-400" />
            Filas de Processamento Assíncrono
          </h3>
          <p className="text-xs text-slate-400">
            Monitoramento de profundidade, latência de fila, taxas de transferência e workers distribuídos por prioridade lógica.
          </p>
        </div>

        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Atualizar Métricas
          </Button>
        )}
      </div>

      {/* Aggregate KPI Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total na Fila</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{totalDepth}</div>
          <div className="mt-1 text-[11px] text-slate-500">Aguardando alocação de worker</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Em Execução</span>
            <Activity className="h-4 w-4 text-orange-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{totalRunning}</div>
          <div className="mt-1 text-[11px] text-slate-500">Operações ativas em processamento</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Vazão Geral</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{totalRate} <span className="text-xs font-normal text-slate-400">/min</span></div>
          <div className="mt-1 text-[11px] text-slate-500">Média de conclusão em tempo real</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Workers Totais</span>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{totalWorkers}</div>
          <div className="mt-1 text-[11px] text-slate-500">Pool de execução concorrente</div>
        </div>
      </div>

      {/* Queues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((queue) => {
          const depthPercent = Math.min(100, Math.round((queue.depth / 50) * 100));

          return (
            <div
              key={queue.name}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition-all space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QueueBadge queue={queue.name} />
                  <span className="text-xs font-mono text-slate-400">({queue.name})</span>
                </div>
                <div>{getStatusBadge(queue.status)}</div>
              </div>

              {/* Stats Numbers */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-center">
                <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/40">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Na Fila</div>
                  <div className={`text-base font-bold ${queue.depth > 20 ? 'text-amber-400' : 'text-white'}`}>
                    {queue.depth}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/40">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Ativos</div>
                  <div className="text-base font-bold text-orange-400">
                    {queue.runningCount}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/40">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Vazão/m</div>
                  <div className="text-base font-bold text-emerald-400">
                    {queue.processingRatePerMinute}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/40">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Workers</div>
                  <div className="text-base font-bold text-purple-400">
                    {queue.activeWorkers}
                  </div>
                </div>
              </div>

              {/* Progress & Latency */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Job mais antigo na fila:</span>
                  <span className={`font-mono font-medium ${queue.oldestJobAgeSeconds > 60 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {formatAge(queue.oldestJobAgeSeconds)}
                  </span>
                </div>

                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      queue.status === 'CRITICAL'
                        ? 'bg-rose-500'
                        : queue.status === 'WARNING'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(4, depthPercent)}%` }}
                  />
                </div>
              </div>

              {/* Card Footer Action */}
              {onFilterQueue && (
                <div className="flex justify-end pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-400 hover:text-orange-400 p-0 h-auto font-medium"
                    onClick={() => onFilterQueue(queue.name)}
                  >
                    Filtrar jobs desta fila
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
