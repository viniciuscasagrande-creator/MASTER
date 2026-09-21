import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Clock,
  Send,
  CheckCircle2,
  TrendingUp,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Building2,
  Calendar,
  Layers,
  FileSignature
} from 'lucide-react';
import {
  CommercialProposalDTO,
  CommercialProposalMetricsDTO,
  CommercialProposalStatus
} from '@shared/types/index';
import { CommercialApi } from '../api/commercial.api';
import { ProposalStatusBadge } from './ProposalStatusBadge';
import { ProposalCreateModal } from './ProposalCreateModal';
import { SendProposalModal, AcceptProposalModal } from './ProposalActionModals';
import { StatCard } from '../../../shared/components/StatCard';
import { Button } from '../../../shared/components/Button';
import { formatDate } from '../../../shared/utils/formatters';

interface ProposalsPageProps {
  onSelectProposal: (proposalId: string) => void;
  onSelectProducer?: (producerId: string) => void;
  onSelectOpportunity?: (opportunityId: string) => void;
  onGenerateContract?: (proposalId: string) => void;
}

type TabType = 'ALL' | 'MINE' | 'PENDING_APPROVAL' | 'SENT' | 'ACCEPTED' | 'DRAFTS';

export const ProposalsPage: React.FC<ProposalsPageProps> = ({
  onSelectProposal,
  onSelectProducer,
  onSelectOpportunity,
  onGenerateContract
}) => {
  const [proposals, setProposals] = useState<CommercialProposalDTO[]>([]);
  const [metrics, setMetrics] = useState<CommercialProposalMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [proposalToSend, setProposalToSend] = useState<CommercialProposalDTO | null>(null);
  const [proposalToAccept, setProposalToAccept] = useState<CommercialProposalDTO | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build status filter based on tab if not overridden
      let effectiveStatus = statusFilter;
      let pendingApproval = false;

      if (activeTab === 'PENDING_APPROVAL') {
        pendingApproval = true;
      } else if (activeTab === 'SENT') {
        effectiveStatus = 'SENT';
      } else if (activeTab === 'ACCEPTED') {
        effectiveStatus = 'ACCEPTED';
      } else if (activeTab === 'DRAFTS') {
        effectiveStatus = 'DRAFT';
      }

      const [proposalsRes, metricsRes] = await Promise.all([
        CommercialApi.listProposals({
          search: search.trim() || undefined,
          status: effectiveStatus !== 'ALL' ? effectiveStatus : undefined,
          pendingApproval: pendingApproval || undefined,
          page,
          limit
        }),
        CommercialApi.getProposalMetrics().catch(() => null)
      ]);

      setProposals(proposalsRes.data);
      setTotal(proposalsRes.total);
      if (metricsRes) {
        setMetrics(metricsRes);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar propostas comerciais.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, statusFilter, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
    if (tab === 'ALL') {
      setStatusFilter('ALL');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const formatModel = (model?: string) => {
    switch (model) {
      case 'PERCENTAGE': return 'Percentual';
      case 'FIXED_PER_TICKET': return 'Fixo por Ingresso';
      case 'FIXED_PER_EVENT': return 'Fixo por Evento';
      case 'TIERED': return 'Escalonado';
      case 'HYBRID': return 'Misto / Híbrido';
      default: return model || 'Geral';
    }
  };

  const isExpiringSoon = (validUntil?: string) => {
    if (!validUntil) return false;
    const diffDays = Math.ceil((new Date(validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 5;
  };

  const isExpired = (validUntil?: string, status?: string) => {
    if (status === 'EXPIRED') return true;
    if (!validUntil) return false;
    return new Date(validUntil).getTime() < new Date().getTime();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Propostas Comerciais</h1>
            <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold text-orange-600 dark:text-orange-400 border border-orange-500/20">
              B2B Produtores
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Formalização de condições comerciais com produtores, governança de alçadas e versionamento imutável.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData()}
            icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
          >
            Nova Proposta
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total de Propostas"
            value={metrics.totalProposals}
            subtitle="Todas as propostas criadas"
            icon={<FileText className="h-5 w-5 text-slate-500" />}
            badgeVariant="slate"
          />

          <StatCard
            title="Aguardando Alçada"
            value={metrics.pendingApprovalCount}
            subtitle="Necessitam aprovação de alçada"
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            badge={metrics.pendingApprovalCount > 0 ? 'Ação requerida' : undefined}
            badgeVariant="amber"
          />

          <StatCard
            title="Enviadas ao Produtor"
            value={metrics.sentCount}
            subtitle="Em análise pelo cliente B2B"
            icon={<Send className="h-5 w-5 text-cyan-500" />}
            badgeVariant="cyan"
          />

          <StatCard
            title="Aceitas Formalmente"
            value={metrics.acceptedCount}
            subtitle="Prontas para contrato"
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            badgeVariant="emerald"
          />

          <StatCard
            title="Taxa de Conversão"
            value={metrics.acceptanceRatePercent !== undefined ? `${metrics.acceptanceRatePercent}%` : '0%'}
            subtitle="Aceite sobre enviadas"
            icon={<TrendingUp className="h-5 w-5 text-orange-500" />}
            badgeVariant="orange"
          />
        </div>
      )}

      {/* Main Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 pt-3 flex flex-wrap gap-2">
          <button
            onClick={() => handleTabChange('ALL')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ALL'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Todas as Propostas
          </button>
          <button
            onClick={() => handleTabChange('PENDING_APPROVAL')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'PENDING_APPROVAL'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Aguardando Alçada
            {metrics?.pendingApprovalCount ? (
              <span className="rounded-full bg-amber-100 dark:bg-amber-500/20 px-2 py-0.2 text-xs font-bold text-amber-700 dark:text-amber-300">
                {metrics.pendingApprovalCount}
              </span>
            ) : null}
          </button>
          <button
            onClick={() => handleTabChange('SENT')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'SENT'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Enviadas ao Produtor
          </button>
          <button
            onClick={() => handleTabChange('ACCEPTED')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ACCEPTED'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Aceitas Formalmente
          </button>
          <button
            onClick={() => handleTabChange('DRAFTS')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'DRAFTS'
                ? 'border-slate-500 text-slate-800 dark:text-slate-200 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Rascunhos / Em Negociação
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código (PROP-...), produtor, objeto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {activeTab === 'ALL' && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filtrar por Status"
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:bg-white"
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="DRAFT">Rascunho (DRAFT)</option>
                  <option value="APPROVAL_PENDING">Aguardando Alçada</option>
                  <option value="APPROVED">Aprovada Internamente</option>
                  <option value="READY_TO_SEND">Pronta para Envio</option>
                  <option value="SENT">Enviada ao Produtor</option>
                  <option value="ACCEPTED">Aceita (ACCEPTED)</option>
                  <option value="DECLINED">Recusada (DECLINED)</option>
                  <option value="EXPIRED">Expirada (EXPIRED)</option>
                  <option value="CANCELLED">Cancelada (CANCELLED)</option>
                </select>
              </div>
            )}

            <span className="text-xs text-slate-500 dark:text-slate-400">
              {total} {total === 1 ? 'proposta encontrada' : 'propostas encontradas'}
            </span>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="m-4 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Table Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mb-3" />
            <p className="text-sm">Carregando propostas comerciais...</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FileText className="h-12 w-12 mx-auto mb-3 text-slate-600" />
            <p className="text-base font-semibold text-slate-300">Nenhuma proposta encontrada</p>
            <p className="text-xs mt-1 text-slate-500">
              Ajuste os filtros ou crie uma nova proposta comercial para um produtor.
            </p>
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Nova Proposta
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-bold">Código / Versão</th>
                  <th className="px-5 py-3 font-bold">Produtor</th>
                  <th className="px-5 py-3 font-bold">Objeto / Oportunidade</th>
                  <th className="px-5 py-3 font-bold">Modelo</th>
                  <th className="px-5 py-3 font-bold">Validade</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {proposals.map((proposal) => {
                  const currentVer = proposal.currentVersion;
                  const validUntil = currentVer?.validUntil || proposal.validUntil;
                  const expiring = isExpiringSoon(validUntil);
                  const expired = isExpired(validUntil, proposal.status);

                  return (
                    <tr
                      key={proposal.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                      onClick={() => onSelectProposal(proposal.id)}
                    >
                      {/* Código e Versão */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {proposal.publicCode}
                          </span>
                          <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            v{proposal.currentVersionNumber || currentVer?.versionNumber || 1}
                          </span>
                        </div>
                        {currentVer?.contentHash && (
                          <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[140px]" title={currentVer.contentHash}>
                            sha: {currentVer.contentHash.slice(0, 10)}...
                          </div>
                        )}
                      </td>

                      {/* Produtor */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                          <div>
                            <p
                              className="font-medium text-slate-800 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
                              onClick={(e) => {
                                if (onSelectProducer) {
                                  e.stopPropagation();
                                  onSelectProducer(proposal.producerId);
                                }
                              }}
                            >
                              {proposal.producerName || 'Produtor B2B'}
                            </p>
                            {(proposal as any).producerDocument && (
                              <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{(proposal as any).producerDocument}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Objeto / Oportunidade */}
                      <td className="px-5 py-4">
                        <div className="max-w-xs">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate" title={proposal.title}>
                            {proposal.title}
                          </p>
                          {proposal.opportunityTitle && (
                            <p
                              className="text-xs text-orange-600 dark:text-orange-400 truncate hover:underline cursor-pointer"
                              onClick={(e) => {
                                if (onSelectOpportunity && proposal.opportunityId) {
                                  e.stopPropagation();
                                  onSelectOpportunity(proposal.opportunityId);
                                }
                              }}
                            >
                              🎯 Op: {proposal.opportunityTitle}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Modelo Comercial */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                        <span className="rounded bg-slate-100 dark:bg-slate-800/80 px-2 py-1 border border-slate-200 dark:border-slate-700/60 font-medium text-slate-700 dark:text-slate-300">
                          {formatModel(currentVer?.commercialModel || 'STANDARD')}
                        </span>
                      </td>

                      {/* Validade */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs">
                        {validUntil ? (
                          <div>
                            <span className={expired ? 'text-rose-600 dark:text-rose-400 font-bold' : expiring ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-700 dark:text-slate-300 font-mono'}>
                              {formatDate(validUntil)}
                            </span>
                            {expired && proposal.status !== 'ACCEPTED' && (
                              <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">Expirada</div>
                            )}
                            {expiring && !expired && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Vence em breve</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Sem validade</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <ProposalStatusBadge status={proposal.status} />
                      </td>

                      {/* Ações */}
                      <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Botão Ver Detalhes */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectProposal(proposal.id)}
                            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 h-8 px-2"
                            title="Ver Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Ação rápida de envio (se liberado) */}
                          {(proposal.status === 'APPROVED' || proposal.status === 'READY_TO_SEND' || proposal.status === 'DRAFT') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setProposalToSend(proposal)}
                              className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 h-8 px-2"
                              title="Enviar Proposta Formal"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Ação rápida de aceite (se enviada) */}
                          {proposal.status === 'SENT' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setProposalToAccept(proposal)}
                              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 h-8 px-2"
                              title="Registrar Aceite Comercial"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Ação de gerar contrato (se aceita) */}
                          {proposal.status === 'ACCEPTED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onGenerateContract?.(proposal.id)}
                              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 h-8 px-2"
                              title="Gerar Contrato Comercial a partir desta Proposta"
                            >
                              <FileSignature className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {proposals.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div>
              Mostrando página <span className="font-semibold text-slate-800 dark:text-slate-200">{page}</span> de{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</span> ({total} propostas)
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage(page - 1)}
                className="h-8 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(page + 1)}
                className="h-8 px-2"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Nova Proposta */}
      <ProposalCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(newProposal: any) => {
          setIsCreateModalOpen(false);
          loadData();
          onSelectProposal(newProposal.id);
        }}
      />

      {/* Modal: Enviar Proposta */}
      {proposalToSend && (
        <SendProposalModal
          proposalId={proposalToSend.id}
          versionNumber={proposalToSend.currentVersionNumber || 1}
          expectedVersion={proposalToSend.version || 1}
          publicCode={proposalToSend.publicCode}
          onClose={() => setProposalToSend(null)}
          onSuccess={() => {
            setProposalToSend(null);
            loadData();
          }}
        />
      )}

      {/* Modal: Registrar Aceite Formal */}
      {proposalToAccept && (
        <AcceptProposalModal
          proposalId={proposalToAccept.id}
          versionNumber={proposalToAccept.currentVersionNumber || 1}
          expectedVersion={proposalToAccept.version || 1}
          publicCode={proposalToAccept.publicCode}
          producerName={proposalToAccept.producerName}
          onClose={() => setProposalToAccept(null)}
          onSuccess={() => {
            setProposalToAccept(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};
