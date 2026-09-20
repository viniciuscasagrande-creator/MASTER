import { useState, useCallback, useEffect } from 'react';
import { EventDetailDTO, EventListItemDTO } from '../types/event.types';
import { selectEventContext, fetchEventById } from '../api/events.api';
import { useDiskContext } from '../../../core/context/DiskContext';

export function useEventSelection() {
  const {
    activeEvent,
    selectedEventId,
    setEvent,
    clearEvent,
    apiFetch
  } = useDiskContext();

  const [selectedEventDetails, setSelectedEventDetails] = useState<EventDetailDTO | null>(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  // If there is an activeEvent in DiskContext, load its details
  useEffect(() => {
    if (selectedEventId && selectedEventId !== 'all') {
      let isMounted = true;
      fetchEventById(selectedEventId, apiFetch)
        .then((details) => {
          if (isMounted) setSelectedEventDetails(details);
        })
        .catch((err) => {
          console.warn('Não foi possível carregar detalhes do evento ativo:', err);
        });
      return () => {
        isMounted = false;
      };
    } else {
      setSelectedEventDetails(null);
    }
  }, [selectedEventId, apiFetch]);

  const selectEvent = useCallback(
    async (eventId: string, existingItem?: EventListItemDTO) => {
      try {
        setIsSelecting(true);
        setSelectionError(null);

        // 1. Sync context with backend (records audit & domain event)
        const response = await selectEventContext(eventId, apiFetch);

        // 2. Set details in local state
        setSelectedEventDetails(response.event);

        // 3. Sync DiskContext (X-Event-Id, X-Producer-Id)
        setEvent(eventId);

        return response.event;
      } catch (err: any) {
        setSelectionError(err.message || 'Falha ao selecionar evento');
        throw err;
      } finally {
        setIsSelecting(false);
      }
    },
    [apiFetch, setEvent]
  );

  const deselectEvent = useCallback(() => {
    clearEvent();
    setSelectedEventDetails(null);
  }, [clearEvent]);

  return {
    selectedEventId: selectedEventId !== 'all' ? selectedEventId : null,
    selectedEvent: selectedEventDetails,
    isSelecting,
    selectionError,
    selectEvent,
    deselectEvent
  };
}
