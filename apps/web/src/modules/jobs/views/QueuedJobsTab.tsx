import React from 'react';
import { Job } from '../jobs.types';
import { JobStatusBadge } from '../components/JobStatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { QueueBadge } from '../components/QueueBadge';
import { Button } from '../../../shared/components/Button';
import { Clock, XCircle, Eye } from 'lucide-react';

interface QueuedJobsTabProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onCancelJob: (job: Job) => void;
}

export const QueuedJobsTab: React.FC<QueuedJobsTabProps> = ({
  jobs,
  onSelectJob,
  onCancelJob
}) => {
  const queuedJobs = jobs.filter(j => j.status === 'QUEUED');

  const formatWaitTime = (createdAt?: string | null) => {
    if (!createdAt) return '-';
    try {
      const diffMs = Date.now() - new Date(createdAt).getTime();
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
            <Clock className="h-4 w-4 text-cyan-400" />
            Processamentos Aguardando na Fila
          </h3>
          <p className="text-xs text-slate-400">
            Jobs prontos aguardando liberação de slots de concorrência nos workers.
          </p>
        </div>
        <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
          {queuedJobs.length} enfileirados
        </span>
      </div>

      {queuedJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
          <Clock className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <p className="font-semibold text-white">Nenhum job pendente na fila</p>
          <p className="text-xs text-slate-500 mt-1">O backlog das filas está completamente zerado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase font-semibold text-slate-400">
              <tr>
                <th className="p-3.5">ID / Tipo</th>
                <th className="p-3.5">Fila</th>
                <th className="p-3.5">Prioridade</th>
                <th className="p-3.5">Tempo em Espera</th>
                <th className="p-3.5">Criado Por</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {queuedJobs.map(job => (
                <tr key={job.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3.5">
                    <div className="font-mono font-bold text-white">{job.id}</div>
                    <div className="text-[11px] text-slate-400">{job.type}</div>
                  </td>
                  <td className="p-3.5">
                    <QueueBadge queue={job.queue} />
                  </td>
                  <td className="p-3.5">
                    <PriorityBadge priority={job.priority} />
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">
                    {formatWaitTime(job.createdAt)}
                  </td>
                  <td className="p-3.5 text-slate-300">
                    {job.createdByName}
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {job.cancellable && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onCancelJob(job)}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          Cancelar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectJob(job)}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Detalhes
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
