import React, { createContext, useContext, useState, useMemo } from 'react';
import { Producer, EventItem } from '../types';
import { INITIAL_PRODUCERS, INITIAL_EVENTS } from '../database/mockDatabase';

interface ScopeContextType {
  producers: Producer[];
  events: EventItem[];
  selectedProducerId: string | 'all';
  selectedEventId: string | 'all';
  setSelectedProducerId: (id: string | 'all') => void;
  setSelectedEventId: (id: string | 'all') => void;
  currentProducer: Producer | null;
  currentEvent: EventItem | null;
  availableEvents: EventItem[];
  resetScope: () => void;
}

const ScopeContext = createContext<ScopeContextType | undefined>(undefined);

export const ScopeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProducerId, setSelectedProducerIdState] = useState<string | 'all'>('all');
  const [selectedEventId, setSelectedEventIdState] = useState<string | 'all'>('all');

  const producers = INITIAL_PRODUCERS;
  const allEvents = INITIAL_EVENTS;

  // If producer is selected, filter events available to that producer
  const availableEvents = useMemo(() => {
    if (selectedProducerId === 'all') return allEvents;
    return allEvents.filter(e => e.producerId === selectedProducerId);
  }, [selectedProducerId, allEvents]);

  const setSelectedProducerId = (id: string | 'all') => {
    setSelectedProducerIdState(id);
    // If the currently selected event does not belong to the new producer, reset event to all
    if (id !== 'all' && selectedEventId !== 'all') {
      const evt = allEvents.find(e => e.id === selectedEventId);
      if (evt && evt.producerId !== id) {
        setSelectedEventIdState('all');
      }
    }
  };

  const setSelectedEventId = (id: string | 'all') => {
    setSelectedEventIdState(id);
    if (id !== 'all') {
      const evt = allEvents.find(e => e.id === id);
      if (evt && selectedProducerId !== evt.producerId) {
        setSelectedProducerIdState(evt.producerId);
      }
    }
  };

  const resetScope = () => {
    setSelectedProducerIdState('all');
    setSelectedEventIdState('all');
  };

  const currentProducer = useMemo(() => {
    if (selectedProducerId === 'all') return null;
    return producers.find(p => p.id === selectedProducerId) || null;
  }, [selectedProducerId, producers]);

  const currentEvent = useMemo(() => {
    if (selectedEventId === 'all') return null;
    return allEvents.find(e => e.id === selectedEventId) || null;
  }, [selectedEventId, allEvents]);

  const value = useMemo(() => ({
    producers,
    events: allEvents,
    selectedProducerId,
    selectedEventId,
    setSelectedProducerId,
    setSelectedEventId,
    currentProducer,
    currentEvent,
    availableEvents,
    resetScope
  }), [producers, allEvents, selectedProducerId, selectedEventId, currentProducer, currentEvent, availableEvents]);

  return (
    <ScopeContext.Provider value={value}>
      {children}
    </ScopeContext.Provider>
  );
};

export const useScope = () => {
  const context = useContext(ScopeContext);
  if (!context) {
    throw new Error('useScope must be used within a ScopeProvider');
  }
  return context;
};
