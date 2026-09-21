import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Building2,
  DollarSign
} from 'lucide-react';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatCurrency } from '../../shared/utils/formatters';

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

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.type === filterType;
  });

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'SALE':
        return <Badge variant="emerald">Venda</Badge>;
      case 'PAYOUT':
        return <Badge variant="purple">Repasse</Badge>;
      case 'COMMISSION_FEE':
        return <Badge variant="orange">Taxa Retida</Badge>;
      case 'REFUND':
        return <Badge variant="rose">Estorno</Badge>;
      case 'ADVANCE':
        return <Badge variant="cyan">Adiantamento</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
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

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mb-3" />
        <p className="text-xs">Carregando extrato da conta corrente...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters & Export Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            Filtrar Lançamento:
          </span>
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent font-semibold text-white outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Todos os Lançamentos</option>
              <option value="SALE" className="bg-slate-900">Vendas (Créditos)</option>
              <option value="PAYOUT" className="bg-slate-900">Repasses Pagos (Débitos)</option>
              <option value="COMMISSION_FEE" className="bg-slate-900">Taxas Retidas DiskIngressos</option>
              <option value="REFUND" className="bg-slate-900">Estornos Concedidos</option>
            </select>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={exportCSV}
          icon={<Download className="h-3.5 w-3.5" />}
        >
          Exportar Extrato CSV
        </Button>
      </div>

      {/* Analytical Ledger Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">Data / Hora</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-6">Descrição do Fato Contábil</th>
                <th className="py-3.5 px-4 text-right">Valor do Lançamento</th>
                <th className="py-3.5 px-6 text-right">Saldo da Conta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    Nenhum lançamento encontrado para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-slate-300">
                        {new Date(tx.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        {getTransactionBadge(tx.type)}
                      </td>

                      <td className="py-3.5 px-6">
                        <div className="font-medium text-white">{tx.description}</div>
                        {tx.eventTitle && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {tx.eventTitle}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-xs">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          )}
                          {formatCurrency(Math.abs(tx.amount))}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right font-mono font-bold text-white text-xs">
                        {formatCurrency(tx.balanceAfter)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
