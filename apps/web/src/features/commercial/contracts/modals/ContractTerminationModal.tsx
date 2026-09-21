import React, { useState } from 'react';
import { CommercialContractDTO } from '@shared/types/index';
import { CommercialContractsApi } from '../api/commercial-contracts.api';
import { X, AlertOctagon, AlertTriangle } from 'lucide-react';
import { Button } from '../../../../shared/components/Button';

interface ContractTerminationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  contractCode: string;
  onSuccess?: (contract: CommercialContractDTO) => void;
}

export const ContractTerminationModal: React.FC<ContractTerminationModalProps> = ({
  isOpen,
  onClose,
  contractId,
  contractCode,
  onSuccess
}) => {
  if (!isOpen) return null;

  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A justificativa da rescisão é estritamente obrigatória.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const contract = await CommercialContractsApi.terminateContract(contractId, {
        reason: reason.trim(),
        notes: notes.trim() || undefined
      });

      onSuccess?.(contract);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao rescindir contrato.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-rose-200 dark:border-rose-500/40 bg-white dark:bg-[#0F172A] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-500/20 bg-rose-50/80 dark:bg-rose-500/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-rose-100 dark:bg-rose-500/20 p-2 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Rescisão Contratual Definitiva</h2>
              <p className="text-xs text-rose-600 dark:text-rose-300 font-medium">
                Ação irreversível para o contrato <span className="font-mono font-bold text-slate-900 dark:text-white">{contractCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-100/50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-sm flex-1">
          {error && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900 dark:text-rose-300">Atenção ao impacto operacional e financeiro:</p>
              <p className="mt-1 text-rose-700/90 dark:text-rose-200/90 leading-relaxed">
                Ao rescindir este contrato, as taxas e condições comerciais serão imediatamente desativadas. Todos os borderôs e apurações futuras serão afetados e o status passará a TERMINATED.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Motivo Formal da Rescisão *
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Distrato consensual entre as partes / Inadimplemento contratual..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-rose-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Observações e Parecer Jurídico
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Detalhes adicionais, número de processo ou termos acordados na notificação extrajudicial..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-rose-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !reason.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
            >
              {submitting ? 'Rescindindo...' : 'Confirmar Rescisão Contratual'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
