import { Request, Response } from 'express';
import { AccessValidationService } from './validation/access-validation.service';
import { AccessDeviceService } from './devices/access-device.service';
import { DeviceSessionService } from './devices/device-session.service';
import { AccessRuleService } from './rules/access-rule.service';
import { OfflineBundleService } from './offline/offline-bundle.service';
import { OfflineSyncService } from './offline/offline-sync.service';
import { AccessExceptionService } from './exceptions/access-exception.service';
import { TicketAccessBlockService } from './exceptions/ticket-access-block.service';
import { CheckinSummaryService } from './monitoring/checkin-summary.service';

export class CheckinController {
  public static async validate(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = req.params.sessionId ? String(req.params.sessionId) : (req.body.sessionId ? String(req.body.sessionId) : '');
      const operatorId = req.user?.id || 'sys_op';
      const operatorName = req.user?.name || 'Operador';

      const result = await AccessValidationService.validate({
        ...req.body,
        eventId,
        sessionId,
        operatorId: req.body.operatorId || operatorId,
        operatorName: req.body.operatorName || operatorName
      });

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao validar ingresso.' });
    }
  }

  public static async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = req.params.sessionId ? String(req.params.sessionId) : undefined;
      const summary = await CheckinSummaryService.getSummary(eventId, sessionId);
      res.status(200).json(summary);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao carregar resumo de check-in.' });
    }
  }

  public static async listDevices(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const devices = await AccessDeviceService.listDevices(eventId);
      res.status(200).json(devices);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao listar dispositivos.' });
    }
  }

  public static async registerDevice(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const device = await AccessDeviceService.registerDevice({
        ...req.body,
        eventId,
        registeredBy: req.user?.id || 'admin'
      });
      res.status(201).json(device);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao registrar dispositivo.' });
    }
  }

  public static async authorizeDevice(req: Request, res: Response): Promise<void> {
    try {
      const deviceId = String(req.params.deviceId);
      const device = await AccessDeviceService.authorizeDevice(deviceId, req.user?.id || 'admin');
      res.status(200).json(device);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao autorizar dispositivo.' });
    }
  }

  public static async revokeDevice(req: Request, res: Response): Promise<void> {
    try {
      const deviceId = String(req.params.deviceId);
      const { reason } = req.body;
      const device = await AccessDeviceService.revokeDevice(deviceId, reason || 'Revogação manual', req.user?.id || 'admin');
      res.status(200).json(device);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao revogar dispositivo.' });
    }
  }

  public static async recordHeartbeat(req: Request, res: Response): Promise<void> {
    try {
      const deviceId = String(req.params.deviceId);
      const { batteryLevel, appVersion } = req.body;
      const device = await AccessDeviceService.recordHeartbeat(deviceId, batteryLevel, appVersion);
      res.status(200).json(device);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro no heartbeat do dispositivo.' });
    }
  }

  public static async startDeviceSession(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const session = await DeviceSessionService.startSession({
        ...req.body,
        eventId,
        operatorId: req.user?.id || req.body.operatorId || 'op_1',
        operatorName: req.user?.name || req.body.operatorName || 'Operador'
      });
      res.status(201).json(session);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao iniciar sessão do dispositivo.' });
    }
  }

  public static async endDeviceSession(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const ended = await DeviceSessionService.endSession(sessionId);
      res.status(200).json(ended);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao finalizar sessão do dispositivo.' });
    }
  }

  public static async getActiveDeviceSession(req: Request, res: Response): Promise<void> {
    try {
      const deviceId = String(req.params.deviceId);
      const active = await DeviceSessionService.getActiveSession(deviceId);
      res.status(200).json(active);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao buscar sessão ativa do dispositivo.' });
    }
  }

  public static async listRules(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = req.params.sessionId ? String(req.params.sessionId) : undefined;
      const rules = await AccessRuleService.listRules(eventId, sessionId);
      res.status(200).json(rules);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao listar regras de acesso.' });
    }
  }

  public static async createRule(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const rule = await AccessRuleService.createRule({ ...req.body, eventId });
      res.status(201).json(rule);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao criar regra de acesso.' });
    }
  }

  public static async updateRule(req: Request, res: Response): Promise<void> {
    try {
      const ruleId = String(req.params.ruleId);
      const updated = await AccessRuleService.updateRule(ruleId, req.body);
      res.status(200).json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao atualizar regra de acesso.' });
    }
  }

  public static async generateOfflineBundle(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const { sessionId, accessPointId, deviceId, validityHours } = req.body;
      const bundle = await OfflineBundleService.generateBundle({
        eventId,
        sessionId,
        accessPointId,
        deviceId,
        validityHours
      });
      res.status(200).json(bundle);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao gerar pacote offline.' });
    }
  }

  public static async syncOfflineBatch(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const result = await OfflineSyncService.processOfflineBatch({
        ...req.body,
        eventId,
        operatorId: req.user?.id || req.body.operatorId || 'op_offline'
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao sincronizar lote offline.' });
    }
  }

  public static async listConflicts(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const conflicts = await OfflineSyncService.listConflicts(eventId);
      res.status(200).json(conflicts);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao listar conflitos.' });
    }
  }

  public static async resolveConflict(req: Request, res: Response): Promise<void> {
    try {
      const conflictId = String(req.params.conflictId);
      const { notes } = req.body;
      const resolved = await OfflineSyncService.resolveConflict(conflictId, req.user?.id || 'supervisor', notes);
      res.status(200).json(resolved);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao resolver conflito offline.' });
    }
  }

  public static async requestException(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const exc = await AccessExceptionService.requestException({
        ...req.body,
        eventId,
        operatorId: req.user?.id || req.body.operatorId || 'op_1',
        operatorName: req.user?.name || req.body.operatorName || 'Operador'
      });
      res.status(201).json(exc);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao solicitar exceção de acesso.' });
    }
  }

  public static async listPendingExceptions(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = req.params.sessionId ? String(req.params.sessionId) : undefined;
      const list = await AccessExceptionService.listPending(eventId, sessionId);
      res.status(200).json(list);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao listar exceções pendentes.' });
    }
  }

  public static async reviewException(req: Request, res: Response): Promise<void> {
    try {
      const requestId = String(req.params.requestId);
      const { status, decisionNotes } = req.body;
      const reviewed = await AccessExceptionService.reviewException({
        requestId,
        status,
        supervisorId: req.user?.id || 'supervisor',
        supervisorName: req.user?.name || 'Supervisor',
        decisionNotes
      });
      res.status(200).json(reviewed);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao avaliar exceção de acesso.' });
    }
  }

  public static async blockTicket(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const block = await TicketAccessBlockService.blockTicket({
        ...req.body,
        eventId,
        blockedBy: req.user?.id || 'admin',
        blockedByName: req.user?.name || 'Administrador'
      });
      res.status(201).json(block);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao bloquear ingresso.' });
    }
  }

  public static async unblockTicket(req: Request, res: Response): Promise<void> {
    try {
      const ticketId = String(req.params.ticketId);
      const { unblockReason } = req.body;
      const unblocked = await TicketAccessBlockService.unblockTicket({
        ticketId,
        unblockReason,
        unblockedBy: req.user?.id || 'admin'
      });
      res.status(200).json(unblocked);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao desbloquear ingresso.' });
    }
  }

  public static async listBlocks(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const blocks = await TicketAccessBlockService.listBlocks(eventId);
      res.status(200).json(blocks);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao listar bloqueios de ingressos.' });
    }
  }
}
