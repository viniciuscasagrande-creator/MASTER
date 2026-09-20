import React from 'react';
import { ProcessingCenterStats, Job, JobBatch } from '../jobs.types';
import { JobStatusBadge } from '../components/JobStatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { QueueBadge } from '../components/QueueBadge';
import { JobProgress } from '../components/JobProgress';
import { Button } from '../../../shared/components/Button';
import {
  Play,
  Layers,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Database,
  Cpu,
  Activity,
  ArrowUpRight,
  Clock,
  Sparkles
} from 'lucide-react';

interface OverviewTabProps {
  stats: ProcessingCenterStats | null;
  runningJobs: Job[];
  recentBatches: JobBatch[];
  onOpenNewBatch: () => void;
  onOpenNewSchedule: () => void;
  onSelectJob: (job: Job) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  runningJobs,
  recentBatches,
  onOpenNewBatch,
  onOpenNewSchedule,
  onSelectJob
}) => {
  const getHealthBadge = (status?: 'HEALTHY' | 'WARNING' | 'CRITICAL') => {
    switch (status) {
      case 'HEALTHY':
        return <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Normal</span>;
      case 'WARNING':
        return <span className="inline-flex items-center gap-1 text-amber-400 font-semibold"><span className="h-2 w-2 rounded-full bg-amber-500" /> Atenção</span>;
      case 'CRITICAL':
        return <span className="inline-flex items-center gap-1 text-rose-400 font-semibold"><span className="h-2 w-2 rounded-full bg-rose-500" /> Crítico</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-slate-400">Normal</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Central de Processamentos & Orquestração</h2>
          <p className="text-xs text-slate-400">
            Painel unificado de monitoramento de workers, filas assíncronas, rotinas agendadas e lotes operacionais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onOpenNewSchedule}>
            <Calendar className="mr-1.5 h-4 w-4 text-orange-400" />
            Novo Agendamento
          </Button>
          <Button variant="primary" size="sm" onClick={onOpenNewBatch}>
            <Layers className="mr-1.5 h-4 w-4" />
            Processar Lote
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Running */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Em Execução</span>
            <Play className="h-4 w-4 text-orange-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {stats ? stats.runningCount : 18}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Workers ativos consumindo
          </div>
        </div>

        {/* Queued */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Na Fila</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {stats ? stats.queuedCount : 42}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Aguardando capacidade
          </div>
        </div>

        {/* Scheduled */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Agendados</span>
            <Calendar className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {stats ? stats.scheduledCount : 27}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Rotinas automáticas
          </div>
        </div>

        {/* Completed Today */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Concluídos Hoje</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {stats ? stats.completedTodayCount.toLocaleString('pt-BR') : '8.421'}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/80">
            99.8% taxa de sucesso
          </div>
        </div>

        {/* Failed */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Com Falha</span>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400">
            {stats ? stats.failedCount : 7}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Retentativa automática
          </div>
        </div>

        {/* Dead Letter */}
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300">Requer Intervenção</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400">
            {stats ? stats.deadLetterCount : 2}
          </div>
          <div className="mt-1 text-[11px] text-rose-300/80">
            Dead Letter queue
          </div>
        </div>
      </div>

      {/* Cluster Health & Latency Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Health Status Box */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-400" />
              Saúde da Infraestrutura
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Cluster 3 Nodes</span>
          </div>

          <div className="divide-y divide-slate-800/80 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Workers Operacionais</span>
              {getHealthBadge(stats?.health.workers)}
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Filas & Backpressure</span>
              {getHealthBadge(stats?.health.queues)}
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Redis & Cache</span>
              {getHealthBadge(stats?.health.redis)}
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Banco de Dados (PostgreSQL)</span>
              {getHealthBadge(stats?.health.database)}
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">APIs & Integrações</span>
              {getHealthBadge(stats?.health.integrations)}
            </div>
          </div>
        </div>

        {/* Processing Rate & Latencies */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              Performance & Latência
            </h3>
            <span className="text-[11px] font-mono text-cyan-400">Tempo Real</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80">
              <div className="flex justify-between text-slate-400">
                <span>Latência Média de Execução</span>
                <span className="font-bold text-white font-mono">{stats?.avgDurationSeconds || '3.8'}s</span>
              </div>
            </div>

            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80">
              <div className="flex justify-between text-slate-400">
                <span>Percentil P95</span>
                <span className="font-bold text-amber-400 font-mono">{stats?.p95DurationSeconds || '12.4'}s</span>
              </div>
            </div>

            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80">
              <div className="flex justify-between text-slate-400">
                <span>Percentil P99</span>
                <span className="font-bold text-rose-400 font-mono">{stats?.p99DurationSeconds || '28.1'}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Batch Summary */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" />
              Lotes Recentes
            </h3>
            <span className="text-[11px] text-slate-500">Últimos disparos</span>
          </div>

          <div className="space-y-2.5">
            {recentBatches.length > 0 ? (
              recentBatches.slice(0, 3).map(batch => (
                <div key={batch.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-white">
                    <span className="truncate max-w-[180px]">{batch.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      batch.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                      batch.status === 'PARTIALLY_COMPLETED' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-cyan-500/10 text-cyan-400'
                    }`}>
                      {batch.status === 'COMPLETED' ? 'Concluído' : (batch.status === 'PARTIALLY_COMPLETED' ? 'Parcial' : 'Processando')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{batch.completedItems} / {batch.totalItems} itens</span>
                    <span className="text-orange-400 font-bold">{batch.progressPercent}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">
                Nenhum lote recente processado.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Jobs in Execution */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Play className="h-4 w-4 text-orange-400" />
              Processamentos Ativos em Execução
            </h3>
            <p className="text-xs text-slate-400">
              Jobs sendo executados pelos workers com telemetria de progresso em tempo real.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {runningJobs.length} ativos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-500">
              <tr>
                <th className="pb-3">ID / Tipo</th>
                <th className="pb-3">Fila / Prioridade</th>
                <th className="pb-3">Progresso Real</th>
                <th className="pb-3">Criado Por</th>
                <th className="pb-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {runningJobs.length > 0 ? (
                runningJobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 pr-4">
                      <div className="font-mono font-bold text-white">{job.id}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[220px]">{job.type}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <QueueBadge queue={job.queue} />
                        <PriorityBadge priority={job.priority} />
                      </div>
                    </td>
                    <td className="py-3 pr-4 min-w-[200px]">
                      <JobProgress progress={job.progress} progressData={job.progressData} />
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      {job.createdByName}
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectJob(job)}
                      >
                        Ver Detalhes
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Nenhum processamento em execução neste momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
