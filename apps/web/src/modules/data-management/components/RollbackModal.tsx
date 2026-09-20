import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { RollbackEligibility } from '../data-management.types';

interface RollbackModalProps {
  importId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const RollbackModal: React.FC<RollbackModalProps> = ({
  importId,
  onClose,
  onSuccess
}) => {
  const [eligibility, setEligibility] = useState<RollbackEligibility | null>(null);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState<boolean>(true);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [forceCompensation, setForceCompensation] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    checkEligibility();
  }, [importId]);

  const checkEligibility = async () => {
    setIsLoadingEligibility(true);
    try {
      const res = await fetch(`/api/data/imports/${importId}/rollback/eligibility`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const data = await res.json();
      if (data.success) {
        setEligibility(data.eligibility);
        if (!data.eligibility.eligible) {
          setForceCompensation(true);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingEligibility(false);
    }
  };

  const handleExecuteRollback = async () => {
    setIsExecuting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/data/imports/${importId}/rollback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ forceCompensation })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Falha ao executar reversão/rollback.');
      }
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado na operação.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Reversão e Compensação de Lote</h3>
              <p className="text-xs text-slate-400">ID: {importId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-sm text-slate-300">
          {errorMsg && (
            <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoadingEligibility ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-purple-400" />
              <span className="text-xs text-slate-400">Auditando integridade relacional e dependências...</span>
            </div>
          ) : eligibility ? (
            <div className="space-y-4">
              {eligibility.eligible ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Rollback Físico Autorizado</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Nenhum pedido, ingresso ou liquidação financeira foi gerado a partir destes registros. O lote pode ser fisicamente desfeito sem quebrar a integridade relacional do sistema.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-xs text-yellow-300 space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldAlert className="h-4 w-4 text-yellow-400" />
                    <span>Rollback Físico Bloqueado por Dependências</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {eligibility.reason}
                  </p>
                  {eligibility.blockingDependencies.length > 0 && (
                    <div className="mt-2 rounded-lg bg-slate-950/60 p-2.5 space-y-1">
                      <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
                        Registros Dependentes Vinculados:
                      </span>
                      {eligibility.blockingDependencies.map(dep => (
                        <div key={dep.relation} className="flex justify-between text-[11px] text-slate-300">
                          <span>{dep.relation}:</span>
                          <span className="font-bold text-white">{dep.count} registros</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-purple-300 font-medium">
                    Ação recomendada: <strong>Compensação Lógica</strong> (os registros serão desativados e cancelados sem exclusão física das transações dependentes).
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-slate-950/40 border border-slate-800 p-3 text-xs text-slate-400">
                ⚠️ <strong>Aviso de Auditoria:</strong> Toda operação de reversão emite evento rastreável no EventBus (<code>DATA_IMPORT_ROLLED_BACK</code>) e gera trilha indelével de conformidade.
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-950/80 p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isExecuting}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExecuteRollback}
            disabled={isExecuting || isLoadingEligibility}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 shadow-lg shadow-purple-950/40 disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Executando...
              </>
            ) : eligibility?.eligible ? (
              <>
                <RotateCcw className="h-4 w-4" />
                Confirmar Rollback Físico
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Confirmar Ação Compensatória
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
