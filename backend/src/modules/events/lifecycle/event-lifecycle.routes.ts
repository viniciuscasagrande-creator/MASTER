import { Router } from 'express';
import { EventLifecycleController } from './event-lifecycle.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

// Transições e Máquina de Estados
router.get(
  '/lifecycle/transitions',
  requirePermission('eventos.visualizar'),
  EventLifecycleController.getTransitions
);

router.post(
  '/lifecycle/transition',
  requirePermission('eventos.editar'),
  EventLifecycleController.requestTransition
);

// Revisão e Snapshots Imutáveis
router.get(
  '/review/snapshot',
  requirePermission('eventos.visualizar'),
  EventLifecycleController.getLatestSnapshot
);

router.post(
  '/review/snapshot',
  requirePermission('eventos.lifecycle.review'),
  EventLifecycleController.createSnapshot
);

router.get(
  '/review/verify',
  requirePermission('eventos.visualizar'),
  EventLifecycleController.verifySnapshotIntegrity
);

// Publicação e Abertura de Vendas
router.post(
  '/publication/publish',
  requirePermission('eventos.lifecycle.publicar'),
  EventLifecycleController.publishImmediate
);

router.post(
  '/publication/schedule',
  requirePermission('eventos.lifecycle.aprovar'),
  EventLifecycleController.schedulePublication
);

router.get(
  '/publication/schedules',
  requirePermission('eventos.visualizar'),
  EventLifecycleController.listSchedules
);

router.post(
  '/publication/pause',
  requirePermission('eventos.lifecycle.pausar_vendas'),
  EventLifecycleController.pauseSales
);

router.post(
  '/publication/resume',
  requirePermission('eventos.lifecycle.pausar_vendas'),
  EventLifecycleController.resumeSales
);

router.get(
  '/publication/preview-token',
  requirePermission('eventos.visualizar'),
  EventLifecycleController.generatePreviewToken
);

export default router;
