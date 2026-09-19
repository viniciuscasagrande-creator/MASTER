import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Camera,
  RefreshCw,
  Clock,
  ShieldCheck,
  Table as TableIcon,
  BarChart2,
  PieChart,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { SavedReport, AnalyticsResult } from '@shared/types/index';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';

interface ReportViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SavedReport | null;
  result: AnalyticsResult | null;
  isLoading: boolean;
  onRefresh: () => void;
  onExport: (format: 'CSV' | 'XLSX' | 'PDF') => void;
  onCreateSnapshot: () => void;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({
  isOpen,
  onClose,
  report,
  result,
  isLoading,
  onRefresh,
  onExport,
  onCreateSnapshot
}) => {
  const [activeViewMode, setActiveViewMode] = useState<'TABLE' | 'CHART'>('TABLE');

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2 text-orange-400">
              <TableIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
                  {report.domain}
                </span>
                <span className="text-xs text-slate-500">
                  Criado por {report.creatorUserName}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">{report.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Buttons */}
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5">
              <button
                onClick={() => onExport('CSV')}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white"
                title="Exportar CSV (Ponto-e-vírgula e UTF-8 BOM)"
              >
                <Download className="h-3.5 w-3.5 text-blue-400" />
                CSV
              </button>
              <button
                onClick={() => onExport('XLSX')}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white"
                title="Exportar Planilha Excel Estruturada"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                Excel
              </button>
              <button
                onClick={() => onExport('PDF')}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white"
                title="Exportar PDF com Marca D'água"
              >
                <FileText className="h-3.5 w-3.5 text-rose-400" />
                PDF
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onCreateSnapshot}
              className="flex items-center gap-1.5"
            >
              <Camera className="h-4 w-4 text-cyan-400" />
              Congelar Foto (Snapshot)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Subheader / Status Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-slate-950/40 px-6 py-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-orange-400" />
              <span>
                Período: <strong className="text-slate-200">{report.queryDefinition.period.type}</strong>
              </span>
            </div>
            {result && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">&bull;</span>
                  <span>
                    Status: <strong className="text-emerald-400">{result.freshness.status}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">&bull;</span>
                  <span>
                    Execução: <strong className="text-slate-200">{result.executionTimeMs}ms</strong>
                  </span>
                </div>
                {result.cached && (
                  <Badge variant="info" size="sm">
                    Cache Analítico
                  </Badge>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveViewMode('TABLE')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
                activeViewMode === 'TABLE'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              Tabela
            </button>
            <button
              onClick={() => setActiveViewMode('CHART')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
                activeViewMode === 'CHART'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Gráfico ({report.chartType})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-sm text-slate-400">Processando consulta analítica com permissões seguras...</p>
            </div>
          ) : !result || result.rows.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
              <TableIcon className="h-10 w-10 text-slate-600" />
              <h3 className="font-semibold text-slate-300">Nenhum registro encontrado</h3>
              <p className="text-xs text-slate-500">
                Não há dados para o período ou filtros selecionados.
              </p>
            </div>
          ) : activeViewMode === 'TABLE' ? (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-inner">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                    {result.dimensions.map((dim) => (
                      <th key={dim} className="px-4 py-3 font-semibold uppercase tracking-wider">
                        {dim}
                      </th>
                    ))}
                    {result.metrics.map((m) => (
                      <th key={m.code} className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-orange-400">
                        {m.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {result.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="transition-colors hover:bg-slate-900/40">
                      {result.dimensions.map((dim) => (
                        <td key={dim} className="px-4 py-3 text-slate-300">
                          {row[`${dim}Label`] || row[`${dim}Name`] || row[dim] || '-'}
                        </td>
                      ))}
                      {result.metrics.map((m) => {
                        const formatted = row[`${m.code}_formatted`];
                        const raw = row[m.code];
                        return (
                          <td key={m.code} className="px-4 py-3 text-right font-mono font-medium text-slate-100">
                            {formatted !== undefined ? formatted : String(raw ?? '-')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-700 bg-slate-900 font-bold text-white">
                    {result.dimensions.map((dim, idx) => (
                      <td key={dim} className="px-4 py-3">
                        {idx === 0 ? 'TOTAL CONSOLIDADO' : ''}
                      </td>
                    ))}
                    {result.metrics.map((m) => (
                      <td key={m.code} className="px-4 py-3 text-right font-mono text-orange-400">
                        {m.formattedTotal || String(m.total ?? '-')}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            /* Visual Chart Representation */
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Distribuição Visual dos Indicadores ({report.chartType})
                </h4>
                <div className="space-y-4">
                  {result.rows.map((row, idx) => {
                    const label = result.dimensions.map((d) => row[`${d}Label`] || row[`${d}Name`] || row[d] || '').join(' - ');
                    const primaryMetric = result.metrics[0];
                    const val = Number(row[primaryMetric.code] || 0);
                    const total = Number(primaryMetric.total || 1);
                    const pct = Math.min(100, Math.max(5, Math.round((val / total) * 100)));

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-300">{label || `Item #${idx + 1}`}</span>
                          <span className="font-mono text-orange-400">
                            {row[`${primaryMetric.code}_formatted`] || val} ({pct}%)
                          </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
