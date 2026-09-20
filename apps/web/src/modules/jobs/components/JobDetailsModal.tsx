import React from 'react';
import { Job, JobAttempt } from '../jobs.types';
import { JobStatusBadge } from './JobStatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { QueueBadge } from './QueueBadge';
import { JobProgress } from './JobProgress';
import { JobTimeline } from './JobTimeline';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import {
  Copy,
  Clock,
  Play,
  Pause,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  attempts?: JobAttempt[];
  onRetry?: (job: Job) => void;
  onCancel?: (job: Job) => void;
  onPause?: (job: Job) => void;
  onResume?: (job: Job) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  isOpen,
  onClose,
  job,
  attempts = [],
  onRetry,
  onCancel,
  onPause,
  onResume
}) => {
  if (!job) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span className="font-mono text-base font-bold text-white">{job.id}</span>
          <JobStatusBadge status={job.status} />
        </div>
      }
      size="xl"
    >
      <div className="space-y-6">
        {/* Top Header Information Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-500">Tipo de Job</div>
            <div className="text-sm font-semibold text-white truncate" title={job.type}>
              {job.type}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase text-slate-500">Módulo</div>
            <div className="text-sm font-semibold text-white">
              {job.module}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase text-slate-500">Fila & Prioridade</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <QueueBadge queue={job.queue} />
              <PriorityBadge priority={job.priority} />
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase text-slate-500">Tentativas</div>
            <div className="text-sm font-semibold text-white">
              {job.attempts} de {job.maxAttempts}
            </div>
          </div>
        </div>

        {/* Correlation ID & Audit Context */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800/80 bg-slate-950 p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-mono">Correlation ID:</span>
            <span className="font-mono text-orange-400 font-bold">{job.correlationId}</span>
            <button
              onClick={() => copyToClipboard(job.correlationId)}
              className="p-1 text-slate-500 hover:text-white transition"
              title="Copiar Correlation ID"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          {job.producerId && (
            <div className="flex items-center gap-1 text-slate-400">
              <Building className="h-3.5 w-3.5 text-slate-500" />
              <span>Produtor: <strong className="text-white">{job.producerId}</strong></span>
            </div>
          )}

          {job.idempotencyKey && (
            <div className="flex items-center gap-1 text-slate-400 truncate max-w-[250px]" title={job.idempotencyKey}>
              <span>Chave Idemp: <strong className="text-slate-300 font-mono text-[10px]">{job.idempotencyKey}</strong></span>
            </div>
          )}
        </div>

        {/* Progress Bar (if running or completed) */}
        {(job.status === 'RUNNING' || job.status === 'COMPLETED' || job.progress > 0) && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Progresso Operacional</div>
            <JobProgress progress={job.progress} progressData={job.progressData} />
          </div>
        )}

        {/* Error Alert Box (if failed) */}
        {job.error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-1">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Erro no Processamento ({job.error.isPermanent ? 'Permanente' : 'Temporário'})</span>
            </div>
            <p className="text-xs text-rose-200 font-mono whitespace-pre-wrap">
              {job.error.message}
            </p>
            {job.error.code && (
              <div className="text-[11px] text-rose-400/80 font-mono">
                Código do Erro: {job.error.code}
              </div>
            )}
          </div>
        )}

        {/* Results Inspection (if completed) */}
        {job.result && (
          <div className="rounded-xl border border-emerald-500/20 bg-slate-900/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4" />
              <span>Resultado da Execução</span>
            </div>
            <pre className="max-h-40 overflow-y-auto rounded bg-slate-950 p-3 text-[11px] font-mono text-slate-300 border border-slate-800">
              {JSON.stringify(job.result, null, 2)}
            </pre>
          </div>
        )}

        {/* Payload Section */}
        {job.payload && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Parâmetros (Payload Sanitizado)</div>
            <pre className="max-h-40 overflow-y-auto rounded bg-slate-950 p-3 text-[11px] font-mono text-slate-300 border border-slate-800">
              {JSON.stringify(job.payload, null, 2)}
            </pre>
          </div>
        )}

        {/* Chronological Timeline */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Trilha de Execução & Linha do Tempo</div>
          <JobTimeline job={job} attempts={attempts} />
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-500">
            Iniciado em: {formatDateTime(job.startedAt)}
          </div>

          <div className="flex items-center gap-2">
            {(job.status === 'FAILED' || job.status === 'DEAD_LETTER') && onRetry && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onRetry(job)}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Reprocessar Job
              </Button>
            )}

            {job.status === 'RUNNING' && job.pausable && onPause && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPause(job)}
              >
                <Pause className="mr-1.5 h-3.5 w-3.5 text-purple-400" />
                Pausar Execução
              </Button>
            )}

            {job.status === 'WAITING' && job.paused && onResume && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onResume(job)}
              >
                <Play className="mr-1.5 h-3.5 w-3.5" />
                Retomar Execução
              </Button>
            )}

            {(job.status === 'QUEUED' || job.status === 'RUNNING') && job.cancellable && onCancel && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onCancel(job)}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Cancelar Job
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
