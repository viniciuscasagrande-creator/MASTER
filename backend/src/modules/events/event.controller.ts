import { Request, Response, NextFunction } from 'express';
import { EventService } from './event.service';
import {
  listEventsQuerySchema,
  getEventParamsSchema,
  createEventSchema
} from './event.schemas';

export class EventController {
  public static async listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const filters = listEventsQuerySchema.parse(req.query);
      const result = await EventService.listEvents(user, filters);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getEventSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const requestedProducerId = req.query.producerId ? String(req.query.producerId) : undefined;
      const summary = await EventService.getEventSummary(user, requestedProducerId);

      res.status(200).json({
        success: true,
        summary
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { eventId } = getEventParamsSchema.parse(req.params);
      const event = await EventService.getEventById(user, eventId);

      res.status(200).json({
        success: true,
        event
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const input = createEventSchema.parse(req.body);
      const event = await EventService.createEvent(user, input);

      res.status(201).json({
        success: true,
        message: 'Evento cadastrado com sucesso em status de Rascunho.',
        event
      });
    } catch (err) {
      next(err);
    }
  }

  public static async selectEventContext(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { eventId } = getEventParamsSchema.parse(req.params);
      const event = await EventService.selectEventContext(user, eventId);

      res.status(200).json({
        success: true,
        message: `Contexto operacional alterado para o evento "${event.name}".`,
        event
      });
    } catch (err) {
      next(err);
    }
  }
}
