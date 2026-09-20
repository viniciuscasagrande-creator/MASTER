import React from 'react';
import { JobWorker, WorkerStatus } from '../jobs.types';
import { QueueBadge } from '../components/QueueBadge';
import { Button } from '../../../shared/components/Button';
import {
  Cpu,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  HardDrive,
  Clock,
  Layers,
  Zap,
  Power
} from 'lucide-react';

interface WorkersTabProps {
  workers: JobWorker[];
  onRefresh?: () => void;
  onRestartWorker?: (workerId: string) => void;
}

export const WorkersTab: React.FC<WorkersTabProps> = ({
  workers,
  onRefresh,
  onRestartWorker
}) => {
  const totalConcurrency = workers.reduce((acc, w) => acc + w.concurrency, 0);
  const activeConcurrency = workers.reduce((acc, w) => acc + w.activeJobsCount, 0);
  const utilizationRate = totalConcurrency > 0 ? Math.round((activeConcurrency / totalConcurrency) * 100) : 0;
  const activeWorkersCount = workers.filter(w => w.status === 'ACTIVE').length;
  const stalledWorkersCount = workers.filter(w => w.status === 'STALLED').length;
  const offlineWorkersCount = workers.filter(w => w.status === 'OFFLINE').length;

  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours < 24) return `${hours}h ${remMins}m`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  };

  const formatRelativeTime = (iso: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diff < 5) return 'agora';
      if (diff < 60) return `há ${diff}s`;
      const mins = Math.floor(diff / 60);
      return `há ${mins}m`;
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status: WorkerStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ativo
          </span>
        );
      case 'IDLE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Ocioso
          </span>
        );
      case 'STALLED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            Travado / Sem Heartbeat
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3 text-rose-400" />
            Offline
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
            <Cpu className="h-4 w-4 text-orange-400" />
            Cluster de Workers & Concorrência
          </h3>
          <p className="text-xs text-slate-400">
            Gerenciamento de instâncias distribuídas de execução assíncrona, pools de threads e monitoramento de batimentos cardíacos (heartbeat).
          </p>
        </div>

        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Atualizar Status
          </Button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Workers Registrados</span>
            <Server className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{workers.length}</span>
            <span className="text-xs text-emerald-400 font-medium">({activeWorkersCount} ativos)</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {stalledWorkersCount > 0 ? (
              <span className="text-amber-400">{stalledWorkersCount} travado(s)</span>
            ) : (
              '100% dos nós respondendo'
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Slots de Concorrência</span>
            <Layers className="h-4 w-4 text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{activeConcurrency}</span>
            <span className="text-xs text-slate-400">/ {totalConcurrency} slots</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Capacidade máxima simultânea</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Taxa de Utilização</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{utilizationRate}%</div>
          <div className="mt-1 text-[11px] text-slate-500">
            {utilizationRate > 85 ? 'Próximo ao limite operacional' : 'Carga balanceada'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Recuperação Ativa</span>
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">Auto</div>
          <div className="mt-1 text-[11px] text-slate-500">Timeout 60s / Re-enfileiramento</div>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workers.map((worker) => {
          const loadPercent = worker.concurrency > 0
            ? Math.round((worker.activeJobsCount / worker.concurrency) * 100)
            : 0;

          return (
            <div
              key={worker.id}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition-all space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{worker.name}</span>
                    <span className="font-mono text-[11px] text-slate-500">({worker.hostname})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>Uptime: <strong className="text-slate-300">{formatUptime(worker.metrics.uptimeSeconds)}</strong></span>
                    <span>•</span>
                    <span>Último heartbeat: <strong className="text-slate-300">{formatRelativeTime(worker.lastHeartbeatAt)}</strong></span>
                  </div>
                </div>

                <div>{getStatusBadge(worker.status)}</div>
              </div>

              {/* Concurrency Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Carga do Worker:</span>
                  <span className="font-mono font-bold text-white">
                    {worker.activeJobsCount} / {worker.concurrency} threads ({loadPercent}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      loadPercent >= 90
                        ? 'bg-rose-500'
                        : loadPercent >= 70
                        ? 'bg-amber-500'
                        : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.max(2, loadPercent)}%` }}
                  />
                </div>
              </div>

              {/* Resource & Operational Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/60 text-center">
                <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/40">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Processados</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {worker.metrics.totalProcessed.toLocaleString('pt-BR')}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/40">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Falhas</div>
                  <div className={`text-sm font-bold ${worker.metrics.totalFailed > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {worker.metrics.totalFailed}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/40">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Uso Mem / CPU</div>
                  <div className="text-xs font-mono font-semibold text-slate-300">
                    {worker.metrics.memoryUsageMb ?? 184}MB / {worker.metrics.cpuUsagePercent ?? 12}%
                  </div>
                </div>
              </div>

              {/* Queues Handled */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] text-slate-400 font-medium">Filas subscritas:</div>
                <div className="flex flex-wrap gap-1.5">
                  {worker.queues.map(q => (
                    <QueueBadge key={q} queue={q} />
                  ))}
                </div>
              </div>

              {/* Worker Action Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-xs">
                <span className="font-mono text-[10px] text-slate-500">ID: {worker.id}</span>
                {onRestartWorker && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-slate-700 text-slate-300 hover:text-white"
                    onClick={() => onRestartWorker(worker.id)}
                  >
                    <Power className="mr-1 h-3 w-3 text-amber-400" />
                    Reiniciar Instância
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
