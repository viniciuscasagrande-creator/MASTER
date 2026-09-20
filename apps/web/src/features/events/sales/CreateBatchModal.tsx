import React, { useState, useEffect } from 'react';
import { X, Layers, Calendar, Clock, AlertCircle } from 'lucide-react';
import {
  TicketBatchDTO,
  CreateTicketBatchInput,
  BatchActivationType
} from '@shared/types/index';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTicketBatchInput) => Promise<void>;
  existingBatches: TicketBatchDTO[];
  batchToEdit?: TicketBatchDTO | null;
}

const ACTIVATION_TYPES: { value: BatchActivationType; label: string; desc: string }[] = [
  { value: 'MANUAL', label: 'Manual', desc: 'Ativado pelo produtor no painel' },
  { value: 'DATE_TIME', label: 'Data e Hora', desc: 'Agendado para abertura automática' },
  { value: 'PREVIOUS_BATCH_SOLD_OUT', label: 'Esgotamento do Lote Anterior', desc: 'Abre assim que o lote anterior esgotar' },
  { value: 'PREVIOUS_BATCH_QUANTITY', label: 'Quantidade do Lote Anterior', desc: 'Abre ao atingir X vendas no lote anterior' }
];

export const CreateBatchModal: React.FC<CreateBatchModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingBatches,
  batchToEdit
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState(existingBatches.length + 1);
  const [activationType, setActivationType] = useState<BatchActivationType>('PREVIOUS_BATCH_SOLD_OUT');
  const [activationDate, setActivationDate] = useState('');
  const [deactivationDate, setDeactivationDate] = useState('');
  const [previousBatchId, setPreviousBatchId] = useState('');
  const [triggerQuantity, setTriggerQuantity] = useState<number>(0);
  const [totalQuantityLimit, setTotalQuantityLimit] = useState<number | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batchToEdit) {
      setName(batchToEdit.name);
      setCode(batchToEdit.code);
      setPhase(batchToEdit.phase);
      setActivationType(batchToEdit.activationType);
      setActivationDate(batchToEdit.activationDate ? batchToEdit.activationDate.substring(0, 16) : '');
      setDeactivationDate(batchToEdit.deactivationDate ? batchToEdit.deactivationDate.substring(0, 16) : '');
      setPreviousBatchId(batchToEdit.previousBatchId || '');
      setTriggerQuantity(batchToEdit.triggerQuantity || 0);
      setTotalQuantityLimit(batchToEdit.totalQuantityLimit || undefined);
    } else {
      const nextPhase = existingBatches.length + 1;
      setName(`Lote ${nextPhase}`);
      setCode(`LOTE_${nextPhase}`);
      setPhase(nextPhase);
      setActivationType(existingBatches.length > 0 ? 'PREVIOUS_BATCH_SOLD_OUT' : 'MANUAL');
      setActivationDate('');
      setDeactivationDate('');
      setPreviousBatchId(existingBatches[existingBatches.length - 1]?.id || '');
      setTriggerQuantity(0);
      setTotalQuantityLimit(undefined);
    }
  }, [batchToEdit, existingBatches, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do lote é obrigatório.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        name: name.trim(),
        code: code.trim() || undefined,
        phase,
        activationType,
        activationDate: activationDate ? new Date(activationDate).toISOString() : undefined,
        deactivationDate: deactivationDate ? new Date(deactivationDate).toISOString() : undefined,
        previousBatchId: previousBatchId || undefined,
        triggerQuantity: triggerQuantity > 0 ? triggerQuantity : undefined,
        totalQuantityLimit: totalQuantityLimit && totalQuantityLimit > 0 ? totalQuantityLimit : undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar lote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">
                {batchToEdit ? 'Editar Lote Comercial' : 'Criar Novo Lote Comercial'}
              </h2>
              <p className="text-xs text-slate-400">
                Lotes são janelas temporais/comerciais sobre o estoque dos setores
              </p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome do Lote *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Lote 1 — Promocional"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Fase (Ordem)
              </label>
              <input
                type="number"
                min={1}
                value={phase}
                onChange={e => setPhase(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Código Único
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="LOTE_1"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Regra de Ativação Automática *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACTIVATION_TYPES.map(at => (
                <button
                  key={at.value}
                  type="button"
                  onClick={() => setActivationType(at.value)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    activationType === at.value
                      ? 'bg-brand-500/10 border-brand-500 text-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold">{at.label}</p>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{at.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Campos condicionais por tipo de ativação */}
          {activationType === 'DATE_TIME' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Data e Horário de Abertura Automática *
              </label>
              <input
                type="datetime-local"
                value={activationDate}
                onChange={e => setActivationDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                required
              />
            </div>
          )}

          {(activationType === 'PREVIOUS_BATCH_SOLD_OUT' || activationType === 'PREVIOUS_BATCH_QUANTITY') && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Lote Predecessor (Gatilho) *
              </label>
              <select
                value={previousBatchId}
                onChange={e => setPreviousBatchId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                required
              >
                <option value="">Selecione o lote anterior...</option>
                {existingBatches
                  .filter(b => !batchToEdit || b.id !== batchToEdit.id)
                  .map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) — Fase {b.phase}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {activationType === 'PREVIOUS_BATCH_QUANTITY' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ativar quando o lote anterior atingir (ingressos):
              </label>
              <input
                type="number"
                min={1}
                value={triggerQuantity}
                onChange={e => setTriggerQuantity(parseInt(e.target.value) || 0)}
                placeholder="Ex: 1500"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100"
                required
              />
            </div>
          )}

          {/* Limite Total de Ingressos do Lote (Opcional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Limite Total deste Lote
              </label>
              <input
                type="number"
                min={1}
                value={totalQuantityLimit || ''}
                onChange={e => setTotalQuantityLimit(parseInt(e.target.value) || undefined)}
                placeholder="Ex: 5000 (Opcional)"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100"
              />
              <span className="text-[10px] text-slate-400">Ao atingir, vira SOLD_OUT</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Data Limite de Encerramento
              </label>
              <input
                type="datetime-local"
                value={deactivationDate}
                onChange={e => setDeactivationDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
              />
              <span className="text-[10px] text-slate-400">Opcional: vira ENDED</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 bg-slate-800/50 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-xl disabled:opacity-50"
            >
              {loading ? 'Salvando...' : batchToEdit ? 'Salvar Lote' : 'Criar Lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
