import React, { useState } from 'react';
import { ContractRenewalType, ContractRenewalDTO } from '@shared/types/index';
import { CommercialContractsApi } from '../api/commercial-contracts.api';
import { X, RefreshCw, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '../../../../shared/components/Button';

interface ContractRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  contractCode: string;
  currentEffectiveUntil?: string | null;
  onSuccess?: (renewal: ContractRenewalDTO) => void;
}

export const ContractRenewalModal: React.FC<ContractRenewalModalProps> = ({
  isOpen,
  onClose,
  contractId,
  contractCode,
  currentEffectiveUntil,
  onSuccess
}) => {
  if (!isOpen) return null;

  const [renewalType, setRenewalType] = useState<ContractRenewalType>('SIMPLE');
  const [targetEffectiveFrom, setTargetEffectiveFrom] = useState(() => {
    if (currentEffectiveUntil) {
      const d = new Date(currentEffectiveUntil);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [targetEffectiveUntil, setTargetEffectiveUntil] = useState(() => {
    const d = currentEffectiveUntil ? new Date(currentEffectiveUntil) : new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const renewal = await CommercialContractsApi.createRenewal(contractId, {
        renewalType,
        targetEffectiveFrom,
        targetEffectiveUntil,
        notes: notes.trim() || undefined
      });

      onSuccess?.(renewal);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao processar renovação contratual.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Renovação ou Renegociação de Contrato</h2>
              <p className="text-xs text-slate-400">
                Contrato <span className="font-mono text-white">{contractCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-sm flex-1">
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Type Choice */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-400">
              Modalidade de Renovação *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRenewalType('SIMPLE')}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                  renewalType === 'SIMPLE'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  Prorrogação Simples
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Estende o prazo de vigência mantendo as mesmas condições comerciais vigentes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRenewalType('RENEGOTIATION')}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                  renewalType === 'RENEGOTIATION'
                    ? 'border-orange-500/50 bg-orange-500/10 text-orange-300'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <TrendingUp className="h-4 w-4 text-orange-400" />
                  Renegociação Comercial
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Gera uma nova oportunidade no CRM comercial para repactuar condições e novas taxas.
                </p>
              </button>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Novo Início de Vigência *
              </label>
              <input
                type="date"
                value={targetEffectiveFrom}
                onChange={e => setTargetEffectiveFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Novo Término de Vigência *
              </label>
              <input
                type="date"
                value={targetEffectiveUntil}
                onChange={e => setTargetEffectiveUntil(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Notas e Justificativa da Renovação
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Renovação automática prevista em contrato para mais um ciclo de 12 meses..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          {renewalType === 'RENEGOTIATION' && (
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-300 flex items-start gap-2">
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Oportunidade no CRM Comercial</p>
                <p className="text-orange-200/80 mt-0.5">
                  Ao confirmar, uma nova oportunidade será registrada no pipeline da 1.3.4 vinculada a este produtor para condução da nova rodada de negociação.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="border-slate-700 text-slate-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20"
            >
              {submitting ? 'Processando...' : renewalType === 'RENEGOTIATION' ? 'Iniciar Renegociação' : 'Efetivar Prorrogação'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
