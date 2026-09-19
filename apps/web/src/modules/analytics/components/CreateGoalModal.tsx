import React, { useState } from 'react';
import { X, Target, DollarSign, Calendar } from 'lucide-react';
import { Button } from '../../../shared/components/Button';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoal: (data: {
    metricCode: string;
    name: string;
    targetValue: number;
    currentValue?: number;
    projectionValue?: number;
    unit?: string;
    period: string;
    producerId?: string;
    eventId?: string;
  }) => Promise<void>;
}

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  onClose,
  onSaveGoal
}) => {
  const [metricCode, setMetricCode] = useState<string>('sales.gross_amount');
  const [name, setName] = useState<string>('Meta de Vendas Brutas');
  const [targetValue, setTargetValue] = useState<number>(1000000);
  const [currentValue, setCurrentValue] = useState<number>(650000);
  const [projectionValue, setProjectionValue] = useState<number>(1150000);
  const [period, setPeriod] = useState<string>('2026-09');
  const [unit, setUnit] = useState<string>('BRL');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveGoal({
        metricCode,
        name,
        targetValue,
        currentValue,
        projectionValue,
        unit,
        period
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2 text-orange-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cadastrar Meta Operacional</h2>
              <p className="text-xs text-slate-400">Acompanhamento de Realizado x Meta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 text-sm">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Título da Meta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Indicador / Métrica
              </label>
              <select
                value={metricCode}
                onChange={(e) => {
                  setMetricCode(e.target.value);
                  if (e.target.value === 'tickets.sold') setUnit('UNIDADES');
                  else setUnit('BRL');
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-orange-500"
              >
                <option value="sales.gross_amount">Vendas Brutas (GMV)</option>
                <option value="sales.net_amount">Vendas Líquidas</option>
                <option value="tickets.sold">Ingressos Vendidos</option>
                <option value="marketing.roas">ROAS de Mídia</option>
                <option value="remarketing.recovered_revenue">Receita Recuperada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Competência / Período
              </label>
              <input
                type="text"
                placeholder="AAAA-MM"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-orange-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Meta (Alvo)
              </label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Realizado Atual
              </label>
              <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Projeção
              </label>
              <input
                type="number"
                value={projectionValue}
                onChange={(e) => setProjectionValue(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Criar Meta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
