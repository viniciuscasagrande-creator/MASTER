import { WebSocket } from 'ws';

export interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  sessionId?: string;
  userEmail?: string;
  roles?: string[];
  isAlive?: boolean;
}

export type RealtimeMessageType =
  | 'NOTIFICATION_NEW'
  | 'NOTIFICATION_READ'
  | 'NOTIFICATION_COUNT'
  | 'DASHBOARD_UPDATE'
  | 'RESOURCE_UPDATED'
  | 'CHANNEL_JOIN'
  | 'CHANNEL_LEAVE'
  | 'PONG'
  | 'ERROR';

export interface RealtimeEnvelope<T = any> {
  type: RealtimeMessageType;
  timestamp: string;
  data: T;
  channel?: string;
}
