import { Request, Response } from 'express';
import { db } from '../core/database/index';

export class EventsController {
  public static listEvents(req: Request, res: Response): void {
    const user = req.user;

    // Filter events according to data scope
    let accessibleEvents = db.events;

    if (user && user.roleSlug !== 'admin_geral' && user.scope.type === 'PRODUCER') {
      accessibleEvents = db.events.filter(e => {
        const matchesProducer = user.scope.producerIds.includes(e.producerId);
        const matchesEvent = user.scope.eventIds.length === 0 || user.scope.eventIds.includes(e.id);
        return matchesProducer && matchesEvent;
      });
    }

    res.json({
      total: accessibleEvents.length,
      events: accessibleEvents
    });
  }

  public static getEventById(req: Request, res: Response): void {
    const { eventId } = req.params;
    const event = db.events.find(e => e.id === String(eventId));

    if (!event) {
      res.status(404).json({ error: 'Evento não encontrado.' });
      return;
    }

    res.json({
      event,
      authorizedFor: req.user?.name,
      scopeApplied: req.user?.scope.type
    });
  }

  public static createEvent(req: Request, res: Response): void {
    const { producerId, title, venue, date } = req.body;

    if (!producerId || !title || !venue || !date) {
      res.status(400).json({ error: 'Campos obrigatórios: producerId, title, venue, date.' });
      return;
    }

    const newEvent = {
      id: `evt-${Date.now()}`,
      producerId,
      title,
      venue,
      date,
      grossRevenue: 0
    };

    db.events.push(newEvent);

    db.logAudit({
      userId: req.user?.id || 'sys-admin',
      userName: req.user?.name || 'Administrador',
      action: 'CREATE_EVENT',
      module: 'EVENTOS',
      entityType: 'EVENT',
      entityId: newEvent.id,
      details: `Novo evento criado: '${title}' para o produtor ${producerId}.`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.status(201).json({
      success: true,
      event: newEvent
    });
  }
}
