import React, { useState } from 'react';
import {
  FileText,
  Search,
  Share2,
  Copy,
  Trash2,
  Play,
  Camera,
  Star,
  Users,
  Lock,
  Building,
  Plus
} from 'lucide-react';
import { SavedReport, MetricDomain } from '@shared/types/index';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';

interface SavedReportsTabProps {
  reports: SavedReport[];
  currentUserId: string;
  onExecuteReport: (report: SavedReport) => void;
  onShareReport: (report: SavedReport) => void;
  onDuplicateReport: (report: SavedReport) => void;
  onSnapshotReport: (report: SavedReport) => void;
  onDeleteReport: (report: SavedReport) => void;
  onNavigateToBuilder: () => void;
}

export const SavedReportsTab: React.FC<SavedReportsTabProps> = ({
  reports,
  currentUserId,
  onExecuteReport,
  onShareReport,
  onDuplicateReport,
  onSnapshotReport,
  onDeleteReport,
  onNavigateToBuilder
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  const filteredReports = reports.filter((r) => {
    const matchesDomain = selectedDomain === 'ALL' || r.domain === selectedDomain;
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64 sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar relatórios salvos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-orange-500"
            />
          </div>

          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-orange-500"
          >
            <option value="ALL">Todos os Domínios ({reports.length})</option>
            <option value="COMERCIAL">Comercial</option>
            <option value="EVENTOS">Eventos</option>
            <option value="FINANCEIRO">Financeiro</option>
            <option value="SAC">SAC</option>
            <option value="ESTORNO">Estorno</option>
            <option value="CONTABILIDADE">Contabilidade</option>
            <option value="MARKETING">Marketing</option>
            <option value="REMARKETING">Remarketing</option>
          </select>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onNavigateToBuilder}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4" />
          Novo Relatório
        </Button>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 text-center">
          <FileText className="h-10 w-10 text-slate-600" />
          <h3 className="mt-3 text-sm font-semibold text-slate-300">Nenhum relatório encontrado</h3>
          <p className="mt-1 text-xs text-slate-500">
            Crie novos relatórios com o construtor visual declarativo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => {
            const isOwner = report.creatorUserId === currentUserId;

            return (
              <div
                key={report.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg transition hover:border-slate-700 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-300">
                        {report.domain}
                      </span>
                      <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[10px] font-mono text-orange-400">
                        {report.chartType}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      {report.visibility === 'PRIVATE' && <span title="Privado"><Lock className="h-3.5 w-3.5 text-slate-400" /></span>}
                      {report.visibility === 'TEAM' && <span title="Equipe"><Users className="h-3.5 w-3.5 text-cyan-400" /></span>}
                      {report.visibility === 'ROLE' && <span title="Perfil"><Building className="h-3.5 w-3.5 text-purple-400" /></span>}
                      {report.visibility === 'PRODUCER' && <span title="Produtor"><Building className="h-3.5 w-3.5 text-emerald-400" /></span>}
                      {report.visibility === 'SPECIFIC_USERS' && <span title="Usuários Específicos"><Users className="h-3.5 w-3.5 text-orange-400" /></span>}
                    </div>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-white hover:text-orange-400 transition cursor-pointer" onClick={() => onExecuteReport(report)}>
                    {report.title}
                  </h3>

                  {report.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                      {report.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-1">
                    {report.queryDefinition.metrics.slice(0, 3).map((m) => (
                      <span
                        key={m}
                        className="rounded bg-slate-950 px-1.5 py-0.5 text-[10px] font-mono text-slate-400"
                      >
                        {m}
                      </span>
                    ))}
                    {report.queryDefinition.metrics.length > 3 && (
                      <span className="rounded bg-slate-950 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                        +{report.queryDefinition.metrics.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-800/80 pt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                    <span>Por {report.creatorUserName}</span>
                    <span>{new Date(report.updatedAt).toLocaleDateString('pt-BR')}</span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onExecuteReport(report)}
                      className="flex flex-1 items-center justify-center gap-1 text-xs"
                    >
                      <Play className="h-3 w-3 text-emerald-400" />
                      Visualizar
                    </Button>

                    <button
                      onClick={() => onSnapshotReport(report)}
                      className="rounded-lg border border-slate-800 p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-cyan-400"
                      title="Congelar Foto (Snapshot)"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => onShareReport(report)}
                      className="rounded-lg border border-slate-800 p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-orange-400"
                      title="Compartilhar"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => onDuplicateReport(report)}
                      className="rounded-lg border border-slate-800 p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                      title="Duplicar"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir o relatório "${report.title}"?`)) {
                            onDeleteReport(report);
                          }
                        }}
                        className="rounded-lg border border-slate-800 p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
