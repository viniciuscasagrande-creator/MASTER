import React, { useState } from 'react';
import {
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  TrendingUp,
  TrendingDown,
  Scale,
  FileSpreadsheet
} from 'lucide-react';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { MetricCard } from '../../shared/components/MetricCard';
import { FilterBar } from '../../shared/components/FilterBar';
import { DataTable, Column } from '../../shared/components/DataTable';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatDateTime } from '../../shared/utils/formatters';

export interface FinancialTransactionUI {
  id: string;
  producerId: string;
  eventId?: string;
  eventTitle?: string;
  type: 'SALE' | 'COMMISSION_FEE' | 'PAYOUT' | 'REFUND' | 'ADVANCE' | 'ADJUSTMENT';
  description: string;
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  createdAt: string;
}

interface AccountStatementViewProps {
  transactions: FinancialTransactionUI[];
  isLoading: boolean;
}

export const AccountStatementView: React.FC<AccountStatementViewProps> = ({
  transactions,
  isLoading
}) => {
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === 'ALL' || tx.type === filterType;
    const matchesSearch =
      !searchTerm.trim() ||
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.eventTitle && tx.eventTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.referenceId && tx.referenceId.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesType && matchesSearch;
  });

  // KPI Calculations
  const totalEntries = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const totalExits = transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const currentBalance = transactions.length > 0 ? transactions[0].balanceAfter : 0;

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'SALE':
        return <StatusBadge variant="success" label="Venda" />;
      case 'PAYOUT':
        return <StatusBadge variant="purple" label="Repasse" />;
      case 'COMMISSION_FEE':
        return <StatusBadge variant="warning" label="Taxa Retida" />;
      case 'REFUND':
        return <StatusBadge variant="danger" label="Estorno" />;
      case 'ADVANCE':
        return <StatusBadge variant="info" label="Adiantamento" />;
      default:
        return <StatusBadge variant="neutral" label={type} />;
    }
  };

  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Evento', 'Descricao', 'Valor', 'Saldo_Apos'];
    const rows = filteredTransactions.map(tx => [
      tx.createdAt,
      tx.type,
      tx.eventTitle || '',
      `"${tx.description}"`,
      tx.amount.toFixed(2),
      tx.balanceAfter.toFixed(2)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `extrato_financeiro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<FinancialTransactionUI>[] = [
    {
      header: 'Data / Hora',
      width: '180px',
      accessor: (tx) => (
        <span className="font-mono text-slate-600 font-medium">
          {formatDateTime(tx.createdAt)}
        </span>
      )
    },
    {
      header: 'Tipo',
      width: '130px',
      accessor: (tx) => getTransactionBadge(tx.type)
    },
    {
      header: 'Descrição do Lançamento',
      accessor: (tx) => (
        <div>
          <div className="font-semibold text-slate-900">{tx.description}</div>
          {tx.eventTitle && (
            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
              {tx.eventTitle}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Valor',
      align: 'right',
      width: '160px',
      accessor: (tx) => {
        const isPositive = tx.amount > 0;
        return (
          <span
            className={`inline-flex items-center gap-1 font-mono font-bold ${
              isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />
            )}
            {formatCurrency(Math.abs(tx.amount))}
          </span>
        );
      }
    },
    {
      header: 'Saldo Resultante',
      align: 'right',
      width: '160px',
      accessor: (tx) => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(tx.balanceAfter)}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* KPI Cards Row (Standardized 120-140px Height) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="SALDO ATUAL EM CONTA"
          value={formatCurrency(currentBalance)}
          subtitle="Disponível para repasse ou transferência"
          icon={<Scale className="h-4 w-4 text-emerald-600" />}
          badge="Auditado"
          badgeVariant="emerald"
        />

        <MetricCard
          title="TOTAL DE ENTRADAS"
          value={formatCurrency(totalEntries)}
          trend={{ value: 'Créditos em bilheteria', isPositive: true }}
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          badge="Vendas"
          badgeVariant="emerald"
        />

        <MetricCard
          title="TOTAL DE SAÍDAS"
          value={formatCurrency(totalExits)}
          subtitle="Repasses, taxas e estornos deduzidos"
          icon={<TrendingDown className="h-4 w-4 text-rose-500" />}
          badge="Débitos"
          badgeVariant="rose"
        />

        <MetricCard
          title="LANÇAMENTOS REGISTRADOS"
          value={transactions.length}
          subtitle="Extrato oficial do produtor"
          icon={<Receipt className="h-4 w-4 text-slate-600" />}
          badge="Em tempo real"
          badgeVariant="slate"
        />
      </div>

      {/* FilterBar Toolbar */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por descrição, evento ou documento..."
        selects={[
          {
            id: 'filter-type',
            value: filterType,
            onChange: setFilterType,
            options: [
              { label: 'Todos os Lançamentos', value: 'ALL' },
              { label: 'Vendas (Créditos)', value: 'SALE' },
              { label: 'Repasses Pagos (Débitos)', value: 'PAYOUT' },
              { label: 'Taxas Retidas', value: 'COMMISSION_FEE' },
              { label: 'Estornos Concedidos', value: 'REFUND' },
              { label: 'Adiantamentos', value: 'ADVANCE' }
            ]
          }
        ]}
        hasActiveFilters={filterType !== 'ALL' || Boolean(searchTerm)}
        onClearFilters={() => {
          setFilterType('ALL');
          setSearchTerm('');
        }}
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={exportCSV}
            icon={<Download className="h-3.5 w-3.5" />}
          >
            Exportar CSV
          </Button>
        }
      />

      {/* Analytical Ledger Table */}
      <DataTable
        columns={columns}
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="Nenhum lançamento contábil encontrado para o filtro selecionado."
        emptyIcon={<Receipt className="h-8 w-8 text-slate-300" />}
      />
    </div>
  );
};
