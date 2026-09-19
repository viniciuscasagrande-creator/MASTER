export type RealtimeMessageType =
  | 'SYSTEM_READY'
  | 'NOTIFICATION_NEW'
  | 'RESOURCE_UPDATED'
  | 'METRIC_UPDATED'
  | 'HEARTBEAT_PING'
  | 'HEARTBEAT_PONG'
  | 'AUTH_REVOKED';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT' | 'CRITICAL';
export type RecipientStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export interface RealtimeEnvelope<T = any> {
  type: RealtimeMessageType;
  timestamp: string;
  payload: T;
  channel?: string;
}

export interface NotificationItem {
  id: string; // Recipient record ID
  notificationId: string;
  module: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  description: string;
  actionUrl?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  producerId?: string | null;
  eventId?: string | null;
  groupKey?: string | null;
  status: RecipientStatus;
  createdAt: string;
  readAt?: string | null;
  archivedAt?: string | null;
  metadata?: Record<string, any>;
}

export interface NotificationFilter {
  module?: string;
  priority?: string;
  status?: 'ALL' | 'UNREAD' | 'READ' | 'ARCHIVED';
  search?: string;
  producerId?: string;
  eventId?: string;
}

export interface NotificationPreference {
  module: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
  mandatory?: boolean;
}

export interface NotificationRule {
  id: string;
  eventType: string;
  module: string;
  channel: string;
  priority: NotificationPriority;
  template: string;
  throttleMinutes: number;
  roles: string[];
  active: boolean;
}
