import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/prisma';
import { AuditService } from '../../modules/audit/audit.service';
import { AuthenticatedUser } from './authenticate';

export interface RequireScopeOptions {
  producerParam?: string;
  eventParam?: string;
}

/**
 * Middleware requireScope:
 * Validates whether the requested resource (producer or event) is within the user's authorized scope.
 */
export const requireScope = (options: RequireScopeOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: '401 — Não autenticado.' });
      return;
    }

    // Super Admin or Global Scope bypasses segregation
    if (user.isSuperAdmin || user.scope.isGlobal) {
      return next();
    }

    // 1. Producer Scope Validation
    if (options.producerParam) {
      const requestedProducerId = String(
        req.params[options.producerParam] ||
        req.body[options.producerParam] ||
        req.query[options.producerParam] ||
        ''
      );

      if (requestedProducerId && !user.scope.producers.includes(requestedProducerId)) {
        await AuditService.log({
          userId: user.id,
          userName: user.name,
          action: 'SCOPE_VIOLATION_PRODUCER',
          resource: req.originalUrl,
          producerId: requestedProducerId,
          details: `Tentativa de acesso não autorizado ao produtor ${requestedProducerId}.`,
          ipAddress: req.ip || '127.0.0.1',
          result: 'DENIED'
        });

        res.status(403).json({
          error: 'Acesso não autorizado ao produtor solicitado.',
          statusCode: 403,
          details: {
            requestedProducerId,
            authorizedProducers: user.scope.producers
          }
        });
        return;
      }
    }

    // 2. Event Scope Validation (Producer -> Event relational check)
    if (options.eventParam) {
      const requestedEventId = String(
        req.params[options.eventParam] ||
        req.body[options.eventParam] ||
        req.query[options.eventParam] ||
        ''
      );

      if (requestedEventId) {
        // Query event in DB to check its owning producer
        const event = await prisma.event.findUnique({
          where: { id: requestedEventId }
        });

        const isDirectlyAuthorizedEvent =
          user.scope.events.length === 0 || user.scope.events.includes(requestedEventId);
        const isAuthorizedThroughProducer = event
          ? user.scope.producers.includes(event.producerId)
          : false;

        if (!isDirectlyAuthorizedEvent || !isAuthorizedThroughProducer) {
          await AuditService.log({
            userId: user.id,
            userName: user.name,
            action: 'SCOPE_VIOLATION_EVENT',
            resource: req.originalUrl,
            eventId: requestedEventId,
            producerId: event?.producerId,
            details: `Acesso não autorizado ao evento ${requestedEventId} (pertencente ao produtor ${event?.producerId}).`,
            ipAddress: req.ip || '127.0.0.1',
            result: 'DENIED'
          });

          res.status(403).json({
            error: 'Acesso não autorizado ao evento solicitado.',
            statusCode: 403,
            details: {
              requestedEventId,
              eventProducerId: event?.producerId,
              authorizedProducers: user.scope.producers
            }
          });
          return;
        }
      }
    }

    next();
  };
};

/**
 * Helper: buildScopeFilter
 * Returns a Prisma `where` clause fragment that restricts queries to authorized producers or events.
 */
export function buildScopeFilter(
  user: AuthenticatedUser,
  options: { producerField?: string; eventField?: string } = {}
): Record<string, any> {
  // If Super Admin or Global staff, no query restriction is needed
  if (user.isSuperAdmin || user.scope.isGlobal) {
    return {};
  }

  const filter: Record<string, any> = {};
  const producerField = options.producerField || 'producerId';
  const eventField = options.eventField || 'eventId';

  if (user.scope.producers.length > 0) {
    filter[producerField] = { in: user.scope.producers };
  }

  if (user.scope.events.length > 0) {
    filter[eventField] = { in: user.scope.events };
  }

  return filter;
}
