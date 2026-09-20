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
import { EventSectionsPage } from '../../features/events/tickets/EventSectionsPage';
import { EventTicketTypesPage } from '../../features/events/tickets/EventTicketTypesPage';
import { EventCapacityPage } from '../../features/events/tickets/EventCapacityPage';
import { EventBatchesPage } from '../../features/events/sales/EventBatchesPage';
import { EventPricingPage } from '../../features/events/sales/EventPricingPage';
import { EventSalesRulesPage } from '../../features/events/sales/EventSalesRulesPage';
import { EventSalesChannelsPage } from '../../features/events/sales-channels/EventSalesChannelsPage';
import { ComplimentaryPage } from '../../features/events/complimentary/ComplimentaryPage';
import { EventTeamPage } from '../../features/events/team/EventTeamPage';
import { EventDocumentsPage } from '../../features/events/documents/EventDocumentsPage';
import { EventTasksPage } from '../../features/events/tasks/EventTasksPage';
import { EventReadinessPage } from '../../features/events/readiness/EventReadinessPage';
import { EventReviewPublicationPage } from '../../features/events/publication/EventReviewPublicationPage';
import { EventChangeManagementPage } from '../../features/events/changes/EventChangeManagementPage';
import { EventOperationPage } from '../../features/events/operation/EventOperationPage';
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

  // Helper for active event in commercial/inventory sub-routes
  const activeEvent = selectedEvent || events[0];

  const renderNoEventSelected = (actionLabel: string) => (
    <div className="p-8 text-center text-slate-400 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40">
      <p className="text-sm font-semibold text-slate-300">Nenhum evento selecionado para {actionLabel}.</p>
      <p className="text-xs text-slate-500">Selecione um evento no catálogo para gerenciar sua operação comercial.</p>
      <button
        onClick={() => onNavigate?.('events', 'events-all')}
        className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-md transition-all"
      >
        Escolher Evento no Catálogo
      </button>
    </div>
  );

  // --- SUB-ROTA: SETORES OPERACIONAIS (FASE 1.2.5) ---
  if (initialSubItem === 'events-sections') {
    if (!activeEvent) return renderNoEventSelected('gerenciar setores operacionais');
    return (
      <EventSectionsPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
        onNavigateToTickets={() => onNavigate?.('events', 'events-tickets')}
        onNavigateToCapacity={() => onNavigate?.('events', 'events-capacity')}
      />
    );
  }

  // --- SUB-ROTA: TIPOS DE INGRESSO (FASE 1.2.5) ---
  if (initialSubItem === 'events-tickets') {
    if (!activeEvent) return renderNoEventSelected('configurar tipos de ingresso');
    return (
      <EventTicketTypesPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
        onNavigateToSections={() => onNavigate?.('events', 'events-sections')}
        onNavigateToPricing={() => onNavigate?.('events', 'events-pricing')}
      />
    );
  }

  // --- SUB-ROTA: INVENTÁRIO & CAPACIDADE (FASE 1.2.5) ---
  if (initialSubItem === 'events-capacity') {
    if (!activeEvent) return renderNoEventSelected('visualizar inventário e capacidade');
    return (
      <EventCapacityPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
        onNavigateToSections={() => onNavigate?.('events', 'events-sections')}
        onNavigateToPricing={() => onNavigate?.('events', 'events-pricing')}
      />
    );
  }

  // --- SUB-ROTA: LOTES COMERCIAIS (FASE 1.2.6) ---
  if (initialSubItem === 'events-batches' || initialSubItem === 'events-lots') {
    if (!activeEvent) return renderNoEventSelected('gerenciar lotes comerciais');
    return (
      <EventBatchesPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
        onNavigateToPricing={() => onNavigate?.('events', 'events-pricing')}
        onNavigateToTickets={() => onNavigate?.('events', 'events-tickets')}
      />
    );
  }

  // --- SUB-ROTA: MATRIZ DE PREÇOS (FASE 1.2.6) ---
  if (initialSubItem === 'events-pricing') {
    if (!activeEvent) return renderNoEventSelected('configurar matriz de preços');
    return (
      <EventPricingPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
        onNavigateToBatches={() => onNavigate?.('events', 'events-batches')}
        onNavigateToRules={() => onNavigate?.('events', 'events-rules')}
      />
    );
  }

  // --- SUB-ROTA: REGRAS DE VENDA (FASE 1.2.6) ---
  if (initialSubItem === 'events-rules') {
    if (!activeEvent) return renderNoEventSelected('gerenciar regras de venda');
    return (
      <EventSalesRulesPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
        onBackToDashboard={() => onNavigate?.('events', 'events-dashboard')}
        onNavigateToBatches={() => onNavigate?.('events', 'events-batches')}
        onNavigateToPricing={() => onNavigate?.('events', 'events-pricing')}
      />
    );
  }

  // --- SUB-ROTA: CANAIS DE VENDA (FASE 1.2.7) ---
  if (initialSubItem === 'events-channels') {
    if (!activeEvent) return renderNoEventSelected('gerenciar canais de venda');
    return (
      <EventSalesChannelsPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
        onNavigateToInventory={() => onNavigate?.('events', 'events-capacity')}
        onNavigateToSessions={() => onNavigate?.('events', 'events-sessions')}
      />
    );
  }

  // --- SUB-ROTA: CORTESIAS & CONVITES (FASE 1.2.7) ---
  if (initialSubItem === 'events-complimentary') {
    if (!activeEvent) return renderNoEventSelected('gerenciar cortesias e convites');
    return (
      <ComplimentaryPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
        onNavigateToInventory={() => onNavigate?.('events', 'events-capacity')}
      />
    );
  }

  // --- SUB-ROTA: EQUIPE DO EVENTO & ESCALAS (FASE 1.2.7) ---
  if (initialSubItem === 'events-team') {
    if (!activeEvent) return renderNoEventSelected('gerenciar equipe e escalas');
    return (
      <EventTeamPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
      />
    );
  }

  // --- SUB-ROTA: DOCUMENTOS DO EVENTO (FASE 1.2.8) ---
  if (initialSubItem === 'events-documents') {
    if (!activeEvent) return renderNoEventSelected('gerenciar documentos do evento');
    return (
      <EventDocumentsPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
      />
    );
  }

  // --- SUB-ROTA: PENDÊNCIAS DO EVENTO (FASE 1.2.8) ---
  if (initialSubItem === 'events-tasks') {
    if (!activeEvent) return renderNoEventSelected('gerenciar pendências do evento');
    return (
      <EventTasksPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
        onNavigateToReadiness={() => onNavigate?.('events', 'events-readiness')}
      />
    );
  }

  // --- SUB-ROTA: CENTRAL DE PRONTIDÃO (FASE 1.2.8) ---
  if (initialSubItem === 'events-readiness') {
    if (!activeEvent) return renderNoEventSelected('avaliar prontidão do evento');
    return (
      <EventReadinessPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
        onNavigateToTab={(tabId) => onNavigate?.('events', tabId)}
      />
    );
  }

  // --- SUB-ROTA: CENTRAL DE ALTERAÇÕES CONTROLADAS (FASE 1.2.10) ---
  if (initialSubItem === 'events-changes') {
    if (!activeEvent) return renderNoEventSelected('gerenciar alterações controladas do evento');
    return (
      <EventChangeManagementPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
      />
    );
  }

  // --- SUB-ROTA: REVISÃO & PUBLICAÇÃO (FASE 1.2.9) ---
  if (initialSubItem === 'events-review-publication') {
    if (!activeEvent) return renderNoEventSelected('revisar e publicar o evento');
    return (
      <EventReviewPublicationPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
      />
    );
  }

  // --- SUB-ROTA: CENTRAL DE OPERAÇÃO EM TEMPO REAL (FASE 1.2.12) ---
  if (initialSubItem === 'events-operation' || initialSubItem === 'events-realtime') {
    if (!activeEvent) return renderNoEventSelected('acessar a central de operação em tempo real');
    return (
      <EventOperationPage
        eventId={activeEvent.id}
        eventName={activeEvent.name || (activeEvent as any).title}
        onNavigate={(subId) => onNavigate?.('events', subId)}
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
