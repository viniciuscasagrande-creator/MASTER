import React from 'react';
import { Producer, EventItem } from '../types';
import { useDiskContext } from './DiskContext';

export interface ScopeContextType {
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

export const ScopeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useScope = (): ScopeContextType => {
  const disk = useDiskContext();

  return {
    producers: disk.availableProducers,
    events: disk.availableEvents,
    selectedProducerId: disk.selectedProducerId,
    selectedEventId: disk.selectedEventId,
    setSelectedProducerId: disk.setProducer,
    setSelectedEventId: disk.setEvent,
    currentProducer: disk.activeProducer,
    currentEvent: disk.activeEvent,
    availableEvents: disk.availableEvents,
    resetScope: disk.resetScope
  };
};

