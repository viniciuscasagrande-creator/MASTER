import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Download,
  Shield,
  Layers,
  Clock,
  User,
  Hash
} from 'lucide-react';
import { ImportRequest, ImportValidationError, ImportDuplicate } from '../data-management.types';

interface ImportDetailsModalProps {
  importId: string;
  onClose: () => void;
  onRequestRollback: (importId: string) => void;
}

export const ImportDetailsModal: React.FC<ImportDetailsModalProps> = ({
  importId,
  onClose,
  onRequestRollback
}) => {
  const [data, setData] = useState<ImportRequest | null>(null);
  const [errors, setErrors] = useState<ImportValidationError[]>([]);
  const [duplicates, setDuplicates] = useState<ImportDuplicate[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'SUMMARY' | 'ERRORS' | 'DUPLICATES'>('SUMMARY');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchData();
  }, [importId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/data/imports/${importId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const json = await res.json();
      if (json.success) {
        setData(json.item);
        setErrors(json.errorsPreview || []);
        setDuplicates(json.duplicatesPreview || []);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{data.code}</h3>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    data.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : data.status === 'PARTIALLY_COMPLETED'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : data.status === 'FAILED'
                      ? 'bg-red-500/20 text-red-300'
                      : data.status === 'ROLLED_BACK'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {data.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">{data.fileName} • {data.importType}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Subtabs Header */}
        <div className="flex items-center gap-4 border-b border-slate-800 bg-slate-950 px-6 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('SUMMARY')}
            className={`border-b-2 py-3 transition-colors ${
              activeSubTab === 'SUMMARY'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Visão Geral & Métricas
          </button>
          <button
            onClick={() => setActiveSubTab('ERRORS')}
            className={`border-b-2 py-3 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'ERRORS'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Relatório de Inconsistências
            {errors.length > 0 && (
              <span className="rounded-full bg-red-500/20 px-1.5 py-0.2 text-[10px] text-red-400">
                {errors.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('DUPLICATES')}
            className={`border-b-2 py-3 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'DUPLICATES'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Duplicidades Detectadas
            {duplicates.length > 0 && (
              <span className="rounded-full bg-yellow-500/20 px-1.5 py-0.2 text-[10px] text-yellow-400">
                {duplicates.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-200">
          {activeSubTab === 'SUMMARY' && (
            <div className="space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="text-xs text-slate-400">Total de Linhas</span>
                  <p className="text-2xl font-bold text-white">{data.summary.totalRows}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <span className="text-xs text-emerald-400">Gravados com Sucesso</span>
                  <p className="text-2xl font-bold text-emerald-300">{data.summary.createdCount + data.summary.updatedCount}</p>
                </div>
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
                  <span className="text-xs text-yellow-400">Duplicados / Pulados</span>
                  <p className="text-2xl font-bold text-yellow-300">{data.summary.duplicateRows}</p>
                </div>
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                  <span className="text-xs text-red-400">Linhas com Erro</span>
                  <p className="text-2xl font-bold text-red-300">{data.summary.invalidRows}</p>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-3 text-xs">
                <h4 className="font-semibold text-white uppercase font-mono text-[11px] text-slate-400">
                  Parâmetros de Auditoria e Integridade
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500">Hash SHA-256 do Arquivo:</span>
                    <p className="font-mono text-slate-300 break-all">{data.fileChecksum}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Tamanho do Arquivo:</span>
                    <p className="text-slate-300">{(data.fileSize / 1024).toFixed(1)} KB ({data.fileFormat})</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Política de Atomicidade:</span>
                    <p className="text-slate-300 font-semibold">{data.atomicityPolicy}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Estratégia de Duplicidades:</span>
                    <p className="text-slate-300 font-semibold">{data.duplicateStrategy}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Operador Responsável:</span>
                    <p className="text-slate-300">{data.creatorUserName} ({data.creatorUserId})</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Data de Envio:</span>
                    <p className="text-slate-300">{new Date(data.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              {/* Actions Box */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <RotateCcw className="h-4 w-4 text-purple-400" />
                  <span>Deseja desfazer este lote? O sistema verificará se há movimentações dependentes.</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRequestRollback(data.id)}
                  className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-all"
                >
                  Solicitar Reversão / Rollback
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'ERRORS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Total de {errors.length} inconsistências registradas neste lote de importação.
                </p>
                <a
                  href={`/api/data/imports/${data.id}/errors/export`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-emerald-400 hover:bg-slate-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar CSV de Erros (UTF-8 BOM)
                </a>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono uppercase">
                    <tr>
                      <th className="p-3">Linha</th>
                      <th className="p-3">Campo</th>
                      <th className="p-3">Valor Informado</th>
                      <th className="p-3">Severidade</th>
                      <th className="p-3">Problema</th>
                      <th className="p-3">Orientação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {errors.map((err) => (
                      <tr key={err.id || err.rowNumber} className="hover:bg-slate-900/40">
                        <td className="p-3 font-mono font-bold text-white">{err.rowNumber}</td>
                        <td className="p-3 font-semibold text-red-400">{err.columnName}</td>
                        <td className="p-3 font-mono text-slate-400">{String(err.cellValue || 'Vazio')}</td>
                        <td className="p-3">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              err.severity === 'BLOCKING' || err.severity === 'ERROR'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {err.severity}
                          </span>
                        </td>
                        <td className="p-3 text-red-300">{err.message}</td>
                        <td className="p-3 text-emerald-300">{err.suggestedFix || 'Verificar dado'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'DUPLICATES' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Registros colidindo com a base existente e a respectiva estratégia aplicada.
              </p>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono uppercase">
                    <tr>
                      <th className="p-3">Linha</th>
                      <th className="p-3">Campo de Conflito</th>
                      <th className="p-3">Valor Colidente</th>
                      <th className="p-3">ID do Registro Existente</th>
                      <th className="p-3">Estratégia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {duplicates.map((dup) => (
                      <tr key={dup.id || dup.rowNumber} className="hover:bg-slate-900/40">
                        <td className="p-3 font-mono font-bold text-white">{dup.rowNumber}</td>
                        <td className="p-3 font-semibold text-yellow-400">{dup.matchField}</td>
                        <td className="p-3 font-mono text-slate-300">{dup.matchValue}</td>
                        <td className="p-3 font-mono text-slate-400">{dup.existingEntityId}</td>
                        <td className="p-3 font-semibold text-white">{dup.strategy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-slate-800 bg-slate-950/80 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
