import React, { useState, useEffect } from 'react';
import { EventsPage } from '../../features/events/pages/EventsPage';
import { EventDashboardPage } from '../../features/events/pages/EventDashboardPage';
import { EventWizardPage } from '../../features/events/wizard/EventWizardPage';
import { useEventSelection } from '../../features/events/hooks/useEventSelection';
import { useEvents } from '../../features/events/hooks/useEvents';
import { createEventDraft } from '../../features/events/api/events.api';

interface EventsDashboardProps {
  onNavigate?: (moduleId: string, subItemId?: string) => void;
  initialSubItem?: string;
}

export const EventsDashboard: React.FC<EventsDashboardProps> = ({
  onNavigate,
  initialSubItem
}) => {
  const {
    selectedEventId,
    selectedEvent,
    selectEvent,
    deselectEvent
  } = useEventSelection();

  const { events } = useEvents();
  const [wizardEventId, setWizardEventId] = useState<string | null>(null);

  // Auto-trigger wizard when navigating to 'events-create'
  useEffect(() => {
    if (initialSubItem === 'events-create' && !wizardEventId) {
      createEventDraft({})
        .then(({ event }) => {
          setWizardEventId(event.id);
        })
        .catch((err) => {
          console.error('Erro ao iniciar rascunho de evento:', err);
        });
    }
  }, [initialSubItem, wizardEventId]);

  // If wizard is active
  if (wizardEventId) {
    return (
      <EventWizardPage
        eventId={wizardEventId}
        onExit={() => {
          setWizardEventId(null);
          if (onNavigate) onNavigate('events', 'events-all');
        }}
      />
    );
  }

  // If user explicitly clicks on "Todos os Eventos" / "Eventos Cadastrados", they want to see the catalog
  const forceCatalog = initialSubItem === 'events-all';

  // If an event is selected in context and user hasn't explicitly navigated to 'events-all', show the operational event dashboard
  if (selectedEvent && !forceCatalog) {
    return (
      <EventDashboardPage
        event={selectedEvent}
        availableEvents={events}
        onSelectAnotherEvent={(id) => selectEvent(id)}
        onClearEventContext={deselectEvent}
        onNavigateModule={onNavigate}
      />
    );
  }

  // Otherwise, show the full catalog of events
  return (
    <EventsPage
      onSelectEvent={(id) => selectEvent(id)}
      selectedEventId={selectedEventId}
      onOpenWizard={(id) => setWizardEventId(id)}
    />
  );
};

export default EventsDashboard;
