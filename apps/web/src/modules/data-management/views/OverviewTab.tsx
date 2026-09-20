import React from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Download,
  Search,
  Activity
} from 'lucide-react';
import { DataQualityStats, ImportRequest, DataQualityDimension } from '../data-management.types';

interface OverviewTabProps {
  stats: DataQualityStats | null;
  recentImports: ImportRequest[];
  onOpenWizard: () => void;
  onNavigateTab: (tab: any) => void;
  onTriggerScan: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  recentImports,
  onOpenWizard,
  onNavigateTab,
  onTriggerScan
}) => {
  const totalAudited = stats?.totalRecordsAudited || 1250;
  const totalIssues = stats?.totalIssues || 0;
  const qualityRate = Math.max(0, Math.round(((totalAudited - totalIssues) / (totalAudited || 1)) * 100));

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 p-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" /> Core Data Management — 1.1.5.15
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Central de Importação, Migração e Qualidade de Dados
            </h2>
            <p className="max-w-2xl text-xs text-slate-400 leading-relaxed">
              Ingestão controlada de planilhas, mapeamento inteligente sem execução arbitrária de código, mitigação de injeção de fórmulas e governança multitenant conectada ao Job Engine.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenWizard}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 transition-all"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Nova Importação (Wizard)
            </button>
            <button
              type="button"
              onClick={onTriggerScan}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
            >
              <Zap className="h-4 w-4 text-yellow-400" />
              Executar Varredura
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total de Importações</span>
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{recentImports.length}</p>
          <span className="mt-1 text-[11px] text-emerald-400 font-medium">Lotes gerenciados</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Score de Qualidade Geral</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-cyan-300">{qualityRate}%</p>
          <span className="mt-1 text-[11px] text-slate-400">{totalAudited} registros auditados</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Não Conformidades Abertas</span>
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-yellow-300">{stats?.totalIssues || 0}</p>
          <span className="mt-1 text-[11px] text-yellow-400 font-medium">Requer atenção operacional</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Dimensões Auditadas</span>
            <Database className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-purple-300">6</p>
          <span className="mt-1 text-[11px] text-slate-400">Completude, Validade, etc.</span>
        </div>
      </div>

      {/* 6 Dimensions Health Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Saúde dos Dados pelas 6 Dimensões</h3>
            <p className="text-xs text-slate-400">
              Conformidade contínua nos eixos de integridade referencial, tempestividade e unicidade
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('QUALITY')}
            className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-medium"
          >
            Ver Detalhes das Regras <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { dim: 'COMPLETENESS' as DataQualityDimension, label: 'Completude', desc: 'Campos essenciais preenchidos' },
            { dim: 'VALIDITY' as DataQualityDimension, label: 'Validade', desc: 'Formato e checksum Mod11' },
            { dim: 'UNIQUENESS' as DataQualityDimension, label: 'Unicidade', desc: 'Sem duplicidades de chaves' },
            { dim: 'CONSISTENCY' as DataQualityDimension, label: 'Consistência', desc: 'Relações entre pedidos e itens' },
            { dim: 'TIMELINESS' as DataQualityDimension, label: 'Tempestividade', desc: 'Competência e sem datas futuras' },
            { dim: 'REFERENTIAL_INTEGRITY' as DataQualityDimension, label: 'Ref. Integridade', desc: 'Vínculos de chaves estrangeiras' }
          ].map((d) => {
            const issuesCount = stats?.issuesByDimension ? (stats.issuesByDimension[d.dim] || 0) : 0;
            const isClean = issuesCount === 0;


            return (
              <div
                key={d.dim}
                className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white">{d.label}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{d.desc}</p>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-400">{issuesCount} falhas</span>
                  {isClean ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Imports Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Últimos Lotes de Importação</h3>
            <p className="text-xs text-slate-400">Rastreabilidade em tempo real de execuções do Import Engine</p>
          </div>
          <button
            onClick={() => onNavigateTab('IMPORTS')}
            className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-medium"
          >
            Ver Todas as Importações <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono uppercase">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Arquivo</th>
                <th className="p-3">Linhas</th>
                <th className="p-3">Status</th>
                <th className="p-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {recentImports.slice(0, 5).map((imp) => (
                <tr key={imp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-white">{imp.code}</td>
                  <td className="p-3">{imp.importType}</td>
                  <td className="p-3 font-mono text-slate-400">{imp.fileName}</td>
                  <td className="p-3 font-bold">{imp.summary.totalRows}</td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        imp.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : imp.status === 'PARTIALLY_COMPLETED'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : imp.status === 'FAILED'
                          ? 'bg-red-500/20 text-red-300'
                          : imp.status === 'ROLLED_BACK'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {imp.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{new Date(imp.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
