import { Request, Response } from 'express';
import { SessionClosureService } from './session-closure.service';
import { EventClosureService } from './event-closure.service';
import { ClosureOverrideService } from './overrides/closure-override.service';
import { PostEventService } from './post-event/post-event.service';

export class ClosureController {
  // Session readiness check
  public static async getSessionReadiness(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = String(req.params.sessionId);
      const readiness = await SessionClosureService.getReadiness(eventId, sessionId);
      res.status(200).json(readiness);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao avaliar prontidão de encerramento da sessão.' });
    }
  }

  // Close session
  public static async closeSession(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const sessionId = String(req.params.sessionId);
      const { notes } = req.body;
      const closed = await SessionClosureService.closeSession({
        eventId,
        sessionId,
        closedBy: req.user?.id || 'sys_user',
        closedByName: req.user?.name || 'Administrador',
        notes
      });
      res.status(200).json(closed);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao encerrar sessão.' });
    }
  }

  // Event readiness check
  public static async getEventReadiness(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const readiness = await EventClosureService.getReadiness(eventId);
      res.status(200).json(readiness);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao avaliar prontidão de encerramento do evento.' });
    }
  }

  // Close entire event
  public static async closeEvent(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const { notes } = req.body;
      const result = await EventClosureService.closeEvent({
        eventId,
        closedBy: req.user?.id || 'sys_user',
        closedByName: req.user?.name || 'Administrador',
        notes
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao encerrar evento.' });
    }
  }

  // Apply blocker override
  public static async applyOverride(req: Request, res: Response): Promise<void> {
    try {
      const { scope, targetId, checkCode, justification } = req.body;
      const override = await ClosureOverrideService.applyOverride({
        scope: scope || 'SESSION',
        targetId: targetId || (req.params.sessionId ? String(req.params.sessionId) : String(req.params.eventId)),
        checkCode,
        justification,
        authorizedBy: req.user?.id || 'supervisor',
        authorizedByName: req.user?.name || 'Supervisor'
      });
      res.status(201).json(override);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao aplicar override em bloqueador.' });
    }
  }

  // Post event report
  public static async getPostEventReport(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const report = await PostEventService.getReport(eventId);
      res.status(200).json(report);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao gerar relatório pós-evento.' });
    }
  }
}
