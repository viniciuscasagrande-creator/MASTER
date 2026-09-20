import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  RefreshCw,
  Edit2,
  Trash2,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import {
  TicketBatchDTO,
  TicketBatchStatus,
  CreateTicketBatchInput,
  UpdateTicketBatchInput
} from '@shared/types/index';
import {
  fetchBatches,
  createBatch,
  updateBatch,
  transitionBatchStatus,
  deleteBatch
} from '../api/batches.api';
import { StatCard } from '../../../shared/components/StatCard';
import { Badge } from '../../../shared/components/Badge';
import { formatNumber, formatDateTime } from '../../../shared/utils/formatters';
import { CreateBatchModal } from './CreateBatchModal';

interface EventBatchesPageProps {
  eventId: string;
  eventName?: string;
  onNavigateToPricing?: (batchId?: string) => void;
  onNavigateToTickets?: () => void;
}

const STATUS_CONFIG: Record<TicketBatchStatus, { label: string; bg: string; text: string; border: string }> = {
  ACTIVE: { label: 'Ativo (Em Venda)', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  SOLD_OUT: { label: 'Esgotado', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  SCHEDULED: { label: 'Agendado', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  PAUSED: { label: 'Pausado', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  DRAFT: { label: 'Rascunho', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
  ENDED: { label: 'Encerrado', bg: 'bg-slate-800', text: 'text-slate-500', border: 'border-slate-700' },
  ARCHIVED: { label: 'Arquivado', bg: 'bg-slate-900', text: 'text-slate-600', border: 'border-slate-800' }
};

export const EventBatchesPage: React.FC<EventBatchesPageProps> = ({
  eventId,
  eventName,
  onNavigateToPricing,
  onNavigateToTickets
}) => {
  const [batches, setBatches] = useState<TicketBatchDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState<TicketBatchDTO | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await fetchBatches(eventId);
      setBatches(list);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lotes');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateOrUpdate = async (input: CreateTicketBatchInput) => {
    if (batchToEdit) {
      await updateBatch(eventId, batchToEdit.id, input);
    } else {
      await createBatch(eventId, input);
    }
    await loadData();
  };

  const handleTransitionStatus = async (batchId: string, status: TicketBatchStatus) => {
    try {
      await transitionBatchStatus(eventId, batchId, status);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status do lote');
    }
  };

  const handleDelete = async (batch: TicketBatchDTO) => {
    if (!window.confirm(`Deseja realmente excluir o ${batch.name}?`)) return;

    try {
      await deleteBatch(eventId, batch.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir lote');
    }
  };

  const activeBatch = batches.find(b => b.status === 'ACTIVE');
  const totalSold = batches.reduce((sum, b) => sum + (b.soldCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-400 font-medium mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Fase 1.2.6 — Estratégia de Venda & Lotes</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            Lotes Comerciais
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {eventName ? `Evento: ${eventName}` : 'Sequência temporal de preços e ativação automática por demanda'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToPricing && (
            <button
              onClick={() => onNavigateToPricing()}
              className="px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5 text-brand-400" />
              <span>Matriz de Preços</span>
            </button>
          )}
          <button
            onClick={() => { setBatchToEdit(null); setModalOpen(true); }}
            className="px-4 py-2 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lote</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Total de Lotes"
          value={batches.length}
          subtitle="Fases comerciais criadas"
          icon={<Layers className="w-4 h-4 text-orange-400" />}
        />
        <StatCard
          title="Lote em Venda"
          value={activeBatch ? activeBatch.name : 'Nenhum ativo'}
          subtitle={activeBatch ? `${activeBatch.soldCount} ingressos vendidos` : 'Vendas pausadas'}
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          title="Total Vendido em Lotes"
          value={formatNumber(totalSold)}
          subtitle="Ingressos processados"
          icon={<CheckCircle2 className="w-4 h-4 text-cyan-400" />}
        />
        <StatCard
          title="Sequência Automática"
          value="Ativa"
          subtitle="Gatilhos por data e estoque"
          icon={<Clock className="w-4 h-4 text-purple-400" />}
        />
      </div>

      {/* Batches Timeline & Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Sequência de Lotes do Evento
        </h2>

        {batches.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/30 border border-slate-800 rounded-2xl">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-slate-300">Nenhum lote cadastrado</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Crie o Lote 1 para começar a definir os preços de venda para cada setor.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch, idx) => {
              const statusCfg = STATUS_CONFIG[batch.status] || STATUS_CONFIG.DRAFT;
              const hasLimit = batch.totalQuantityLimit && batch.totalQuantityLimit > 0;
              const progressPct = hasLimit ? Math.min(100, Math.round(((batch.soldCount || 0) / batch.totalQuantityLimit!) * 100)) : 0;

              return (
                <div
                  key={batch.id}
                  className={`bg-slate-900/70 border rounded-2xl p-5 transition-all shadow-md ${
                    batch.status === 'ACTIVE'
                      ? 'border-emerald-500/40 bg-emerald-500/[0.02]'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-200 text-sm border border-slate-700/60 flex-shrink-0">
                        #{batch.phase}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-slate-100">{batch.name}</h3>
                          <span className="text-xs font-mono text-slate-400">({batch.code})</span>
                          <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                            {statusCfg.label}
                          </span>
                        </div>

                        {/* Activation Info */}
                        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            Gatilho:{' '}
                            <strong className="text-slate-300">
                              {batch.activationType === 'MANUAL' ? 'Abertura Manual' :
                               batch.activationType === 'DATE_TIME' ? `Agendado para ${batch.activationDate ? formatDateTime(batch.activationDate) : 'data indefinida'}` :
                               batch.activationType === 'PREVIOUS_BATCH_SOLD_OUT' ? `Ao esgotar ${batch.previousBatchName || 'lote anterior'}` :
                               `Ao atingir ${batch.triggerQuantity} vendas no ${batch.previousBatchName || 'lote anterior'}`}
                            </strong>
                          </span>

                          <span>•</span>

                          <span>
                            Preços Configurados:{' '}
                            <strong className="text-slate-300">{batch.pricesCount || 0} setores/modalidades</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Progress if limit */}
                    {hasLimit && (
                      <div className="w-full lg:w-64 space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Vendas do Lote</span>
                          <span className="font-semibold text-slate-200">
                            {formatNumber(batch.soldCount)} / {formatNumber(batch.totalQuantityLimit!)} ({progressPct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            style={{ width: `${progressPct}%` }}
                            className={`h-full transition-all ${batch.status === 'SOLD_OUT' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {batch.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleTransitionStatus(batch.id, 'PAUSED')}
                          className="px-3 py-1.5 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pausar</span>
                        </button>
                      )}

                      {batch.status === 'PAUSED' && (
                        <button
                          onClick={() => handleTransitionStatus(batch.id, 'ACTIVE')}
                          className="px-3 py-1.5 text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Retomar</span>
                        </button>
                      )}

                      {(batch.status === 'DRAFT' || batch.status === 'SCHEDULED') && (
                        <button
                          onClick={() => handleTransitionStatus(batch.id, 'ACTIVE')}
                          className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Ativar Agora</span>
                        </button>
                      )}

                      {onNavigateToPricing && (
                        <button
                          onClick={() => onNavigateToPricing(batch.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
                          title="Abrir tabela de preços deste lote"
                        >
                          <DollarSign className="w-3.5 h-3.5 text-brand-400" />
                          <span>Preços</span>
                        </button>
                      )}

                      <button
                        onClick={() => { setBatchToEdit(batch); setModalOpen(true); }}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                        title="Editar configurações"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {batch.soldCount === 0 && (
                        <button
                          onClick={() => handleDelete(batch)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                          title="Excluir lote sem vendas"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal */}
      {modalOpen && (
        <CreateBatchModal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreateOrUpdate}
          existingBatches={batches}
          batchToEdit={batchToEdit}
        />
      )}
    </div>
  );
};
