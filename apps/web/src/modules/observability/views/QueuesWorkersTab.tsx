import React from 'react';
import {
  Layers,
  Cpu,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Server
} from 'lucide-react';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { QueueMonitorItem, WorkerMonitorItem } from '../observability.types';

interface QueuesWorkersTabProps {
  queues: QueueMonitorItem[];
  workers: WorkerMonitorItem[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const QueuesWorkersTab: React.FC<QueuesWorkersTabProps> = ({
  queues,
  workers,
  onRefresh,
  isLoading = false
}) => {
  const getQueueStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <Badge variant="emerald" dot>Normal</Badge>;
      case 'DEGRADED':
        return <Badge variant="amber" dot>Retenção Leve</Badge>;
      case 'STALLED':
        return <Badge variant="rose" dot>Fila Travada</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const getWorkerStatusBadge = (status: string) => {
    switch (status) {
      case 'BUSY':
        return <Badge variant="cyan" dot>Ocupado</Badge>;
      case 'IDLE':
        return <Badge variant="emerald">Livre</Badge>;
      case 'PAUSED':
        return <Badge variant="amber">Pausado</Badge>;
      case 'OFFLINE':
        return <Badge variant="rose">Offline</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-purple-400" />
            Filas de Mensagens & Frotas de Workers
          </h2>
          <p className="text-sm text-slate-400">
            Monitoramento em tempo real de processamento assíncrono, webhooks, relatórios e balanceamento de carga entre nós de execução.
          </p>
        </div>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            isLoading={isLoading}
            className="border-slate-700 bg-slate-800 text-slate-200"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Atualizar Filas
          </Button>
        )}
      </div>

      {/* Queues Section */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-purple-400" />
          Filas Operacionais Ativas ({queues.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {queues.map(queue => (
            <div
              key={queue.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm font-mono">{queue.name}</h4>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Vazão: <strong className="text-slate-200">{queue.throughputPerMin} jobs/min</strong>
                  </div>
                </div>
                {getQueueStatusBadge(queue.status)}
              </div>

              {/* Counters Grid */}
              <div className="grid grid-cols-4 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Ativos</div>
                  <div className="text-sm font-bold font-mono text-cyan-400">{queue.activeCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Aguardando</div>
                  <div className="text-sm font-bold font-mono text-slate-300">{queue.waitingCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Atrasados</div>
                  <div className="text-sm font-bold font-mono text-amber-400">{queue.delayedCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Falhas</div>
                  <div className="text-sm font-bold font-mono text-rose-400">{queue.failedCount}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60">
                <span>Último processado: {new Date(queue.lastProcessedAt).toLocaleTimeString('pt-BR')}</span>
                {queue.failedCount > 0 && (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" />
                    Retry pendente
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workers Fleet Section */}
      <div className="space-y-3 pt-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="h-5 w-5 text-emerald-400" />
          Frotas de Workers de Processamento ({workers.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map(worker => (
            <div
              key={worker.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{worker.name}</h4>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">{worker.hostname}</div>
                </div>
                {getWorkerStatusBadge(worker.status)}
              </div>

              {/* Resource Usage Bars */}
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>CPU: {worker.cpuUsagePercent}%</span>
                    <span>{worker.cpuUsagePercent > 80 ? 'Elevado' : 'Estável'}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        worker.cpuUsagePercent > 80 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${worker.cpuUsagePercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>RAM: {worker.memoryUsageMb} MB</span>
                    <span>Max 1024 MB</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${(worker.memoryUsageMb / 1024) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Current Job */}
              <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800 text-xs">
                <div className="text-slate-500 text-[10px] uppercase font-semibold">Job Atual:</div>
                <div className="text-slate-200 font-mono truncate mt-0.5">
                  {worker.activeJob || 'Aguardando novas mensagens...'}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60">
                <span>Processados: <strong className="text-slate-300 font-mono">{worker.processedCount}</strong></span>
                <span>Uptime: {Math.floor(worker.uptimeSeconds / 3600)}h {Math.floor((worker.uptimeSeconds % 3600) / 60)}m</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
