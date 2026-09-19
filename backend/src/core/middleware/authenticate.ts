import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../security/token';
import { prisma } from '../database/prisma';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  status: string;
  roles: string[];
  permissions: string[];
  scope: {
    isGlobal: boolean;
    producers: string[];
    events: string[];
  };
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export type AuthenticatedRequest = Request;

/**
 * Middleware authenticate:
 * Validates JWT Bearer Token, checks user existence, active status, and active session in database.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('401 — Token de autenticação ausente.');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedError('401 — Token de autenticação inválido.');
    }

    // 1. Verify token signature and expiration
    const payload = verifyAccessToken(token);

    // 2. Verify active session in DB
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId }
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedError('401 — Sessão revogada ou inexistente. Faça login novamente.');
    }

    if (new Date(session.expiresAt) < new Date()) {
      throw new UnauthorizedError('401 — Sessão expirada.');
    }

    // 3. Find User in DB with all relations
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true }
                }
              }
            }
          }
        },
        userPermissions: {
          include: { permission: true }
        },
        producerAccesses: true,
        eventAccesses: true
      }
    });

    if (!user) {
      throw new UnauthorizedError('401 — Usuário associado ao token não encontrado.');
    }

    // 4. Check user status
    if (user.status === 'BLOCKED') {
      res.status(403).json({
        error: 'ACESSO BLOQUEADO — Esta conta foi bloqueada pela administração.',
        statusCode: 403,
        details: { userId: user.id, status: user.status }
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        error: `ACESSO NEGADO — Conta em status ${user.status}.`,
        statusCode: 403
      });
      return;
    }

    // 5. Aggregate Roles
    const roles: string[] = user.userRoles?.map((ur: any) => ur.role?.code).filter(Boolean) || [];

    // 6. Aggregate Granular Permissions
    const permissionSet = new Set<string>();

    // From roles
    for (const ur of user.userRoles || []) {
      for (const rp of ur.role?.rolePermissions || []) {
        if (rp.permission?.code) {
          permissionSet.add(rp.permission.code);
        }
      }
    }

    // Custom direct user permissions (grants and revokes)
    for (const up of user.userPermissions || []) {
      if (up.permission?.code) {
        if (up.isGranted) {
          permissionSet.add(up.permission.code);
        } else {
          permissionSet.delete(up.permission.code);
        }
      }
    }

    const permissions = Array.from(permissionSet);

    // 7. Calculate Scope
    const isGlobal = user.isSuperAdmin || roles.some(r => r !== 'PRODUTOR');
    const producers = user.producerAccesses?.map((pa: any) => pa.producerId) || [];
    const events = user.eventAccesses?.map((ea: any) => ea.eventId) || [];

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      status: user.status,
      roles,
      permissions,
      scope: {
        isGlobal,
        producers,
        events
      },
      sessionId: session.id
    };

    next();
  } catch (err) {
    next(err);
  }
};
