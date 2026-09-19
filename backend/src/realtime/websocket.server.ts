import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { authenticateWebSocket } from './websocket.auth';
import { ConnectionManager } from './connection.manager';
import { AuthenticatedSocket } from './realtime.types';
import { AuditService } from '../modules/audit/audit.service';

export function setupWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/realtime' });

  wss.on('connection', async (ws: AuthenticatedSocket, req) => {
    const user = await authenticateWebSocket(req);

    if (!user) {
      ws.close(4001, 'Unauthorized: Sessão inválida ou expirada');
      return;
    }

    ws.userId = user.id;
    ws.sessionId = user.sessionId;
    ws.userEmail = user.email;
    ws.roles = user.roles;
    ws.isAlive = true;

    ConnectionManager.register(user.id, ws);

    // Subscribe to authorized producer and event channels if scoped
    for (const prodId of user.scope.producers) {
      ConnectionManager.joinChannel(`producer:${prodId}`, ws);
    }
    for (const evtId of user.scope.events) {
      ConnectionManager.joinChannel(`event:${evtId}`, ws);
    }
    for (const role of user.roles) {
      ConnectionManager.joinChannel(`role:${role}`, ws);
    }

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
        } else if (message.type === 'CHANNEL_JOIN' && message.channel) {
          // Verify user has right to join requested channel
          const ch = String(message.channel);
          if (ch.startsWith('producer:')) {
            const pId = ch.replace('producer:', '');
            if (user.isSuperAdmin || user.scope.isGlobal || user.scope.producers.includes(pId)) {
              ConnectionManager.joinChannel(ch, ws);
            }
          } else if (ch.startsWith('event:')) {
            const eId = ch.replace('event:', '');
            if (user.isSuperAdmin || user.scope.isGlobal || user.scope.events.includes(eId)) {
              ConnectionManager.joinChannel(ch, ws);
            }
          }
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      ConnectionManager.unregister(user.id, ws);
    });

    ws.on('error', () => {
      ConnectionManager.unregister(user.id, ws);
    });

    // Send initial welcome & connected envelope
    ws.send(JSON.stringify({
      type: 'NOTIFICATION_COUNT',
      timestamp: new Date().toISOString(),
      data: { status: 'CONNECTED', userId: user.id }
    }));
  });

  // Heartbeat Interval to keep connections alive and clean up ghosts
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      const authWs = ws as AuthenticatedSocket;
      if (authWs.isAlive === false) {
        if (authWs.userId) {
          ConnectionManager.unregister(authWs.userId, authWs);
        }
        return ws.terminate();
      }
      authWs.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}
