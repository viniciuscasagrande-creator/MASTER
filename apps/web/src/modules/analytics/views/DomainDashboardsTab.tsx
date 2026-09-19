import React, { useState } from 'react';
import {
  Briefcase,
  Calendar,
  DollarSign,
  MessageSquare,
  RotateCcw,
  FileSpreadsheet,
  Megaphone,
  TrendingUp,
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react';
import { MetricDomain, DashboardWidget, AnalyticsResult } from '@shared/types/index';
import { Button } from '../../../shared/components/Button';
import { MetricCard } from '../components/MetricCard';

interface DomainDashboardsTabProps {
  currentDomain: MetricDomain;
  onSelectDomain: (domain: MetricDomain) => void;
  widgets: DashboardWidget[];
  result: AnalyticsResult | null;
  isLoading: boolean;
  onRefresh: () => void;
  onExplainMetric: (code: string) => void;
}

export const DomainDashboardsTab: React.FC<DomainDashboardsTabProps> = ({
  currentDomain,
  onSelectDomain,
  widgets,
  result,
  isLoading,
  onRefresh,
  onExplainMetric
}) => {
  const domains: Array<{ id: MetricDomain; label: string; icon: React.ReactNode }> = [
    { id: 'COMERCIAL', label: 'Comercial', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'EVENTOS', label: 'Eventos & Portaria', icon: <Calendar className="h-4 w-4" /> },
    { id: 'FINANCEIRO', label: 'Financeiro', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'SAC', label: 'Atendimento SAC', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'ESTORNO', label: 'Estornos & Chargeback', icon: <RotateCcw className="h-4 w-4" /> },
    { id: 'CONTABILIDADE', label: 'Contabilidade', icon: <FileSpreadsheet className="h-4 w-4" /> },
    { id: 'MARKETING', label: 'Marketing & Tráfego', icon: <Megaphone className="h-4 w-4" /> },
    { id: 'REMARKETING', label: 'Remarketing', icon: <TrendingUp className="h-4 w-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Domain Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-3 shadow-sm">
        {domains.map((dom) => (
          <button
            key={dom.id}
            onClick={() => onSelectDomain(dom.id)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              currentDomain === dom.id
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {dom.icon}
            <span>{dom.label}</span>
          </button>
        ))}
      </div>

      {/* Domain Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-400">
              PAINEL SETORIAL
            </span>
            <span className="text-xs text-slate-500">&bull;</span>
            <span className="text-xs text-slate-400">
              {widgets.length} widget(s) operacionais vinculados
            </span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-white">
            BI Especializado &bull; {domains.find((d) => d.id === currentDomain)?.label}
          </h2>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar Indicadores
        </Button>
      </div>

      {/* Metrics Content */}
      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs text-slate-400">Consolidando indicadores analíticos do setor...</p>
        </div>
      ) : !result || result.metrics.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 text-center">
          <Layers className="h-10 w-10 text-slate-600" />
          <h3 className="mt-3 text-sm font-semibold text-slate-300">Nenhum dado consolidado</h3>
          <p className="mt-1 text-xs text-slate-500">
            Não há movimentações para este domínio na competência selecionada.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Domain KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {result.metrics.map((m) => {
              return (
                <MetricCard
                  key={m.code}
                  title={m.name}
                  code={m.code}
                  value={m.formattedTotal || String(m.total || 0)}
                  domain={currentDomain}
                  onExplainClick={onExplainMetric}
                />
              );
            })}
          </div>

          {/* Breakdown Table */}
          {result.rows.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg">
              <div className="border-b border-slate-800 bg-slate-950 px-6 py-4">
                <h3 className="text-sm font-bold text-white">Detalhamento por Dimensão</h3>
                <p className="text-xs text-slate-400">
                  Agrupamento oficial ({result.dimensions.join(', ')})
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                      {result.dimensions.map((dim) => (
                        <th key={dim} className="px-5 py-3.5 font-semibold uppercase tracking-wider">
                          {dim}
                        </th>
                      ))}
                      {result.metrics.map((m) => (
                        <th key={m.code} className="px-5 py-3.5 text-right font-semibold uppercase tracking-wider text-orange-400">
                          {m.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {result.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="transition hover:bg-slate-800/40">
                        {result.dimensions.map((dim) => (
                          <td key={dim} className="px-5 py-3.5 text-slate-200">
                            {row[`${dim}Label`] || row[`${dim}Name`] || row[dim] || '-'}
                          </td>
                        ))}
                        {result.metrics.map((m) => (
                          <td key={m.code} className="px-5 py-3.5 text-right font-mono font-medium text-slate-100">
                            {row[`${m.code}_formatted`] !== undefined
                              ? row[`${m.code}_formatted`]
                              : String(row[m.code] ?? '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
