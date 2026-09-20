import React from 'react';
import { Job, JobDeadLetter } from '../jobs.types';
import { JobStatusBadge } from '../components/JobStatusBadge';
import { QueueBadge } from '../components/QueueBadge';
import { Button } from '../../../shared/components/Button';
import { AlertTriangle, RefreshCw, Search, Eye } from 'lucide-react';

interface DeadLetterTabProps {
  deadLetters: JobDeadLetter[];
  onInvestigate: (dl: JobDeadLetter) => void;
  onReprocess: (dl: JobDeadLetter) => void;
  onViewJob?: (jobId: string) => void;
}

export const DeadLetterTab: React.FC<DeadLetterTabProps> = ({
  deadLetters,
  onInvestigate,
  onReprocess,
  onViewJob
}) => {
  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            Central de Dead Letters (Requer Intervenção Humana)
          </h3>
          <p className="text-xs text-slate-400">
            Processamentos que sofreram erros permanentes ou esgotaram a política de retentativas automáticas.
          </p>
        </div>
        <span className="text-xs font-mono text-rose-400 font-bold bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
          {deadLetters.length} pendentes
        </span>
      </div>

      {deadLetters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
          <AlertTriangle className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <p className="font-semibold text-white">Nenhum processamento em Dead Letter</p>
          <p className="text-xs text-slate-500 mt-1">Todos os jobs com erro foram recuperados ou não há falhas críticas no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deadLetters.map(dl => (
            <div
              key={dl.id}
              className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-rose-300">{dl.jobId}</span>
                  <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 uppercase">
                    Requer Intervenção
                  </span>
                  <QueueBadge queue={dl.originalQueue} />
                </div>

                <div className="text-xs text-slate-400">
                  Registrado em: {formatDateTime(dl.movedToDeadLetterAt)}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{dl.jobType}</h4>
                <div className="text-xs text-slate-400 mt-0.5">
                  Módulo: <strong className="text-slate-300">{dl.module}</strong> • Tentativas Realizadas: <strong className="text-rose-400">{dl.attemptsCount}</strong>
                  {dl.investigated && (
                    <span className="ml-2 text-emerald-400 font-semibold">
                      ✓ Investigado por {dl.investigatedBy}
                    </span>
                  )}
                </div>
              </div>

              {/* Error Reason Banner */}
              <div className="rounded-lg bg-slate-950 p-3 border border-rose-500/20 text-xs font-mono text-rose-200">
                {dl.failureReason}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-500 font-mono">
                  ID Dead Letter: {dl.id}
                </div>

                <div className="flex items-center gap-2">
                  {!dl.investigated && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onInvestigate(dl)}
                    >
                      <Search className="mr-1.5 h-3.5 w-3.5" />
                      Marcar como Investigado
                    </Button>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onReprocess(dl)}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Reprocessar Job
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
