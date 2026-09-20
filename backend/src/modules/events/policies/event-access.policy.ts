import { AuthenticatedUser } from '../../../core/middleware/authenticate';
import { EventAccessDeniedError } from '../errors/event.errors';

export class EventAccessPolicy {
  /**
   * Builds the database `where` filter strictly applying the user's multi-tenant scope.
   * Prevents leaking events from other producers or unauthorized events.
   */
  public static buildScopeWhere(user: AuthenticatedUser, requestedProducerId?: string): Record<string, any> {
    const isGlobal = user.isSuperAdmin ||
      user.roles.includes('ADMINISTRADOR_GERAL') ||
      user.roles.includes('admin_geral') ||
      user.scope?.isGlobal === true;

    if (isGlobal) {
      if (requestedProducerId && requestedProducerId !== 'all') {
        return { producerId: requestedProducerId };
      }
      return {};
    }

    const authorizedProducers = user.scope?.producers || [];
    const authorizedEvents = user.scope?.events || [];

    // Producer scope
    if (authorizedProducers.length > 0 && authorizedEvents.length === 0) {
      if (requestedProducerId && requestedProducerId !== 'all') {
        if (!authorizedProducers.includes(requestedProducerId)) {
          throw new EventAccessDeniedError('Você não possui permissão para acessar eventos deste produtor.');
        }
        return { producerId: requestedProducerId };
      }

      return {
        producerId: authorizedProducers.length === 1
          ? authorizedProducers[0]
          : { in: authorizedProducers }
      };
    }

    // Specific event scope
    if (authorizedEvents.length > 0) {
      if (requestedProducerId && requestedProducerId !== 'all') {
        if (authorizedProducers.length > 0 && !authorizedProducers.includes(requestedProducerId)) {
          throw new EventAccessDeniedError('Você não possui permissão para acessar eventos deste produtor.');
        }
      }
      return {
        id: authorizedEvents.length === 1
          ? authorizedEvents[0]
          : { in: authorizedEvents }
      };
    }

    if (authorizedProducers.length > 0) {
      return { producerId: { in: authorizedProducers } };
    }

    throw new EventAccessDeniedError('Escopo de acesso a eventos não configurado.');
  }

  /**
   * Validates whether a specific event can be accessed by the user.
   * Throws 403 EventAccessDeniedError if unauthorized.
   */
  public static verifyEventAccess(user: AuthenticatedUser, event: { id: string; producerId: string }): boolean {
    const isGlobal = user.isSuperAdmin ||
      user.roles.includes('ADMINISTRADOR_GERAL') ||
      user.roles.includes('admin_geral') ||
      user.scope?.isGlobal === true;

    if (isGlobal) return true;

    const authorizedProducers = user.scope?.producers || [];
    const authorizedEvents = user.scope?.events || [];

    if (authorizedEvents.length > 0 && authorizedEvents.includes(event.id)) {
      return true;
    }

    if (authorizedProducers.length > 0 && authorizedProducers.includes(event.producerId)) {
      return true;
    }

    throw new EventAccessDeniedError('Você não possui permissão para acessar este evento.');
  }

  /**
   * Validates whether the user is authorized to create/manage events for a given producer.
   */
  public static verifyProducerAccess(user: AuthenticatedUser, producerId: string): boolean {
    const isGlobal = user.isSuperAdmin ||
      user.roles.includes('ADMINISTRADOR_GERAL') ||
      user.roles.includes('admin_geral') ||
      user.scope?.isGlobal === true;

    if (isGlobal) return true;

    const authorizedProducers = user.scope?.producers || [];
    if (!authorizedProducers.includes(producerId)) {
      throw new EventAccessDeniedError('Você não possui permissão para gerenciar eventos deste produtor.');
    }
    return true;
  }
}
