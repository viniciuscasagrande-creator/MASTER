import { Router } from 'express';
import { CommercialController } from './commercial.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requireAnyPermission } from '../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);

// 1. Dashboard Executivo Comercial (Fase 1.3.1)
router.get(
  '/dashboard',
  requireAnyPermission(['comercial.dashboard.visualizar', 'eventos.dashboard.comercial.visualizar']),
  CommercialController.getDashboard
);

// 2. Central de Vendas & Performance Comercial por Evento (Fase 1.3.2)
router.get(
  '/performance',
  requireAnyPermission(['comercial.vendas.performance.visualizar', 'comercial.vendas.visualizar']),
  CommercialController.getPerformance
);

// 3. Central de Pedidos (Fase 1.3.1)
router.get(
  '/orders',
  requireAnyPermission(['comercial.pedidos.visualizar']),
  CommercialController.listOrders
);

router.get(
  '/orders/:id',
  requireAnyPermission(['comercial.pedidos.detalhes', 'comercial.pedidos.visualizar']),
  CommercialController.getOrderById
);

router.post(
  '/orders',
  requireAnyPermission(['comercial.pedidos.visualizar', 'admin.sistema.configurar']),
  CommercialController.createOrder
);

router.post(
  '/orders/:id/transition',
  requireAnyPermission(['comercial.pedidos.detalhes', 'admin.sistema.configurar']),
  CommercialController.transitionOrder
);

// 4. Exportações
router.get(
  '/export/orders',
  requireAnyPermission(['comercial.pedidos.exportar']),
  CommercialController.exportOrders
);

router.get(
  '/export/sales',
  requireAnyPermission(['comercial.vendas.exportar']),
  CommercialController.exportSales
);

// =============================================================================
// FASE 1.3.3 — CENTRAL DE PRODUTORES & CARTEIRA COMERCIAL
// =============================================================================

// Produtores
router.get(
  '/producers',
  requireAnyPermission(['comercial.produtores.visualizar']),
  CommercialController.listProducers
);

router.get(
  '/producers/:id/summary',
  requireAnyPermission(['comercial.produtores.detalhes', 'comercial.produtores.visualizar']),
  CommercialController.getProducerSummary
);

router.get(
  '/producers/:id/account',
  requireAnyPermission(['comercial.produtores.detalhes', 'comercial.produtores.visualizar']),
  CommercialController.getCommercialAccount
);

router.put(
  '/producers/:id/account',
  requireAnyPermission(['comercial.produtores.editar', 'admin.sistema.configurar']),
  CommercialController.updateCommercialAccount
);

router.get(
  '/producers/:id/contacts',
  requireAnyPermission(['comercial.produtores.detalhes', 'comercial.produtores.visualizar']),
  CommercialController.listContacts
);

router.post(
  '/producers/:id/contacts',
  requireAnyPermission(['comercial.produtores.editar', 'admin.sistema.configurar']),
  CommercialController.addContact
);

router.put(
  '/contacts/:contactId',
  requireAnyPermission(['comercial.produtores.editar', 'admin.sistema.configurar']),
  CommercialController.updateContact
);

router.delete(
  '/contacts/:contactId',
  requireAnyPermission(['comercial.produtores.editar', 'admin.sistema.configurar']),
  CommercialController.deleteContact
);

// Carteira Comercial
router.get(
  '/portfolio/my-summary',
  requireAnyPermission(['comercial.carteira.visualizar']),
  CommercialController.getMyPortfolioSummary
);

router.get(
  '/portfolio/my-producers',
  requireAnyPermission(['comercial.carteira.visualizar']),
  CommercialController.getMyPortfolioProducers
);

router.post(
  '/portfolio/assign',
  requireAnyPermission(['comercial.carteira.atribuir', 'admin.sistema.configurar']),
  CommercialController.assignProducerToPortfolio
);

router.delete(
  '/portfolio/:id',
  requireAnyPermission(['comercial.carteira.atribuir', 'admin.sistema.configurar']),
  CommercialController.removeProducerFromPortfolio
);

// Prospecções / Leads
router.get(
  '/leads',
  requireAnyPermission(['comercial.prospeccoes.visualizar']),
  CommercialController.listLeads
);

router.get(
  '/leads/:id',
  requireAnyPermission(['comercial.prospeccoes.visualizar']),
  CommercialController.getLeadById
);

router.post(
  '/leads',
  requireAnyPermission(['comercial.prospeccoes.criar', 'admin.sistema.configurar']),
  CommercialController.createLead
);

router.put(
  '/leads/:id',
  requireAnyPermission(['comercial.prospeccoes.editar', 'admin.sistema.configurar']),
  CommercialController.updateLead
);

router.delete(
  '/leads/:id',
  requireAnyPermission(['comercial.prospeccoes.editar', 'admin.sistema.configurar']),
  CommercialController.deleteLead
);

router.post(
  '/leads/:id/convert',
  requireAnyPermission(['comercial.prospeccoes.converter', 'admin.sistema.configurar']),
  CommercialController.convertLead
);

// Atividades Comerciais
router.get(
  '/activities',
  requireAnyPermission(['comercial.atividades.visualizar']),
  CommercialController.listActivities
);

router.post(
  '/activities',
  requireAnyPermission(['comercial.atividades.registrar', 'admin.sistema.configurar']),
  CommercialController.registerActivity
);

// =============================================================================
// FASE 1.3.4 — PIPELINE, ESTÁGIOS & OPORTUNIDADES
// =============================================================================

// Pipelines & Estágios
router.get(
  '/pipelines',
  requireAnyPermission(['comercial.pipeline.visualizar', 'comercial.oportunidades.visualizar']),
  CommercialController.listPipelines
);

