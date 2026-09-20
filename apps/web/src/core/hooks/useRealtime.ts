import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeEnvelope } from '../realtime/realtime.types';

export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

interface UseRealtimeOptions {
  token?: string | null;
  url?: string;
  autoConnect?: boolean;
  onMessage?: (envelope: RealtimeEnvelope) => void;
}

export function useRealtime({
  token,
  url,
  autoConnect = true,
  onMessage
}: UseRealtimeOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [lastMessage, setLastMessage] = useState<RealtimeEnvelope | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingTimestampRef = useRef<number>(0);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const defaultWsUrl = typeof window !== 'undefined'
    ? (import.meta.env.VITE_WS_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:3001/realtime`
        : 'wss://master-production-82a6.up.railway.app/realtime'))
    : 'ws://localhost:3001/realtime';

  const wsUrl = url || defaultWsUrl;

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.onmessage = null;
      socketRef.current.onopen = null;
      if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
        socketRef.current.close();
      }
      socketRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!autoConnect) return;
    if (typeof window === 'undefined') return;

    cleanup();

    const connectUrl = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;

    try {
      setStatus('CONNECTING');
      const ws = new WebSocket(connectUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('CONNECTED');
        setReconnectAttempts(0);

        // Start ping interval (every 25 seconds)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            pingTimestampRef.current = Date.now();
            ws.send(JSON.stringify({
              type: 'HEARTBEAT_PING',
              timestamp: new Date().toISOString(),
              payload: {}
            }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const envelope: RealtimeEnvelope = JSON.parse(event.data);
          
          if (envelope.type === 'HEARTBEAT_PONG') {
            if (pingTimestampRef.current > 0) {
              setLatencyMs(Date.now() - pingTimestampRef.current);
            }
            return;
          }

          setLastMessage(envelope);
          if (onMessageRef.current) {
            onMessageRef.current(envelope);
          }
        } catch {
          // ignore unparsable messages
        }
      };

      ws.onerror = () => {
        // Will trigger onclose next
      };

      ws.onclose = (event) => {
        setStatus('DISCONNECTED');
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Do not auto-reconnect if rejected for invalid auth
        if (event.code === 4001 || event.code === 4003) {
          return;
        }

        // Auto reconnect with exponential backoff
        if (autoConnect) {
          setStatus('RECONNECTING');
          const nextAttempt = reconnectAttempts + 1;
          setReconnectAttempts(nextAttempt);
          const delay = Math.min(1000 * Math.pow(1.5, Math.min(nextAttempt, 6)), 15000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch {
      setStatus('DISCONNECTED');
    }
  }, [autoConnect, cleanup, reconnectAttempts, token, wsUrl]);

  useEffect(() => {
    connect();
    return () => {
      cleanup();
    };
  }, [connect, cleanup]);

  const sendMessage = useCallback((envelope: Partial<RealtimeEnvelope>) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        timestamp: new Date().toISOString(),
        ...envelope
      }));
      return true;
    }
    return false;
  }, []);

  return {
    status,
    lastMessage,
    latencyMs,
    reconnectAttempts,
    reconnect: connect,
    sendMessage
  };
}
