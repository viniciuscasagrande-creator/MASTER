import React from 'react';
import {
  Briefcase,
  Building2,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Award,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { useCoreData } from '../../core/context/CoreDataContext';
import { StatCard } from '../../shared/components/StatCard';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { formatCurrency, formatNumber } from '../../shared/utils/formatters';

export const CommercialDashboard: React.FC = () => {
  const { producers, events } = useCoreData();

  const totalCommercialPipeline = 14200000;
  const targetMonthly = 12000000;
  const currentAttained = 9840000;
  const targetPercent = Math.round((currentAttained / targetMonthly) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              PAINEL COMERCIAL & PRODUTORES
            </h1>
            <Badge variant="orange" size="sm">
              Novos Negócios & Pipeline
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestão de produtores de eventos, funil de propostas, comissões e metas corporativas
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => alert('Formulário de Cadastro de Novo Produtor')}
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Novo Produtor
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="PRODUTORES ATIVOS"
          value={producers.length.toString()}
          subtitle="Contratos vigentes com exclusividade"
          icon={<Building2 className="h-4 w-4 text-orange-400" />}
          badge="Parceiros"
          badgeVariant="orange"
        />

        <StatCard
          title="META COMERCIAL (MÊS)"
          value={`${targetPercent}% atingida`}
          subtitle={`${formatCurrency(currentAttained)} de ${formatCurrency(targetMonthly)}`}
          icon={<Target className="h-4 w-4 text-emerald-400" />}
          badge="Em Rota"
          badgeVariant="emerald"
        />

        <StatCard
          title="PIPELINE EM NEGOCIAÇÃO"
          value={formatCurrency(totalCommercialPipeline)}
          trend={{ value: '12 propostas ativas', isPositive: true }}
          icon={<TrendingUp className="h-4 w-4 text-cyan-400" />}
          badge="Oportunidades"
          badgeVariant="cyan"
        />

        <StatCard
          title="COMISSÃO ESTIMADA DISK"
          value={formatCurrency(currentAttained * 0.08)}
          subtitle="Média ponderada: 8.0% take-rate"
          icon={<Award className="h-4 w-4 text-purple-400" />}
          badge="Take-Rate"
          badgeVariant="purple"
        />
      </div>

      {/* Commercial Funnel */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg">
        <h2 className="text-sm font-bold text-white mb-3">Funil de Captação de Eventos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { stage: '1. Prospecção / Leads', count: 28, value: 'R$ 8,4 mi', color: 'border-slate-700 bg-slate-950/40' },
            { stage: '2. Apresentação PDT', count: 14, value: 'R$ 5,2 mi', color: 'border-cyan-500/30 bg-cyan-500/5' },
            { stage: '3. Proposta Enviada', count: 8, value: 'R$ 3,1 mi', color: 'border-amber-500/30 bg-amber-500/5' },
            { stage: '4. Minuta Contratual', count: 4, value: 'R$ 1,9 mi', color: 'border-orange-500/30 bg-orange-500/5' },
            { stage: '5. Fechados / No Ar', count: producers.length, value: formatCurrency(currentAttained), color: 'border-emerald-500/30 bg-emerald-500/5' },
          ].map((col, idx) => (
            <div key={idx} className={`rounded-xl border p-3.5 space-y-1 ${col.color}`}>
              <div className="text-[11px] font-bold text-slate-300">{col.stage}</div>
              <div className="text-lg font-bold text-white font-mono">{col.count}</div>
              <div className="text-[11px] text-slate-400 font-mono">{col.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Producers Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg">
        <h2 className="text-sm font-bold text-white mb-4">Produtores Credenciados</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3">Razão Social & CNPJ</th>
                <th className="pb-3">Eventos Ativos</th>
                <th className="pb-3">Volume Bruto</th>
                <th className="pb-3">Saldo Disponível</th>
                <th className="pb-3">Taxa Negociada</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {producers.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3">
                    <div className="font-semibold text-white">{prod.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">CNPJ: {prod.cnpj}</div>
                  </td>
                  <td className="py-3 text-slate-300 font-mono">
                    {prod.totalEvents} eventos
                  </td>
                  <td className="py-3 font-mono font-bold text-white">
                    {formatCurrency(prod.totalRevenue)}
                  </td>
                  <td className="py-3 font-mono font-bold text-emerald-400">
                    {formatCurrency(prod.availableBalance)}
                  </td>
                  <td className="py-3 font-mono text-orange-400 font-bold">
                    {(prod.commissionRate * 100).toFixed(1)}%
                  </td>
                  <td className="py-3">
                    <Badge variant="emerald" size="sm">
                      {prod.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => alert(`Visualizando contrato e dados bancários de: ${prod.name}`)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      Ver Detalhes
                    </button>
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
