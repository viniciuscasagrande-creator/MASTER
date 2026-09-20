import React, { useState, useEffect } from 'react';
import {
  Users,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  ShieldCheck,
  Search,
  Filter,
  Sparkles
} from 'lucide-react';
import { CommercialAccountsApi } from './api/commercial-accounts.api';
import { CommercialCatalogApi } from '../catalog/api/commercial-catalog.api';
import {
  CommercialAccountSummaryDTO,
  AccountManagementMetricsDTO,
  CommercialRenewalDTO,
  CommercialMovementDTO,
  CommercialOfferingDTO
} from '@shared/types/index';

import { PortfolioAccountsTab } from './tabs/PortfolioAccountsTab';
import { RenewalsTab } from './tabs/RenewalsTab';
import { MovementsTab } from './tabs/MovementsTab';

import { StartRenewalModal } from './modals/StartRenewalModal';
import { RenewalStatusModal } from './modals/RenewalStatusModal';
import { RenewalDecisionModal } from './modals/RenewalDecisionModal';
import { CreateMovementModal } from './modals/CreateMovementModal';
import { CommercialChangeImpactModal } from './modals/CommercialChangeImpactModal';
import { AccountTimelineModal } from './modals/AccountTimelineModal';

interface AccountManagementPageProps {
  initialTab?: 'portfolio' | 'renewals' | 'movements';
  onNavigateToProducer?: (producerId: string) => void;
  onNavigateToContract?: (contractId: string) => void;
}

