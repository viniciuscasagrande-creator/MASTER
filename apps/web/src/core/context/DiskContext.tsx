import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { Producer, EventItem } from '../types';
import { INITIAL_PRODUCERS, INITIAL_EVENTS } from '../database/mockDatabase';
import { useAuth } from '../auth/AuthContext';

export interface DiskContextType {
  // Active selection
  activeProducer: Producer | null;
  activeEvent: EventItem | null;
  selectedProducerId: string | 'all';
  selectedEventId: string | 'all';

  // Available options based on authorization
  availableProducers: Producer[];
  availableEvents: EventItem[];

  // Constraints & Lock states
  isGlobalScope: boolean;
  isLockedToSingleProducer: boolean;
  isLockedToSingleEvent: boolean;
  defaultDashboard: string;

  // Actions
  setProducer: (producerId: string | 'all') => void;
  setEvent: (eventId: string | 'all') => void;
  clearProducer: () => void;
  clearEvent: () => void;
  resetScope: () => void;

  // Authenticated context-aware fetch client
  apiFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const DiskContext = createContext<DiskContextType | undefined>(undefined);

export const DiskContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [selectedProducerId, setSelectedProducerIdState] = useState<string | 'all'>('all');
  const [selectedEventId, setSelectedEventIdState] = useState<string | 'all'>('all');

  const allProducers = INITIAL_PRODUCERS;
  const allEvents = INITIAL_EVENTS;

  // Determine user's scope constraints
  const isGlobalScope = useMemo(() => {
    return currentUser.roleSlug === 'admin_geral' || currentUser.scope.type === 'GLOBAL';
  }, [currentUser]);

  const availableProducers = useMemo(() => {
    if (isGlobalScope) return allProducers;
    if (currentUser.scope.producerIds.length > 0) {
      return allProducers.filter(p => currentUser.scope.producerIds.includes(p.id));
    }
    return allProducers;
  }, [isGlobalScope, currentUser, allProducers]);

  const isLockedToSingleProducer = useMemo(() => {
    return !isGlobalScope && currentUser.scope.type === 'PRODUCER' && currentUser.scope.producerIds.length === 1;
  }, [isGlobalScope, currentUser]);

  const isLockedToSingleEvent = useMemo(() => {
    return !isGlobalScope && currentUser.scope.type === 'EVENT' && currentUser.scope.eventIds.length === 1;
  }, [isGlobalScope, currentUser]);

  // Determine default dashboard based on primary profile
  const defaultDashboard = useMemo(() => {
    switch (currentUser.roleSlug as string) {
      case 'admin_geral':
        return 'overview';
      case 'financeiro':
        return 'finance';
      case 'marketing':
        return 'marketing';
      case 'sac':
        return 'sac';
      case 'estorno':
        return 'refunds';
      case 'contabilidade':
        return 'accounting';
      case 'comercial':
        return 'commercial';
      case 'suporte':
      case 'suporte_eventos':
        return 'event-support';
      case 'remarketing':
        return 'remarketing';
      case 'produtor':
        return 'events';
      default:
        return 'overview';
    }
  }, [currentUser.roleSlug]);

  // Auto-lock when user changes or has single producer/event scope
  useEffect(() => {
    if (isLockedToSingleProducer) {
      const lockedId = currentUser.scope.producerIds[0];
      setSelectedProducerIdState(lockedId);
    } else if (!isGlobalScope && currentUser.scope.producerIds.length > 0) {
      if (selectedProducerId === 'all' || !currentUser.scope.producerIds.includes(selectedProducerId)) {
        setSelectedProducerIdState(currentUser.scope.producerIds[0]);
      }
    } else if (isGlobalScope && selectedProducerId === 'all') {
      // keep all
    }

    if (isLockedToSingleEvent) {
      const lockedEvtId = currentUser.scope.eventIds[0];
      setSelectedEventIdState(lockedEvtId);
    }
  }, [currentUser, isLockedToSingleProducer, isLockedToSingleEvent, isGlobalScope]);

