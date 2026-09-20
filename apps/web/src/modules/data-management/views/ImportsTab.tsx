import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  RotateCcw,
  Eye,
  Plus,
  XCircle,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ImportRequest, ImportType, ImportStatus } from '../data-management.types';

interface ImportsTabProps {
  imports: ImportRequest[];
  onOpenWizard: () => void;
  onSelectImport: (id: string) => void;
  onRequestRollback: (id: string) => void;
  onCancelImport: (id: string) => void;
}

export const ImportsTab: React.FC<ImportsTabProps> = ({
  imports,
  onOpenWizard,
  onSelectImport,
  onRequestRollback,
  onCancelImport
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filtered = imports.filter((imp) => {
    const matchSearch =
      imp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      imp.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || imp.status === statusFilter;
    const matchType = typeFilter === 'ALL' || imp.importType === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código ou arquivo..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">Todos os Status</option>
            <option value="COMPLETED">Concluído</option>
            <option value="PARTIALLY_COMPLETED">Parcial</option>
            <option value="PROCESSING">Processando</option>
            <option value="QUEUED">Na Fila</option>
            <option value="FAILED">Falhou</option>
            <option value="ROLLED_BACK">Revertido</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="CUSTOMERS">Clientes</option>
            <option value="EVENT_PARTICIPANTS">Participantes</option>
            <option value="SUPPLIERS">Fornecedores</option>
            <option value="ACCOUNTS_PAYABLE">Contas a Pagar</option>
            <option value="ACCOUNTS_RECEIVABLE">Contas a Receber</option>
            <option value="FINANCIAL_TRANSACTIONS">Transações</option>
            <option value="MARKETING_CONTACTS">Marketing</option>
            <option value="LEGACY_ORDERS">Pedidos Legados</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenWizard}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950/40"
        >
          <Plus className="h-4 w-4" />
          Nova Importação
        </button>
      </div>

      {/* Imports Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono uppercase">
            <tr>
              <th className="p-3.5">Identificador</th>
              <th className="p-3.5">Tipo de Dados</th>
              <th className="p-3.5">Arquivo de Origem</th>
              <th className="p-3.5 text-center">Progresso</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Operador</th>
              <th className="p-3.5">Data / Hora</th>
              <th className="p-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {filtered.length > 0 ? (
              filtered.map((imp) => {
                const total = imp.summary.totalRows || 1;
                const success = imp.summary.createdCount + imp.summary.updatedCount;
                const pct = Math.min(100, Math.round((success / total) * 100));

                return (
                  <tr key={imp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-white">{imp.code}</td>
                    <td className="p-3.5 font-medium">{imp.importType}</td>
                    <td className="p-3.5 font-mono text-slate-400 max-w-[180px] truncate">{imp.fileName}</td>
                    <td className="p-3.5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-bold text-white text-[11px]">{success} / {total}</span>
                        <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full transition-all ${
                              imp.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
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
                    <td className="p-3.5 text-slate-400">{imp.creatorUserName}</td>
                    <td className="p-3.5 text-slate-400">{new Date(imp.createdAt).toLocaleString('pt-BR')}</td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectImport(imp.id)}
                          title="Ver Detalhes"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {imp.summary.invalidRows > 0 && (
                          <a
                            href={`/api/data/imports/${imp.id}/errors/export`}
                            target="_blank"
                            rel="noreferrer"
                            title="Exportar CSV de Erros"
                            className="rounded-lg p-1.5 text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                        {(imp.status === 'COMPLETED' || imp.status === 'PARTIALLY_COMPLETED') && (
                          <button
                            type="button"
                            onClick={() => onRequestRollback(imp.id)}
                            title="Desfazer / Reverter Lote"
                            className="rounded-lg p-1.5 text-purple-400 hover:bg-slate-800 hover:text-purple-300 transition-colors"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        {imp.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => onCancelImport(imp.id)}
                            title="Cancelar Lote"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  Nenhum lote de importação encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
