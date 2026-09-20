import React from 'react';
import { JobBatch } from '../jobs.types';
import { Button } from '../../../shared/components/Button';
import { Layers, RefreshCw, XCircle, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface BatchesTabProps {
  batches: JobBatch[];
  onOpenNewBatch: () => void;
  onRetryFailures: (batch: JobBatch) => void;
  onCancelBatch: (batch: JobBatch) => void;
}

export const BatchesTab: React.FC<BatchesTabProps> = ({
  batches,
  onOpenNewBatch,
  onRetryFailures,
  onCancelBatch
}) => {
  const getStatusBadge = (status: JobBatch['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Concluído
          </span>
        );
      case 'PARTIALLY_COMPLETED':
        return (
          <span className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Concluído Parcialmente
          </span>
        );
      case 'FAILED':
        return (
          <span className="rounded bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-400 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Falhou
          </span>
        );
      case 'RUNNING':
        return (
          <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-400 flex items-center gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" /> Em Execução
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-400" />
            Processamentos em Lote (Parent × Child Jobs)
          </h3>
          <p className="text-xs text-slate-400">
            Lotes massivos com orquestração de sub-tarefas, status agregado e reprocessamento seletivo de falhas.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={onOpenNewBatch}>
          <Layers className="mr-1.5 h-4 w-4" />
          Novo Processamento em Lote
        </Button>
      </div>

      {batches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
          <Layers className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <p className="font-semibold text-white">Nenhum lote de processamento encontrado</p>
          <p className="text-xs text-slate-500 mt-1">Dispare um novo lote de pagamentos, conciliações ou mensagens em massa.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map(batch => (
            <div
              key={batch.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white">{batch.id}</span>
                  {getStatusBadge(batch.status)}
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 uppercase">
                    {batch.module}
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  Total: <strong className="text-white">{batch.totalItems} operações filhas</strong>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{batch.name}</h4>
                <div className="text-xs text-slate-400 mt-0.5">
                  Criado por <span className="text-slate-300">{batch.createdByName}</span> • Correlation ID: <span className="font-mono text-[11px] text-slate-400">{batch.correlationId}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Progresso do Lote</span>
                  <span className="font-bold text-orange-400">{batch.progressPercent}%</span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      batch.status === 'COMPLETED' ? 'bg-emerald-500' :
                      batch.failedItems > 0 ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${batch.progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-semibold">
                      ✓ {batch.completedItems} concluídos
                    </span>
                    {batch.failedItems > 0 && (
                      <span className="text-rose-400 font-semibold">
                        ✖ {batch.failedItems} falharam
                      </span>
                    )}
                    {batch.pendingItems > 0 && (
                      <span className="text-cyan-400">
                        ⏳ {batch.pendingItems} pendentes
                      </span>
                    )}
                  </div>

                  <span className="text-slate-500">
                    {batch.completedItems + batch.failedItems} de {batch.totalItems} finalizados
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-slate-500">
                  {batch.failedItems > 0 && (
                    <span className="text-amber-400 text-[11px]">
                      O lote possui falhas parciais elegíveis para retry seletivo sem re-executar operações já concluídas.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {batch.failedItems > 0 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onRetryFailures(batch)}
                    >
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Reprocessar Falhas ({batch.failedItems})
                    </Button>
                  )}

                  {batch.status === 'RUNNING' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onCancelBatch(batch)}
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Cancelar Lote
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
