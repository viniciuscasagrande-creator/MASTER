import React, { useState } from 'react';
import {
  Calendar,
  DollarSign,
  Ticket,
  Send,
  CheckCircle2,
  TrendingUp,
  Building2,
  Percent
} from 'lucide-react';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { MetricCard } from '../../shared/components/MetricCard';
import { FilterBar } from '../../shared/components/FilterBar';
import { DataTable, Column } from '../../shared/components/DataTable';
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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBalances = balances.filter((b) =>
    b.eventTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalGross = balances.reduce((acc, curr) => acc + curr.grossAmount, 0);
  const totalAvailable = balances.reduce((acc, curr) => acc + curr.availableBalance, 0);
  const totalPaid = balances.reduce((acc, curr) => acc + curr.paidPayouts, 0);
  const totalFees = balances.reduce((acc, curr) => acc + curr.diskFee, 0);

  const columns: Column<EventBalanceItemUI>[] = [
    {
      header: 'Evento & Data',
      accessor: (ev) => (
        <div>
          <div className="font-bold text-slate-900">{ev.eventTitle}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
            <Calendar className="h-3 w-3" />
            <span>{ev.eventDate}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Ingressos',
      accessor: (ev) => (
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <Ticket className="h-3.5 w-3.5 text-slate-400" />
          <span>{ev.ticketsSold.toLocaleString('pt-BR')} un.</span>
        </div>
      )
    },
    {
      header: 'Faturamento Bruto',
      align: 'right',
      accessor: (ev) => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(ev.grossAmount)}
        </span>
      )
    },
    {
      header: 'Taxas Retidas',
      align: 'right',
      accessor: (ev) => (
        <span className="font-mono text-slate-500">
          {formatCurrency(ev.diskFee)}
        </span>
      )
    },
    {
      header: 'Repasses Pagos',
      align: 'right',
      accessor: (ev) => (
        <span className="font-mono font-medium text-purple-700">
          {formatCurrency(ev.paidPayouts)}
        </span>
      )
    },
    {
      header: 'Saldo Disponível',
      align: 'right',
      accessor: (ev) => (
        <div>
          <span className="font-mono font-bold text-emerald-600 text-sm">
            {formatCurrency(ev.availableBalance)}
          </span>
          {ev.pendingPayouts > 0 && (
            <div className="text-[10px] text-amber-600 font-mono">
              ({formatCurrency(ev.pendingPayouts)} pendente)
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Ação',
      align: 'right',
      accessor: (ev) => (
        <Button
          size="sm"
          variant="outline"
          disabled={ev.availableBalance <= 0}
          onClick={() => onOpenPayoutForEvent(ev.eventId)}
          icon={<Send className="h-3 w-3 text-emerald-600" />}
        >
          Repasse
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Overview Cards Row (120-140px Height) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="FATURAMENTO BRUTO TOTAL"
          value={formatCurrency(totalGross)}
          subtitle={`${balances.length} eventos sob gestão`}
          icon={<Building2 className="h-4 w-4 text-slate-700" />}
          badge="Volume Geral"
          badgeVariant="slate"
        />

        <MetricCard
          title="SALDO DISPONÍVEL CONSOLIDADO"
          value={formatCurrency(totalAvailable)}
          trend={{ value: 'Segregado por evento', isPositive: true }}
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          badge="Livre p/ Saque"
          badgeVariant="emerald"
        />

        <MetricCard
          title="TOTAL REPASSADO"
          value={formatCurrency(totalPaid)}
          subtitle="Repasses já liquidados em conta"
          icon={<CheckCircle2 className="h-4 w-4 text-purple-600" />}
          badge="Liquidado"
          badgeVariant="purple"
        />

        <MetricCard
          title="TOTAL TAXAS RETIDAS"
          value={formatCurrency(totalFees)}
          subtitle="Remuneração de intermediação"
          icon={<Percent className="h-4 w-4 text-orange-600" />}
          badge="Taxas Plataforma"
          badgeVariant="orange"
        />
      </div>

      {/* FilterBar */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nome do evento..."
        hasActiveFilters={Boolean(searchTerm)}
        onClearFilters={() => setSearchTerm('')}
      />

      {/* Balances Data Table */}
      <DataTable
        columns={columns}
        data={filteredBalances}
        keyExtractor={(item) => item.eventId}
        isLoading={isLoading}
        emptyMessage="Nenhum evento com movimentação financeira encontrado."
        emptyIcon={<DollarSign className="h-8 w-8 text-slate-300" />}
      />
    </div>
  );
};
