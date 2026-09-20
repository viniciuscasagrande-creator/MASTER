import React, { useState, useEffect } from 'react';
import { CommercialDashboardPage } from '../../features/commercial/dashboard/CommercialDashboardPage';
import { OrdersPage } from '../../features/commercial/orders/OrdersPage';
import { OrderDetailsPage } from '../../features/commercial/orders/OrderDetailsPage';
import { CommercialSalesPage } from '../../features/commercial/sales/CommercialSalesPage';
import { ProducersPage } from '../../features/commercial/producers/ProducersPage';
import { ProducerCommercialPage } from '../../features/commercial/producers/ProducerCommercialPage';
import { MyPortfolioPage } from '../../features/commercial/portfolio/MyPortfolioPage';
import { CommercialLeadsPage } from '../../features/commercial/leads/CommercialLeadsPage';
import { OpportunitiesPage } from '../../features/commercial/opportunities/OpportunitiesPage';
import { OpportunityDetailsPage } from '../../features/commercial/opportunities/OpportunityDetailsPage';
import { ProposalsPage } from '../../features/commercial/proposals/ProposalsPage';
import { ProposalDetailsPage } from '../../features/commercial/proposals/ProposalDetailsPage';
import { ContractsPage } from '../../features/commercial/contracts/ContractsPage';
import { ContractDetailsPage } from '../../features/commercial/contracts/ContractDetailsPage';

interface CommercialDashboardProps {
  initialSubItem?: string;
  onNavigate?: (moduleId: string, subItemId?: string) => void;
}

