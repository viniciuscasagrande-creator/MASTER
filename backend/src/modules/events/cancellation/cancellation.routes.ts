import { Router } from 'express';
import { CancellationController } from './cancellation.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

// Impact calculation
router.get('/impact', requirePermission('eventos.cancelamento.avaliar_impacto'), CancellationController.calculateImpact);

// Request cancellation
router.post('/request', requirePermission('eventos.cancelamento.solicitar'), CancellationController.requestCancellation);

// List requests
router.get('/requests', requirePermission('eventos.cancelamento.solicitar'), CancellationController.listRequests);

// Execute cancellation
router.post('/requests/:requestId/execute', requirePermission('eventos.cancelamento.executar'), CancellationController.executeCancellation);

// Cancel specific session
router.post('/sessions/:sessionId/cancel', requirePermission('eventos.cancelamento.sessao.executar'), CancellationController.cancelSession);

export default router;
