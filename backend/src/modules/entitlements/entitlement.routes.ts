import { Router } from 'express';
import { EntitlementController } from './entitlement.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requireAnyPermission } from '../../core/middleware/requirePermission';

const router = Router();

router.use(authenticate);

// Catálogo de Recursos Técnicos
router.get(
  '/features',
  requireAnyPermission([
    'comercial.produtos_contratados.visualizar',
    'admin.habilitacoes.visualizar',
    'admin.sistema.configurar'
  ]),
  EntitlementController.listFeatures
);

// Verificação pontual de entitlement e cotas
router.get(
  '/check/:producerId/:featureCode',
  requireAnyPermission([
    'comercial.produtos_contratados.visualizar',
    'admin.habilitacoes.visualizar',
    'admin.sistema.configurar'
  ]),
  EntitlementController.check
);

// Habilitações e Limites de um produtor
router.get(
  '/producer/:producerId',
  requireAnyPermission([
    'comercial.produtos_contratados.visualizar',
    'admin.habilitacoes.visualizar',
    'admin.sistema.configurar'
  ]),
  EntitlementController.listProducerEntitlements
);

// Resumo estruturado de Produtos Contratados para a Central do Produtor
router.get(
  '/producer/:producerId/contracted-products',
  requireAnyPermission([
    'comercial.produtos_contratados.visualizar',
    'admin.habilitacoes.visualizar',
    'admin.sistema.configurar'
  ]),
  EntitlementController.listContractedProducts
);

// Reconciliação sob demanda
router.post(
  '/reconcile/:producerId',
  requireAnyPermission(['admin.habilitacoes.reconciliar', 'admin.sistema.configurar']),
  EntitlementController.reconcileProducer
);

router.post(
  '/reconcile',
  requireAnyPermission(['admin.habilitacoes.reconciliar', 'admin.sistema.configurar']),
  EntitlementController.reconcileAll
);

// Overrides Administrativos Temporários
router.post(
  '/overrides',
  requireAnyPermission(['admin.habilitacoes.override', 'admin.sistema.configurar']),
  EntitlementController.createOverride
);

router.get(
  '/overrides',
  requireAnyPermission([
    'admin.habilitacoes.visualizar',
    'admin.habilitacoes.override',
    'admin.sistema.configurar'
  ]),
  EntitlementController.listOverrides
);

router.delete(
  '/overrides/:overrideId',
  requireAnyPermission(['admin.habilitacoes.override', 'admin.sistema.configurar']),
  EntitlementController.revokeOverride
);

// Migração de Produtores Legados
router.post(
  '/migration/legacy',
  requireAnyPermission(['admin.habilitacoes.gerenciar', 'admin.sistema.configurar']),
  EntitlementController.migrateLegacy
);

// Auditoria e Telemetria
router.get(
  '/audit/:producerId',
  requireAnyPermission(['admin.habilitacoes.visualizar', 'admin.sistema.configurar']),
  EntitlementController.listAuditLogs
);

export default router;
