import React, { useState } from 'react';
import { X, ShieldAlert, AlertCircle } from 'lucide-react';
import {
  InventoryPoolDTO,
  InventoryBlockReason,
  CreateInventoryBlockInput
} from '@shared/types/index';

interface InventoryBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (poolId: string, input: CreateInventoryBlockInput) => Promise<void>;
  pool: InventoryPoolDTO;
}

const BLOCK_REASONS: { value: InventoryBlockReason; label: string; desc: string }[] = [
  { value: 'TECHNICAL_HOLD', label: 'Reserva Técnica', desc: 'House Mix, iluminação, câmeras e torres' },
  { value: 'SECURITY_BUFFER', label: 'Buffer de Segurança', desc: 'Rotas de fuga e exigências do Corpo de Bombeiros' },
  { value: 'SPONSOR_HOLD', label: 'Cota de Patrocinador', desc: 'Reserva contratual de cotas de marcas' },
  { value: 'PRODUCER_HOLD', label: 'Retenção do Produtor', desc: 'Segurança operacional ou contingência' },
  { value: 'GOVERNMENT_HOLD', label: 'Autoridades / Órgãos', desc: 'Polícia, bombeiros e fiscalização' },
  { value: 'OTHER', label: 'Outro Bloqueio', desc: 'Motivo customizado' }
];

export const InventoryBlockModal: React.FC<InventoryBlockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  pool
}) => {
  const [reason, setReason] = useState<InventoryBlockReason>('TECHNICAL_HOLD');
  const [quantity, setQuantity] = useState<number>(50);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('A quantidade de bloqueio deve ser maior que zero.');
      return;
    }
    if (quantity > pool.available) {
      setError(`A quantidade solicitada (${quantity}) excede a capacidade disponível no setor (${pool.available}).`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(pool.id, {
        reason,
        quantity,
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar bloqueio de capacidade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Bloquear Capacidade</h2>
              <p className="text-xs text-slate-400">{pool.sectionName || 'Setor'} (Disponível: {pool.available})</p>
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
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Motivo do Bloqueio
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value as InventoryBlockReason)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
            >
              {BLOCK_REASONS.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label} — {r.desc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Quantidade de Ingressos Bloqueados
            </label>
            <input
              type="number"
              min={1}
              max={pool.available}
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observações / Justificativa
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Corredor de segurança lateral exigido pelo alvará nº 489/2026"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500"
            />
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
              className="px-5 py-2 text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-xl disabled:opacity-50"
            >
              {loading ? 'Bloqueando...' : 'Confirmar Bloqueio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
