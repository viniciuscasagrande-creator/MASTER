import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Building2,
  Layers,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ImportMapping, ImportType, TransformationType } from '../data-management.types';

export const MappingsTab: React.FC = () => {
  const [mappings, setMappings] = useState<ImportMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedMapping, setSelectedMapping] = useState<ImportMapping | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadMappings();
  }, [typeFilter]);

  const loadMappings = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = typeFilter && typeFilter !== 'all'
        ? `/api/data/mappings?importType=${typeFilter}`
        : '/api/data/mappings';

      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao carregar mapeamentos salvos.');
      const data = await res.json();
      setMappings(data.items || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar mapeamentos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!confirm('Deseja realmente excluir este mapeamento salvo?')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/data/mappings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir mapeamento.');
      setSuccessMsg('Mapeamento excluído com sucesso.');
      setTimeout(() => setSuccessMsg(null), 3000);
      if (selectedMapping?.id === id) setSelectedMapping(null);
      await loadMappings();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir mapeamento.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = mappings.filter(m => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = m.name?.toLowerCase().includes(q);
      const matchPartner = m.partnerName?.toLowerCase().includes(q);
      const matchType = m.importType?.toLowerCase().includes(q);
      if (!matchName && !matchPartner && !matchType) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center justify-between text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 font-bold">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-600" />
            Mapeamentos de Colunas Salvos
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Reutilize de forma automática definições de correspondência de colunas e transformações salvas por parceiro ou layout de planilha.
          </p>
        </div>

        <button
          onClick={loadMappings}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome do mapeamento ou parceiro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo:</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg text-sm px-3 py-2 text-slate-700"
          >
            <option value="all">Todos os tipos</option>
            <option value="CUSTOMERS">Clientes</option>
            <option value="SUPPLIERS">Fornecedores</option>
            <option value="EVENTS">Eventos</option>
            <option value="FINANCIAL_TRANSACTIONS">Lançamentos Financeiros</option>
            <option value="TICKETS">Ingressos</option>
            <option value="ORDERS">Pedidos</option>
          </select>
        </div>
      </div>

      {/* Mappings List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-500 mb-2" />
          <p className="text-sm">Carregando modelos de mapeamento salvos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <FileCode className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p className="font-semibold text-slate-800">Nenhum mapeamento salvo encontrado</p>
          <p className="text-xs text-slate-500 mt-1">
            Ao importar planilhas no Assistente, marque a opção "Salvar como modelo de mapeamento reutilizável" para guardá-lo aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(mapItem => (
            <div
              key={mapItem.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-300 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {mapItem.importType}
                  </span>
                  <button
                    onClick={() => handleDeleteMapping(mapItem.id)}
                    disabled={deletingId === mapItem.id}
                    className="text-slate-400 hover:text-red-600 p-1 transition"
                    title="Excluir mapeamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{mapItem.name}</h3>

                {mapItem.partnerName && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Parceiro: <strong>{mapItem.partnerName}</strong>
                  </p>
                )}

                <div className="text-xs text-slate-500">
                  <span>Campos mapeados: <strong>{mapItem.fields?.length || 0} colunas</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {mapItem.createdAt ? new Date(mapItem.createdAt).toLocaleDateString('pt-BR') : '-'}
                </span>

                <button
                  onClick={() => setSelectedMapping(mapItem)}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" /> Ver Regras
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: VER DETALHES DO MAPEAMENTO */}
      {selectedMapping && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedMapping.name}</h3>
                <span className="text-xs text-slate-500">Tipo: {selectedMapping.importType} {selectedMapping.partnerName ? `• Parceiro: ${selectedMapping.partnerName}` : ''}</span>
              </div>
              <button
                onClick={() => setSelectedMapping(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block">
                Campos Correspondentes ({selectedMapping.fields?.length || 0})
              </span>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                      <th className="py-2.5 px-3">Coluna na Planilha</th>
                      <th className="py-2.5 px-3">Campo do Sistema</th>
                      <th className="py-2.5 px-3">Transformador</th>
                      <th className="py-2.5 px-3">Valor Padrão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedMapping.fields?.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{f.fileColumn}</td>
                        <td className="py-2 px-3 font-mono text-indigo-700 font-semibold">{f.targetColumn}</td>
                        <td className="py-2 px-3">

                          {f.transformation ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
                              {f.transformation}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-500 font-mono">
                          {f.defaultValue !== undefined ? String(f.defaultValue) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedMapping(null)}
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