export const AccountManagementPage: React.FC<AccountManagementPageProps> = ({
  initialTab = 'portfolio'
}) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'renewals' | 'movements'>(initialTab);
  const [metrics, setMetrics] = useState<AccountManagementMetricsDTO | null>(null);
  const [accounts, setAccounts] = useState<CommercialAccountSummaryDTO[]>([]);
  const [renewals, setRenewals] = useState<CommercialRenewalDTO[]>([]);
  const [movements, setMovements] = useState<CommercialMovementDTO[]>([]);
  const [offerings, setOfferings] = useState<CommercialOfferingDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isStartRenewalOpen, setIsStartRenewalOpen] = useState<boolean>(false);
  const [selectedContractForRenewal, setSelectedContractForRenewal] = useState<{ id: string; code?: string; producerName?: string } | null>(null);

  const [isRenewalStatusOpen, setIsRenewalStatusOpen] = useState<boolean>(false);
  const [isRenewalDecisionOpen, setIsRenewalDecisionOpen] = useState<boolean>(false);
  const [selectedRenewal, setSelectedRenewal] = useState<CommercialRenewalDTO | null>(null);

  const [isCreateMovementOpen, setIsCreateMovementOpen] = useState<boolean>(false);
  const [selectedProducerForMovement, setSelectedProducerForMovement] = useState<{ id: string; name?: string } | null>(null);

  const [isImpactModalOpen, setIsImpactModalOpen] = useState<boolean>(false);
  const [impactTarget, setImpactTarget] = useState<{ producerId: string; producerName?: string } | null>(null);

  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState<boolean>(false);
  const [timelineTarget, setTimelineTarget] = useState<{ producerId: string; producerName?: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [mRes, aRes, rRes, movRes, offRes] = await Promise.all([
        CommercialAccountsApi.getMetrics().catch(() => null),
        CommercialAccountsApi.listAccounts({ search: searchQuery || undefined }).catch(() => []),
        CommercialAccountsApi.listRenewals().catch(() => []),
        CommercialAccountsApi.listMovements().catch(() => []),
        CommercialCatalogApi.listOfferings().catch(() => ({ data: [] }))
      ]);

      if (mRes) setMetrics(mRes);
      setAccounts(aRes);
      setRenewals(rRes);
      setMovements(movRes);
      setOfferings((offRes as any).data || []);
    } catch (err) {
      console.error('Erro ao carregar dados de gestão de contas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  // Handlers
  const handleOpenTimeline = (producerId: string, producerName: string) => {
    setTimelineTarget({ producerId, producerName });
    setIsTimelineModalOpen(true);
  };

  const handleStartRenewal = (contractId: string, producerName: string) => {
    setSelectedContractForRenewal({ id: contractId, producerName });
    setIsStartRenewalOpen(true);
  };

  const handleStartNegotiationFromRenewal = (renewal: CommercialRenewalDTO) => {
    setSelectedContractForRenewal({
      id: renewal.contractId,
      code: renewal.contractPublicCode,
      producerName: renewal.producerName
    });
    setIsStartRenewalOpen(true);
  };

  const handleUpdateRenewalStatus = (renewal: CommercialRenewalDTO) => {
    setSelectedRenewal(renewal);
    setIsRenewalStatusOpen(true);
  };

  const handleDecideRenewal = (renewal: CommercialRenewalDTO) => {
    setSelectedRenewal(renewal);
    setIsRenewalDecisionOpen(true);
  };

  const handleOpenCreateMovement = (producerId?: string, producerName?: string) => {
    if (producerId) {
      setSelectedProducerForMovement({ id: producerId, name: producerName });
    } else if (accounts.length > 0) {
      setSelectedProducerForMovement({ id: accounts[0].producerId, name: accounts[0].producerName });
    }
    setIsCreateMovementOpen(true);
  };

  const handleOpenImpactModal = (producerId?: string, producerName?: string) => {
    if (producerId) {
      setImpactTarget({ producerId, producerName });
    } else if (accounts.length > 0) {
      setImpactTarget({ producerId: accounts[0].producerId, producerName: accounts[0].producerName });
    }
    setIsImpactModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Gestão de Contas & Renovações
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Operação contínua de relacionamento B2B, ciclos de renovação contratual, expansão e readequação de planos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenImpactModal()}
            className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Simulador de Impacto</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            title="Recarregar Dados"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Produtores Ativos */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Produtores Ativos</span>
              <Users className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white">{metrics.activeProducers}</div>
            <div className="text-[11px] text-slate-500">De {metrics.totalProducers} cadastrados</div>
          </div>

          {/* Card 2: Cobertura de Carteira */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Cobertura Carteira</span>
              <ShieldCheck className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white">{metrics.portfolioCoveragePercentage}%</div>
            <div className="text-[11px] text-slate-500">Com executivo de contas</div>
          </div>

          {/* Card 3: Janela de Renovação */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Janela de Renovação</span>
              <Calendar className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-300">{metrics.contractsInRenewalWindow}</div>
            <div className="text-[11px] text-slate-500">Vencimento em até 90d</div>
          </div>

          {/* Card 4: Contratos Vencidos */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Contratos Vencidos</span>
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <div className={`text-xl font-bold ${metrics.overdueContracts > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {metrics.overdueContracts}
            </div>
            <div className="text-[11px] text-slate-500">Requerem regularização</div>
          </div>

          {/* Card 5: Renovações em Andamento */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Renovações em Curso</span>
              <RefreshCw className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white">{metrics.ongoingRenewals}</div>
            <div className="text-[11px] text-slate-500">Em negociação/proposta</div>
          </div>

          {/* Card 6: Taxa de Retenção */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Retenção no Ciclo</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400">{metrics.renewalRetentionRate}%</div>
            <div className="text-[11px] text-slate-500">{metrics.completedRenewals} contratos retidos</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs & Search */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'portfolio'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Minha Carteira de Contas ({accounts.length})
          </button>

          <button
            onClick={() => setActiveTab('renewals')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'renewals'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Central de Renovações ({renewals.length})
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'movements'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Movimentações Comerciais ({movements.length})
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-64">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por produtor ou CNPJ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'portfolio' && (
        <PortfolioAccountsTab
          accounts={accounts}
          isLoading={isLoading}
          onOpenTimeline={handleOpenTimeline}
          onStartRenewal={handleStartRenewal}
          onCreateMovement={handleOpenCreateMovement}
          onOpenImpactModal={handleOpenImpactModal}
        />
      )}

      {activeTab === 'renewals' && (
        <RenewalsTab
          renewals={renewals}
          isLoading={isLoading}
          onStartNegotiation={handleStartNegotiationFromRenewal}
          onUpdateStatus={handleUpdateRenewalStatus}
          onDecideRenewal={handleDecideRenewal}
        />
      )}

      {activeTab === 'movements' && (
        <MovementsTab
          movements={movements}
          isLoading={isLoading}
          onOpenCreateMovement={() => handleOpenCreateMovement()}
          onOpenImpactModal={handleOpenImpactModal}
        />
      )}

      {/* Modals */}
      {isStartRenewalOpen && selectedContractForRenewal && (
        <StartRenewalModal
          isOpen={isStartRenewalOpen}
          onClose={() => setIsStartRenewalOpen(false)}
          contractId={selectedContractForRenewal.id}
          contractPublicCode={selectedContractForRenewal.code}
          producerName={selectedContractForRenewal.producerName}
          onSuccess={loadData}
        />
      )}

      {isRenewalStatusOpen && selectedRenewal && (
        <RenewalStatusModal
          isOpen={isRenewalStatusOpen}
          onClose={() => setIsRenewalStatusOpen(false)}
          renewal={selectedRenewal}
          onSuccess={loadData}
        />
      )}

      {isRenewalDecisionOpen && selectedRenewal && (
        <RenewalDecisionModal
          isOpen={isRenewalDecisionOpen}
          onClose={() => setIsRenewalDecisionOpen(false)}
          renewal={selectedRenewal}
          onSuccess={loadData}
        />
      )}

      {isCreateMovementOpen && selectedProducerForMovement && (
        <CreateMovementModal
          isOpen={isCreateMovementOpen}
          onClose={() => setIsCreateMovementOpen(false)}
          producerId={selectedProducerForMovement.id}
          producerName={selectedProducerForMovement.name}
          availableOfferings={offerings}
          onSuccess={loadData}
        />
      )}

      {isImpactModalOpen && impactTarget && (
        <CommercialChangeImpactModal
          isOpen={isImpactModalOpen}
          onClose={() => setIsImpactModalOpen(false)}
          producerId={impactTarget.producerId}
          producerName={impactTarget.producerName}
          availableOfferings={offerings}
        />
      )}

      {isTimelineModalOpen && timelineTarget && (
        <AccountTimelineModal
          isOpen={isTimelineModalOpen}
          onClose={() => setIsTimelineModalOpen(false)}
          producerId={timelineTarget.producerId}
          producerName={timelineTarget.producerName}
        />
      )}
    </div>
  );
};
