import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/authenticate';
import { OperationSnapshotService } from './snapshot/operation-snapshot.service';
import { OperationReadinessService } from './readiness/operation-readiness.service';
import { OperationTransitionService } from './lifecycle/operation-transition.service';
import { OperationCommandService } from './commands/operation-command.service';
import { OperationAreaService } from './areas/operation-area.service';
import { OperationShiftService } from './team/operation-shift.service';
import { SessionAccessPointService } from './access-points/session-access-point.service';
import { OperationBroadcastService } from './communication/operation-broadcast.service';
import { OperationHandoffService } from './communication/operation-handoff.service';
import { OperationTimelineService } from './timeline/operation-timeline.service';
import { prisma } from '../../../core/database/prisma';

export class EventOperationController {
  private static async resolveSessionId(eventId: string, rawSessionId?: any): Promise<string> {
    if (rawSessionId) return String(rawSessionId);
    const session = await prisma.eventSession.findFirst({ where: { eventId } });
    if (!session) throw new Error('Nenhuma sessão encontrada para este evento.');
    return session.id;
  }

  public static async getSnapshot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const rawSessionId = req.params.sessionId || req.query.sessionId;
      const sessionId = rawSessionId ? String(rawSessionId) : undefined;

      const snapshot = await OperationSnapshotService.getSnapshot(eventId, sessionId);
      res.status(200).json({ success: true, data: snapshot });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async getReadiness(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = await EventOperationController.resolveSessionId(eventId, req.params.sessionId || req.query.sessionId);

      const opSession = await prisma.eventOperationSession.findUnique({
        where: { eventId_sessionId: { eventId, sessionId } }
      });
      const opId = opSession?.id || 'pending-op';

      const readiness = await OperationReadinessService.evaluateReadiness(eventId, sessionId, opId);
      res.status(200).json({ success: true, data: readiness });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async startOperation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = await EventOperationController.resolveSessionId(eventId, req.params.sessionId || req.body.sessionId);
      const { override, overrideReason, notes } = req.body;

      const result = await OperationTransitionService.executeTransition({
        eventId,
        sessionId,
        targetStatus: 'OPENING',
        userId: req.user?.id || 'system',
        userName: req.user?.name || req.user?.email || 'Operador',
        override,
        overrideReason,
        notes
      });

      res.status(200).json({ success: true, data: result, message: 'Operação iniciada com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async closingOperation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = await EventOperationController.resolveSessionId(eventId, req.params.sessionId || req.body.sessionId);
      const { override, overrideReason, notes } = req.body;

      const result = await OperationTransitionService.executeTransition({
        eventId,
        sessionId,
        targetStatus: 'CLOSING',
        userId: req.user?.id || 'system',
        userName: req.user?.name || req.user?.email || 'Operador',
        override,
        overrideReason,
        notes
      });

      res.status(200).json({ success: true, data: result, message: 'Processo de encerramento iniciado.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async closeOperation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = await EventOperationController.resolveSessionId(eventId, req.params.sessionId || req.body.sessionId);
      const { override, overrideReason, notes } = req.body;

      const result = await OperationTransitionService.executeTransition({
        eventId,
        sessionId,
        targetStatus: 'CLOSED',
        userId: req.user?.id || 'system',
        userName: req.user?.name || req.user?.email || 'Operador',
        override,
        overrideReason,
        notes
      });

      res.status(200).json({ success: true, data: result, message: 'Operação encerrada com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async executeCommand(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = await EventOperationController.resolveSessionId(eventId, req.params.sessionId || req.body.sessionId);

      const opSession = await prisma.eventOperationSession.findUnique({
        where: { eventId_sessionId: { eventId, sessionId } }
      });
      const operationId = opSession?.id || `ops_${Date.now()}`;

      const { commandType, targetType, targetId, executionMode, idempotencyKey, reason, payload } = req.body;

      const result = await OperationCommandService.executeCommand({
        operationId,
        sessionId,
        eventId,
        commandType,
        targetType: targetType || 'SESSION',
        targetId,
        requestedBy: req.user?.id || 'system',
        requestedByName: req.user?.name || req.user?.email || 'Operador',
        executionMode: executionMode || 'LOGICAL',
        idempotencyKey,
        reason,
        payload
      });

      res.status(200).json({ success: true, data: result, message: `Comando ${commandType} executado com sucesso.` });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async listCommands(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = await EventOperationController.resolveSessionId(eventId, req.params.sessionId || req.query.sessionId);

      const opSession = await prisma.eventOperationSession.findUnique({
        where: { eventId_sessionId: { eventId, sessionId } }
      });
      if (!opSession) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      const list = await OperationCommandService.listCommands(opSession.id);
      res.status(200).json({ success: true, data: list });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async listAreas(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const rawSessionId = req.params.sessionId || req.query.sessionId;
      const sessionId = rawSessionId ? String(rawSessionId) : undefined;

      const areas = await OperationAreaService.listAreas(eventId, sessionId);
      res.status(200).json({ success: true, data: areas });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async updateAreaLead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const areaId = String(req.params.areaId);
      const { leadUserId, leadUserName } = req.body;
      const updated = await OperationAreaService.updateAreaLead(areaId, leadUserId, leadUserName);
      res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async listTeamShifts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = await EventOperationController.resolveSessionId(eventId, req.params.sessionId || req.query.sessionId);

      const opSession = await prisma.eventOperationSession.findUnique({
        where: { eventId_sessionId: { eventId, sessionId } }
      });
      const operationId = opSession?.id || 'pending-op';

      const shifts = await OperationShiftService.listShifts(operationId, eventId);
      res.status(200).json({ success: true, data: shifts });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async checkInShift(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const shiftId = String(req.params.shiftId);
      const { notes } = req.body;
      const result = await OperationShiftService.checkInMember(shiftId, notes);
      res.status(200).json({ success: true, data: result, message: 'Presença confirmada.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async checkOutShift(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const shiftId = String(req.params.shiftId);
      const { notes } = req.body;
      const result = await OperationShiftService.checkOutMember(shiftId, notes);
      res.status(200).json({ success: true, data: result, message: 'Saída de turno registrada.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async listAccessPoints(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = await EventOperationController.resolveSessionId(eventId, req.params.sessionId || req.query.sessionId);

      const points = await SessionAccessPointService.listAccessPoints(sessionId);
      res.status(200).json({ success: true, data: points });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async updateAccessPointStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accessPointId = String(req.params.accessPointId);
      const { status, executionMode } = req.body;
      const updated = await SessionAccessPointService.updateStatus(accessPointId, status, executionMode);
      res.status(200).json({ success: true, data: updated, message: `Status do ponto de acesso atualizado para ${status}.` });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async listBroadcasts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = await EventOperationController.resolveSessionId(eventId, req.params.sessionId || req.query.sessionId);

      const opSession = await prisma.eventOperationSession.findUnique({
        where: { eventId_sessionId: { eventId, sessionId } }
      });
      if (!opSession) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      const list = await OperationBroadcastService.listBroadcasts(opSession.id);
      res.status(200).json({ success: true, data: list });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async createBroadcast(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = await EventOperationController.resolveSessionId(eventId, req.params.sessionId || req.body.sessionId);

      const opSession = await prisma.eventOperationSession.findUnique({
        where: { eventId_sessionId: { eventId, sessionId } }
      });
      const operationId = opSession?.id || `ops_${Date.now()}`;

      const { targetAreaId, priority, title, message, requiresAck } = req.body;

      const record = await OperationBroadcastService.createBroadcast({
        operationId,
        eventId,
        targetAreaId,
        priority: priority || 'INFO',
        title,
        message,
        sentBy: req.user?.id || 'system',
        sentByName: req.user?.name || req.user?.email || 'Comando Operacional',
        requiresAck
      });

      res.status(201).json({ success: true, data: record, message: 'Comunicado emitido aos operadores.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async ackBroadcast(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const broadcastId = String(req.params.broadcastId);
      const receipt = await OperationBroadcastService.acknowledgeBroadcast({
        broadcastId,
        userId: req.user?.id || 'system',
        userName: req.user?.name || req.user?.email || 'Operador'
      });
      res.status(200).json({ success: true, data: receipt, message: 'Comunicado confirmado.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async listHandoffs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = await EventOperationController.resolveSessionId(eventId, req.params.sessionId || req.query.sessionId);

      const opSession = await prisma.eventOperationSession.findUnique({
        where: { eventId_sessionId: { eventId, sessionId } }
      });
      if (!opSession) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      const list = await OperationHandoffService.listHandoffs(opSession.id);
      res.status(200).json({ success: true, data: list });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async registerHandoff(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = await EventOperationController.resolveSessionId(eventId, req.params.sessionId || req.body.sessionId);

      const opSession = await prisma.eventOperationSession.findUnique({
        where: { eventId_sessionId: { eventId, sessionId } }
      });
      const operationId = opSession?.id || `ops_${Date.now()}`;

      const { areaId, toUserId, toUserName, notes } = req.body;

      const record = await OperationHandoffService.registerHandoff({
        operationId,
        eventId,
        areaId,
        fromUserId: req.user?.id || 'system',
        fromUserName: req.user?.name || req.user?.email || 'Líder Operacional',
        toUserId,
        toUserName,
        notes
      });

      res.status(201).json({ success: true, data: record, message: 'Passagem de turno concluída e registrada.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async getTimeline(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = await EventOperationController.resolveSessionId(eventId, req.params.sessionId || req.query.sessionId);

      const opSession = await prisma.eventOperationSession.findUnique({
        where: { eventId_sessionId: { eventId, sessionId } }
      });
      if (!opSession) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      const afterSeq = req.query.afterSequence ? parseInt(String(req.query.afterSequence), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;

      const timeline = OperationTimelineService.getTimeline(opSession.id, limit, afterSeq);
      res.status(200).json({ success: true, data: timeline, sequence: OperationTimelineService.getLatestSequence(opSession.id) });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
