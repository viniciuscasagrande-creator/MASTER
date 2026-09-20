import { Router } from 'express';
import { ClosureController } from './closure.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

// Readiness & Closure for individual Session
router.get('/sessions/:sessionId/readiness', requirePermission('eventos.encerramento.sessao.encerrar'), ClosureController.getSessionReadiness);
router.post('/sessions/:sessionId/close', requirePermission('eventos.encerramento.sessao.encerrar'), ClosureController.closeSession);

// Readiness & Closure for whole Event
router.get('/readiness', requirePermission('eventos.encerramento.evento.encerrar'), ClosureController.getEventReadiness);
router.post('/close', requirePermission('eventos.encerramento.evento.encerrar'), ClosureController.closeEvent);

// Blocker Overrides
router.post('/overrides', requirePermission('eventos.encerramento.override.aplicar'), ClosureController.applyOverride);

// Post-event Operational Report
router.get('/post-event', requirePermission('eventos.pos_evento.visualizar'), ClosureController.getPostEventReport);

export default router;
