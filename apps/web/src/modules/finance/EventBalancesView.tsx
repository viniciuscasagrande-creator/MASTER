import React from 'react';
import {
  Calendar,
  DollarSign,
  Ticket,
  Send,
  CheckCircle2,
  Clock,
  TrendingUp,
  Building2
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatCompactCurrency } from '../../shared/utils/formatters';

export interface EventBalanceItemUI {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  status: string;
  ticketsSold: number;
  grossAmount: number;
  diskFee: number;
  netRevenue: number;
  paidPayouts: number;
  pendingPayouts: number;
  transfersIn?: number;
  transfersOut?: number;
  availableBalance: number;
}

interface EventBalancesViewProps {
  balances: EventBalanceItemUI[];
  isLoading: boolean;
  onOpenPayoutForEvent: (eventId: string) => void;
}

export const EventBalancesView: React.FC<EventBalancesViewProps> = ({
  balances,
  isLoading,
  onOpenPayoutForEvent
}) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mb-3" />
        <p className="text-xs">Carregando saldos segregados por evento...</p>
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
        <DollarSign className="h-8 w-8 mx-auto text-slate-600 mb-2" />
        <h3 className="text-sm font-semibold text-white">Nenhum evento com movimentação financeira</h3>
        <p className="text-xs text-slate-500 mt-1">Os saldos aparecerão assim que os ingressos forem comercializados.</p>
      </div>
    );
  }

  const totalGross = balances.reduce((acc, curr) => acc + curr.grossAmount, 0);
  const totalAvailable = balances.reduce((acc, curr) => acc + curr.availableBalance, 0);
  const totalPaid = balances.reduce((acc, curr) => acc + curr.paidPayouts, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Faturamento Bruto Total
          </span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">
            {formatCurrency(totalGross)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {balances.length} eventos ativos
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Total Já Repassado
          </span>
          <span className="text-xl font-bold font-mono text-purple-400 mt-1 block">
            {formatCurrency(totalPaid)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Repasses liquidados via PIX/TED
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block">
            Saldo Disponível Consolidado
          </span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            {formatCurrency(totalAvailable)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Livre para solicitação imediata
          </span>
        </div>
      </div>

      {/* Analytical Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              SALDOS SEGREGADOS POR EVENTO
            </h3>
            <p className="text-xs text-slate-400">
              Disponibilidade líquida individual por centro de custo de produção
            </p>
          </div>
          <Badge variant="emerald" size="sm">
            {balances.length} eventos
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">Evento & Data</th>
                <th className="py-3.5 px-4 text-center">Ingressos</th>
                <th className="py-3.5 px-4 text-right">Vendas Brutas</th>
                <th className="py-3.5 px-4 text-right">Taxa Disk (8%)</th>
                <th className="py-3.5 px-4 text-right">Receita Líquida</th>
                <th className="py-3.5 px-4 text-right">Repasses Pagos</th>
                <th className="py-3.5 px-4 text-right text-emerald-400">Saldo Disponível</th>
                <th className="py-3.5 px-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {balances.map((ev) => (
                <tr key={ev.eventId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-white text-xs">{ev.eventTitle}</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        {ev.eventDate}
                      </span>
                      <span>•</span>
                      <span className="uppercase text-[10px] text-slate-500">{ev.status}</span>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-center font-mono font-medium text-slate-300">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                      <Ticket className="h-3 w-3 text-slate-400" />
                      {ev.ticketsSold}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right font-mono font-medium text-white">
                    {formatCurrency(ev.grossAmount)}
                  </td>

                  <td className="py-4 px-4 text-right font-mono text-slate-400">
                    {formatCurrency(ev.diskFee)}
                  </td>

                  <td className="py-4 px-4 text-right font-mono text-slate-300 font-semibold">
                    {formatCurrency(ev.netRevenue)}
                  </td>

                  <td className="py-4 px-4 text-right font-mono text-purple-400">
                    {formatCurrency(ev.paidPayouts)}
                  </td>

                  <td className="py-4 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                    {formatCurrency(ev.availableBalance)}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onOpenPayoutForEvent(ev.eventId)}
                      disabled={ev.availableBalance <= 0}
                      icon={<Send className="h-3 w-3" />}
                    >
                      Repasse
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
