import React, { useState, useEffect } from 'react';
import {
  History,
  RotateCcw,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  Layers,
  FileSpreadsheet,
  Eye,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { ImportRequest, ImportStatus } from '../data-management.types';

interface HistoryTabProps {
  onSelectImport?: (importItem: ImportRequest) => void;
  onRequestRollback?: (importItem: ImportRequest) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ onSelectImport, onRequestRollback }) => {
  const [historyItems, setHistoryItems] = useState<ImportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ImportRequest | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/data/imports');
      if (!res.ok) throw new Error('Falha ao buscar histórico de operações.');
      const data = await res.json();
      // Filter items that have reached a terminal or noteworthy state (COMPLETED, FAILED, ROLLED_BACK, CANCELLED)
      setHistoryItems(data.items || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar histórico de auditoria.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ImportStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Concluído
          </span>
        );
      case 'ROLLED_BACK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            <RotateCcw className="w-3 h-3" /> Revertido (Rollback)
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" /> Falhou
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            {status}
          </span>
        );
    }
  };

  const filtered = historyItems.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchCode = item.code?.toLowerCase().includes(q);
      const matchFile = item.fileName?.toLowerCase().includes(q);
      const matchUser = item.creatorUserName?.toLowerCase().includes(q);
      const matchType = item.importType?.toLowerCase().includes(q);
      if (!matchCode && !matchFile && !matchUser && !matchType) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Histórico de Operações e Trilha de Auditoria
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Rastreabilidade completa de todas as importações, lotes executados, ações de rollback e compensações lógicas.
          </p>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código, arquivo, operador ou tipo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg text-sm px-3 py-2 text-slate-700"
          >
            <option value="all">Todos os status</option>
            <option value="COMPLETED">Concluído</option>
            <option value="ROLLED_BACK">Revertido (Rollback)</option>
            <option value="FAILED">Falhou</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-500 mb-2" />
          <p className="text-sm">Carregando trilha de auditoria...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <History className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p className="font-semibold text-slate-800">Nenhum registro encontrado no histórico</p>
          <p className="text-xs text-slate-500 mt-1">Tente ajustar seus filtros de busca ou execute uma importação.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <th className="py-3 px-4">Código / Data</th>
                <th className="py-3 px-4">Tipo & Arquivo</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Registros Processados</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-indigo-600 block text-xs">{item.code}</span>
                    <span className="text-[11px] text-slate-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 text-xs block">{item.importType}</span>
                    <span className="text-[11px] text-slate-500 truncate max-w-[200px] block">{item.fileName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-slate-700 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {item.creatorUserName || 'Sistema'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-2 text-xs font-mono">
                      <span className="text-emerald-700 font-bold" title="Criados">+{item.summary?.createdCount || 0}</span>
                      <span className="text-blue-700 font-bold" title="Atualizados">~{item.summary?.updatedCount || 0}</span>
                      <span className="text-slate-500" title="Total">/ {item.summary?.totalRows || 0}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => onSelectImport ? onSelectImport(item) : setSelectedItem(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition"
                    >
                      <Eye className="w-3 h-3" /> Detalhes
                    </button>

                    {item.status === 'COMPLETED' && onRequestRollback && (
                      <button
                        onClick={() => onRequestRollback(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition"
                      >
                        <RotateCcw className="w-3 h-3" /> Rollback
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL AUDIT VIEW */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Trilha de Auditoria — {selectedItem.code}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg">
                <div>
                  <span className="text-slate-500 font-semibold block">ID do Lote:</span>
                  <span className="font-mono text-slate-800">{selectedItem.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Status:</span>
                  <div>{getStatusBadge(selectedItem.status)}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Criado por:</span>
                  <span className="text-slate-800">{selectedItem.creatorUserName} ({selectedItem.creatorUserId})</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Checksum do Arquivo:</span>
                  <span className="font-mono text-slate-800 truncate block">{selectedItem.fileChecksum || 'N/A'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-700 font-bold block mb-1">Resumo da Execução:</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto">
                  {JSON.stringify(selectedItem.summary, null, 2)}
                </pre>
              </div>

              {selectedItem.errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                  <span className="font-bold block mb-1">Mensagem de Erro Registrada:</span>
                  <span className="font-mono text-[11px]">{selectedItem.errorMessage}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
