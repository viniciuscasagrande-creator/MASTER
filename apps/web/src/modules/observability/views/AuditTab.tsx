import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Hash,
  Eye,
  X,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { AuditLogRecord, AuditDiffField } from '../observability.types';
import { formatDateTime } from '../../../shared/utils/formatters';

interface AuditTabProps {
  logs: AuditLogRecord[];
  onExport: (format: 'CSV' | 'JSON', filters: any) => void;
  onFilterByCorrelationId?: (correlationId: string) => void;
  isExporting?: boolean;
}

export const AuditTab: React.FC<AuditTabProps> = ({
  logs,
  onExport,
  onFilterByCorrelationId,
  isExporting = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedResult, setSelectedResult] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'CSV' | 'JSON'>('CSV');
  const [copiedHash, setCopiedHash] = useState(false);

  // Compute diff fields between beforeData and afterData
  const calculateDiff = (before: any, after: any): AuditDiffField[] => {
    if (!before && !after) return [];
    const diffs: AuditDiffField[] = [];

    const keys = new Set([
      ...(before && typeof before === 'object' ? Object.keys(before) : []),
      ...(after && typeof after === 'object' ? Object.keys(after) : [])
    ]);

    for (const key of keys) {
      const oldVal = before ? before[key] : undefined;
      const newVal = after ? after[key] : undefined;

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diffs.push({
          field: key,
          oldValue: oldVal,
          newValue: newVal
        });
      }
    }

    return diffs;
  };

  const filteredLogs = logs.filter(log => {
    if (selectedModule !== 'ALL' && log.module !== selectedModule) return false;
    if (selectedResult !== 'ALL' && log.result !== selectedResult) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCorr = log.correlationId?.toLowerCase().includes(term);
      const matchUser = log.userName?.toLowerCase().includes(term);
      const matchAction = log.action?.toLowerCase().includes(term);
      const matchResId = log.resourceId?.toLowerCase().includes(term);
      const matchResType = log.resourceType?.toLowerCase().includes(term);

      if (!matchCorr && !matchUser && !matchAction && !matchResId && !matchResType) {
        return false;
      }
    }

    return true;
  });

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'SUCCESS':
        return <Badge variant="emerald" size="sm">Sucesso</Badge>;
      case 'DENIED':
        return <Badge variant="amber" size="sm">Acesso Negado</Badge>;
      case 'FAILED':
        return <Badge variant="rose" size="sm">Falha</Badge>;
      default:
        return <Badge variant="slate" size="sm">{result}</Badge>;
    }
  };

  const handleCopyIpHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-orange-400" />
            Trilha Imutável de Auditoria de Negócio
          </h2>
          <p className="text-sm text-slate-400">
            Registro cronológico forense: quem fez o quê, em qual recurso, com qual IP (hash LGPD) e dados antes x depois.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="border-slate-700 bg-slate-800 text-slate-200"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Exportar Trilha
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por Correlation ID, usuário, recurso ou ação..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Módulo:</span>
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-orange-500 focus:outline-none"
            >
              <option value="ALL">Todos os Módulos</option>
              <option value="CONFIGURACOES">Configurações & Políticas</option>
              <option value="FINANCEIRO">Financeiro & Repasses</option>
              <option value="ESTORNO">Estornos & Chargeback</option>
              <option value="EVENTOS">Eventos & Lotes</option>
              <option value="APROVACOES">Aprovações</option>
              <option value="DOCUMENTOS">Documentos</option>
              <option value="TAREFAS">Tarefas & Workflows</option>
              <option value="SEGURANCA">Segurança & Autenticação</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Resultado:</span>
            <select
              value={selectedResult}
              onChange={e => setSelectedResult(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-orange-500 focus:outline-none"
            >
              <option value="ALL">Todos os Resultados</option>
              <option value="SUCCESS">Sucesso</option>
              <option value="DENIED">Acesso Negado</option>
              <option value="FAILED">Falha</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 ml-auto">
            Exibindo <span className="font-semibold text-white">{filteredLogs.length}</span> registros
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Correlation ID</th>
                <th className="px-4 py-3">Ator / Usuário</th>
                <th className="px-4 py-3">Módulo / Ação</th>
                <th className="px-4 py-3">Recurso Afetado</th>
                <th className="px-4 py-3">Resultado</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400 font-mono">
                    {formatDateTime(log.createdAt)}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.correlationId ? (
                      <button
                        type="button"
                        onClick={() => onFilterByCorrelationId && onFilterByCorrelationId(log.correlationId!)}
                        className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors"
                        title="Ver trace desta operação"
                      >
                        <Hash className="h-3 w-3" />
                        {log.correlationId}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-600 font-mono">-</span>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                        {log.userName ? log.userName.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-200">
                          {log.userName || 'Sistema Automático'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {log.userId || 'system'}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs font-semibold text-slate-200">{log.action}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{log.module}</div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.resourceType ? (
                      <div>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                          {log.resourceType}
                        </span>
                        <div className="text-xs font-mono text-slate-300 mt-0.5">
                          {log.resourceId || '-'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600">-</span>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {getResultBadge(log.result)}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                      className="h-7 text-xs border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Diff & Detalhes
                    </Button>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Nenhum registro de auditoria encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Structural Diff & Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Inspeção Estrutural de Auditoria
                    {getResultBadge(selectedLog.result)}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID Registro: {selectedLog.id} · {formatDateTime(selectedLog.createdAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metadata Chips */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block">Correlation ID:</span>
                <span className="font-mono text-cyan-400 font-medium">{selectedLog.correlationId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Usuário Responsável:</span>
                <span className="font-medium text-slate-200">{selectedLog.userName || 'Sistema'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Módulo / Ação:</span>
                <span className="font-medium text-slate-200">{selectedLog.module} · {selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Hash IP (LGPD):</span>
                <div className="flex items-center gap-1 font-mono text-slate-400">
                  <span className="truncate max-w-[120px]">{selectedLog.ipHash || 'N/A'}</span>
                  {selectedLog.ipHash && (
                    <button
                      type="button"
                      onClick={() => handleCopyIpHash(selectedLog.ipHash!)}
                      className="text-slate-500 hover:text-slate-300"
                      title="Copiar Hash SHA-256"
                    >
                      {copiedHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Before vs. After Structural Diff Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                Comparativo Estrutural: Antes x Depois
                <span className="text-xs text-slate-400 font-normal">
                  (Diferença calculada com sanitização estrita de credenciais)
                </span>
              </h4>

              {(() => {
                const diffs = calculateDiff(selectedLog.beforeData, selectedLog.afterData);

                if (diffs.length === 0) {
                  return (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-center text-slate-400 text-xs">
                      {selectedLog.afterData ? (
                        <div>
                          <p className="font-semibold text-slate-300 mb-2">Registro de Criação ou Ação Sem Alteração Anterior</p>
                          <pre className="text-left font-mono text-emerald-300/80 bg-slate-950 p-4 rounded-lg overflow-x-auto text-[11px]">
                            {JSON.stringify(selectedLog.afterData, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        'Nenhum payload de alteração capturado para esta operação.'
                      )}
                    </div>
                  );
                }

                return (
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5 w-1/4">Campo</th>
                          <th className="px-4 py-2.5 w-3/8 text-rose-400">Valor Anterior (Before)</th>
                          <th className="px-4 py-2.5 w-3/8 text-emerald-400">Novo Valor (After)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {diffs.map(d => (
                          <tr key={d.field} className="hover:bg-slate-900/50">
                            <td className="px-4 py-3 font-semibold text-slate-300">
                              {d.field}
                            </td>
                            <td className="px-4 py-3 bg-rose-950/10 text-rose-300 break-all">
                              {typeof d.oldValue === 'object'
                                ? JSON.stringify(d.oldValue)
                                : String(d.oldValue ?? '<vazio>')}
                            </td>
                            <td className="px-4 py-3 bg-emerald-950/10 text-emerald-300 break-all font-semibold">
                              {typeof d.newValue === 'object'
                                ? JSON.stringify(d.newValue)
                                : String(d.newValue ?? '<vazio>')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Immutability Seal */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Registro imutável assinado. Protegido contra expurgo ou edição manual.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
                className="border-slate-700 text-slate-300"
              >
                Fechar Visualização
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Download className="h-5 w-5 text-orange-400" />
                Exportar Trilha de Auditoria
              </h3>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              O arquivo gerado conterá todos os registros filtrados pelo módulo e escopo atual com hashes de integridade.
            </p>

            <div className="space-y-3 mb-6">
              <label className="text-xs font-medium text-slate-300 block">Formato do Arquivo:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('CSV')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    exportFormat === 'CSV'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400 font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Planilhas)
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('JSON')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    exportFormat === 'JSON'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400 font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode className="h-4 w-4" />
                  JSON (Estruturado)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExportModalOpen(false)}
                className="border-slate-700 text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isExporting}
                onClick={() => {
                  onExport(exportFormat, {
                    module: selectedModule !== 'ALL' ? selectedModule : undefined,
                    result: selectedResult !== 'ALL' ? selectedResult : undefined,
                    search: searchTerm || undefined
                  });
                  setIsExportModalOpen(false);
                }}
              >
                Iniciar Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
