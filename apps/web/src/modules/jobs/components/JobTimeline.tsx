import React from 'react';
import { Job, JobAttempt } from '../jobs.types';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Play, Pause, RefreshCw } from 'lucide-react';

interface JobTimelineProps {
  job: Job;
  attempts?: JobAttempt[];
}

export const JobTimeline: React.FC<JobTimelineProps> = ({ job, attempts = [] }) => {
  const formatTime = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return iso;
    }
  };

  return (
    <div className="relative border-l border-slate-800 ml-4 pl-4 space-y-6 text-sm">
      {/* 1. Job Created */}
      <div className="relative">
        <div className="absolute -left-[25px] top-0 h-4 w-4 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center">
          <Clock className="h-2.5 w-2.5 text-slate-300" />
        </div>
        <div>
          <div className="text-xs text-slate-400">
            {formatDate(job.createdAt)} às {formatTime(job.createdAt)}
          </div>
          <div className="font-semibold text-white">Processamento criado</div>
          <div className="text-xs text-slate-400">
            Criado por <span className="text-slate-300 font-medium">{job.createdByName}</span>
          </div>
        </div>
      </div>

      {/* 2. Enqueued */}
      <div className="relative">
        <div className="absolute -left-[25px] top-0 h-4 w-4 rounded-full bg-slate-800 border-2 border-cyan-500 flex items-center justify-center">
          <Play className="h-2.5 w-2.5 text-cyan-400" />
        </div>
        <div>
          <div className="text-xs text-slate-400">{formatTime(job.createdAt)}</div>
          <div className="font-semibold text-white">Enviado para a fila {job.queue}</div>
          <div className="text-xs text-slate-400">
            Prioridade: <span className="text-orange-400">{job.priority}</span>
          </div>
        </div>
      </div>

      {/* 3. Attempts / Execution */}
      {attempts.map((att, idx) => (
        <div key={att.id} className="relative">
          <div className={`absolute -left-[25px] top-0 h-4 w-4 rounded-full bg-slate-800 border-2 flex items-center justify-center ${
            att.status === 'COMPLETED' ? 'border-emerald-500' : (att.status === 'FAILED' ? 'border-rose-500' : 'border-amber-500')
          }`}>
            <RefreshCw className="h-2.5 w-2.5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400">{formatTime(att.startedAt)}</div>
            <div className="font-semibold text-white">
              Tentativa {att.attemptNumber} de {job.maxAttempts}
            </div>
            <div className="text-xs text-slate-400">
              Worker: <span className="font-mono text-slate-300">{att.workerId || 'Worker Core'}</span>
              {att.error && (
                <div className="mt-1 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded">
                  {att.error}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* 4. Progress / Checkpoint */}
      {job.checkpoint && (
        <div className="relative">
          <div className="absolute -left-[25px] top-0 h-4 w-4 rounded-full bg-slate-800 border-2 border-purple-500 flex items-center justify-center">
            <Pause className="h-2.5 w-2.5 text-purple-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400">{formatTime(job.checkpoint.savedAt)}</div>
            <div className="font-semibold text-white">Checkpoint salvo</div>
            <div className="text-xs text-slate-400">
              Itens processados até aqui: <span className="font-mono text-purple-300">{job.checkpoint.processedCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Terminal State */}
      {job.status === 'COMPLETED' && (
        <div className="relative">
          <div className="absolute -left-[25px] top-0 h-4 w-4 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400">{formatTime(job.finishedAt)}</div>
            <div className="font-semibold text-emerald-400">Processamento Concluído</div>
            <div className="text-xs text-slate-400">
              Sucesso total de execução (Progresso 100%)
            </div>
          </div>
        </div>
      )}

      {job.status === 'FAILED' && (
        <div className="relative">
          <div className="absolute -left-[25px] top-0 h-4 w-4 rounded-full bg-slate-800 border-2 border-rose-500 flex items-center justify-center">
            <XCircle className="h-2.5 w-2.5 text-rose-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400">{formatTime(job.finishedAt)}</div>
            <div className="font-semibold text-rose-400">Processamento Falhou</div>
            {job.error && (
              <div className="mt-1 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 p-2 rounded">
                {job.error.message}
              </div>
            )}
          </div>
        </div>
      )}

      {job.status === 'DEAD_LETTER' && (
        <div className="relative">
          <div className="absolute -left-[25px] top-0 h-4 w-4 rounded-full bg-slate-800 border-2 border-rose-600 flex items-center justify-center">
            <AlertTriangle className="h-2.5 w-2.5 text-rose-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400">{formatTime(job.finishedAt)}</div>
            <div className="font-semibold text-rose-400">Enviado para Dead Letter (Requer Intervenção)</div>
            <div className="mt-1 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 p-2 rounded">
              {job.error?.message || 'Falha persistente sem elegibilidade para retry automático.'}
            </div>
          </div>
        </div>
      )}

      {job.status === 'CANCELLED' && (
        <div className="relative">
          <div className="absolute -left-[25px] top-0 h-4 w-4 rounded-full bg-slate-800 border-2 border-slate-500 flex items-center justify-center">
            <XCircle className="h-2.5 w-2.5 text-slate-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400">{formatTime(job.finishedAt)}</div>
            <div className="font-semibold text-slate-400">Processamento Cancelado</div>
            <div className="text-xs text-slate-500">
              Interrompido cooperativamente pelo operador
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
