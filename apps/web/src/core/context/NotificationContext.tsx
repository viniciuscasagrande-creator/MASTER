import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useDiskContext } from './DiskContext';
import { useRealtime, ConnectionStatus } from '../hooks/useRealtime';
import {
  NotificationItem,
  NotificationFilter,
  NotificationPreference,
  RealtimeEnvelope
} from '../realtime/realtime.types';

// Default initial preferences
const DEFAULT_PREFERENCES: NotificationPreference[] = [
  { module: 'SECURITY', inApp: true, email: true, push: true, sms: true, mandatory: true },
  { module: 'FINANCE', inApp: true, email: true, push: true, sms: false, mandatory: false },
  { module: 'EVENTS', inApp: true, email: true, push: false, sms: false, mandatory: false },
  { module: 'SAC', inApp: true, email: false, push: true, sms: false, mandatory: false },
  { module: 'REFUNDS', inApp: true, email: true, push: false, sms: false, mandatory: false },
  { module: 'SUPPORT', inApp: true, email: true, push: true, sms: true, mandatory: false },
  { module: 'COMMERCIAL', inApp: true, email: false, push: false, sms: false, mandatory: false },
  { module: 'MARKETING', inApp: true, email: false, push: false, sms: false, mandatory: false },
  { module: 'ACCOUNTING', inApp: true, email: true, push: false, sms: false, mandatory: false }
];

