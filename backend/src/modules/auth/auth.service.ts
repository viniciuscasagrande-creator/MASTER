import { prisma } from '../../core/database/prisma';
import { verifyPassword, hashPassword } from '../../core/security/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../../core/security/token';
import { generateTwoFactorSecret, verifyTwoFactorCode } from '../../core/security/twoFactor';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../../core/errors/AppError';
import { AuditService } from '../audit/audit.service';

export class AuthService {
  public static async login(params: {
    email: string;
    password: string;
    twoFactorCode?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { email: params.email },
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
      await AuditService.log({
        action: 'LOGIN_FAILED',
        resource: 'AUTH',
        details: `Tentativa de login falha para e-mail não existente: ${params.email}`,
        ipAddress: params.ipAddress,
        result: 'FAILED'
      });
      throw new UnauthorizedError('Credenciais inválidas.');
    }

    // Status check
    if (user.status === 'BLOCKED') {
      await AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'LOGIN_BLOCKED_USER',
        resource: 'AUTH',
        details: `Tentativa de acesso barrada por usuário com status BLOQUEADO: ${user.email}`,
        ipAddress: params.ipAddress,
        result: 'DENIED'
      });
      throw new ForbiddenError('ACESSO BLOQUEADO — Esta conta foi desativada pela administração.');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError(`ACESSO NEGADO — Conta em status ${user.status}.`);
    }

    // Verify Password
    const passwordValid = await verifyPassword(user.passwordHash, params.password);
    if (!passwordValid) {
      await AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'LOGIN_INVALID_PASSWORD',
        resource: 'AUTH',
        details: `Senha incorreta para o usuário: ${user.email}`,
        ipAddress: params.ipAddress,
        result: 'FAILED'
      });
      throw new UnauthorizedError('Credenciais inválidas.');
    }

    // 2FA check
    if (user.twoFactorEnabled) {
      if (!params.twoFactorCode) {
        return {
          requireTwoFactor: true,
          userId: user.id,
          message: 'Autenticação de Dois Fatores (2FA) obrigatória para esta conta.'
        };
      }

      const isValid2fa = verifyTwoFactorCode(params.twoFactorCode, user.twoFactorSecret);
      if (!isValid2fa) {
        throw new UnauthorizedError('Código de autenticação de dois fatores inválido.');
      }
    }

    // Aggregate roles and permissions
    const roles: string[] = user.userRoles?.map((ur: any) => ur.role?.code).filter(Boolean) || [];
    const permissionSet = new Set<string>();

    for (const ur of user.userRoles || []) {
      for (const rp of ur.role?.rolePermissions || []) {
        if (rp.permission?.code) {
          permissionSet.add(rp.permission.code);
        }
      }
    }

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

    // Calculate Scope
    const isGlobal = user.isSuperAdmin || roles.some(r => r !== 'PRODUTOR');
    const producers = user.producerAccesses?.map((pa: any) => pa.producerId) || [];
    const events = user.eventAccesses?.map((ea: any) => ea.eventId) || [];

    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: `token_${Date.now()}_${Math.random()}`,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        expiresAt
      }
    });

    // Generate JWT Tokens
    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      sessionId: session.id,
      isSuperAdmin: user.isSuperAdmin
    });

    const refreshToken = generateRefreshToken({
      sub: user.id,
      sessionId: session.id
    });

    // Update session with refreshToken
    await prisma.session.update({
      where: { id: session.id },
      data: { refreshToken }
    });

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN_SUCCESS',
      resource: 'AUTH',
      details: `Login bem-sucedido (${roles.join(', ')})`,
      ipAddress: params.ipAddress,
      result: 'SUCCESS'
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        status: user.status
      },
      roles,
      permissions,
      scope: {
        isGlobal,
        producers,
        events
      }
    };
  }

  public static async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId }
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedError('Sessão revogada. Faça login novamente.');
    }

    if (new Date(session.expiresAt) < new Date()) {
      throw new UnauthorizedError('Sessão expirada. Faça login novamente.');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub }
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Usuário inativo ou não encontrado.');
    }

    // Generate new pair of tokens
    const newAccessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      sessionId: session.id,
      isSuperAdmin: user.isSuperAdmin
    });

    const newRefreshToken = generateRefreshToken({
      sub: user.id,
      sessionId: session.id
    });

    await prisma.session.update({
      where: { id: session.id },
      data: { refreshToken: newRefreshToken }
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  public static async logout(sessionId: string, userId?: string) {
    if (sessionId) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() }
      });
    }

    if (userId) {
      await AuditService.log({
        userId,
        action: 'LOGOUT',
        resource: 'AUTH',
        details: 'Sessão de usuário finalizada com sucesso.',
        result: 'SUCCESS'
      });
    }

    return { success: true, message: 'Logout realizado com sucesso.' };
  }

  public static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      throw new NotFoundError('Usuário não encontrado.');
    }

    const roles: string[] = user.userRoles?.map((ur: any) => ur.role?.code).filter(Boolean) || [];
    const permissionSet = new Set<string>();

    for (const ur of user.userRoles || []) {
      for (const rp of ur.role?.rolePermissions || []) {
        if (rp.permission?.code) {
          permissionSet.add(rp.permission.code);
        }
      }
    }

    for (const up of user.userPermissions || []) {
      if (up.permission?.code) {
        if (up.isGranted) {
          permissionSet.add(up.permission.code);
        } else {
          permissionSet.delete(up.permission.code);
        }
      }
    }

    const isGlobal = user.isSuperAdmin || roles.some(r => r !== 'PRODUTOR');
    const producers = user.producerAccesses?.map((pa: any) => pa.producerId) || [];
    const events = user.eventAccesses?.map((ea: any) => ea.eventId) || [];

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin
      },
      roles,
      permissions: Array.from(permissionSet),
      scope: {
        global: isGlobal,
        producers,
        events
      }
    };
  }

  public static async setup2FA(userId: string) {
    const { secret, uri } = generateTwoFactorSecret();
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret }
    });
    return { secret, uri };
  }

  public static async verify2FA(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Usuário não encontrado.');

    const isValid = verifyTwoFactorCode(code, user.twoFactorSecret);
    if (!isValid) {
      throw new UnauthorizedError('Código 2FA incorreto.');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });

    return { success: true, message: 'Autenticação em dois fatores ativada com sucesso.' };
  }

  public static async listSessions(userId: string) {
    return prisma.session.findMany({
      where: { userId }
    });
  }

  public static async revokeSession(userId: string, sessionId: string) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new NotFoundError('Sessão não encontrada.');
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() }
    });

    return { success: true, message: 'Sessão revogada com sucesso.' };
  }
}
