import React from 'react';
import { Job } from '../jobs.types';
import { JobStatusBadge } from '../components/JobStatusBadge';
import { QueueBadge } from '../components/QueueBadge';
import { Button } from '../../../shared/components/Button';
import { CheckCircle2, Eye, Clock, Calendar } from 'lucide-react';

interface CompletedJobsTabProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
}

export const CompletedJobsTab: React.FC<CompletedJobsTabProps> = ({
  jobs,
  onSelectJob
}) => {
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED');

  const formatDuration = (startedAt?: string | null, finishedAt?: string | null) => {
    if (!startedAt || !finishedAt) return '-';
    try {
      const diff = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
      const secs = Math.round(diff / 1000);
      if (secs < 60) return `${secs}s`;
      const mins = Math.floor(secs / 60);
      const remSecs = secs % 60;
      return `${mins}m ${remSecs}s`;
    } catch {
      return '-';
    }
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Processamentos Concluídos com Sucesso
          </h3>
          <p className="text-xs text-slate-400">
            Histórico de execuções finalizadas com integridade transacional e auditoria.
          </p>
        </div>
        <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          {completedJobs.length} concluídos
        </span>
      </div>

      {completedJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
          <CheckCircle2 className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <p className="font-semibold text-white">Nenhum job concluído recente</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase font-semibold text-slate-400">
              <tr>
                <th className="p-3.5">ID / Tipo</th>
                <th className="p-3.5">Módulo / Fila</th>
                <th className="p-3.5">Duração</th>
                <th className="p-3.5">Conclusão</th>
                <th className="p-3.5">Correlation ID</th>
                <th className="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {completedJobs.map(job => (
                <tr key={job.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-3.5">
                    <div className="font-mono font-bold text-white">{job.id}</div>
                    <div className="text-[11px] text-slate-400">{job.type}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-300">
                        {job.module}
                      </span>
                      <QueueBadge queue={job.queue} />
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-emerald-400 font-medium">
                    {formatDuration(job.startedAt, job.finishedAt)}
                  </td>
                  <td className="p-3.5 text-slate-400">
                    {formatDateTime(job.finishedAt)}
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-500">
                    {job.correlationId}
                  </td>
                  <td className="p-3.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectJob(job)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Detalhes
                    </Button>
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
