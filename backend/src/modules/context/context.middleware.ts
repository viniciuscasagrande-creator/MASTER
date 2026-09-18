import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../core/database/prisma';
import { AuditService } from '../audit/audit.service';

export interface RequestContext {
  userId: string;
  isSuperAdmin: boolean;
  producerId: string | null;
  eventId: string | null;
  permissions: string[];
  allowedProducerIds: string[];
  allowedEventIds: string[];
}

declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

/**
 * Context Engine Middleware:
 * Resolves active operational context (Producer & Event) from client headers or user defaults.
 * Strictly verifies that the user possesses authorization for the requested context.
 * Prevents client-side context manipulation (returns 403 CONTEXT_ACCESS_DENIED).
 */
export const contextMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;

  // If unauthenticated route, continue without context
  if (!user) {
    return next();
  }

  try {
    const rawProducerHeader = req.headers['x-producer-id'];
    const rawEventHeader = req.headers['x-event-id'];

    const requestedProducerId =
      rawProducerHeader && typeof rawProducerHeader === 'string' && rawProducerHeader !== 'all' && rawProducerHeader !== 'null'
        ? rawProducerHeader.trim()
        : null;

    const requestedEventId =
      rawEventHeader && typeof rawEventHeader === 'string' && rawEventHeader !== 'all' && rawEventHeader !== 'null'
        ? rawEventHeader.trim()
        : null;

    let activeProducerId: string | null = null;
    let activeEventId: string | null = null;

    // 1. Resolve & Validate Producer Context
    if (requestedProducerId) {
      // Validate that producer exists
      const producer = await prisma.producer.findUnique({
        where: { id: requestedProducerId }
      });

      if (!producer) {
        res.status(404).json({ error: 'Produtor do contexto não encontrado.' });
        return;
      }

      // Check if user has permission to access this producer
      if (!user.isSuperAdmin && !user.scope.isGlobal) {
        if (!user.scope.producers.includes(requestedProducerId)) {
          await AuditService.log({
            userId: user.id,
            userName: user.name,
            action: 'CONTEXT_ACCESS_DENIED_PRODUCER',
            resource: 'CONTEXT',
            producerId: requestedProducerId,
            details: `Tentativa de manipulação de contexto: Usuário solicitou Produtor ${requestedProducerId} fora de seu escopo.`,
            ipAddress: req.ip || '127.0.0.1',
            result: 'DENIED'
          });

          res.status(403).json({
            error: '403 — Você não possui acesso a este produtor no contexto.',
            code: 'CONTEXT_ACCESS_DENIED',
            statusCode: 403,
            details: {
              requestedProducerId,
              authorizedProducers: user.scope.producers
            }
          });
          return;
        }
      }

      activeProducerId = requestedProducerId;
    } else {
      // Auto-lock for single-producer users
      if (!user.isSuperAdmin && !user.scope.isGlobal && user.scope.producers.length === 1) {
        activeProducerId = user.scope.producers[0];
      }
    }

    // 2. Resolve & Validate Event Context
    if (requestedEventId) {
      // Validate that event exists
      const event = await prisma.event.findUnique({
        where: { id: requestedEventId }
      });

      if (!event) {
        res.status(404).json({ error: 'Evento do contexto não encontrado.' });
        return;
      }

      // Check if user has permission to access this event
      if (!user.isSuperAdmin && !user.scope.isGlobal) {
        const isEventAllowed = user.scope.events.length === 0 || user.scope.events.includes(requestedEventId);
        const isProducerAllowed = user.scope.producers.includes(event.producerId);

        if (!isEventAllowed || !isProducerAllowed) {
          await AuditService.log({
            userId: user.id,
            userName: user.name,
            action: 'CONTEXT_ACCESS_DENIED_EVENT',
            resource: 'CONTEXT',
            eventId: requestedEventId,
            producerId: event.producerId,
            details: `Tentativa de manipulação de contexto: Usuário solicitou Evento ${requestedEventId} (pertencente a ${event.producerId}) sem autorização.`,
            ipAddress: req.ip || '127.0.0.1',
            result: 'DENIED'
          });

          res.status(403).json({
            error: '403 — Você não possui acesso a este evento no contexto.',
            code: 'CONTEXT_ACCESS_DENIED',
            statusCode: 403,
            details: {
              requestedEventId,
              eventProducerId: event.producerId,
              authorizedEvents: user.scope.events,
              authorizedProducers: user.scope.producers
            }
          });
          return;
        }
      }

      // If an active producer was set, check that the event belongs to this producer
      if (activeProducerId && event.producerId !== activeProducerId) {
        res.status(400).json({
          error: 'O evento solicitado não pertence ao produtor ativo selecionado.',
          details: {
            eventProducerId: event.producerId,
            activeProducerId
          }
        });
        return;
      }

      // If active producer was not set, auto-align active producer to the event's producer
      if (!activeProducerId) {
        activeProducerId = event.producerId;
      }

      activeEventId = requestedEventId;
    } else {
      // Auto-lock for single-event users
      if (!user.isSuperAdmin && !user.scope.isGlobal && user.scope.events.length === 1) {
        activeEventId = user.scope.events[0];
      }
    }

    // Attach validated context to request
    req.context = {
      userId: user.id,
      isSuperAdmin: user.isSuperAdmin,
      producerId: activeProducerId,
      eventId: activeEventId,
      permissions: user.permissions,
      allowedProducerIds: user.scope.producers,
      allowedEventIds: user.scope.events
    };

    next();
  } catch (err) {
    next(err);
  }
};
