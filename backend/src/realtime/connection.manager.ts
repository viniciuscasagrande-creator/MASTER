import { AuthenticatedSocket, RealtimeEnvelope } from './realtime.types';
import { WebSocket } from 'ws';

export class ConnectionManager {
  private static userSockets = new Map<string, Set<AuthenticatedSocket>>();
  private static channelSockets = new Map<string, Set<AuthenticatedSocket>>();

  public static register(userId: string, socket: AuthenticatedSocket): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket);

    // Auto-join personal user channel
    this.joinChannel(`user:${userId}`, socket);
  }

  public static unregister(userId: string, socket: AuthenticatedSocket): void {
    const userSet = this.userSockets.get(userId);
    if (userSet) {
      userSet.delete(socket);
      if (userSet.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    // Remove from all channels
    for (const [channel, set] of this.channelSockets.entries()) {
      set.delete(socket);
      if (set.size === 0) {
        this.channelSockets.delete(channel);
      }
    }
  }

  public static joinChannel(channel: string, socket: AuthenticatedSocket): void {
    if (!this.channelSockets.has(channel)) {
      this.channelSockets.set(channel, new Set());
    }
    this.channelSockets.get(channel)!.add(socket);
  }

  public static leaveChannel(channel: string, socket: AuthenticatedSocket): void {
    const set = this.channelSockets.get(channel);
    if (set) {
      set.delete(socket);
      if (set.size === 0) {
        this.channelSockets.delete(channel);
      }
    }
  }

  public static sendToUser(userId: string, envelope: RealtimeEnvelope): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    const payload = JSON.stringify(envelope);
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    }
  }

  public static broadcastToChannel(channel: string, envelope: RealtimeEnvelope): void {
    const sockets = this.channelSockets.get(channel);
    if (!sockets) return;

    const payload = JSON.stringify(envelope);
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    }
  }

  public static terminateUserConnections(userId: string, reason: string): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close(4003, reason);
      }
    }
    this.userSockets.delete(userId);
  }

  public static getActiveUsersCount(): number {
    return this.userSockets.size;
  }

  public static isUserOnline(userId: string): boolean {
    const set = this.userSockets.get(userId);
    return !!set && set.size > 0;
  }
}
