import React from 'react';
import { Job } from '../jobs.types';
import { JobStatusBadge } from '../components/JobStatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { QueueBadge } from '../components/QueueBadge';
import { JobProgress } from '../components/JobProgress';
import { Button } from '../../../shared/components/Button';
import { Play, Pause, XCircle, Clock, Eye, AlertCircle } from 'lucide-react';

interface RunningJobsTabProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onPauseJob: (job: Job) => void;
  onCancelJob: (job: Job) => void;
}

export const RunningJobsTab: React.FC<RunningJobsTabProps> = ({
  jobs,
  onSelectJob,
  onPauseJob,
  onCancelJob
}) => {
  const runningJobs = jobs.filter(j => j.status === 'RUNNING');

  const formatElapsed = (startedAt?: string | null) => {
    if (!startedAt) return '-';
    try {
      const diffMs = Date.now() - new Date(startedAt).getTime();
      const seconds = Math.floor(diffMs / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Play className="h-4 w-4 text-orange-400" />
            Processamentos em Execução Ativa
          </h3>
          <p className="text-xs text-slate-400">
            Workers alocados executando transações e tarefas com telemetria em tempo real.
          </p>
        </div>
        <span className="text-xs font-mono text-orange-400 font-bold bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
          {runningJobs.length} em andamento
        </span>
      </div>

      {runningJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
          <Clock className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <p className="font-semibold text-white">Nenhum job em execução ativa</p>
          <p className="text-xs text-slate-500 mt-1">Todos os workers encontram-se ociosos ou aguardando novas solicitações nas filas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {runningJobs.map(job => (
            <div
              key={job.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white">{job.id}</span>
                  <JobStatusBadge status={job.status} />
                  <QueueBadge queue={job.queue} />
                  <PriorityBadge priority={job.priority} />
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>Em execução há <strong className="text-white font-mono">{formatElapsed(job.startedAt)}</strong></span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{job.type}</h4>
                <div className="text-xs text-slate-400 mt-0.5">
                  Módulo: <span className="text-slate-300 font-medium">{job.module}</span>
                  {job.producerId && <span> • Produtor: <strong className="text-slate-300">{job.producerId}</strong></span>}
                  <span> • Criado por: <span className="text-slate-300">{job.createdByName}</span></span>
                </div>
              </div>

              {/* Real Progress Bar */}
              <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
                <JobProgress progress={job.progress} progressData={job.progressData} />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-mono text-[11px] text-slate-500">
                  Correlation: {job.correlationId}
                </span>

                <div className="flex items-center gap-2">
                  {job.pausable && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPauseJob(job)}
                    >
                      <Pause className="mr-1.5 h-3.5 w-3.5 text-purple-400" />
                      Pausar
                    </Button>
                  )}

                  {job.cancellable && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onCancelJob(job)}
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Cancelar
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectJob(job)}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Detalhes
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
