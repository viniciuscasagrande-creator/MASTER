import { Request, Response } from 'express';
import { EventCancellationService } from './event-cancellation.service';
import { SessionCancellationService } from './session-cancellation.service';
import { CancellationImpactService } from './cancellation-impact.service';

export class CancellationController {
  public static async calculateImpact(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = req.query.sessionId ? String(req.query.sessionId) : undefined;
      const impact = await CancellationImpactService.calculateImpact({ eventId, sessionId });
      res.status(200).json(impact);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao calcular impacto do cancelamento.' });
    }
  }

  public static async requestCancellation(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const request = await EventCancellationService.requestCancellation({
        ...req.body,
        eventId,
        requestedBy: req.user?.id || 'sys_user',
        requestedByName: req.user?.name || 'Administrador'
      });
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao solicitar cancelamento do evento.' });
    }
  }

  public static async executeCancellation(req: Request, res: Response): Promise<void> {
    try {
      const requestId = String(req.params.requestId);
      const result = await EventCancellationService.executeCancellation({
        requestId,
        executedBy: req.user?.id || 'sys_user',
        executedByName: req.user?.name || 'Administrador'
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao executar cancelamento.' });
    }
  }

  public static async cancelSession(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = String(req.params.sessionId);
      const result = await SessionCancellationService.cancelSession({
        ...req.body,
        eventId,
        sessionId,
        cancelledBy: req.user?.id || 'sys_user',
        cancelledByName: req.user?.name || 'Administrador'
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao cancelar sessão.' });
    }
  }

  public static async listRequests(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const list = await EventCancellationService.listRequests(eventId);
      res.status(200).json(list);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao listar solicitações de cancelamento.' });
    }
  }
}