  // Available events strictly filtered by active producer & authorized scope
  const availableEvents = useMemo(() => {
    let list = allEvents;

    // Filter by user scope first
    if (!isGlobalScope) {
      if (currentUser.scope.eventIds && currentUser.scope.eventIds.length > 0) {
        list = list.filter(e => currentUser.scope.eventIds.includes(e.id));
      } else if (currentUser.scope.producerIds && currentUser.scope.producerIds.length > 0) {
        list = list.filter(e => currentUser.scope.producerIds.includes(e.producerId));
      }
    }

    // Filter by currently selected producer in context
    if (selectedProducerId !== 'all') {
      list = list.filter(e => e.producerId === selectedProducerId);
    }

    return list;
  }, [allEvents, isGlobalScope, currentUser, selectedProducerId]);

  const activeProducer = useMemo(() => {
    if (selectedProducerId === 'all') return null;
    return allProducers.find(p => p.id === selectedProducerId) || null;
  }, [selectedProducerId, allProducers]);

  const activeEvent = useMemo(() => {
    if (selectedEventId === 'all') return null;
    return allEvents.find(e => e.id === selectedEventId) || null;
  }, [selectedEventId, allEvents]);

  const setProducer = useCallback((producerId: string | 'all') => {
    if (isLockedToSingleProducer) return;
    setSelectedProducerIdState(producerId);

    // If selected event does not belong to new producer, reset event filter
    if (producerId !== 'all' && selectedEventId !== 'all') {
      const evt = allEvents.find(e => e.id === selectedEventId);
      if (evt && evt.producerId !== producerId) {
        setSelectedEventIdState('all');
      }
    }
  }, [isLockedToSingleProducer, selectedEventId, allEvents]);

  const setEvent = useCallback((eventId: string | 'all') => {
    if (isLockedToSingleEvent) return;
    setSelectedEventIdState(eventId);

    // Auto-align producer when selecting specific event
    if (eventId !== 'all') {
      const evt = allEvents.find(e => e.id === eventId);
      if (evt && selectedProducerId !== evt.producerId) {
        setSelectedProducerIdState(evt.producerId);
      }
    }
  }, [isLockedToSingleEvent, selectedProducerId, allEvents]);

  const clearProducer = useCallback(() => {
    if (isLockedToSingleProducer) return;
    setSelectedProducerIdState('all');
    setSelectedEventIdState('all');
  }, [isLockedToSingleProducer]);

  const clearEvent = useCallback(() => {
    if (isLockedToSingleEvent) return;
    setSelectedEventIdState('all');
  }, [isLockedToSingleEvent]);

  const resetScope = useCallback(() => {
    if (!isLockedToSingleProducer) {
      setSelectedProducerIdState('all');
    }
    if (!isLockedToSingleEvent) {
      setSelectedEventIdState('all');
    }
  }, [isLockedToSingleProducer, isLockedToSingleEvent]);

  // Context-aware fetch client injecting X-Producer-Id and X-Event-Id
  const apiFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers || {});

    if (activeProducer?.id) {
      headers.set('X-Producer-Id', activeProducer.id);
    }
    if (activeEvent?.id) {
      headers.set('X-Event-Id', activeEvent.id);
    }

    const modifiedInit: RequestInit = {
      ...init,
      headers
    };

    return fetch(input, modifiedInit);
  }, [activeProducer, activeEvent]);

  const value = useMemo(() => ({
    activeProducer,
    activeEvent,
    selectedProducerId,
    selectedEventId,
    availableProducers,
    availableEvents,
    isGlobalScope,
    isLockedToSingleProducer,
    isLockedToSingleEvent,
    defaultDashboard,
    setProducer,
    setEvent,
    clearProducer,
    clearEvent,
    resetScope,
    apiFetch
  }), [
    activeProducer,
    activeEvent,
    selectedProducerId,
    selectedEventId,
    availableProducers,
    availableEvents,
    isGlobalScope,
    isLockedToSingleProducer,
    isLockedToSingleEvent,
    defaultDashboard,
    setProducer,
    setEvent,
    clearProducer,
    clearEvent,
    resetScope,
    apiFetch
  ]);

  return (
    <DiskContext.Provider value={value}>
      {children}
    </DiskContext.Provider>
  );
};

export const useDiskContext = () => {
  const context = useContext(DiskContext);
  if (!context) {
    throw new Error('useDiskContext must be used within a DiskContextProvider');
  }
  return context;
};
