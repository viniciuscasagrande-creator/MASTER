import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Eye,
  Check,
  ShieldAlert,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { ImportDuplicate, MergePlan, DuplicateStrategy } from '../data-management.types';

export const DuplicatesTab: React.FC = () => {
  const [activeSubtab, setActiveSubtab] = useState<'CONFLICTS' | 'MERGE_PLANS'>('CONFLICTS');
  const [duplicates, setDuplicates] = useState<ImportDuplicate[]>([]);
  const [mergePlans, setMergePlans] = useState<MergePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDuplicate, setSelectedDuplicate] = useState<ImportDuplicate | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<MergePlan | null>(null);
  const [filterResolved, setFilterResolved] = useState<string>('all');
  const [executingPlanId, setExecutingPlanId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New Merge Plan Modal
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [planEntityType, setPlanEntityType] = useState('CUSTOMERS');
  const [planPrimaryId, setPlanPrimaryId] = useState('');
  const [planDuplicateId, setPlanDuplicateId] = useState('');
  const [creatingPlan, setCreatingPlan] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load duplicates
      const dupRes = await fetch('/api/data/duplicates');
      if (dupRes.ok) {
        const dupData = await dupRes.json();
        setDuplicates(dupData.items || []);
      }

      // Load merge plans
      const planRes = await fetch('/api/data/duplicates/merge-plans');
      if (planRes.ok) {
        const planData = await planRes.json();
        setMergePlans(planData.items || []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados de duplicidades:', err);
      setError(err.message || 'Falha ao buscar duplicidades e planos de mesclagem.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDuplicate = async (id: string, action: DuplicateStrategy) => {
    try {
      setResolvingId(id);
      const res = await fetch(`/api/data/duplicates/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Falha ao resolver duplicidade.');
      }
      setActionSuccess(`Duplicidade resolvida com estratégia: ${action}`);
      setTimeout(() => setActionSuccess(null), 4000);
      setSelectedDuplicate(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao resolver duplicidade.');
    } finally {
      setResolvingId(null);
    }
  };

  const handleExecuteMergePlan = async (planId: string) => {
    if (!confirm('Deseja realmente consolidar os registros deste plano de mesclagem? Todas as entidades vinculadas serão transferidas.')) {
      return;
    }
    try {
      setExecutingPlanId(planId);
      const res = await fetch(`/api/data/duplicates/merge-plans/${planId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Falha ao executar mesclagem.');
      }
      setActionSuccess('Plano de mesclagem executado com sucesso!');
      setTimeout(() => setActionSuccess(null), 4000);
      setSelectedPlan(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao executar mesclagem.');
    } finally {
      setExecutingPlanId(null);
    }
  };

  const handleCreateMergePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planPrimaryId || !planDuplicateId) {
      alert('Preencha os IDs principal e duplicado.');
      return;
    }
    try {
      setCreatingPlan(true);
      const res = await fetch('/api/data/duplicates/merge-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: planEntityType,
          primaryId: planPrimaryId,
          duplicateId: planDuplicateId
        })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Falha ao criar plano de mesclagem.');
      }
      setShowCreatePlanModal(false);
      setPlanPrimaryId('');
      setPlanDuplicateId('');
      setActionSuccess('Plano de mesclagem estruturado com sucesso.');
      setTimeout(() => setActionSuccess(null), 4000);
      await loadData();
      setActiveSubtab('MERGE_PLANS');
    } catch (err: any) {
      alert(err.message || 'Erro ao criar plano.');
    } finally {
      setCreatingPlan(false);
    }
  };

  const filteredDuplicates = duplicates.filter(d => {
    if (filterResolved === 'resolved') return d.resolved;
    if (filterResolved === 'pending') return !d.resolved;
    return true;
  });

  const getPlanStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3" /> Consolidado</span>;
      case 'WAITING_APPROVAL':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Requer Aprovação</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><Check className="w-3 h-3" /> Aprovado para Execução</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> Rejeitado</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Rascunho (Draft)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center justify-between text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 font-bold hover:text-emerald-900">&times;</button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-indigo-600" />
            Central de Duplicidades e Planos de Mesclagem
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Resolução de conflitos de chave única, desduplicação e consolidação de cadastros com reatribuição relacional segura.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={() => setShowCreatePlanModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
          >
            <GitMerge className="w-4 h-4" />
            Novo Plano de Mesclagem
          </button>
        </div>
      </div>

      {/* Subtabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubtab('CONFLICTS')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeSubtab === 'CONFLICTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Conflitos Detectados ({duplicates.filter(d => !d.resolved).length} pendentes)
        </button>
        <button
          onClick={() => setActiveSubtab('MERGE_PLANS')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeSubtab === 'MERGE_PLANS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Planos de Mesclagem Estruturados ({mergePlans.length})
        </button>
      </div>

      {/* SUBTAB 1: CONFLICTS */}
      {activeSubtab === 'CONFLICTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtrar status:</span>
              <select
                value={filterResolved}
                onChange={e => setFilterResolved(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
              >
                <option value="all">Todos ({duplicates.length})</option>
                <option value="pending">Pendentes ({duplicates.filter(d => !d.resolved).length})</option>
                <option value="resolved">Resolvidos ({duplicates.filter(d => d.resolved).length})</option>
              </select>
            </div>
            <span className="text-xs text-slate-500">Total: {filteredDuplicates.length} registros</span>
          </div>

          {filteredDuplicates.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
              <p className="font-semibold text-slate-800">Nenhum conflito de duplicidade pendente!</p>
              <p className="text-xs text-slate-500 mt-1">Todos os registros importados foram resolvidos ou não geraram colisão de chaves.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                    <th className="py-3 px-4">Linha</th>
                    <th className="py-3 px-4">Lote / Origem</th>
                    <th className="py-3 px-4">Campo Chave</th>
                    <th className="py-3 px-4">Valor em Conflito</th>
                    <th className="py-3 px-4">Estratégia Padrão</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredDuplicates.map(dup => (
                    <tr key={dup.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500 font-bold">#{dup.rowNumber}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 truncate max-w-[120px]">{dup.importId}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                          {dup.matchField}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{dup.matchValue}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono text-slate-600 bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                          {dup.strategy}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {dup.resolved ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <Check className="w-3 h-3" /> Resolvido ({dup.resolvedAction})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3" /> Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedDuplicate(dup)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition"
                        >
                          <Eye className="w-3 h-3" /> Analisar e Resolver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: MERGE PLANS */}
      {activeSubtab === 'MERGE_PLANS' && (
        <div className="space-y-4">
          {mergePlans.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              <GitMerge className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="font-semibold text-slate-800">Nenhum plano de mesclagem cadastrado</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Crie planos para transferir relacionamentos de registros duplicados com segurança.</p>
              <button
                onClick={() => setShowCreatePlanModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                <GitMerge className="w-4 h-4" /> Criar Plano de Mesclagem
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mergePlans.map(plan => (
                <div key={plan.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 hover:border-indigo-300 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{plan.entityType}</span>
                        {getPlanStatusBadge(plan.status)}
                      </div>
                      <span className="text-xs font-mono text-slate-400">ID: {plan.id}</span>
                    </div>
                    {plan.requiresApproval && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700 border border-amber-200">
                        <ShieldAlert className="w-3 h-3" /> Exige Aprovação
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg text-xs">
                    <div>
                      <span className="text-slate-500 block">ID Registro Principal:</span>
                      <span className="font-mono font-bold text-slate-800 truncate block">{plan.primaryId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ID Registro Duplicado:</span>
                      <span className="font-mono font-bold text-slate-800 truncate block">{plan.duplicateId}</span>
                    </div>
                  </div>

                  {/* Relations impact */}
                  <div>
                    <span className="text-xs font-semibold text-slate-600 block mb-1">Impacto nos Relacionamentos:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.reassignedRelations && plan.reassignedRelations.length > 0 ? (
                        plan.reassignedRelations.map((r, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                            {r.relationName}: <strong>{r.count}</strong>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sem entidades dependentes detectadas</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedPlan(plan)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver Detalhes
                    </button>

                    {plan.status !== 'COMPLETED' && plan.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleExecuteMergePlan(plan.id)}
                        disabled={executingPlanId === plan.id || plan.status === 'WAITING_APPROVAL'}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition ${
                          plan.status === 'WAITING_APPROVAL'
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                        title={plan.status === 'WAITING_APPROVAL' ? 'Requer aprovação prévia no fluxo de Governança' : 'Consolidar e transferir dados'}
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        {executingPlanId === plan.id ? 'Consolidando...' : 'Executar Consolidação'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ANALISAR E RESOLVER DUPLICIDADE */}
      {selectedDuplicate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900">Análise de Duplicidade — Linha #{selectedDuplicate.rowNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedDuplicate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                O valor <strong>"{selectedDuplicate.matchValue}"</strong> no campo <strong>"{selectedDuplicate.matchField}"</strong> coincide com uma entidade já cadastrada no banco de dados (ID: <span className="font-mono">{selectedDuplicate.existingEntityId}</span>).
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <span className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wide">Registro Existente no Banco</span>
                  <pre className="text-[11px] font-mono text-slate-800 bg-white p-2.5 rounded border border-slate-200 overflow-x-auto max-h-56">
                    {JSON.stringify(selectedDuplicate.existingData, null, 2)}
                  </pre>
                </div>
                <div className="border border-indigo-100 rounded-xl p-3 bg-indigo-50/50">
                  <span className="text-xs font-bold text-indigo-900 block mb-2 uppercase tracking-wide">Registro da Planilha (Entrada)</span>
                  <pre className="text-[11px] font-mono text-slate-800 bg-white p-2.5 rounded border border-indigo-200 overflow-x-auto max-h-56">
                    {JSON.stringify(selectedDuplicate.incomingData, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Resolution options */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-700 block">Escolha a Estratégia de Resolução:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleResolveDuplicate(selectedDuplicate.id, 'UPDATE')}
                    disabled={resolvingId === selectedDuplicate.id}
                    className="p-3 text-left border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 transition text-xs space-y-1"
                  >
                    <span className="font-bold text-slate-900 block">Atualizar (UPDATE)</span>
                    <span className="text-slate-500 text-[11px] block">Atualiza o registro do banco com os dados desta planilha.</span>
                  </button>

                  <button
                    onClick={() => handleResolveDuplicate(selectedDuplicate.id, 'IGNORE')}
                    disabled={resolvingId === selectedDuplicate.id}
                    className="p-3 text-left border border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition text-xs space-y-1"
                  >
                    <span className="font-bold text-slate-900 block">Ignorar Linha (IGNORE)</span>
                    <span className="text-slate-500 text-[11px] block">Mantém o cadastro existente intacto e descarta este item.</span>
                  </button>

                  <button
                    onClick={() => handleResolveDuplicate(selectedDuplicate.id, 'CREATE_NEW')}
                    disabled={resolvingId === selectedDuplicate.id}
                    className="p-3 text-left border border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50/30 transition text-xs space-y-1"
                  >
                    <span className="font-bold text-emerald-900 block">Criar Novo (CREATE_NEW)</span>
                    <span className="text-slate-500 text-[11px] block">Insere como nova entidade gerando novo ID interno.</span>
                  </button>


                  <button
                    onClick={() => {
                      setPlanEntityType('CUSTOMERS');
                      setPlanPrimaryId(selectedDuplicate.existingEntityId);
                      setPlanDuplicateId(`incoming_row_${selectedDuplicate.rowNumber}`);
                      setSelectedDuplicate(null);
                      setShowCreatePlanModal(true);
                    }}
                    className="p-3 text-left border border-indigo-200 bg-indigo-50/50 rounded-xl hover:bg-indigo-100/60 transition text-xs space-y-1"
                  >
                    <span className="font-bold text-indigo-900 block flex items-center gap-1">
                      <GitMerge className="w-3.5 h-3.5" /> Criar Plano de Mesclagem
                    </span>
                    <span className="text-indigo-700 text-[11px] block">Estruturar mesclagem com reatribuição de histórico relacional.</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedDuplicate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER DETALHES DO PLANO DE MESCLAGEM */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Plano de Mesclagem #{selectedPlan.id}</h3>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-semibold block">Entidade Alvo:</span>
                  <span className="font-bold text-slate-900">{selectedPlan.entityType}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Status Atual:</span>
                  <div>{getPlanStatusBadge(selectedPlan.status)}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-700 font-bold block mb-1">Relacionamentos Reatribuídos:</span>
                <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-slate-50 p-2 space-y-1">
                  {selectedPlan.reassignedRelations.map((r, i) => (
                    <li key={i} className="flex justify-between py-1 text-slate-800">
                      <span>{r.relationName}</span>
                      <span className="font-bold font-mono">{r.count} registros</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-slate-700 font-bold block mb-1">Dados Finais Consolidados:</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto max-h-48">
                  {JSON.stringify(selectedPlan.mergedData, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setSelectedPlan(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR PLANO DE MESCLAGEM */}
      {showCreatePlanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <form onSubmit={handleCreateMergePlan}>
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900">Novo Plano de Mesclagem</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreatePlanModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo de Entidade</label>
                  <select
                    value={planEntityType}
                    onChange={e => setPlanEntityType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="CUSTOMERS">Clientes (CUSTOMERS)</option>
                    <option value="SUPPLIERS">Fornecedores (SUPPLIERS)</option>
                    <option value="EVENTS">Eventos (EVENTS)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ID do Registro Principal (Destino)</label>
                  <input
                    type="text"
                    value={planPrimaryId}
                    onChange={e => setPlanPrimaryId(e.target.value)}
                    placeholder="ex: cust_123456"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Este registro continuará ativo e receberá todos os dados e vínculos.</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ID do Registro Duplicado (Origem)</label>
                  <input
                    type="text"
                    value={planDuplicateId}
                    onChange={e => setPlanDuplicateId(e.target.value)}
                    placeholder="ex: cust_987654"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Este registro será arquivado após a migração de suas dependências.</span>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePlanModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingPlan}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {creatingPlan ? 'Criando...' : 'Criar Plano de Mesclagem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
