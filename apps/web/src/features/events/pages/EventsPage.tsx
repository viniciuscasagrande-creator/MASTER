import React, { useState } from 'react';
import { EventsHeader } from '../components/EventsHeader';
import { EventsSummary } from '../components/EventsSummary';
import { EventsFilters } from '../components/EventsFilters';
import { EventCard } from '../components/EventCard';
import { EventTable } from '../components/EventTable';
import { EventsEmptyState } from '../components/EventsEmptyState';
import { CreateEventModal } from '../components/CreateEventModal';
import { EventWizardPage } from '../wizard/EventWizardPage';
import { useEvents } from '../hooks/useEvents';
import { createEventDraft } from '../api/events.api';
import { EventDetailDTO } from '../types/event.types';
import { AlertCircle } from 'lucide-react';

interface EventsPageProps {
  onSelectEvent: (eventId: string) => void;
  selectedEventId?: string | null;
  onOpenWizard?: (eventId: string) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({
  onSelectEvent,
  selectedEventId,
  onOpenWizard
}) => {
  const {
    events,
    total,
    summary,
    filters,
    viewMode,
    isLoading,
    isSummaryLoading,
    error,
    setViewMode,
    handleChangeFilter,
    handleClearFilters,
    refresh
  } = useEvents();

  const [activeWizardEventId, setActiveWizardEventId] = useState<string | null>(null);
  const [isStartingDraft, setIsStartingDraft] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Flow: + Criar evento creates an early draft and opens the Intelligent Wizard
  const handleStartNewDraft = async () => {
    try {
      setIsStartingDraft(true);
      const result = await createEventDraft({});
      refresh();
      if (onOpenWizard) {
        onOpenWizard(result.event.id);
      } else {
        setActiveWizardEventId(result.event.id);
      }
    } catch (err: any) {
      console.error('Erro ao iniciar rascunho:', err);
      // Fallback to traditional modal if needed
      setIsCreateModalOpen(true);
    } finally {
      setIsStartingDraft(false);
    }
  };

  const handleOpenDraftConfig = (eventId: string) => {
    if (onOpenWizard) {
      onOpenWizard(eventId);
    } else {
      setActiveWizardEventId(eventId);
    }
  };

  const handleEventCreated = (newEvent: EventDetailDTO) => {
    refresh();
    onSelectEvent(newEvent.id);
  };

  // If the wizard is currently active, render it directly
  if (activeWizardEventId) {
    return (
      <EventWizardPage
        eventId={activeWizardEventId}
        onExit={() => {
          setActiveWizardEventId(null);
          refresh();
        }}
      />
    );
  }

  const hasActiveFilters = Boolean(
    filters.search ||
    (filters.status && filters.status !== 'ALL') ||
    (filters.period && filters.period !== 'all')
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header with dynamic title, producer scope badge & actions */}
      <EventsHeader
        onRefresh={refresh}
        onOpenCreateModal={handleStartNewDraft}
        isLoading={isLoading || isSummaryLoading || isStartingDraft}
      />

      {/* 2. Top Summary KPI Cards (Total, Em Venda, Próximos, Em Configuração) */}
      <EventsSummary
        summary={summary}
        isLoading={isSummaryLoading}
      />

      {/* 3. Filters Toolbar (Search, Status, Period, Sort, Grid/Table view) */}
      <EventsFilters
        filters={filters}
        onChangeFilter={handleChangeFilter}
        onClearFilters={handleClearFilters}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        totalResults={total}
      />

      {/* 4. Error banner if any */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 5. Main Catalog Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-28 bg-slate-800 rounded" />
                  <div className="h-4 w-20 bg-slate-800 rounded" />
                </div>
                <div className="h-6 w-3/4 bg-slate-800 rounded mt-3" />
                <div className="h-3 w-1/2 bg-slate-800 rounded mt-2" />
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-slate-800 rounded" />
                <div className="h-4 w-24 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <EventsEmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          onOpenCreateModal={handleStartNewDraft}
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelectEvent={onSelectEvent}
              onConfigureDraft={handleOpenDraftConfig}
              isSelected={selectedEventId === event.id}
            />
          ))}
        </div>
      ) : (
        <EventTable
          events={events}
          onSelectEvent={onSelectEvent}
          onConfigureDraft={handleOpenDraftConfig}
          selectedEventId={selectedEventId || undefined}
        />
      )}

      {/* 6. Fallback Modal for registering new draft events */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
};
