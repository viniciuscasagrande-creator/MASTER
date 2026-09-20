import { Router } from 'express';
import { EventReadinessController } from './event-readiness.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

router.get('/', requirePermission('eventos.preparacao.visualizar'), EventReadinessController.evaluateReadiness);
router.post('/evaluate', requirePermission('eventos.preparacao.avaliar'), EventReadinessController.evaluateReadiness);

export default router;
