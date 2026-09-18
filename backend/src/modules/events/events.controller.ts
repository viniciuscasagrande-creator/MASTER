import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../core/database/prisma';
import { buildScopeFilter } from '../../core/middleware/requireScope';
import { NotFoundError } from '../../core/errors/AppError';
import { AuditService } from '../audit/audit.service';

export class EventsRealController {
  public static async listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scopeFilter = buildScopeFilter(req.user!, { producerField: 'producerId' });
      const events = await prisma.event.findMany({
        where: scopeFilter
      });

      res.status(200).json({ total: events.length, events });
    } catch (err) {
      next(err);
    }
  }

  public static async getEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const event = await prisma.event.findUnique({
        where: { id: String(eventId) }
      });

      if (!event) throw new NotFoundError('Evento não encontrado.');
      res.status(200).json({ event, consultedBy: req.user?.name });
    } catch (err) {
      next(err);
    }
  }

  public static async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { producerId, title, venue } = req.body;

      const event = await prisma.event.create({
        data: {
          producerId: String(producerId),
          title,
          venue
        }
      });

      await AuditService.log({
        userId: req.user?.id,
        userName: req.user?.name,
        action: 'CREATE_EVENT',
        resource: `EVENT:${event.id}`,
        producerId: String(producerId),
        eventId: event.id,
        details: `Evento '${event.title}' cadastrado com sucesso.`,
        result: 'SUCCESS'
      });

      res.status(201).json({ success: true, event });
    } catch (err) {
      next(err);
    }
  }
}
