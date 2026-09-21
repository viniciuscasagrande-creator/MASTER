import React from 'react';
import { ArrowLeft, Building2, Calendar, MapPin, ChevronDown, X, Sparkles } from 'lucide-react';
import { EventDetailDTO, EventListItemDTO } from '../types/event.types';
import { EventStatusBadge } from './EventStatusBadge';
import { formatDateTime } from '../../../shared/utils/formatters';

interface EventContextHeaderProps {
  event: EventDetailDTO | EventListItemDTO;
  availableEvents: EventListItemDTO[];
  onSelectAnotherEvent: (eventId: string) => void;
  onClearEventContext: () => void;
}

export const EventContextHeader: React.FC<EventContextHeaderProps> = ({
  event,
  availableEvents = [],
  onSelectAnotherEvent,
  onClearEventContext
}) => {
  if (!event) return null;

  return (
    <div className="rounded-2xl border border-orange-200 bg-white p-4 shadow-xs mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Back button + Event Identity */}
        <div className="flex items-start sm:items-center gap-3">
          <button
            onClick={onClearEventContext}
            title="Voltar ao catálogo geral de eventos"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition-colors cursor-pointer border border-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                {event.publicCode}
              </span>
              <EventStatusBadge status={event.status} size="sm" />
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Contexto Operacional Ativo
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {event.name || event.title}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              {event.producerName && (
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Building2 className="h-3.5 w-3.5 text-cyan-600" />
                  <span>{event.producerName}</span>
                </div>
              )}

              {event.startAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-orange-600" />
                  <span>{formatDateTime(event.startAt)}</span>
                </div>
              )}

              {(event.venue || event.city) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <span>
                    {event.venue ? `${event.venue}, ` : ''}
                    {event.city || ''}{event.state ? `/${event.state}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Switcher dropdown & Clear button */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          {availableEvents && availableEvents.length > 1 && (
            <div className="relative">
              <select
                value={event.id}
                onChange={(e) => onSelectAnotherEvent(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-800 rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-2xs"
              >
                {availableEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    Alternar: {evt.name || evt.title} ({evt.publicCode})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          )}

          <button
            onClick={onClearEventContext}
            title="Sair do contexto deste evento e voltar à visão do Produtor"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-xs font-semibold text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer shadow-2xs"
          >
            <X className="h-3.5 w-3.5 text-slate-400 hover:text-rose-500" />
            <span className="hidden sm:inline">Desselecionar Evento</span>
          </button>
        </div>
      </div>
    </div>
  );
};
