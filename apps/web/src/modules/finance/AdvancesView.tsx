import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Percent,
  Sliders
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatCurrency } from '../../shared/utils/formatters';
import { EventBalanceItemUI } from './EventBalancesView';

interface AdvancesViewProps {
  producerId: string;
  eventBalances: EventBalanceItemUI[];
  onRefreshBalances?: () => void;
}

export const AdvancesView: React.FC<AdvancesViewProps> = ({
  producerId,
  eventBalances,
  onRefreshBalances
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [advanceAmount, setAdvanceAmount] = useState<number>(50000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Total gross future receivables across events
  const totalGross = eventBalances.reduce((acc, curr) => acc + curr.grossAmount, 0);
  const maxAdvanceLimit = Math.max(10000, Math.round(totalGross * 0.7)); // Up to 70% of gross volume

  const feeRateMonthly = 0.018; // 1.8% a.m.
  const spreadFee = Math.round(advanceAmount * feeRateMonthly * 100) / 100;
  const iof = Math.round(advanceAmount * 0.0038 * 100) / 100;
  const netAdvanceAmount = Math.max(0, advanceAmount - spreadFee - iof);

  const handleRequestAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (advanceAmount <= 0 || advanceAmount > maxAdvanceLimit) {
      setErrorMessage(`Valor de antecipação deve ser entre R$ 1.000,00 e ${formatCurrency(maxAdvanceLimit)}.`);
      return;
    }

    setIsSubmitting(true);
    // Simulate real request with timeout and audit
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(`Solicitação de antecipação de ${formatCurrency(advanceAmount)} enviada para a Mesa de Crédito. Alçada Maker-Checker iniciada.`);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              ANTECIPAÇÕES & CRÉDITO PRO
            </h2>
            <Badge variant="amber" size="sm">
              Liquidez Imediata
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulação e antecipação de recebíveis futuros de bilheteria parcelada no cartão com spread transparente e liquidação via PIX na conta homologada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="emerald" size="md">
            Taxa Balcão: 1.80% a.m.
          </Badge>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Simulator + Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulator Column */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Simulador de Antecipação
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Limite Pré-Aprovado: <strong className="text-white font-mono">{formatCurrency(maxAdvanceLimit)}</strong>
            </span>
          </div>

          <form onSubmit={handleRequestAdvance} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Evento de Lastro
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">Carteira Consolidada do Produtor (Todos os Eventos)</option>
                {eventBalances.map(ev => (
                  <option key={ev.eventId} value={ev.eventId}>
                    {ev.eventTitle} — Volume Bruto: {formatCurrency(ev.grossAmount)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Valor a Antecipar (R$)
                </label>
                <span className="text-xl font-bold font-mono text-amber-400">
                  {formatCurrency(advanceAmount)}
                </span>
              </div>

              <input
                type="range"
                min={5000}
                max={maxAdvanceLimit}
                step={1000}
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Min: R$ 5.000,00</span>
                <span>Max: {formatCurrency(maxAdvanceLimit)}</span>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs space-y-2.5">
              <div className="flex justify-between text-slate-400">
                <span>(+) Valor Bruto da Antecipação:</span>
                <span className="font-mono text-white font-semibold">{formatCurrency(advanceAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>(-) Desconto de Taxa (Spread 1.80% a.m.):</span>
                <span className="font-mono text-rose-400">-{formatCurrency(spreadFee)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>(-) IOF Operacional:</span>
                <span className="font-mono text-rose-400">-{formatCurrency(iof)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                <span className="text-white">(=) Valor Líquido a Receber via PIX:</span>
                <span className="font-mono text-emerald-400 text-base">{formatCurrency(netAdvanceAmount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                icon={<ArrowRight className="h-4 w-4" />}
              >
                {isSubmitting ? 'Submetendo...' : 'Solicitar Antecipação Formal'}
              </Button>
            </div>
          </form>
        </div>

        {/* Requirements and Governance Column */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Regras & Governança
            </h3>
          </div>

          <div className="space-y-3.5 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Liquidação via PIX:</strong> Crédito automático na conta Itaú Unibanco homologada em até 2 horas úteis.</span>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Alçada Maker-Checker:</strong> Solicitações acima de R$ 50.000,00 exigem aprovação da Diretoria Financeira.</span>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Garantia Real:</strong> A amortização ocorre automaticamente pelos recebíveis de cartão à medida que forem liquidados.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <strong>Spread Competitivo:</strong> Taxa negociada diretamente para grandes produtores credenciados no Disk Interno.
          </div>
        </div>
      </div>
    </div>
  );
};
