import React, { useState } from 'react';
import { X, PieChart, AlertCircle } from 'lucide-react';
import {
  InventoryPoolDTO,
  EventTicketTypeDTO,
  InventoryAllocationType,
  SaveInventoryAllocationInput
} from '@shared/types/index';

interface QuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (poolId: string, input: SaveInventoryAllocationInput) => Promise<void>;
  pool: InventoryPoolDTO;
  ticketTypes: EventTicketTypeDTO[];
}

export const QuotaModal: React.FC<QuotaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  pool,
  ticketTypes
}) => {
  const [ticketTypeId, setTicketTypeId] = useState(ticketTypes[0]?.id || '');
  const [allocationType, setAllocationType] = useState<InventoryAllocationType>('PERCENTAGE');
  const [allocationValue, setAllocationValue] = useState<number>(40);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const calculatedQty = allocationType === 'PERCENTAGE'
    ? Math.floor((pool.capacity * allocationValue) / 100)
    : allocationType === 'FIXED'
    ? allocationValue
    : pool.capacity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTypeId) {
      setError('Selecione um tipo de ingresso');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(pool.id, {
        eventTicketTypeId: ticketTypeId,
        allocationType,
        allocationValue
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-400">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Configurar Cota / Limite</h2>
              <p className="text-xs text-slate-400">{pool.sectionName || 'Setor'} (Cap: {pool.capacity})</p>
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
              Tipo de Ingresso
            </label>
            <select
              value={ticketTypeId}
              onChange={e => setTicketTypeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
            >
              {ticketTypes.map(tt => (
                <option key={tt.id} value={tt.id}>
                  {tt.name} ({tt.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Modo de Limitação
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setAllocationType('PERCENTAGE'); setAllocationValue(40); }}
                className={`p-2 rounded-xl border text-xs font-medium ${
                  allocationType === 'PERCENTAGE'
                    ? 'bg-brand-500/10 border-brand-500 text-brand-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Porcentagem (%)
              </button>
              <button
                type="button"
                onClick={() => { setAllocationType('FIXED'); setAllocationValue(1000); }}
                className={`p-2 rounded-xl border text-xs font-medium ${
                  allocationType === 'FIXED'
                    ? 'bg-brand-500/10 border-brand-500 text-brand-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Quantidade Fixa
              </button>
              <button
                type="button"
                onClick={() => { setAllocationType('UNLIMITED'); setAllocationValue(0); }}
                className={`p-2 rounded-xl border text-xs font-medium ${
                  allocationType === 'UNLIMITED'
                    ? 'bg-brand-500/10 border-brand-500 text-brand-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Ilimitada (Pool)
              </button>
            </div>
          </div>

          {allocationType !== 'UNLIMITED' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {allocationType === 'PERCENTAGE' ? 'Porcentagem (%)' : 'Quantidade de Ingressos'}
              </label>
              <input
                type="number"
                min={1}
                max={allocationType === 'PERCENTAGE' ? 100 : pool.capacity}
                value={allocationValue}
                onChange={e => setAllocationValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100"
              />
            </div>
          )}

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs flex justify-between">
            <span className="text-slate-400">Total de ingressos disponibilizados:</span>
            <span className="font-semibold text-brand-400">{calculatedQty} ingressos</span>
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
              {loading ? 'Salvando...' : 'Aplicar Cota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
