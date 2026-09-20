import { ForbiddenError } from '../../../core/errors/AppError';
import { AuditService } from '../../audit/audit.service';

export interface AuthenticatedUserContext {
  id: string;
  name: string;
  isSuperAdmin?: boolean;
  scope: {
    isGlobal?: boolean;
    producers: string[];
    events: string[];
  };
  permissions: string[];
}

export class CommercialScopePolicy {
  /**
   * Checks if user has permission to access given producer and/or event
   */
  public static canAccessScope(
    user: AuthenticatedUserContext,
    targetProducerId?: string,
    targetEventId?: string
  ): boolean {
    if (user.isSuperAdmin || user.scope?.isGlobal) {
      return true;
    }

    if (targetProducerId && !user.scope?.producers?.includes(targetProducerId)) {
      return false;
    }

    if (targetEventId && user.scope?.events?.length > 0 && !user.scope?.events?.includes(targetEventId)) {
      return false;
    }

    return true;
  }

  /**
   * Enforces scope rules, throwing ForbiddenError and recording an audit record if unauthorized
   */
  public static async enforceScope(
    user: AuthenticatedUserContext,
    targetProducerId?: string,
    targetEventId?: string,
    ipAddress?: string
  ): Promise<void> {
    if (!this.canAccessScope(user, targetProducerId, targetEventId)) {
      await AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'COMMERCIAL_SCOPE_VIOLATION',
        resource: 'COMMERCIAL_DATA',
        producerId: targetProducerId,
        eventId: targetEventId,
        details: {
          message: 'Acesso bloqueado por isolamento multi-tenant comercial.',
          requestedProducer: targetProducerId,
          requestedEvent: targetEventId,
          authorizedProducers: user.scope?.producers || [],
          authorizedEvents: user.scope?.events || []
        },
        ipAddress: ipAddress || '127.0.0.1',
        result: 'DENIED'
      });

      throw new ForbiddenError('Acesso não autorizado ao produtor ou evento solicitado.', {
        scopeIssue: 'PRODUCER_OR_EVENT_MISMATCH',
        authorizedScope: user.scope
      });
    }
  }

  /**
   * Enforces scope when accessing a specific order
   */
  public static async enforceOrderAccess(
    user: AuthenticatedUserContext,
    order: { id: string; producerId: string; eventId?: string },
    ipAddress?: string
  ): Promise<void> {
    if (!this.canAccessScope(user, order.producerId, order.eventId)) {
      await AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'COMMERCIAL_ORDER_SCOPE_VIOLATION',
        resource: `ORDER:${order.id}`,
        producerId: order.producerId,
        eventId: order.eventId,
        details: {
          message: `Tentativa de acessar pedido ${order.id} pertencente ao produtor ${order.producerId}.`,
          orderId: order.id,
          orderProducerId: order.producerId,
          userAuthorizedProducers: user.scope?.producers || []
        },
        ipAddress: ipAddress || '127.0.0.1',
        result: 'DENIED'
      });

      throw new ForbiddenError('Acesso não autorizado ao pedido solicitado.', {
        scopeIssue: 'ORDER_PRODUCER_MISMATCH',
        authorizedScope: user.scope
      });
    }
  }

  /**
   * Resolves filter parameters based on user's authorized scope
   */
  public static resolveScopeFilters(
    user: AuthenticatedUserContext,
    requestedProducerId?: string,
    requestedEventId?: string
  ): { producerIds?: string[]; eventIds?: string[] } {
    if (user.isSuperAdmin || user.scope?.isGlobal) {
      return {
        producerIds: requestedProducerId ? [requestedProducerId] : undefined,
        eventIds: requestedEventId ? [requestedEventId] : undefined
      };
    }

    const authorizedProducers = user.scope?.producers || [];
    const authorizedEvents = user.scope?.events || [];

    let resolvedProducers: string[] = authorizedProducers;
    if (requestedProducerId) {
      if (!authorizedProducers.includes(requestedProducerId)) {
        throw new ForbiddenError('Produtor fora do escopo permitido.', {
          scopeIssue: 'UNAUTHORIZED_PRODUCER',
          authorizedScope: authorizedProducers
        });
      }
      resolvedProducers = [requestedProducerId];
    }

    let resolvedEvents: string[] | undefined = authorizedEvents.length > 0 ? authorizedEvents : undefined;
    if (requestedEventId) {
      if (authorizedEvents.length > 0 && !authorizedEvents.includes(requestedEventId)) {
        throw new ForbiddenError('Evento fora do escopo permitido.', {
          scopeIssue: 'UNAUTHORIZED_EVENT',
          authorizedScope: authorizedEvents
        });
      }
      resolvedEvents = [requestedEventId];
    }

    return {
      producerIds: resolvedProducers,
      eventIds: resolvedEvents
    };
  }
}
