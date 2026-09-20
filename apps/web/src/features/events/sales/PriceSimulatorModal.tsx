import React, { useState, useEffect } from 'react';
import { X, Calculator, DollarSign, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { FeeComponentDTO, PriceSimulationResult } from '@shared/types/index';
import { simulatePrice } from '../api/pricing.api';
import { formatCurrency } from '../../../shared/utils/formatters';

interface PriceSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  initialPriceInCents?: number;
}

export const PriceSimulatorModal: React.FC<PriceSimulatorModalProps> = ({
  isOpen,
  onClose,
  eventId,
  initialPriceInCents = 15000
}) => {
  const [basePrice, setBasePrice] = useState<number>(initialPriceInCents / 100);
  const [feePercentage, setFeePercentage] = useState<number>(10);
  const [feePayer, setFeePayer] = useState<'BUYER' | 'PRODUCER' | 'SPLIT'>('BUYER');
  const [producerSplit, setProducerSplit] = useState<number>(50);
  const [quantity, setQuantity] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);

  const [result, setResult] = useState<PriceSimulationResult | null>(null);

  useEffect(() => {
    const feeComponent: FeeComponentDTO = {
      name: `Taxa da Plataforma (${feePercentage}%)`,
      type: 'PERCENTAGE',
      value: feePercentage,
      payer: feePayer,
      producerSharePercentage: feePayer === 'SPLIT' ? producerSplit : undefined
    };

    simulatePrice(eventId, {
      basePriceInCents: Math.round(basePrice * 100),
      salePriceInCents: Math.round(basePrice * 100),
      feeComponents: [feeComponent],
      quantity,
      discountInCents: Math.round(discount * 100)
    })
      .then(setResult)
      .catch(console.error);
  }, [eventId, basePrice, feePercentage, feePayer, producerSplit, quantity, discount]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Simulador de Preços & Taxas</h2>
              <p className="text-xs text-slate-400">Cálculo transparente de taxas, total ao comprador e repasse líquido</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Preço Base (R$)
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={basePrice}
                onChange={e => setBasePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Taxa de Serviço (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="30"
                value={feePercentage}
                onChange={e => setFeePercentage(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Quem absorve a taxa?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFeePayer('BUYER')}
                className={`p-2 rounded-xl border text-xs font-medium ${
                  feePayer === 'BUYER' ? 'bg-brand-500/10 border-brand-500 text-brand-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Comprador (Acrescenta)
              </button>
              <button
                type="button"
                onClick={() => setFeePayer('PRODUCER')}
                className={`p-2 rounded-xl border text-xs font-medium ${
                  feePayer === 'PRODUCER' ? 'bg-brand-500/10 border-brand-500 text-brand-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Produtor (Absorve)
              </button>
              <button
                type="button"
                onClick={() => setFeePayer('SPLIT')}
                className={`p-2 rounded-xl border text-xs font-medium ${
                  feePayer === 'SPLIT' ? 'bg-brand-500/10 border-brand-500 text-brand-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Dividida (Split)
              </button>
            </div>
          </div>

          {feePayer === 'SPLIT' && (
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Participação do Produtor na Taxa:</span>
                <span className="font-semibold text-brand-400">{producerSplit}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={producerSplit}
                onChange={e => setProducerSplit(parseInt(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>
          )}

          {/* Resultado Simulado */}
          {result && (
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">Total a Pagar (Comprador):</span>
                <span className="text-lg font-bold text-emerald-400">
                  {formatCurrency(result.buyerTotalInCents / 100)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">Repasse Líquido (Produtor):</span>
                <span className="text-lg font-bold text-blue-400">
                  {formatCurrency(result.producerNetInCents / 100)}
                </span>
              </div>

              <div className="space-y-1 pt-1 text-xs">
                {result.feeBreakdown.map((f, i) => (
                  <div key={i} className="flex justify-between text-slate-400 text-[11px]">
                    <span>{f.name} ({f.payer === 'BUYER' ? 'pago pelo comprador' : 'retido do produtor'}):</span>
                    <span className="font-mono text-slate-300">+{formatCurrency(f.amountInCents / 100)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-800 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl"
          >
            Fechar Simulador
          </button>
        </div>
      </div>
    </div>
  );
};