export const CommercialDashboard: React.FC<CommercialDashboardProps> = ({
  initialSubItem = 'commercial-dashboard',
  onNavigate
}) => {
  const [currentView, setCurrentView] = useState<string>(initialSubItem);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedProducerId, setSelectedProducerId] = useState<string | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [proposalForContractId, setProposalForContractId] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubItem) {
      setCurrentView(initialSubItem);
    }
  }, [initialSubItem]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentView('commercial-orders-detail');
  };

  const handleBackToOrders = () => {
    setSelectedOrderId(null);
    setCurrentView('commercial-orders');
  };

  const handleSelectProducer = (producerId: string) => {
    setSelectedProducerId(producerId);
    setCurrentView('commercial-producer-detail');
  };

  const handleBackToProducers = () => {
    setSelectedProducerId(null);
    setCurrentView('commercial-producers');
  };

  const handleSelectOpportunity = (opportunityId: string) => {
    setSelectedOpportunityId(opportunityId);
    setCurrentView('commercial-opportunity-detail');
  };

  const handleBackToOpportunities = () => {
    setSelectedOpportunityId(null);
    setCurrentView('commercial-opportunities');
  };

  const handleSelectProposal = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    setCurrentView('commercial-proposal-detail');
  };

  const handleBackToProposals = () => {
    setSelectedProposalId(null);
    setCurrentView('commercial-proposals');
  };

  const handleSelectContract = (contractId: string) => {
    setSelectedContractId(contractId);
    setCurrentView('commercial-contract-detail');
  };

  const handleBackToContracts = () => {
    setSelectedContractId(null);
    setProposalForContractId(null);
    setCurrentView('commercial-contracts');
  };

  const handleGenerateContractFromProposal = (proposalId: string) => {
    setProposalForContractId(proposalId);
    setCurrentView('commercial-contracts');
  };

  // Route switcher
  if (currentView === 'commercial-orders-detail' && selectedOrderId) {
    return (
      <OrderDetailsPage
        orderId={selectedOrderId}
        onBack={handleBackToOrders}
      />
    );
  }

  if (currentView === 'commercial-orders') {
    return (
      <OrdersPage
        onSelectOrder={handleSelectOrder}
        onBackToDashboard={() => setCurrentView('commercial-dashboard')}
      />
    );
  }

  if (currentView === 'commercial-sales') {
    return (
      <CommercialSalesPage
        onNavigateToOrders={() => setCurrentView('commercial-orders')}
        onNavigateToEventsModule={(subItem) => onNavigate?.('events', subItem)}
      />
    );
  }

  // Producer Commercial Detail (Visão Comercial do Produtor)
  if (currentView === 'commercial-producer-detail' && selectedProducerId) {
    return (
      <ProducerCommercialPage
        producerId={selectedProducerId}
        onBack={handleBackToProducers}
        onSelectOpportunity={handleSelectOpportunity}
        onSelectEvent={(eventId) => onNavigate?.('events', 'events-all')}
      />
    );
  }

  // Central de Produtores (Fase 1.3.3)
  if (currentView === 'commercial-producers') {
    return (
      <ProducersPage
        onSelectProducer={handleSelectProducer}
        onNavigateToLeads={() => setCurrentView('commercial-leads')}
      />
    );
  }

  // Minha Carteira Comercial (Fase 1.3.3)
  if (currentView === 'commercial-portfolio') {
    return (
      <MyPortfolioPage
        onSelectProducer={handleSelectProducer}
        onNavigateToOpportunities={() => setCurrentView('commercial-opportunities')}
      />
    );
  }

  // Prospecções / Leads (Fase 1.3.3)
  if (currentView === 'commercial-leads') {
    return (
      <CommercialLeadsPage
        onSelectConvertedProducer={handleSelectProducer}
      />
    );
  }

  // Detalhes da Oportunidade (Fase 1.3.4)
  if (currentView === 'commercial-opportunity-detail' && selectedOpportunityId) {
    return (
      <OpportunityDetailsPage
        opportunityId={selectedOpportunityId}
        onBack={handleBackToOpportunities}
        onSelectProducer={handleSelectProducer}
      />
    );
  }

  // Central de Oportunidades & Pipeline (Fase 1.3.4)
  if (currentView === 'commercial-opportunities' || currentView === 'commercial-pipeline') {
    return (
      <OpportunitiesPage
        onSelectOpportunity={handleSelectOpportunity}
        onSelectProducer={handleSelectProducer}
      />
    );
  }

  // Detalhes da Proposta Comercial (Fase 1.3.5)
  if (currentView === 'commercial-proposal-detail' && selectedProposalId) {
    return (
      <ProposalDetailsPage
        proposalId={selectedProposalId}
        onBack={handleBackToProposals}
        onSelectProducer={handleSelectProducer}
        onSelectOpportunity={handleSelectOpportunity}
        onGenerateContract={handleGenerateContractFromProposal}
      />
    );
  }

  // Central de Propostas Comerciais (Fase 1.3.5)
  if (currentView === 'commercial-proposals') {
    return (
      <ProposalsPage
        onSelectProposal={handleSelectProposal}
        onSelectProducer={handleSelectProducer}
        onSelectOpportunity={handleSelectOpportunity}
        onGenerateContract={handleGenerateContractFromProposal}
      />
    );
  }

  // Detalhes do Contrato Comercial (Fase 1.3.6)
  if (currentView === 'commercial-contract-detail' && selectedContractId) {
    return (
      <ContractDetailsPage
        contractId={selectedContractId}
        onBack={handleBackToContracts}
        onSelectProducer={handleSelectProducer}
        onSelectProposal={handleSelectProposal}
      />
    );
  }

  // Central de Contratos Comerciais (Fase 1.3.6)
  if (currentView === 'commercial-contracts') {
    return (
      <ContractsPage
        onSelectContract={handleSelectContract}
        onSelectProducer={handleSelectProducer}
        initialProposalIdForCreate={proposalForContractId || undefined}
      />
    );
  }

  // Default: Executive Dashboard (Fase 1.3.1)
  return (
    <CommercialDashboardPage
      onNavigateToOrders={() => setCurrentView('commercial-orders')}
      onNavigateToSales={() => setCurrentView('commercial-sales')}
      onSelectOrder={handleSelectOrder}
      onNavigateToRemarketing={() => onNavigate?.('remarketing', 'remarketing-abandoned-carts')}
    />
  );
};
