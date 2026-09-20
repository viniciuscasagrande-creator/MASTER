import React, { useState } from 'react';
import { X, RefreshCw, AlertCircle, FileText, Calendar, DollarSign } from 'lucide-react';
import { CommercialAccountsApi } from '../api/commercial-accounts.api';
import { CommercialRenewalType } from '@shared/types/index';

interface StartRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  contractPublicCode?: string;
  producerName?: string;
  currentExpiresAt?: string;
  onSuccess: () => void;
}

export const StartRenewalModal: React.FC<StartRenewalModalProps> = ({
  isOpen,
  onClose,
  contractId,
  contractPublicCode,
  producerName,
  currentExpiresAt,
  onSuccess
}) => {
  const [renewalType, setRenewalType] = useState<CommercialRenewalType>('SIMPLE');
  const [targetEffectiveUntil, setTargetEffectiveUntil] = useState<string>('');
  const [estimatedValue, setEstimatedValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await CommercialAccountsApi.startRenewalNegotiation({
        contractId,
        renewalType,
        targetEffectiveUntil: targetEffectiveUntil ? new Date(targetEffectiveUntil).toISOString() : undefined,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
        notes: notes || undefined
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao iniciar processo de renovação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Iniciar Ciclo de Renovação</h2>
              <p className="text-xs text-slate-400">
                {contractPublicCode || contractId} {producerName ? `• ${producerName}` : ''}
              </p>
            </div>
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

          {currentExpiresAt && (
            <div className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-lg text-xs text-slate-300 flex justify-between">
              <span className="text-slate-400">Vencimento Contratual Atual:</span>
              <span className="font-medium text-white">{new Date(currentExpiresAt).toLocaleDateString('pt-BR')}</span>
            </div>
          )}

          {/* Tipo de Renovação */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Tipo de Renovação
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-lg border cursor-pointer flex flex-col gap-1 transition ${
                  renewalType === 'SIMPLE'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="renewalType"
                  value="SIMPLE"
                  checked={renewalType === 'SIMPLE'}
                  onChange={() => setRenewalType('SIMPLE')}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Renovação Simples</span>
                <span className="text-xs opacity-75">Extensão de prazo mantendo as condições atuais.</span>
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer flex flex-col gap-1 transition ${
                  renewalType === 'RENEGOTIATION'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="renewalType"
                  value="RENEGOTIATION"
                  checked={renewalType === 'RENEGOTIATION'}
                  onChange={() => setRenewalType('RENEGOTIATION')}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Renegociação</span>
                <span className="text-xs opacity-75">Abre oportunidade no pipeline para nova proposta/termos.</span>
              </label>
            </div>
          </div>

          {/* Nova Data Prevista de Término */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nova Data Prevista de Término (Vigência Alvo)
            </label>
            <div className="relative">
              <Calendar className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="date"
                value={targetEffectiveUntil}
                onChange={(e) => setTargetEffectiveUntil(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Valor Estimado (para renegociação) */}
          {renewalType === 'RENEGOTIATION' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Faturamento Estimado no Novo Ciclo (R$)
              </label>
              <div className="relative">
                <DollarSign className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  placeholder="0,00"
                  step="0.01"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Observações & Justificativa Comercial
            </label>
            <textarea
              rows={3}
              placeholder="Detalhes sobre a negociação de renovação, expectativas de eventos do produtor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
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
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>Confirmar Abertura</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
