import { Router } from 'express';
import { AccountManagementController } from './account-management.controller';
import { authenticate } from '../../../core/middleware/authenticate';
import { requireAnyPermission } from '../../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);

// 1. Contas & Carteira
router.get(
  '/accounts',
  requireAnyPermission(['comercial.gestao_contas.visualizar', 'comercial.produtores.visualizar']),
  AccountManagementController.listAccounts
);

router.get(
  '/accounts/metrics',
  requireAnyPermission(['comercial.gestao_contas.visualizar', 'comercial.produtores.visualizar']),
  AccountManagementController.getMetrics
);

router.get(
  '/accounts/alerts',
  requireAnyPermission(['comercial.gestao_contas.visualizar', 'comercial.produtores.visualizar']),
  AccountManagementController.getAccountAlerts
);

router.get(
  '/accounts/:producerId',
  requireAnyPermission(['comercial.gestao_contas.visualizar', 'comercial.produtores.visualizar']),
  AccountManagementController.getAccountDetails
);

router.get(
  '/accounts/:producerId/timeline',
  requireAnyPermission(['comercial.contas.historico.visualizar', 'comercial.gestao_contas.visualizar']),
  AccountManagementController.getAccountTimeline
);

router.get(
  '/accounts/:producerId/alerts',
  requireAnyPermission(['comercial.gestao_contas.visualizar']),
  AccountManagementController.getAccountAlerts
);

// 2. Central de Renovações
router.get(
  '/renewals',
  requireAnyPermission(['comercial.renovacoes.visualizar', 'comercial.gestao_contas.visualizar', 'comercial.contratos.visualizar']),
  AccountManagementController.listRenewals
);

router.get(
  '/renewals/:id',
  requireAnyPermission(['comercial.renovacoes.visualizar', 'comercial.contratos.visualizar']),
  AccountManagementController.getRenewalById
);

router.post(
  '/renewals/start-negotiation',
  requireAnyPermission(['comercial.renovacoes.iniciar', 'comercial.contratos.renovacoes.gerenciar']),
  AccountManagementController.startRenewalNegotiation
);

router.patch(
  '/renewals/:id/status',
  requireAnyPermission(['comercial.renovacoes.atualizar_status', 'comercial.contratos.renovacoes.gerenciar']),
  AccountManagementController.updateRenewalStatus
);

router.post(
  '/renewals/:id/decide',
  requireAnyPermission(['comercial.renovacoes.decidir', 'comercial.contratos.renovacoes.gerenciar']),
  AccountManagementController.decideRenewal
);

// 3. Movimentações Comerciais (Expansão, Upgrade, Downgrade, Novos Serviços)
router.get(
  '/movements',
  requireAnyPermission(['comercial.movimentacoes.visualizar', 'comercial.oportunidades.visualizar', 'comercial.gestao_contas.visualizar']),
  AccountManagementController.listMovements
);

router.post(
  '/movements',
  requireAnyPermission(['comercial.movimentacoes.criar', 'comercial.oportunidades.criar']),
  AccountManagementController.createMovement
);

// 4. Comparador de Impacto Comercial (Simulação Consultiva)
router.post(
  '/change-impact/simulate',
  requireAnyPermission(['comercial.movimentacoes.analisar_impacto', 'comercial.movimentacoes.visualizar', 'comercial.gestao_contas.visualizar']),
  AccountManagementController.simulateChangeImpact
);

export default router;
