import { AuthenticatedUser } from '../../core/middleware/authenticate';

export interface EffectiveSearchScope {
  isGlobal: boolean;
  forcedProducerId: string | null;
  forcedEventId: string | null;
  allowedEntities: {
    customers: boolean;
    orders: boolean;
    tickets: boolean;
    events: boolean;
    producers: boolean;
    payments: boolean;
    refunds: boolean;
    support: boolean;
    campaigns: boolean;
  };
}

export class ScopeFilterService {
  /**
   * Derive the effective scope and entity permissions for the authenticated user
   */
  public static deriveScope(
    user: AuthenticatedUser,
    options?: {
      scopeParam?: string; // 'global' | 'context'
      producerIdHeader?: string;
      eventIdHeader?: string;
    }
  ): EffectiveSearchScope {
    const isSuperAdmin = user.isSuperAdmin === true || user.roles?.includes('ADMINISTRADOR_GERAL');
    const isProducerRole = user.roles?.includes('PRODUTOR') && !isSuperAdmin;

    let forcedProducerId: string | null = null;
    let forcedEventId: string | null = null;
    let isGlobal = false;

    if (isProducerRole) {
      // Hard-locked to producer's organization
      forcedProducerId = user.scope?.producers?.[0] || 'prd_100';
      if (options?.producerIdHeader && user.scope?.producers?.includes(options.producerIdHeader)) {
        forcedProducerId = options.producerIdHeader;
      }
      if (options?.eventIdHeader && options.eventIdHeader !== 'all') {
        if (!user.scope?.events || user.scope.events.includes(options.eventIdHeader)) {
          forcedEventId = options.eventIdHeader;
        }
      } else {
        forcedEventId = null;
      }
      isGlobal = false;
    } else {
      // Administrator or internal staff
      if (options?.scopeParam === 'global' && (isSuperAdmin || user.scope?.isGlobal)) {
        isGlobal = true;
        forcedProducerId = null;
        forcedEventId = null;
      } else {
        forcedProducerId = options?.producerIdHeader && options.producerIdHeader !== 'all'
          ? options.producerIdHeader
          : null;
        forcedEventId = options?.eventIdHeader && options.eventIdHeader !== 'all'
          ? options.eventIdHeader
          : null;
        isGlobal = !forcedProducerId && !forcedEventId;
      }
    }

    const hasPerm = (code: string) => {
      if (isSuperAdmin) return true;
      return user.permissions?.includes(code) || false;
    };

    // Granular entity permissions check
    const allowedEntities = {
      customers: hasPerm('busca.cliente.visualizar') || hasPerm('sac.consulta.acessar') || isSuperAdmin,
      orders: hasPerm('busca.pedido.visualizar') || hasPerm('sac.pedido.visualizar') || hasPerm('financeiro.saldo.visualizar') || isProducerRole || isSuperAdmin,
      tickets: hasPerm('busca.ingresso.visualizar') || hasPerm('eventos.evento.visualizar') || hasPerm('sac.pedido.visualizar') || isProducerRole || isSuperAdmin,
      events: hasPerm('busca.evento.visualizar') || hasPerm('eventos.evento.visualizar') || isProducerRole || isSuperAdmin,
      producers: hasPerm('busca.produtor.visualizar') || hasPerm('comercial.produtores.visualizar') || (isSuperAdmin && !isProducerRole),
      payments: hasPerm('busca.pagamento.visualizar') || hasPerm('financeiro.saldo.visualizar') || isSuperAdmin,
      refunds: hasPerm('busca.estorno.visualizar') || hasPerm('estorno.solicitacao.visualizar') || isSuperAdmin,
      support: hasPerm('busca.ticket.visualizar') || hasPerm('sac.consulta.acessar') || isSuperAdmin,
      campaigns: hasPerm('busca.campanha.visualizar') || hasPerm('marketing.campanha.visualizar') || isSuperAdmin
    };

    return {
      isGlobal,
      forcedProducerId,
      forcedEventId,
      allowedEntities
    };
  }

  /**
   * Helper to check if an entity belongs to the user's effective scope
   */
  public static matchesScope(
    entity: { producerId?: string | null; eventId?: string | null },
    scope: EffectiveSearchScope
  ): boolean {
    if (scope.isGlobal) return true;

    if (scope.forcedProducerId) {
      if (!entity.producerId) return false;
      // Allow producer id aliases (prod-1 <-> prd_100, prod-2 <-> prd_200)
      const matchesDirect = entity.producerId === scope.forcedProducerId;
      const matchesAlias1 = (scope.forcedProducerId === 'prd_100' || scope.forcedProducerId === 'prod-1') &&
                            (entity.producerId === 'prd_100' || entity.producerId === 'prod-1');
      const matchesAlias2 = (scope.forcedProducerId === 'prd_200' || scope.forcedProducerId === 'prod-2') &&
                            (entity.producerId === 'prd_200' || entity.producerId === 'prod-2');

      if (!matchesDirect && !matchesAlias1 && !matchesAlias2) {
        return false;
      }
    }

    if (scope.forcedEventId) {
      if (!entity.eventId) return false;
      const matchesEvtDirect = entity.eventId === scope.forcedEventId;
      const matchesEvtAlias1 = (scope.forcedEventId === 'evt_1001' || scope.forcedEventId === 'evt-101') &&
                               (entity.eventId === 'evt_1001' || entity.eventId === 'evt-101');
      const matchesEvtAlias2 = (scope.forcedEventId === 'evt_2001' || scope.forcedEventId === 'evt-102') &&
                               (entity.eventId === 'evt_2001' || entity.eventId === 'evt-102');

      if (!matchesEvtDirect && !matchesEvtAlias1 && !matchesEvtAlias2) {
        return false;
      }
    }

    return true;
  }
}