router.get(
  '/pipelines/default',
  requireAnyPermission(['comercial.pipeline.visualizar', 'comercial.oportunidades.visualizar']),
  CommercialController.getDefaultPipeline
);

router.get(
  '/pipelines/:id/stages',
  requireAnyPermission(['comercial.pipeline.visualizar', 'comercial.oportunidades.visualizar']),
  CommercialController.listStages
);

router.get(
  '/close-reasons',
  requireAnyPermission(['comercial.oportunidades.visualizar']),
  CommercialController.listCloseReasons
);

// Oportunidades & Negociações
router.get(
  '/opportunities',
  requireAnyPermission(['comercial.oportunidades.visualizar']),
  CommercialController.listOpportunities
);

router.get(
  '/opportunities/metrics',
  requireAnyPermission(['comercial.oportunidades.visualizar']),
  CommercialController.getOpportunityMetrics
);

router.get(
  '/opportunities/:id',
  requireAnyPermission(['comercial.oportunidades.visualizar']),
  CommercialController.getOpportunityById
);

router.post(
  '/opportunities',
  requireAnyPermission(['comercial.oportunidades.criar', 'admin.sistema.configurar']),
  CommercialController.createOpportunity
);

router.put(
  '/opportunities/:id',
  requireAnyPermission(['comercial.oportunidades.editar', 'admin.sistema.configurar']),
  CommercialController.updateOpportunity
);

router.post(
  '/opportunities/:id/transition',
  requireAnyPermission(['comercial.oportunidades.mover', 'admin.sistema.configurar']),
  CommercialController.transitionOpportunity
);

router.post(
  '/opportunities/:id/win',
  requireAnyPermission(['comercial.oportunidades.ganhar', 'admin.sistema.configurar']),
  CommercialController.winOpportunity
);

router.post(
  '/opportunities/:id/close',
  requireAnyPermission(['comercial.oportunidades.encerrar', 'admin.sistema.configurar']),
  CommercialController.closeOpportunity
);

// =============================================================================
// FASE 1.3.5 — CATÁLOGO DE OFERTAS & PROPOSTAS COMERCIAIS
// =============================================================================

// Ofertas Comerciais
router.get(
  '/offerings/categories',
  requireAnyPermission(['comercial.propostas.visualizar', 'comercial.propostas.criar', 'comercial.ofertas.gerenciar']),
  CommercialController.listOfferingCategories
);

router.get(
  '/offerings',
  requireAnyPermission(['comercial.propostas.visualizar', 'comercial.propostas.criar', 'comercial.ofertas.gerenciar']),
  CommercialController.listOfferings
);

router.post(
  '/offerings',
  requireAnyPermission(['comercial.ofertas.gerenciar', 'admin.sistema.configurar']),
  CommercialController.createOffering
);

router.put(
  '/offerings/:id',
  requireAnyPermission(['comercial.ofertas.gerenciar', 'admin.sistema.configurar']),
  CommercialController.updateOffering
);

// Propostas Comerciais
router.get(
  '/proposals',
  requireAnyPermission(['comercial.propostas.visualizar', 'comercial.propostas.gerenciar']),
  CommercialController.listProposals
);

router.get(
  '/proposals/metrics',
  requireAnyPermission(['comercial.propostas.visualizar', 'comercial.dashboard.visualizar']),
  CommercialController.getProposalMetrics
);

router.get(
  '/proposals/:id',
  requireAnyPermission(['comercial.propostas.visualizar', 'comercial.propostas.gerenciar']),
  CommercialController.getProposalById
);

router.post(
  '/proposals',
  requireAnyPermission(['comercial.propostas.criar', 'admin.sistema.configurar']),
  CommercialController.createProposal
);

router.put(
  '/proposals/:id',
  requireAnyPermission(['comercial.propostas.editar', 'admin.sistema.configurar']),
  CommercialController.updateProposal
);

router.post(
  '/proposals/:id/cancel',
  requireAnyPermission(['comercial.propostas.cancelar', 'admin.sistema.configurar']),
  CommercialController.cancelProposal
);

router.post(
  '/proposals/:id/versions',
  requireAnyPermission(['comercial.propostas.editar', 'admin.sistema.configurar']),
  CommercialController.createProposalVersion
);

router.get(
  '/proposals/:id/diff',
  requireAnyPermission(['comercial.propostas.versoes.visualizar', 'comercial.propostas.visualizar']),
  CommercialController.getProposalDiff
);

router.post(
  '/proposals/:id/versions/:versionNumber/submit-approval',
  requireAnyPermission(['comercial.propostas.enviar_aprovacao', 'admin.sistema.configurar']),
  CommercialController.submitProposalApproval
);

router.post(
  '/proposals/:id/versions/:versionNumber/decision',
  requireAnyPermission(['comercial.propostas.enviar_aprovacao', 'admin.sistema.configurar']),
  CommercialController.processProposalDecision
);

router.post(
  '/proposals/:id/versions/:versionNumber/document',
  requireAnyPermission(['comercial.propostas.documentos.gerar', 'comercial.propostas.visualizar']),
  CommercialController.generateProposalDocument
);

router.post(
  '/proposals/:id/versions/:versionNumber/send',
  requireAnyPermission(['comercial.propostas.enviar', 'admin.sistema.configurar']),
  CommercialController.sendProposal
);

router.post(
  '/proposals/:id/versions/:versionNumber/accept',
  requireAnyPermission(['comercial.propostas.aceite.registrar', 'admin.sistema.configurar']),
  CommercialController.registerProposalAcceptance
);

router.post(
  '/proposals/:id/versions/:versionNumber/decline',
  requireAnyPermission(['comercial.propostas.aceite.registrar', 'comercial.propostas.editar', 'admin.sistema.configurar']),
  CommercialController.declineProposal
);

export default router;

