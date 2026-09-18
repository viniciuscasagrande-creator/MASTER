import { Request, Response, NextFunction } from 'express';
import { UserAccount, PermissionString } from '@shared/types/index';
import { db } from '../core/database/index';
import { UnauthorizedError, ForbiddenError } from '../core/errors/AppError';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: UserAccount;
    }
  }
}

/**
 * Authentication Middleware:
 * Resolves user from Bearer token (or x-user-id header for dev/test).
 * Validates account status (active vs blocked).
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'] || (req.headers['x-user-id'] as string | undefined);

  if (!authHeader) {
    // If no header is provided in test/dev, we leave req.user undefined (or default if needed)
    return next();
  }

  let token = typeof authHeader === 'string' ? authHeader : '';
  if (token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }

  // Support direct user ID, session token (dk_sess_<userId>_...), or email
  let userId = token;
  if (token.startsWith('dk_sess_')) {
    const parts = token.split('_');
    if (parts.length >= 3) {
      userId = parts[2];
    }
  }

  const user = db.getUserById(userId) || db.getUserByEmail(userId);

  if (user) {
    if (user.status === 'blocked') {
      db.logSecurity({
        userId: user.id,
        email: user.email,
        eventType: 'USER_BLOCKED',
        ipAddress: req.ip || '127.0.0.1',
        details: `Tentativa de acesso por usuário bloqueado: ${user.email} na rota ${req.originalUrl}`
      });

      res.status(403).json({
        error: 'ACESSO BLOQUEADO — Esta conta foi desativada pela administração.',
        statusCode: 403,
        details: { userId: user.id, status: 'blocked' },
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
      return;
    }

    req.user = user;
  }

  next();
};

/**
 * RBAC Permission Middleware:
 * Ensures the authenticated user possesses the specific granular permission.
 * Administrador Geral (admin_geral) has universal bypass.
 */
export const requirePermission = (permission: PermissionString) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        error: '401 — Não autenticado. Forneça credenciais válidas.',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
      return;
    }

    // Administrador Geral bypass
    if (user.roleSlug === 'admin_geral') {
      return next();
    }

    // Granular permission validation
    if (!user.permissions.includes(permission)) {
      db.logSecurity({
        userId: user.id,
        email: user.email,
        eventType: 'ACCESS_DENIED_403',
        ipAddress: req.ip || '127.0.0.1',
        details: `Permissão ausente: requer '${permission}', usuário possui perfil '${user.roleSlug}'`
      });

      res.status(403).json({
        error: '403 ACESSO NEGADO — Você não possui permissão para executar esta ação.',
        statusCode: 403,
        details: {
          requiredPermission: permission,
          userRole: user.roleName,
          userRoleSlug: user.roleSlug
        },
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
      return;
    }

    next();
  };
};

/**
 * RBAC Helper: Allow access if user possesses AT LEAST ONE of the listed permissions.
 */
export const requireAnyPermission = (permissions: PermissionString[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        error: '401 — Não autenticado. Forneça credenciais válidas.',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
      return;
    }

    // Administrador Geral bypass
    if (user.roleSlug === 'admin_geral') {
      return next();
    }

    const hasAny = permissions.some(p => user.permissions.includes(p));
    if (!hasAny) {
      db.logSecurity({
        userId: user.id,
        email: user.email,
        eventType: 'ACCESS_DENIED_403',
        ipAddress: req.ip || '127.0.0.1',
        details: `Nenhuma das permissões necessárias atendida: requer uma de ${JSON.stringify(permissions)}`
      });

      res.status(403).json({
        error: '403 ACESSO NEGADO — Você não possui nenhuma das permissões necessárias para acessar este recurso.',
        statusCode: 403,
        details: {
          requiredAnyOf: permissions,
          userRole: user.roleName
        },
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
      return;
    }

    next();
  };
};

/**
 * Data Scope Middleware:
 * Verifies that the requested resource belongs to the user's authorized producer or event boundaries.
 * - GLOBAL scope: access allowed across all producers and events.
 * - PRODUCER scope: access restricted to user.scope.producerIds and user.scope.eventIds.
 * - EVENT scope: access restricted to user.scope.eventIds.
 */
export const requireScope = (options: {
  producerParam?: string;
  eventParam?: string;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        error: '401 — Não autenticado.',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
      return;
    }

    // Administrador Geral or Global Scope bypass
    if (user.roleSlug === 'admin_geral' || user.scope.type === 'GLOBAL') {
      return next();
    }

    // 1. Validate Producer Scope boundary
    if (options.producerParam) {
      const requestedProducerId =
        req.params[options.producerParam] ||
        req.body[options.producerParam] ||
        req.query[options.producerParam];

      if (requestedProducerId && !user.scope.producerIds.includes(String(requestedProducerId))) {
        db.logSecurity({
          userId: user.id,
          email: user.email,
          eventType: 'SCOPE_VIOLATION',
          ipAddress: req.ip || '127.0.0.1',
          details: `Tentativa de violação de escopo de produtor. Solicitado: '${requestedProducerId}', Autorizados: ${JSON.stringify(user.scope.producerIds)}`
        });

        res.status(403).json({
          error: 'ACESSO NEGADO — Você não possui autorização para operar dados deste Produtor.',
          statusCode: 403,
          details: {
            scopeType: user.scope.type,
            requestedProducerId: String(requestedProducerId),
            authorizedProducers: user.scope.producerIds
          },
          timestamp: new Date().toISOString(),
          path: req.originalUrl
        });
        return;
      }
    }

    // 2. Validate Event Scope boundary
    if (options.eventParam) {
      const requestedEventId =
        req.params[options.eventParam] ||
        req.body[options.eventParam] ||
        req.query[options.eventParam];

      if (requestedEventId) {
        // If the user is a PRODUCER, check if the event belongs to this producer
        const event = db.events.find(e => e.id === requestedEventId);
        
        const isAuthorizedByEventList = user.scope.eventIds.length === 0 || user.scope.eventIds.includes(String(requestedEventId));
        const isAuthorizedByProducerOwnership = event ? user.scope.producerIds.includes(event.producerId) : false;

        if (!isAuthorizedByEventList || (event && !isAuthorizedByProducerOwnership)) {
          db.logSecurity({
            userId: user.id,
            email: user.email,
            eventType: 'SCOPE_VIOLATION',
            ipAddress: req.ip || '127.0.0.1',
            details: `Tentativa de violação de escopo de evento. Solicitado: '${requestedEventId}', Evento pertence a: '${event?.producerId}', Produtor do usuário: ${JSON.stringify(user.scope.producerIds)}`
          });

          res.status(403).json({
            error: 'ACESSO NEGADO — Você não possui autorização para consultar dados deste Evento.',
            statusCode: 403,
            details: {
              requestedEventId: String(requestedEventId),
              eventProducerId: event?.producerId,
              userAuthorizedProducers: user.scope.producerIds,
              userAuthorizedEvents: user.scope.eventIds
            },
            timestamp: new Date().toISOString(),
            path: req.originalUrl
          });
          return;
        }
      }
    }

    next();
  };
};
