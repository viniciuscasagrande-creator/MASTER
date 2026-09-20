import React, { useEffect, useState } from 'react';
import {
  FileDiff,
  Plus,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Ban
} from 'lucide-react';
import { EventChangeRequestDTO, EventChangeRequestStatus } from '@shared/types/index';
import { fetchEventChanges, fetchEventChangeById } from '../api/changes.api';
import { ChangeRequestDetailsModal } from './ChangeRequestDetailsModal';
import { CreateChangeRequestModal } from './CreateChangeRequestModal';

interface EventChangeManagementPageProps {
  eventId: string;
  eventName: string;
}

export const EventChangeManagementPage: React.FC<EventChangeManagementPageProps> = ({
  eventId,
  eventName
}) => {
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState<EventChangeRequestDTO[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'EXECUTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedChange, setSelectedChange] = useState<EventChangeRequestDTO | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadChanges = async () => {
    try {
      setLoading(true);
      const data = await fetchEventChanges(eventId);
      setChanges(data);
    } catch (err) {
      console.error('Erro ao carregar alterações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChanges();
  }, [eventId]);

  const handleOpenDetails = async (change: EventChangeRequestDTO) => {
    try {
      const fullChange = await fetchEventChangeById(eventId, change.id);
      setSelectedChange(fullChange);
      setIsDetailsModalOpen(true);
    } catch (err) {
      setSelectedChange(change);
      setIsDetailsModalOpen(true);
    }
  };

  const filteredChanges = changes.filter((c) => {
    const matchesSearch =
      c.publicCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.changeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.reason.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'PENDING') {
      return c.status === 'APPROVAL_PENDING' || c.status === 'READY_FOR_SUBMISSION';
    }
    if (activeTab === 'APPROVED') {
      return c.status === 'APPROVED';
    }
    if (activeTab === 'EXECUTED') {
      return c.status === 'EXECUTED';
    }
    return true;
  });

  const pendingApprovalCount = changes.filter((c) => c.status === 'APPROVAL_PENDING').length;
  const readyExecutionCount = changes.filter((c) => c.status === 'APPROVED' || c.status === 'READY_FOR_SUBMISSION').length;
  const executedCount = changes.filter((c) => c.status === 'EXECUTED').length;

  const getStatusBadge = (status: EventChangeRequestStatus) => {
    switch (status) {
      case 'EXECUTED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">EXECUTADA</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">APROVADA</span>;
      case 'APPROVAL_PENDING':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">APROVAÇÃO PENDENTE</span>;
      case 'READY_FOR_SUBMISSION':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">PRONTA P/ SUBMISSÃO</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">REJEITADA</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">CANCELADA</span>;
      case 'STALE':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">DESATUALIZADA</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300">RASCUNHO</span>;
    }
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'POST_SALES_CRITICAL':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">PÓS-VENDA CRÍTICA</span>;
      case 'PUBLICATION_CRITICAL':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">CRÍTICA DE PUBLICAÇÃO</span>;
      case 'REVIEW_INVALIDATING':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">INVALIDA REVISÃO</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">NÃO CRÍTICA</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <FileDiff className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Central de Alterações Controladas</h2>
          </div>
          <p className="text-xs text-slate-400">
            Governança rigorosa de alterações estruturais com análise de impacto em tempo real e esteira de aprovação.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-blue-900/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova Solicitação de Alteração
        </button>
      </div>

      {/* KPI Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 mb-1">Total de Solicitações</div>
          <div className="text-2xl font-bold text-white">{changes.length}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-purple-400 mb-1">Aprovação Pendente</div>
          <div className="text-2xl font-bold text-purple-300">{pendingApprovalCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-blue-400 mb-1">Prontas para Execução</div>
          <div className="text-2xl font-bold text-blue-300">{readyExecutionCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-emerald-400 mb-1">Alterações Executadas</div>
          <div className="text-2xl font-bold text-emerald-300">{executedCount}</div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs de Filtro */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todas ({changes.length})
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'PENDING'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Pendentes ({pendingApprovalCount + readyExecutionCount})
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'APPROVED'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Aprovadas ({readyExecutionCount})
          </button>
          <button
            onClick={() => setActiveTab('EXECUTED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'EXECUTED'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Executadas ({executedCount})
          </button>
        </div>

        {/* Campo de Busca */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ALT-XXXXXX ou motivo..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Listagem de Solicitações */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <RotateCw className="w-6 h-6 animate-spin mr-3 text-blue-500" />
          Carregando solicitações de alteração...
        </div>
      ) : filteredChanges.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <FileCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">Nenhuma solicitação de alteração encontrada</h3>
          <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
            Todas as configurações do evento estão estáveis e aprovadas. Crie uma solicitação para propor ajustes controlados.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
          >
            Criar Solicitação
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Tipo & Classificação</th>
                  <th className="py-3 px-4">Motivo da Alteração</th>
                  <th className="py-3 px-4">Impacto Estimado</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Solicitado em</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredChanges.map((change) => (
                  <tr
                    key={change.id}
                    onClick={() => handleOpenDetails(change)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                      {change.publicCode}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{change.changeType}</div>
                      <div className="mt-1">{getClassificationBadge(change.classification)}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-300">
                      {change.reason}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {change.impact ? (
                        <div className="text-[11px] text-slate-400 space-y-0.5">
                          <div>
                            <span className="text-white font-semibold">{change.impact.affectedTickets}</span> ingressos
                          </div>
                          <div>
                            R$ {(change.impact.financialAmount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(change.status)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap font-mono">
                      {new Date(change.requestedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button className="p-1 text-slate-400 hover:text-white">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalhes, Impacto e Aprovação */}
      <ChangeRequestDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        changeRequest={selectedChange}
        eventId={eventId}
        onUpdated={() => {
          setIsDetailsModalOpen(false);
          loadChanges();
        }}
      />

      {/* Modal de Nova Solicitação de Alteração */}
      <CreateChangeRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        eventId={eventId}
        onCreated={loadChanges}
      />
    </div>
  );
};
