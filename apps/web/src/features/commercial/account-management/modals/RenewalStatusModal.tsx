import React, { useState } from 'react';
import { X, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { CommercialAccountsApi } from '../api/commercial-accounts.api';
import { CommercialRenewalDTO, CommercialRenewalStatus } from '@shared/types/index';

interface RenewalStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  renewal: CommercialRenewalDTO;
  onSuccess: () => void;
}

export const RenewalStatusModal: React.FC<RenewalStatusModalProps> = ({
  isOpen,
  onClose,
  renewal,
  onSuccess
}) => {
  const [status, setStatus] = useState<CommercialRenewalStatus>(renewal.status);
  const [notes, setNotes] = useState<string>(renewal.notes || '');
  const [targetEffectiveUntil, setTargetEffectiveUntil] = useState<string>(
    renewal.targetEffectiveUntil ? renewal.targetEffectiveUntil.split('T')[0] : ''
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await CommercialAccountsApi.updateRenewalStatus(renewal.id, {
        status,
        version: renewal.version, // Concurrency protection
        notes: notes || undefined,
        targetEffectiveUntil: targetEffectiveUntil ? new Date(targetEffectiveUntil).toISOString() : undefined
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar status da renovação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div>
            <h2 className="text-lg font-semibold text-white">Atualizar Status de Renovação</h2>
            <p className="text-xs text-slate-400">
              {renewal.contractPublicCode} • Ciclo {renewal.renewalCycle} • Versão {renewal.version}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Novo Status Operacional
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CommercialRenewalStatus)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="PLANNED">Planejada (Em preparação comercial)</option>
              <option value="IN_PROGRESS">Em Negociação (Em contato com produtor)</option>
              <option value="PROPOSAL">Proposta Enviada (Aguardando análise)</option>
              <option value="AWAITING_DECISION">Em Decisão Final / Assinatura</option>
              <option value="CANCELLED">Cancelada (Ciclo descartado)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Data Prevista de Término
            </label>
            <div className="relative">
              <Calendar className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="date"
                value={targetEffectiveUntil}
                onChange={(e) => setTargetEffectiveUntil(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas de Acompanhamento
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Atualizações da negociação, alinhamentos feitos..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
