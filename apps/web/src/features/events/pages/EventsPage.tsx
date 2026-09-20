import React, { useState } from 'react';
import { EventsHeader } from '../components/EventsHeader';
import { EventsSummary } from '../components/EventsSummary';
import { EventsFilters } from '../components/EventsFilters';
import { EventCard } from '../components/EventCard';
import { EventTable } from '../components/EventTable';
import { EventsEmptyState } from '../components/EventsEmptyState';
import { CreateEventModal } from '../components/CreateEventModal';
import { useEvents } from '../hooks/useEvents';
import { EventDetailDTO } from '../types/event.types';
import { AlertCircle } from 'lucide-react';

interface EventsPageProps {
  onSelectEvent: (eventId: string) => void;
  selectedEventId?: string | null;
}

export const EventsPage: React.FC<EventsPageProps> = ({
  onSelectEvent,
  selectedEventId
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

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleEventCreated = (newEvent: EventDetailDTO) => {
    refresh();
    // Automatically select newly created event
    onSelectEvent(newEvent.id);
  };

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
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        isLoading={isLoading || isSummaryLoading}
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
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelectEvent={onSelectEvent}
              isSelected={selectedEventId === event.id}
            />
          ))}
        </div>
      ) : (
        <EventTable
          events={events}
          onSelectEvent={onSelectEvent}
          selectedEventId={selectedEventId || undefined}
        />
      )}

      {/* 6. Modal for registering new draft events */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
};
