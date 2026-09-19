import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requirePermission } from '../../core/middleware/requirePermission';
import { ConfigurationController } from './configuration.controller';
import { PolicyController } from './policy.controller';
import { FeatureFlagController } from './feature-flag.controller';

const router = Router();

// All configuration routes require authentication
router.use(authenticate);

// ----------------------------------------------------
// Public / Operational Effective Value Resolution
// ----------------------------------------------------
router.get(
  '/effective',
  requirePermission('configuracoes.central.visualizar'),
  ConfigurationController.getAllEffective
);

router.get(
  '/:key/effective',
  requirePermission('configuracoes.parametro.visualizar'),
  ConfigurationController.getEffective
);

// ----------------------------------------------------
// Configuration Definitions & Overrides Management
// ----------------------------------------------------
router.get(
  '/admin/definitions',
  requirePermission('configuracoes.parametro.visualizar'),
  ConfigurationController.listDefinitions
);

router.get(
  '/admin/history',
  requirePermission('configuracoes.historico.visualizar'),
  ConfigurationController.getHistory
);

router.post(
  '/admin/:key/override',
  requirePermission('configuracoes.parametro.editar'),
  ConfigurationController.setOverride
);

router.delete(
  '/admin/:key/override',
  requirePermission('configuracoes.parametro.editar'),
  ConfigurationController.removeOverride
);

// ----------------------------------------------------
// Policies & Business Rules Management
// ----------------------------------------------------
router.get(
  '/admin/policies',
  requirePermission('configuracoes.politica.visualizar'),
  PolicyController.listPolicies
);

router.post(
  '/admin/policies',
  requirePermission('configuracoes.politica.criar'),
  PolicyController.createPolicy
);

router.post(
  '/admin/policies/simulate',
  requirePermission('configuracoes.simulador.utilizar'),
  PolicyController.simulate
);

router.post(
  '/admin/policies/detect-conflicts',
  requirePermission('configuracoes.politica.visualizar'),
  PolicyController.detectConflicts
);

router.get(
  '/admin/policies/conflicts',
  requirePermission('configuracoes.politica.visualizar'),
  PolicyController.listConflicts
);

router.post(
  '/admin/policies/conflicts/:id/resolve',
  requirePermission('configuracoes.politica.editar'),
  PolicyController.resolveConflict
);

router.get(
  '/admin/policies/:id',
  requirePermission('configuracoes.politica.visualizar'),
  PolicyController.getPolicyById
);

router.post(
  '/admin/policies/:id/activate',
  requirePermission('configuracoes.politica.ativar'),
  PolicyController.activatePolicy
);

router.post(
  '/admin/policies/:id/schedule',
  requirePermission('configuracoes.politica.ativar'),
  PolicyController.schedulePolicy
);

router.get(
  '/admin/policies/:id/compare',
  requirePermission('configuracoes.versao.visualizar'),
  PolicyController.compareVersions
);

router.post(
  '/admin/policies/:id/versions',
  requirePermission('configuracoes.politica.editar'),
  PolicyController.createNewVersion
);

router.post(
  '/admin/policies/:id/rollback',
  requirePermission('configuracoes.rollback.executar'),
  PolicyController.rollbackPolicy
);

// ----------------------------------------------------
// Feature Flags & Kill Switches
// ----------------------------------------------------
router.get(
  '/admin/feature-flags',
  requirePermission('configuracoes.feature_flag.visualizar'),
  FeatureFlagController.listFlags
);

router.post(
  '/admin/feature-flags',
  requirePermission('configuracoes.feature_flag.editar'),
  FeatureFlagController.upsertFlag
);

router.post(
  '/admin/feature-flags/:key/kill-switch',
  requirePermission('configuracoes.feature_flag.editar'),
  FeatureFlagController.triggerKillSwitch
);

router.post(
  '/admin/feature-flags/:key/reset-kill-switch',
  requirePermission('configuracoes.feature_flag.editar'),
  FeatureFlagController.resetKillSwitch
);

export { router as configurationRoutes };
