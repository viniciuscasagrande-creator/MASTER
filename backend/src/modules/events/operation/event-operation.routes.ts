import { Router } from 'express';
import { EventOperationController } from './event-operation.controller';
import { requirePermission } from '../../../core/middleware/requirePermission';

const router = Router({ mergeParams: true });

// 1. Snapshot & Readiness
router.get('/snapshot', requirePermission('eventos.operacao.visualizar'), EventOperationController.getSnapshot);
router.get('/readiness', requirePermission('eventos.operacao.visualizar'), EventOperationController.getReadiness);

// 2. Lifecycle transitions
router.post('/start', requirePermission('eventos.operacao.iniciar'), EventOperationController.startOperation);
router.post('/closing', requirePermission('eventos.operacao.encerrar'), EventOperationController.closingOperation);
router.post('/close', requirePermission('eventos.operacao.encerrar'), EventOperationController.closeOperation);

// 3. Typed Commands
router.post('/commands', requirePermission('eventos.operacao.comandos.executar'), EventOperationController.executeCommand);
router.get('/commands', requirePermission('eventos.operacao.visualizar'), EventOperationController.listCommands);

// 4. Areas
router.get('/areas', requirePermission('eventos.operacao.areas.visualizar'), EventOperationController.listAreas);
router.put('/areas/:areaId/lead', requirePermission('eventos.operacao.equipe.gerenciar'), EventOperationController.updateAreaLead);

// 5. Team Shifts & Presence
router.get('/team', requirePermission('eventos.operacao.equipe.visualizar'), EventOperationController.listTeamShifts);
router.post('/team/:shiftId/checkin', requirePermission('eventos.operacao.equipe.gerenciar'), EventOperationController.checkInShift);
router.post('/team/:shiftId/checkout', requirePermission('eventos.operacao.equipe.gerenciar'), EventOperationController.checkOutShift);

// 6. Access Points & Gates
router.get('/access-points', requirePermission('eventos.operacao.acessos.visualizar'), EventOperationController.listAccessPoints);
router.put('/access-points/:accessPointId/status', requirePermission('eventos.operacao.acessos.operar'), EventOperationController.updateAccessPointStatus);

// 7. Internal Communication (Broadcasts)
router.get('/broadcasts', requirePermission('eventos.operacao.visualizar'), EventOperationController.listBroadcasts);
router.post('/broadcasts', requirePermission('eventos.operacao.comunicados.enviar'), EventOperationController.createBroadcast);
router.post('/broadcasts/:broadcastId/ack', requirePermission('eventos.operacao.visualizar'), EventOperationController.ackBroadcast);

// 8. Shift Handoff
router.get('/handoff', requirePermission('eventos.operacao.visualizar'), EventOperationController.listHandoffs);
router.post('/handoff', requirePermission('eventos.operacao.handoff.realizar'), EventOperationController.registerHandoff);

// 9. Live Timeline
router.get('/timeline', requirePermission('eventos.operacao.visualizar'), EventOperationController.getTimeline);

export default router;
