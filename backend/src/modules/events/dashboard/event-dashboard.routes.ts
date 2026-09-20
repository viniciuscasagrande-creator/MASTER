import { Router } from 'express';
import { EventDashboardController } from './event-dashboard.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

router.get(
  '/',
  requirePermission('eventos.visualizar'),
  EventDashboardController.getDashboard
);

router.get(
  '/alerts',
  requirePermission('eventos.visualizar'),
  EventDashboardController.getAlerts
);

export default router;
