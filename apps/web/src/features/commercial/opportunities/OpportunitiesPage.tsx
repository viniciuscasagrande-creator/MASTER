import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Search,
  Plus,
  LayoutGrid,
  List,
  RefreshCw,
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight
} from 'lucide-react';
import {
  CommercialOpportunityDTO,
  CommercialOpportunityMetricsDTO,
  CommercialPipelineDTO,
  CommercialPipelineStageDTO,
  OpportunityCloseReasonDTO
} from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { StatCard } from '../../../shared/components/StatCard';
import { Modal } from '../../../shared/components/Modal';
import { CommercialPipelineBoard } from '../pipeline/CommercialPipelineBoard';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';

interface OpportunitiesPageProps {
  onSelectOpportunity: (opportunityId: string) => void;
  onSelectProducer?: (producerId: string) => void;
}

export const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({
  onSelectOpportunity,
  onSelectProducer
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Pipeline and stages
  const [pipelines, setPipelines] = useState<CommercialPipelineDTO[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [stages, setStages] = useState<CommercialPipelineStageDTO[]>([]);
  const [closeReasons, setCloseReasons] = useState<OpportunityCloseReasonDTO[]>([]);

  // Opportunities and metrics
  const [opportunities, setOpportunities] = useState<CommercialOpportunityDTO[]>([]);
  const [metrics, setMetrics] = useState<CommercialOpportunityMetricsDTO | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('');

  // Modal: Nova Oportunidade
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    producerId: '',
    businessType: 'NOVO_EVENTO',
    estimatedValue: '',
    expectedDecisionAt: '',
    description: ''
  });

  const loadBaseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pipRes, reasonRes] = await Promise.all([
        CommercialApi.listPipelines(),
        CommercialApi.listCloseReasons()
      ]);
      setPipelines(pipRes);
      setCloseReasons(reasonRes);

      const defaultPip = pipRes.find((p) => p.isDefault) || pipRes[0];
      if (defaultPip) {
        setSelectedPipelineId(defaultPip.id);
        const stageRes = await CommercialApi.listStages(defaultPip.id);
        setStages(stageRes);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar estrutura do pipeline.');
    } finally {
      setLoading(false);
    }
  };

  const loadOpportunitiesAndMetrics = async () => {
    if (!selectedPipelineId) return;
    try {
      const [oppRes, metricRes] = await Promise.all([
        CommercialApi.listOpportunities({
          pipelineId: selectedPipelineId,
          stageId: stageFilter || undefined,
          search: search.trim() || undefined
        }),
        CommercialApi.getOpportunityMetrics(selectedPipelineId)
      ]);
      setOpportunities(oppRes || []);
      setMetrics(metricRes);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar oportunidades.');
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    if (selectedPipelineId) {
      loadOpportunitiesAndMetrics();
    }
  }, [selectedPipelineId, stageFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOpportunitiesAndMetrics();
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      setCreateError('O título da oportunidade é obrigatório.');
      return;
    }
    try {
      setCreateLoading(true);
      setCreateError(null);
      const estVal = createForm.estimatedValue
        ? parseFloat(createForm.estimatedValue.replace(/\./g, '').replace(',', '.'))
        : undefined;

      await CommercialApi.createOpportunity({
        title: createForm.title.trim(),
        pipelineId: selectedPipelineId,
        producerId: createForm.producerId.trim() || undefined,
        typeId: createForm.businessType,
        estimatedValue: estVal,
        expectedDecisionAt: createForm.expectedDecisionAt
          ? new Date(createForm.expectedDecisionAt).toISOString()
          : undefined,
        description: createForm.description.trim() || undefined
      });

      setCreateModalOpen(false);
      setCreateForm({
        title: '',
        producerId: '',
        businessType: 'NOVO_EVENTO',
        estimatedValue: '',
        expectedDecisionAt: '',
        description: ''
      });
      loadOpportunitiesAndMetrics();
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao criar oportunidade.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-orange-500" />
              CENTRAL DE OPORTUNIDADES & PIPELINE
            </h1>
            <Badge variant="orange" size="sm">Funil B2B</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão visual do funil comercial, transição de estágios com concorrência otimista e motivos auditáveis
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Visualização em Quadro Kanban"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Quadro</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Visualização em Tabela / Lista"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadOpportunitiesAndMetrics}
            icon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Nova Oportunidade
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total Abertas"
          value={metrics?.totalOpen || 0}
          subtitle="Negociações ativas"
          icon={<TrendingUp className="h-4 w-4 text-orange-500" />}
        />
        <StatCard
          title="Em Negociação"
          value={metrics?.inNegotiation || 0}
          subtitle="Propostas e contratos"
          icon={<Clock className="h-4 w-4 text-cyan-500" />}
        />
        <StatCard
          title="Sem Próxima Ação"
          value={metrics?.withoutNextAction || 0}
          subtitle="Sem agendamento"
          badgeVariant={metrics && metrics.withoutNextAction > 0 ? 'amber' : 'slate'}
          icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
        />
        <StatCard
          title="Ações Vencidas"
          value={metrics?.overdueActions || 0}
          subtitle="Atrasadas no prazo"
          badgeVariant={metrics && metrics.overdueActions > 0 ? 'rose' : 'emerald'}
          icon={<XCircle className="h-4 w-4 text-rose-500" />}
        />
        <StatCard
          title="Ganhas no Período"
          value={metrics?.wonInPeriod || 0}
          subtitle="Negociações fechadas"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          badgeVariant="emerald"
        />
        <StatCard
          title="Ciclo Médio"
          value={metrics?.averageCycleDurationDays ? `${metrics.averageCycleDurationDays}d` : '—'}
          subtitle="Tempo médio de ciclo"
          icon={<Calendar className="h-4 w-4 text-slate-500" />}
        />
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, código (OPC-...) ou produtor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <select
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              aria-label="Selecionar Funil Comercial"
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-orange-500 focus:bg-white"
            >
              {pipelines.map((pip) => (
                <option key={pip.id} value={pip.id}>
                  {pip.name}
                </option>
              ))}
            </select>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              aria-label="Filtrar por Estágio do Pipeline"
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-orange-500 focus:bg-white"
            >
              <option value="">Todos os Estágios</option>
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>

            <Button type="submit" variant="secondary" size="sm">
              Filtrar
            </Button>
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content: Kanban or Table */}
      {viewMode === 'kanban' ? (
        <CommercialPipelineBoard
          stages={stages}
          opportunities={opportunities}
          closeReasons={closeReasons}
          onSelectOpportunity={onSelectOpportunity}
          onRefresh={loadOpportunitiesAndMetrics}
        />
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Título & Oportunidade</th>
                  <th className="px-4 py-3">Produtor / Prospecção</th>
                  <th className="px-4 py-3">Estágio</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Valor Estimado</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Próxima Ação</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      Nenhuma oportunidade encontrada no pipeline selecionado.
                    </td>
                  </tr>
                ) : (
                  opportunities.map((opp) => {
                    const isActionOverdue =
                      opp.nextActionAt && new Date(opp.nextActionAt) < new Date();

                    return (
                      <tr
                        key={opp.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => onSelectOpportunity(opp.id)}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-orange-600 dark:text-orange-400">
                          {opp.publicCode}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {opp.title}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {opp.producerName || opp.leadCompanyName || 'Prospecção'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="cyan" size="sm">
                            {opp.stageName || 'Estágio'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              opp.status === 'WON'
                                ? 'emerald'
                                : opp.status === 'CLOSED'
                                ? 'rose'
                                : 'amber'
                            }
                            size="sm"
                          >
                            {opp.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {opp.estimatedValue ? formatCurrency(opp.estimatedValue) : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {opp.ownerName || 'Não atribuído'}
                        </td>
                        <td className="px-4 py-3">
                          {opp.nextActionAt ? (
                            <span
                              className={`font-mono text-xs ${
                                isActionOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {formatDate(opp.nextActionAt)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectOpportunity(opp.id);
                            }}
                            icon={<ChevronRight className="h-3.5 w-3.5" />}
                          >
                            Detalhes
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Nova Oportunidade */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-orange-500" />
            <span className="text-slate-900 dark:text-white">Criar Nova Oportunidade no Funil</span>
          </div>
        }
        size="lg"
      >
        <form onSubmit={handleCreateOpportunity} className="space-y-4">
          {createError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Título da Negociação <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              required
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="Ex: Festival de Rock 2026 - Exclusividade de Bilheteria"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                ID do Produtor (Opcional)
              </label>
              <input
                type="text"
                value={createForm.producerId}
                onChange={(e) => setCreateForm({ ...createForm, producerId: e.target.value })}
                placeholder="Ex: prd_100 ou deixe em branco"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Negócio
              </label>
              <select
                value={createForm.businessType}
                onChange={(e) => setCreateForm({ ...createForm, businessType: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 focus:bg-white"
              >
                <option value="NOVO_EVENTO">Novo Evento</option>
                <option value="RENOVACAO">Renovação Contratual</option>
                <option value="EXCLUSIVIDADE">Exclusividade de Praça</option>
                <option value="UPSELL">Upsell de Serviços</option>
                <option value="RECUPERACAO">Recuperação de Produtor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Valor Estimado de Venda (R$)
              </label>
              <input
                type="text"
                value={createForm.estimatedValue}
                onChange={(e) => setCreateForm({ ...createForm, estimatedValue: e.target.value })}
                placeholder="Ex: 500.000,00"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Data Prevista de Decisão
              </label>
              <input
                type="date"
                value={createForm.expectedDecisionAt}
                onChange={(e) => setCreateForm({ ...createForm, expectedDecisionAt: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 focus:bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contexto e Escopo
            </label>
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Descreva particularidades do evento, praça pretendida, estimativa de público..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createLoading}
            >
              Criar Oportunidade
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
