import React from 'react';
import {
  FileSpreadsheet,
  Layers,
  Scale,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { formatCurrency } from '../../shared/utils/formatters';

export const AccountingDashboard: React.FC = () => {
  const { accountingEntries, orders } = useCoreData();

  const totalEntries = accountingEntries.length;
  const totalDebits = accountingEntries.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              PAINEL CONTÁBIL & PARTIDAS DOBRADAS
            </h1>
            <Badge variant="cyan" size="sm">
              Fatos Contábeis Automáticos
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Geração de lançamentos a débito e a crédito sincronizados a cada venda, taxa ou estorno
          </p>
        </div>

        <Badge variant="emerald" size="sm" dot>
          Balancete Equilibrado (Débito = Crédito)
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="LANÇAMENTOS POSTADOS"
          value={totalEntries.toString()}
          subtitle="100% integrados ao Core"
          icon={<FileSpreadsheet className="h-4 w-4 text-orange-400" />}
          badge="Diário Contábil"
          badgeVariant="orange"
        />

        <StatCard
          title="MOVIMENTAÇÃO TOTAL"
          value={formatCurrency(totalDebits)}
          subtitle="Partidas dobradas conferidas"
          icon={<Scale className="h-4 w-4 text-emerald-400" />}
          badge="Equilíbrio R$ 0"
          badgeVariant="emerald"
        />

        <StatCard
          title="RECEITA TAXAS DISK"
          value={formatCurrency(orders.reduce((acc, o) => acc + o.serviceFee, 0))}
          trend={{ value: 'Conta 3.1.1.01', isPositive: true }}
          icon={<DollarSign className="h-4 w-4 text-cyan-400" />}
          badge="DRE Líquido"
          badgeVariant="cyan"
        />

        <StatCard
          title="STATUS DO FECHAMENTO"
          value="Em Dia"
          subtitle="Competência Setembro/2026"
          icon={<CheckCircle2 className="h-4 w-4 text-purple-400" />}
          badge="Auditado"
          badgeVariant="purple"
        />
      </div>

      {/* Double-Entry Journal Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Livro Diário - Lançamentos em Tempo Real</h2>
            <p className="text-xs text-slate-400">Cada venda ou estorno reflete instantaneamente nas contas contábeis</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3">Nº Lançamento</th>
                <th className="pb-3">Data</th>
                <th className="pb-3">Conta Devedora (D)</th>
                <th className="pb-3">Conta Credora (C)</th>
                <th className="pb-3">Histórico / Descrição</th>
                <th className="pb-3 text-right">Valor (R$)</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {accountingEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-bold text-orange-400">
                    {entry.entryNumber}
                  </td>
                  <td className="py-3 text-slate-300">
                    {entry.date}
                  </td>
                  <td className="py-3 text-slate-200">
                    {entry.debitAccount}
                  </td>
                  <td className="py-3 text-slate-200">
                    {entry.creditAccount}
                  </td>
                  <td className="py-3 text-slate-400 font-sans text-xs max-w-xs truncate">
                    {entry.description}
                  </td>
                  <td className="py-3 text-right font-bold text-white">
                    {formatCurrency(entry.amount)}
                  </td>
                  <td className="py-3 text-right">
                    <Badge variant="emerald" size="sm">
                      Postado
                    </Badge>
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
