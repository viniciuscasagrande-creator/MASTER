import { Router } from 'express';
import { ContractController } from './contract.controller';
import { authenticate } from '../../../core/middleware/authenticate';
import { requireAnyPermission } from '../../../core/middleware/requirePermission';

const router = Router();

// Webhook da Autoridade de Assinatura (aberto para recebimento de eventos assinados)
router.post('/webhook/signature', ContractController.handleSignatureWebhook);

// Rotas autenticadas
router.use(authenticate);

// Métricas de Contratos
router.get(
  '/metrics',
  requireAnyPermission(['comercial.contratos.visualizar', 'comercial.dashboard.visualizar']),
  ContractController.getMetrics
);

// Condições Efetivas Vigentes (para consumo pelo Financeiro / Borderô)
router.get(
  '/effective-terms/:producerId',
  requireAnyPermission(['comercial.contratos.condicoes.visualizar', 'comercial.contratos.visualizar', 'financeiro.dashboard.visualizar']),
  ContractController.getEffectiveTerms
);

// Listagem de Contratos
router.get(
  '/',
  requireAnyPermission(['comercial.contratos.visualizar']),
  ContractController.listContracts
);

// Detalhes do Contrato
router.get(
  '/:id',
  requireAnyPermission(['comercial.contratos.visualizar']),
  ContractController.getContractById
);

// Criação de Contrato a partir de Proposta Comercial Aceita
router.post(
  '/from-proposal',
  requireAnyPermission(['comercial.contratos.criar', 'admin.sistema.configurar']),
  ContractController.createFromProposal
);

// Criação Direta de Contrato
router.post(
  '/',
  requireAnyPermission(['comercial.contratos.criar', 'admin.sistema.configurar']),
  ContractController.createDirect
);

// Atualização de Rascunho do Contrato (Bloqueado se assinado)
router.put(
  '/:id',
  requireAnyPermission(['comercial.contratos.editar', 'admin.sistema.configurar']),
  ContractController.updateDraft
);

// Submissão para Aprovação Interna
router.post(
  '/:id/submit-approval',
  requireAnyPermission(['comercial.contratos.enviar_aprovacao', 'admin.sistema.configurar']),
  ContractController.submitApproval
);

// Decisão de Aprovação Interna (Maker-Checker)
router.post(
  '/:id/decision',
  requireAnyPermission(['comercial.contratos.enviar_aprovacao', 'admin.sistema.configurar']),
  ContractController.processDecision
);

// Geração de Minuta / Documento Formal
router.post(
  '/:id/versions/:versionNumber/document',
  requireAnyPermission(['comercial.contratos.documentos.gerar', 'comercial.contratos.visualizar']),
  ContractController.generateDocument
);

// Preparar e Despachar Envelope de Assinatura
router.post(
  '/:id/prepare-signature',
  requireAnyPermission(['comercial.contratos.preparar_assinatura', 'comercial.contratos.enviar_assinatura', 'admin.sistema.configurar']),
  ContractController.prepareAndSendSignature
);

// Gestão de Aditivos Contratuais
router.post(
  '/:id/amendments',
  requireAnyPermission(['comercial.contratos.aditivos.gerenciar', 'admin.sistema.configurar']),
  ContractController.createAmendment
);

router.post(
  '/:id/amendments/:amendmentId/approve',
  requireAnyPermission(['comercial.contratos.aditivos.gerenciar', 'admin.sistema.configurar']),
  ContractController.approveAmendment
);

router.post(
  '/:id/amendments/:amendmentId/activate',
  requireAnyPermission(['comercial.contratos.aditivos.gerenciar', 'admin.sistema.configurar']),
  ContractController.activateAmendment
);

// Gestão de Renovações e Renegociações
router.post(
  '/:id/renewals',
  requireAnyPermission(['comercial.contratos.renovacoes.gerenciar', 'admin.sistema.configurar']),
  ContractController.createRenewal
);

router.post(
  '/:id/renewals/:renewalId/complete',
  requireAnyPermission(['comercial.contratos.renovacoes.gerenciar', 'admin.sistema.configurar']),
  ContractController.completeRenewal
);

// Suspensão e Reativação
router.post(
  '/:id/suspend',
  requireAnyPermission(['comercial.contratos.suspender', 'admin.sistema.configurar']),
  ContractController.suspendContract
);

router.post(
  '/:id/reactivate',
  requireAnyPermission(['comercial.contratos.suspender', 'admin.sistema.configurar']),
  ContractController.reactivateContract
);

// Rescisão Contratual
router.post(
  '/:id/terminate',
  requireAnyPermission(['comercial.contratos.rescindir', 'admin.sistema.configurar']),
  ContractController.terminateContract
);

export default router;
