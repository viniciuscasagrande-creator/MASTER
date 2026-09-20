import { Request, Response } from 'express';
import { EventSessionService } from './event-session.service';
import { SessionCapacityService } from './capacity/session-capacity.service';
import { SessionConflictService } from './conflicts/session-conflict.service';
import { SessionRecurrenceService } from './recurrence/session-recurrence.service';
import {
  createEventSessionSchema,
  updateEventSessionSchema,
  changeSessionStatusSchema,
  duplicateSessionSchema,
  addReservationSchema,
  recurrencePreviewSchema,
  recurrenceBulkCreateSchema
} from './event-session.schemas';

export class EventSessionController {
  public static async listSessions(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const { status, venueId, startAtFrom, startAtTo } = req.query as any;

      const sessions = await EventSessionService.listSessions(eventId, {
        status,
        venueId,
        startAtFrom,
        startAtTo
      });
      res.json({ success: true, sessions });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async getSessionSummary(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const summary = await EventSessionService.getSessionSummary(eventId);
      res.json({ success: true, summary });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getSession(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const session = await EventSessionService.getSessionById(sessionId);
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  }

  public static async createSession(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const input = createEventSessionSchema.parse(req.body);
      const user = (req as any).user;

      const session = await EventSessionService.createSession(eventId, input, user);
      res.status(201).json({ success: true, session });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async updateSession(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const input = updateEventSessionSchema.parse(req.body);
      const user = (req as any).user;

      const session = await EventSessionService.updateSession(sessionId, input, user);
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async changeStatus(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const { status, reason } = changeSessionStatusSchema.parse(req.body);
      const user = (req as any).user;

      const session = await EventSessionService.changeSessionStatus(
        sessionId,
        status as any,
        user,
        reason
      );
      res.json({ success: true, session, message: `Status alterado para ${status}.` });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async duplicateSession(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const input = duplicateSessionSchema.parse(req.body);
      const user = (req as any).user;

      const newSession = await EventSessionService.duplicateSession(sessionId, input, user);
      res.status(201).json({ success: true, session: newSession });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async archiveSession(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const user = (req as any).user;

      const session = await EventSessionService.archiveSession(sessionId, user);
      res.json({ success: true, session, message: 'Sessão arquivada com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async addReservation(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const input = addReservationSchema.parse(req.body);
      const user = (req as any).user;

      const reservation = await SessionCapacityService.addReservation(
        sessionId,
        input as any,
        user
      );
      res.status(201).json({ success: true, reservation });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async removeReservation(req: Request, res: Response): Promise<void> {
    try {
      const reservationId = req.params.reservationId as string;
      const user = (req as any).user;

      await SessionCapacityService.removeReservation(reservationId, user);
      res.json({ success: true, message: 'Reserva técnica removida com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async previewRecurrence(req: Request, res: Response): Promise<void> {
    try {
      const input = recurrencePreviewSchema.parse(req.body);
      const preview = await SessionRecurrenceService.previewRecurrence(input);
      res.json({ success: true, ...preview });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async createBulkSessions(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const input = recurrenceBulkCreateSchema.parse(req.body);
      const user = (req as any).user;

      const sessions = await SessionRecurrenceService.createBulkSessions(eventId, input, user);
      res.status(201).json({ success: true, sessions });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async checkConflicts(req: Request, res: Response): Promise<void> {
    try {
      const { venueId, startAt, endAt, doorsOpenAt, excludeSessionId } = req.query as any;
      if (!venueId || !startAt) {
        res.status(400).json({ success: false, message: 'venueId e startAt são obrigatórios.' });
        return;
      }

      const conflicts = await SessionConflictService.detectConflicts(
        venueId,
        new Date(startAt),
        endAt ? new Date(endAt) : null,
        doorsOpenAt ? new Date(doorsOpenAt) : null,
        excludeSessionId
      );

      res.json({ success: true, ...conflicts });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
