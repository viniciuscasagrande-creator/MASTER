import { Router } from 'express';
import { EventSessionController } from './event-session.controller';
import { authenticate } from '../../../core/middleware/authenticate';
import { contextMiddleware } from '../../context/context.middleware';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(contextMiddleware);

// --- 1. Resumo e KPIs de Sessões ---
router.get('/summary', requirePermission('eventos.sessoes.visualizar'), EventSessionController.getSessionSummary);

// --- 2. Conflitos de Agenda e Local ---
router.get('/conflicts', requirePermission('eventos.sessoes.visualizar'), EventSessionController.checkConflicts);

// --- 3. Recorrência e Lotes ---
router.post('/bulk-preview', requirePermission('eventos.sessoes.visualizar'), EventSessionController.previewRecurrence);
router.post('/bulk-create', requirePermission('eventos.sessoes.criar'), EventSessionController.createBulkSessions);

// --- 4. Listagem de Sessões do Evento ---
router.get('/', requirePermission('eventos.sessoes.visualizar'), EventSessionController.listSessions);

// --- 5. Criar Sessão ---
router.post('/', requirePermission('eventos.sessoes.criar'), EventSessionController.createSession);

// --- 6. Detalhes de uma Sessão ---
router.get('/:sessionId', requirePermission('eventos.sessoes.visualizar'), EventSessionController.getSession);

// --- 7. Atualizar Sessão ---
router.put('/:sessionId', requirePermission('eventos.sessoes.editar'), EventSessionController.updateSession);

// --- 8. Alterar Status (State Machine) ---
router.post('/:sessionId/status', requirePermission('eventos.sessoes.status.alterar'), EventSessionController.changeStatus);

// --- 9. Duplicar Sessão ---
router.post('/:sessionId/duplicate', requirePermission('eventos.sessoes.duplicar'), EventSessionController.duplicateSession);

// --- 10. Reservas Técnicas de Capacidade ---
router.post('/:sessionId/reservations', requirePermission('eventos.sessoes.capacidade.gerenciar'), EventSessionController.addReservation);
router.delete('/:sessionId/reservations/:reservationId', requirePermission('eventos.sessoes.capacidade.gerenciar'), EventSessionController.removeReservation);

// --- 11. Arquivar Sessão ---
router.post('/:sessionId/archive', requirePermission('eventos.sessoes.arquivar'), EventSessionController.archiveSession);

export default router;
