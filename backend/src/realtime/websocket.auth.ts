import { IncomingMessage } from 'http';
import { verifyAccessToken } from '../core/security/token';
import { prisma } from '../core/database/prisma';
import { AuthenticatedUser } from '../core/middleware/authenticate';

export async function authenticateWebSocket(req: IncomingMessage): Promise<AuthenticatedUser | null> {
  try {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    let token = url.searchParams.get('token');

    // Or from Sec-WebSocket-Protocol
    if (!token && req.headers['sec-websocket-protocol']) {
      token = String(req.headers['sec-websocket-protocol']).split(',')[0].trim();
    }

    // Or from Authorization header
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7).trim();
    }

    if (!token) {
      return null;
    }

    const payload = verifyAccessToken(token);

    // Verify session
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId }
    });

    if (!session || session.revokedAt || new Date(session.expiresAt) < new Date()) {
      return null;
    }

    // Verify user
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: { include: { role: true } },
        producerAccesses: true,
        eventAccesses: true
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    const roles: string[] = user.userRoles?.map((ur: any) => ur.role?.code).filter(Boolean) || [];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      status: user.status,
      roles,
      permissions: [],
      scope: {
        isGlobal: user.isSuperAdmin || roles.some(r => r !== 'PRODUTOR'),
        producers: user.producerAccesses?.map((pa: any) => pa.producerId) || [],
        events: user.eventAccesses?.map((ea: any) => ea.eventId) || []
      },
      sessionId: session.id
    };
  } catch (err) {
    return null;
  }
}
