import { Router } from 'express';
import { EventChangeController } from './event-change.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

router.get(
  '/',
  requirePermission('eventos.visualizar'),
  EventChangeController.list
);

router.post(
  '/',
  requirePermission('eventos.alteracoes.solicitar'),
  EventChangeController.create
);

router.get(
  '/:id',
  requirePermission('eventos.visualizar'),
  EventChangeController.getById
);

router.post(
  '/:id/recalculate',
  requirePermission('eventos.alteracoes.solicitar'),
  EventChangeController.recalculate
);

router.post(
  '/:id/submit',
  requirePermission('eventos.alteracoes.solicitar'),
  EventChangeController.submit
);

router.post(
  '/:id/approve',
  requirePermission('eventos.alteracoes.aprovar'),
  EventChangeController.approve
);

router.post(
  '/:id/reject',
  requirePermission('eventos.alteracoes.aprovar'),
  EventChangeController.reject
);

router.post(
  '/:id/execute',
  requirePermission('eventos.alteracoes.executar'),
  EventChangeController.execute
);

router.post(
  '/:id/cancel',
  requirePermission('eventos.alteracoes.solicitar'),
  EventChangeController.cancel
);

export default router;
