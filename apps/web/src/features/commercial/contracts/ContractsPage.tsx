import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  FileSignature,
  CalendarCheck2,
  AlertTriangle,
  FileDiff,
  Search,
  Plus,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldCheck,
  Clock
} from 'lucide-react';
import {
  CommercialContractDTO,
  CommercialContractMetricsDTO,
  CommercialContractStatus
} from '@shared/types/index';
import { CommercialContractsApi } from './api/commercial-contracts.api';
import { ContractStatusBadge } from './ContractStatusBadge';
import { ContractCreateModal } from './modals/ContractCreateModal';
import { StatCard } from '../../../shared/components/StatCard';
import { Button } from '../../../shared/components/Button';
import { formatDate } from '../../../shared/utils/formatters';

interface ContractsPageProps {
  onSelectContract: (contractId: string) => void;
  onSelectProducer?: (producerId: string) => void;
  initialProposalIdForCreate?: string;
}

type TabType = 'ALL' | 'ACTIVE' | 'SIGNATURE_PENDING' | 'DRAFTS' | 'EXPIRING_SOON' | 'SUSPENDED_TERMINATED';

export const ContractsPage: React.FC<ContractsPageProps> = ({
  onSelectContract,
  onSelectProducer,
  initialProposalIdForCreate
}) => {
  const [contracts, setContracts] = useState<CommercialContractDTO[]>([]);
  const [metrics, setMetrics] = useState<CommercialContractMetricsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(Boolean(initialProposalIdForCreate));

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let effectiveStatus = statusFilter !== 'ALL' ? statusFilter : undefined;
      let expiringInDays: number | undefined = undefined;

      if (activeTab === 'ACTIVE') {
        effectiveStatus = 'ACTIVE';
      } else if (activeTab === 'SIGNATURE_PENDING') {
        effectiveStatus = 'SIGNATURE_PENDING';
      } else if (activeTab === 'DRAFTS') {
        effectiveStatus = 'DRAFT';
      } else if (activeTab === 'EXPIRING_SOON') {
        expiringInDays = 30;
      }

      const [contractsRes, metricsRes] = await Promise.all([
        CommercialContractsApi.listContracts({
          search: search.trim() || undefined,
          status: effectiveStatus,
          expiringInDays,
          page,
          limit
        }),
        CommercialContractsApi.getMetrics().catch(() => null)
      ]);

      setContracts(contractsRes.data);
      setTotal(contractsRes.total);
      if (metricsRes) {
        setMetrics(metricsRes);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar contratos comerciais.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, statusFilter, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Contratos Comerciais B2B
            </h1>
            <span className="rounded-md bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-400 border border-orange-500/20">
              Fase 1.3.6
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestão jurídica de contratos com produtores, minutas, assinaturas eletrônicas, vigência e aditivos
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-slate-800 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/20"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Novo Contrato
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total de Contratos"
            value={metrics.totalContracts}
            icon={<FileText className="h-5 w-5 text-slate-400" />}
            subtitle={`${metrics.draftCount} em rascunho`}
          />
          <StatCard
            title="Em Assinatura"
            value={metrics.signaturePendingCount}
            icon={<FileSignature className="h-5 w-5 text-purple-400" />}
            subtitle="Aguardando signatários"
          />
          <StatCard
            title="Contratos Vigentes"
            value={metrics.activeCount}
            icon={<CalendarCheck2 className="h-5 w-5 text-emerald-400" />}
            subtitle={`${metrics.signedCount} assinados`}
          />
          <StatCard
            title="Aditivos Ativos"
            value={metrics.activeAmendmentsCount}
            icon={<FileDiff className="h-5 w-5 text-amber-400" />}
            subtitle="Repactuações vigentes"
          />
          <StatCard
            title="Expirados / Suspensos"
            value={metrics.expiredCount + metrics.suspendedCount}
            icon={<AlertTriangle className="h-5 w-5 text-rose-400" />}
            subtitle={`${metrics.suspendedCount} suspensos`}
          />
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 gap-2">
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => {
              setActiveTab('ALL');
              setPage(1);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Todos os Contratos
          </button>
          <button
            onClick={() => {
              setActiveTab('ACTIVE');
              setPage(1);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'ACTIVE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-900'
            }`}
          >
            <CalendarCheck2 className="h-3.5 w-3.5 text-emerald-400" />
            Vigentes
          </button>
          <button
            onClick={() => {
              setActiveTab('SIGNATURE_PENDING');
              setPage(1);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'SIGNATURE_PENDING'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-purple-300 hover:bg-slate-900'
            }`}
          >
            <FileSignature className="h-3.5 w-3.5 text-purple-400" />
            Em Assinatura
          </button>
          <button
            onClick={() => {
              setActiveTab('DRAFTS');
              setPage(1);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'DRAFTS'
                ? 'bg-slate-700/60 text-slate-200 border border-slate-600'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            Rascunhos & Minutas
          </button>
          <button
            onClick={() => {
              setActiveTab('EXPIRING_SOON');
              setPage(1);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'EXPIRING_SOON'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            A Vencer (30 dias)
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 pb-2 sm:pb-0">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por código, título ou produtor..."
              className="rounded-lg border border-slate-800 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none w-64"
            />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Contracts Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 font-semibold text-slate-400">
              <tr>
                <th className="px-4 py-3.5">Código / Identificador</th>
                <th className="px-4 py-3.5">Produtor Contratante</th>
                <th className="px-4 py-3.5">Título & Escopo</th>
                <th className="px-4 py-3.5">Vigência (De / Até)</th>
                <th className="px-4 py-3.5">Status Jurídico</th>
                <th className="px-4 py-3.5">Versão / Aditivos</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading && contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-orange-400" />
                    Carregando contratos comerciais...
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-slate-600 opacity-50" />
                    Nenhum contrato comercial encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                contracts.map(ctr => (
                  <tr
                    key={ctr.id}
                    onClick={() => onSelectContract(ctr.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-white text-xs">
                        {ctr.publicCode}
                      </span>
                      {ctr.sourceProposalPublicCode && (
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          Origem: {ctr.sourceProposalPublicCode}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        <span>{ctr.producerName || 'Produtor Cadastrado'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-200 line-clamp-1">{ctr.title}</div>
                      {ctr.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {ctr.description}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>
                          {ctr.effectiveFrom ? formatDate(ctr.effectiveFrom) : 'Não definida'} a{' '}
                          {ctr.effectiveUntil ? formatDate(ctr.effectiveUntil) : 'Indeterminado'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <ContractStatusBadge status={ctr.status} size="sm" />
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">
                          v{ctr.currentVersionNumber}
                        </span>
                        {ctr.amendments && ctr.amendments.length > 0 && (
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-mono text-amber-400 border border-amber-500/30">
                            +{ctr.amendments.length} aditivo{ctr.amendments.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={e => {
                          e.stopPropagation();
                          onSelectContract(ctr.id);
                        }}
                        className="border-slate-800 text-slate-400 hover:text-white h-7 text-[11px]"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Detalhes
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 bg-slate-950/40 text-xs text-slate-400">
          <div>
            Mostrando <span className="text-white font-medium">{contracts.length}</span> de{' '}
            <span className="text-white font-medium">{total}</span> contratos
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-slate-300">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Creation Modal */}
      {isCreateModalOpen && (
        <ContractCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          initialProposalId={initialProposalIdForCreate}
          onCreated={contract => {
            loadData();
            onSelectContract(contract.id);
          }}
        />
      )}
    </div>
  );
};
