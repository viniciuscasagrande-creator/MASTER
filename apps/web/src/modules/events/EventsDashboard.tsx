import React, { useState, useEffect } from 'react';
import { EventsPage } from '../../features/events/pages/EventsPage';
import { EventDashboardPage } from '../../features/events/pages/EventDashboardPage';
import { EventWizardPage } from '../../features/events/wizard/EventWizardPage';
import { VenuesPage } from '../../features/events/venues/VenuesPage';
import { VenueDetailsPage } from '../../features/events/venues/VenueDetailsPage';
import { VenueCreatePage } from '../../features/events/venues/VenueCreatePage';
import { VenueMapEditorPage } from '../../features/events/venues/VenueMapEditorPage';
import { EventSessionsPage } from '../../features/events/sessions/EventSessionsPage';
import { EventSessionDetailsPage } from '../../features/events/sessions/EventSessionDetailsPage';
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

  // Venues Navigation State (Fase 1.2.3)
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [isCreatingVenue, setIsCreatingVenue] = useState(false);
  const [venueMapEditor, setVenueMapEditor] = useState<{ mapId: string; versionId?: string } | null>(null);

  // Sessions Navigation State (Fase 1.2.4)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

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

  // Reset internal page states when switching subItems
  useEffect(() => {
    if (initialSubItem !== 'events-venues') {
      setSelectedVenueId(null);
      setIsCreatingVenue(false);
      setVenueMapEditor(null);
    }
    if (initialSubItem !== 'events-sessions') {
      setSelectedSessionId(null);
    }
  }, [initialSubItem]);

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

  // --- SUB-ROTA: LOCAIS & PLANTAS (FASE 1.2.3) ---
  if (initialSubItem === 'events-venues') {
    if (venueMapEditor && selectedVenueId) {
      return (
        <VenueMapEditorPage
          venueId={selectedVenueId}
          mapId={venueMapEditor.mapId}
          initialVersionId={venueMapEditor.versionId}
          onBack={() => setVenueMapEditor(null)}
        />
      );
    }

    if (selectedVenueId) {
      return (
        <VenueDetailsPage
          venueId={selectedVenueId}
          onBack={() => setSelectedVenueId(null)}
          onOpenMapEditor={(mapId, versionId) => setVenueMapEditor({ mapId, versionId })}
        />
      );
    }

    if (isCreatingVenue) {
      return (
        <VenueCreatePage
          onSuccess={(newId) => {
            setIsCreatingVenue(false);
            setSelectedVenueId(newId);
          }}
          onCancel={() => setIsCreatingVenue(false)}
        />
      );
    }

    return (
      <VenuesPage
        onSelectVenue={(id) => setSelectedVenueId(id)}
        onCreateVenue={() => setIsCreatingVenue(true)}
      />
    );
  }

  // --- SUB-ROTA: SESSÕES & CAPACIDADE (FASE 1.2.4) ---
  if (initialSubItem === 'events-sessions') {
    // If an event is selected, or pick the first available
    const activeEvent = selectedEvent || events[0];

    if (!activeEvent) {
      return (
        <div className="p-8 text-center text-slate-400 space-y-3">
          <p className="text-sm font-semibold">Nenhum evento selecionado para gerenciar sessões.</p>
          <button
            onClick={() => onNavigate?.('events', 'events-all')}
            className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold"
          >
            Escolher Evento no Catálogo
          </button>
        </div>
      );
    }

    if (selectedSessionId) {
      return (
        <EventSessionDetailsPage
          eventId={activeEvent.id}
          sessionId={selectedSessionId}
          onBack={() => setSelectedSessionId(null)}
        />
      );
    }

    return (
      <EventSessionsPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
        onSelectSession={(id) => setSelectedSessionId(id)}
        onBackToDashboard={() => onNavigate?.('events', 'events-dashboard')}
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
