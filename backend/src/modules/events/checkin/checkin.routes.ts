import { Router } from 'express';
import { CheckinController } from './checkin.controller';
import { requirePermission, requireAnyPermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

// 1. Validar Check-in
router.post('/validate', requirePermission('eventos.checkin.validar'), CheckinController.validate);

// 2. Resumo e KPIs de Check-in em tempo real
router.get('/summary', requirePermission('eventos.checkin.relatorios.visualizar'), CheckinController.getSummary);

// 3. Dispositivos & Scanners
router.get('/devices', requirePermission('eventos.checkin.dispositivos.visualizar'), CheckinController.listDevices);
router.post('/devices', requirePermission('eventos.checkin.dispositivos.autorizar'), CheckinController.registerDevice);
router.post('/devices/:deviceId/authorize', requirePermission('eventos.checkin.dispositivos.autorizar'), CheckinController.authorizeDevice);
router.post('/devices/:deviceId/revoke', requirePermission('eventos.checkin.dispositivos.revogar'), CheckinController.revokeDevice);
router.post('/devices/:deviceId/heartbeat', requirePermission('eventos.checkin.validar'), CheckinController.recordHeartbeat);

// 4. Sessões de Dispositivo (Turnos de Operador)
router.post('/devices/sessions/start', requirePermission('eventos.checkin.dispositivos.vincular'), CheckinController.startDeviceSession);
router.post('/devices/sessions/:sessionId/end', requirePermission('eventos.checkin.dispositivos.vincular'), CheckinController.endDeviceSession);
router.get('/devices/:deviceId/session', requirePermission('eventos.checkin.dispositivos.visualizar'), CheckinController.getActiveDeviceSession);

// 5. Regras de Acesso e Reentrada
router.get('/rules', requirePermission('eventos.checkin.regras.gerenciar'), CheckinController.listRules);
router.post('/rules', requirePermission('eventos.checkin.regras.gerenciar'), CheckinController.createRule);
router.put('/rules/:ruleId', requirePermission('eventos.checkin.regras.gerenciar'), CheckinController.updateRule);

// 6. Operação Offline e Sincronização
router.post('/offline/bundle', requirePermission('eventos.checkin.offline.sincronizar'), CheckinController.generateOfflineBundle);
router.post('/offline/sync', requirePermission('eventos.checkin.offline.sincronizar'), CheckinController.syncOfflineBatch);
router.get('/offline/conflicts', requirePermission('eventos.checkin.relatorios.visualizar'), CheckinController.listConflicts);
router.post('/offline/conflicts/:conflictId/resolve', requirePermission('eventos.checkin.excecao.aprovar'), CheckinController.resolveConflict);

// 7. Exceções de Acesso
router.post('/exceptions', requirePermission('eventos.checkin.excecao.solicitar'), CheckinController.requestException);
router.get('/exceptions/pending', requirePermission('eventos.checkin.excecao.aprovar'), CheckinController.listPendingExceptions);
router.post('/exceptions/:requestId/review', requirePermission('eventos.checkin.excecao.aprovar'), CheckinController.reviewException);

// 8. Bloqueios Administrativos de Ingressos
router.post('/blocks', requirePermission('eventos.checkin.bloqueio.gerenciar'), CheckinController.blockTicket);
router.post('/blocks/:ticketId/unblock', requirePermission('eventos.checkin.bloqueio.gerenciar'), CheckinController.unblockTicket);
router.get('/blocks', requirePermission('eventos.checkin.bloqueio.gerenciar'), CheckinController.listBlocks);

export default router;
