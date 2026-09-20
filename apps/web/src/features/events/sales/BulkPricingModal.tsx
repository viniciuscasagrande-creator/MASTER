import React, { useState } from 'react';
import { X, Sparkles, TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  BulkPricingUpdateInput,
  BulkPricingUpdateResult,
  PricingMatrixDTO
} from '@shared/types/index';
import { bulkUpdatePricing } from '../api/pricing.api';
import { formatCurrency } from '../../../shared/utils/formatters';

interface BulkPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied: () => Promise<void>;
  eventId: string;
  batchId: string;
  batchName: string;
  matrix: PricingMatrixDTO;
}

export const BulkPricingModal: React.FC<BulkPricingModalProps> = ({
  isOpen,
  onClose,
  onApplied,
  eventId,
  batchId,
  batchName,
  matrix
}) => {
  const [operation, setOperation] = useState<BulkPricingUpdateInput['operation']>('INCREASE_PERCENTAGE');
  const [value, setValue] = useState<number>(10);
  const [roundingPolicy, setRoundingPolicy] = useState<BulkPricingUpdateInput['roundingPolicy']>('ROUND_UP_INT');
  const [targetSectionIds, setTargetSectionIds] = useState<string[]>([]);
  const [targetTicketTypeIds, setTargetTicketTypeIds] = useState<string[]>([]);

  const [preview, setPreview] = useState<BulkPricingUpdateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulate = async () => {
    try {
      setLoading(true);
      setError(null);

      // Converte valor conforme operação
      let valInCentsOrPct = value;
      if (operation === 'SET_VALUE' || operation === 'INCREASE_FIXED' || operation === 'DECREASE_FIXED') {
        valInCentsOrPct = Math.round(value * 100);
      }

      const res = await bulkUpdatePricing(eventId, {
        batchId,
        operation,
        value: valInCentsOrPct,
        roundingPolicy,
        targetSectionIds: targetSectionIds.length > 0 ? targetSectionIds : undefined,
        targetTicketTypeIds: targetTicketTypeIds.length > 0 ? targetTicketTypeIds : undefined,
        dryRun: true
      });

      setPreview(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao simular reajuste');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      setLoading(true);
      setError(null);

      let valInCentsOrPct = value;
      if (operation === 'SET_VALUE' || operation === 'INCREASE_FIXED' || operation === 'DECREASE_FIXED') {
        valInCentsOrPct = Math.round(value * 100);
      }

      await bulkUpdatePricing(eventId, {
        batchId,
        operation,
        value: valInCentsOrPct,
        roundingPolicy,
        targetSectionIds: targetSectionIds.length > 0 ? targetSectionIds : undefined,
        targetTicketTypeIds: targetTicketTypeIds.length > 0 ? targetTicketTypeIds : undefined,
        dryRun: false
      });

      await onApplied();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao aplicar reajuste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 my-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Reajuste em Massa — {batchName}</h2>
              <p className="text-xs text-slate-400">Altere preços de múltiplos setores com simulação prévia</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Tipo de Operação
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setOperation('INCREASE_PERCENTAGE'); setValue(10); }}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left ${
                  operation === 'INCREASE_PERCENTAGE' ? 'bg-brand-500/10 border-brand-500 text-brand-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                + Aumento (%)
              </button>
              <button
                type="button"
                onClick={() => { setOperation('DECREASE_PERCENTAGE'); setValue(10); }}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left ${
                  operation === 'DECREASE_PERCENTAGE' ? 'bg-brand-500/10 border-brand-500 text-brand-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                - Desconto (%)
              </button>
              <button
                type="button"
                onClick={() => { setOperation('INCREASE_FIXED'); setValue(20); }}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left ${
                  operation === 'INCREASE_FIXED' ? 'bg-brand-500/10 border-brand-500 text-brand-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                + Acréscimo Fixo (R$)
              </button>
              <button
                type="button"
                onClick={() => { setOperation('DECREASE_FIXED'); setValue(20); }}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left ${
                  operation === 'DECREASE_FIXED' ? 'bg-brand-500/10 border-brand-500 text-brand-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                - Redução Fixa (R$)
              </button>
              <button
                type="button"
                onClick={() => { setOperation('SET_VALUE'); setValue(150); }}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left ${
                  operation === 'SET_VALUE' ? 'bg-brand-500/10 border-brand-500 text-brand-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                = Fixar Preço (R$)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Valor {operation.includes('PERCENTAGE') ? '(%)' : '(R$)'}
              </label>
              <input
                type="number"
                step={operation.includes('PERCENTAGE') ? '1' : '0.50'}
                value={value}
                onChange={e => setValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Política de Arredondamento
              </label>
              <select
                value={roundingPolicy}
                onChange={e => setRoundingPolicy(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
              >
                <option value="NONE">Sem arredondamento especial</option>
                <option value="ROUND_UP_INT">Arredondar para o real cheio acima (R$ X,00)</option>
                <option value="ROUND_NEAREST_TEN">Arredondar para dezena mais próxima (R$ 10, 20)</option>
                <option value="ROUND_CENTS_99">Preço psicológico final 99 (R$ X,99)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSimulate}
              disabled={loading}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Gerar Prévia de Reajuste (Simulação)</span>
            </button>
          </div>

          {/* Prévia dos Novos Valores */}
          {preview && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold uppercase tracking-wider">
                  Prévia de Impacto ({preview.preview.length} itens afetados)
                </span>
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Simulação calculada
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/40">
                {preview.preview.map((p, idx) => (
                  <div key={idx} className="pt-1.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-slate-200">{p.sectionName}</span>
                      <span className="text-slate-400 ml-1.5">({p.ticketTypeName})</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-slate-400 line-through">
                        {formatCurrency(p.oldPriceInCents / 100)}
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {formatCurrency(p.newPriceInCents / 100)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 bg-slate-800/50 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={loading || !preview}
            className="px-5 py-2 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            {loading ? 'Aplicando...' : 'Confirmar e Aplicar Preços'}
          </button>
        </div>
      </div>
    </div>
  );
};