// Rich fallback notifications when offline or initial load
const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'nr_seed_1',
    notificationId: 'notif_seed_1',
    module: 'FINANCE',
    type: 'WARNING',
    priority: 'HIGH',
    title: 'Aprovação de Transferência Pendente',
    description: 'Transferência de R$ 75.000,00 para Opus Entretenimento aguarda liberação com Step-Up.',
    actionUrl: '/finance',
    resourceType: 'FINANCE_TRANSFER',
    resourceId: 'tr_seed_909',
    producerId: 'prod-1',
    status: 'UNREAD',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    id: 'nr_seed_2',
    notificationId: 'notif_seed_2',
    module: 'EVENTS',
    type: 'ALERT',
    priority: 'NORMAL',
    title: 'Capacidade do Setor VIP em 92%',
    description: 'Festival de Inverno 2026 ultrapassou 90% dos ingressos vendidos no Setor Camarote.',
    actionUrl: '/events',
    resourceType: 'EVENT',
    resourceId: 'evt-101',
    producerId: 'prod-1',
    eventId: 'evt-101',
    status: 'UNREAD',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
  },
  {
    id: 'nr_seed_3',
    notificationId: 'notif_seed_3',
    module: 'SAC',
    type: 'CRITICAL',
    priority: 'CRITICAL',
    title: 'SLA de Atendimento em Risco (Chamado #3892)',
    description: 'Cliente aguarda resolução de divergência de voucher há mais de 45 minutos.',
    actionUrl: '/sac',
    resourceType: 'SAC_TICKET',
    resourceId: 'tkt_3892',
    status: 'UNREAD',
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString()
  },
  {
    id: 'nr_seed_4',
    notificationId: 'notif_seed_4',
    module: 'SECURITY',
    type: 'CRITICAL',
    priority: 'CRITICAL',
    title: 'Tentativa de Força Bruta Detectada',
    description: 'IP 189.44.120.19 excedeu 5 tentativas de login. Proteção de taxa acionada.',
    actionUrl: '/admin',
    resourceType: 'SECURITY_EVENT',
    resourceId: 'sec_evt_101',
    status: 'READ',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: 'nr_seed_5',
    notificationId: 'notif_seed_5',
    module: 'REFUNDS',
    type: 'INFO',
    priority: 'NORMAL',
    title: 'Novo Pedido de Estorno Registrado',
    description: 'Solicitação de estorno #EST-4402 no valor de R$ 420,00 enviada para análise.',
    actionUrl: '/refunds',
    resourceType: 'REFUND_REQUEST',
    resourceId: 'ref_4402',
    status: 'READ',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  }
];

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  preferences: NotificationPreference[];
  toastNotification: NotificationItem | null;
  dismissToast: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  updatePreference: (module: string, channel: 'inApp' | 'email' | 'push' | 'sms', enabled: boolean) => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
  simulateIncomingNotification: (custom?: Partial<NotificationItem>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { activeProducer, activeEvent, apiFetch } = useDiskContext();

  const [notifications, setNotifications] = useState<NotificationItem[]>(SEED_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    return SEED_NOTIFICATIONS.filter(n => n.status === 'UNREAD').length;
  });
  const [preferences, setPreferences] = useState<NotificationPreference[]>(DEFAULT_PREFERENCES);
  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);

  // Audio effect for critical/high alerts
  const playAlertSound = useCallback((priority: string) => {
    try {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        if (priority === 'CRITICAL') {
          osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.25);
        } else if (priority === 'HIGH') {
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.18);
        }
      }
    } catch {
      // Audio playback silently skipped if blocked by autoplay policy
    }
  }, []);

  // Handle incoming real-time websocket envelope
  const handleRealtimeEnvelope = useCallback((envelope: RealtimeEnvelope) => {
    if (envelope.type === 'NOTIFICATION_NEW' && envelope.payload) {
      const payload = envelope.payload;
      const newItem: NotificationItem = {
        id: payload.recipientId || payload.id || `nr_${Date.now()}`,
        notificationId: payload.notificationId || payload.id,
        module: payload.module || 'SYSTEM',
        type: payload.type || 'INFO',
        priority: payload.priority || 'NORMAL',
        title: payload.title || 'Novo Alerta',
        description: payload.description || '',
        actionUrl: payload.actionUrl || null,
        resourceType: payload.resourceType || null,
        resourceId: payload.resourceId || null,
        producerId: payload.producerId || null,
        eventId: payload.eventId || null,
        groupKey: payload.groupKey || null,
        status: 'UNREAD',
        createdAt: payload.createdAt || new Date().toISOString(),
        metadata: payload.metadata
      };

      setNotifications(prev => {
        // Prevent duplicate IDs
        if (prev.some(n => n.id === newItem.id || (newItem.groupKey && n.groupKey === newItem.groupKey))) {
          return prev.map(n => n.groupKey === newItem.groupKey ? newItem : n);
        }
        return [newItem, ...prev];
      });

      setUnreadCount(prev => prev + 1);

      // Play alert chime and show toast if high/critical
      if (newItem.priority === 'CRITICAL' || newItem.priority === 'HIGH') {
        playAlertSound(newItem.priority);
        setToastNotification(newItem);
      }
    }
  }, [playAlertSound]);

  // Connect to WebSocket with token
  const wsToken = useMemo(() => {
    // We can pass current user ID or token
    return currentUser ? `mock_token_for_${currentUser.id}` : null;
  }, [currentUser]);

  const { status: connectionStatus, latencyMs } = useRealtime({
    token: wsToken,
    autoConnect: isAuthenticated,
    onMessage: handleRealtimeEnvelope
  });

  // Auto-dismiss toast notification after 6 seconds
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  const dismissToast = useCallback(() => {
    setToastNotification(null);
  }, []);

  // Fetch notifications from REST API
  const refreshNotifications = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/notifications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: NotificationItem[] = data.map((nr: any) => ({
            id: nr.id,
            notificationId: nr.notificationId,
            module: nr.notification?.module || 'SYSTEM',
            type: nr.notification?.type || 'INFO',
            priority: nr.notification?.priority || 'NORMAL',
            title: nr.notification?.title || '',
            description: nr.notification?.description || '',
            actionUrl: nr.notification?.actionUrl,
            resourceType: nr.notification?.resourceType,
            resourceId: nr.notification?.resourceId,
            producerId: nr.notification?.producerId,
            eventId: nr.notification?.eventId,
            groupKey: nr.notification?.groupKey,
            status: nr.status,
            createdAt: nr.createdAt || nr.notification?.createdAt,
            readAt: nr.readAt,
            archivedAt: nr.archivedAt,
            metadata: nr.notification?.metadata
          }));
          setNotifications(mapped);
          setUnreadCount(mapped.filter(n => n.status === 'UNREAD').length);
        }
      }
    } catch {
      // In offline/dev standalone mode, keep existing notifications
    }
  }, [apiFetch]);

  // Mark single notification as READ
  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, status: 'READ', readAt: new Date().toISOString() } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await apiFetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      // Offline fallback succeeded locally
    }
  }, [apiFetch]);

  // Mark all notifications as READ
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, status: 'READ', readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      await apiFetch('/api/v1/notifications/read-all', { method: 'PATCH' });
    } catch {
      // Offline fallback succeeded locally
    }
  }, [apiFetch]);

  // Archive notification
  const archiveNotification = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, status: 'ARCHIVED', archivedAt: new Date().toISOString() } : n))
    );
    setUnreadCount(prev => {
      const item = notifications.find(n => n.id === id);
      return item && item.status === 'UNREAD' ? Math.max(0, prev - 1) : prev;
    });

    try {
      await apiFetch(`/api/v1/notifications/${id}/archive`, { method: 'PATCH' });
    } catch {
      // Offline fallback succeeded locally
    }
  }, [apiFetch, notifications]);

  // Update notification preference
  const updatePreference = useCallback(async (
    module: string,
    channel: 'inApp' | 'email' | 'push' | 'sms',
    enabled: boolean
  ): Promise<boolean> => {
    // Security & Compliance check: mandatory notifications cannot be disabled
    if (module === 'SECURITY' && !enabled) {
      alert('Política de Segurança & Auditoria: As notificações de segurança e telemetria são obrigatórias por conformidade e não podem ser desativadas.');
      return false;
    }

    setPreferences(prev =>
      prev.map(p => {
        if (p.module === module) {
          return { ...p, [channel]: enabled };
        }
        return p;
      })
    );

    try {
      await apiFetch('/api/v1/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, [channel]: enabled })
      });
      return true;
    } catch {
      return true;
    }
  }, [apiFetch]);

  // Helper to simulate incoming notifications (for demo / testing)
  const simulateIncomingNotification = useCallback((custom?: Partial<NotificationItem>) => {
    const newItem: NotificationItem = {
      id: `nr_sim_${Date.now()}`,
      notificationId: `notif_sim_${Date.now()}`,
      module: custom?.module || 'FINANCE',
      type: custom?.type || 'WARNING',
      priority: custom?.priority || 'HIGH',
      title: custom?.title || 'Nova Notificação em Tempo Real',
      description: custom?.description || 'Evento gerado pelo motor central de mensageria da plataforma.',
      actionUrl: custom?.actionUrl || '/finance',
      producerId: activeProducer?.id || 'prod-1',
      eventId: activeEvent?.id || 'evt-101',
      status: 'UNREAD',
      createdAt: new Date().toISOString(),
      ...custom
    };

    setNotifications(prev => [newItem, ...prev]);
    setUnreadCount(prev => prev + 1);
    playAlertSound(newItem.priority);
    setToastNotification(newItem);
  }, [activeProducer, activeEvent, playAlertSound]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    connectionStatus,
    latencyMs,
    preferences,
    toastNotification,
    dismissToast,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    updatePreference,
    refreshNotifications,
    simulateIncomingNotification
  }), [
    notifications,
    unreadCount,
    connectionStatus,
    latencyMs,
    preferences,
    toastNotification,
    dismissToast,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    updatePreference,
    refreshNotifications,
    simulateIncomingNotification
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
