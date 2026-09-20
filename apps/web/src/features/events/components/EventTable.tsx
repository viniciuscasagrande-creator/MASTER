import React from 'react';
import { Building2, Calendar, MapPin, ArrowRight, TrendingUp } from 'lucide-react';
import { EventListItemDTO } from '../types/event.types';
import { EventStatusBadge } from './EventStatusBadge';
import { formatNumber, formatDateTime } from '../../../shared/utils/formatters';

interface EventTableProps {
  events: EventListItemDTO[];
  onSelectEvent: (eventId: string) => void;
  onConfigureDraft?: (eventId: string) => void;
  selectedEventId?: string;
}

export const EventTable: React.FC<EventTableProps> = ({
  events,
  onSelectEvent,
  onConfigureDraft,
  selectedEventId
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/60 shadow-lg">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <tr>
            <th className="py-3 px-4">Código</th>
            <th className="py-3 px-4">Evento</th>
            <th className="py-3 px-4">Produtor</th>
            <th className="py-3 px-4">Data / Horário</th>
            <th className="py-3 px-4">Local</th>
            <th className="py-3 px-4">Ocupação / Vendas</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-right">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {events.map((event) => {
            const isSelected = selectedEventId === event.id;
            const occupancy = event.occupancyPercentage;
            const sold = event.soldTickets || 0;
            const capacity = event.capacity || 0;

            return (
              <tr
                key={event.id}
                onClick={() => onSelectEvent(event.id)}
                className={`transition-colors cursor-pointer hover:bg-slate-800/40 ${
                  isSelected ? 'bg-orange-500/10' : ''
                }`}
              >
                {/* Code */}
                <td className="py-3 px-4 font-mono font-semibold text-slate-400">
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                    {event.publicCode}
                  </span>
                </td>

                {/* Name */}
                <td className="py-3 px-4 font-bold text-white max-w-[220px] truncate">
                  {event.name || event.title}
                </td>

                {/* Producer */}
                <td className="py-3 px-4 text-slate-300">
                  <div className="flex items-center gap-1.5 max-w-[160px] truncate">
                    <Building2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{event.producerName || '—'}</span>
                  </div>
                </td>

                {/* Date */}
                <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                    <span>{event.startAt ? formatDateTime(event.startAt) : 'A definir'}</span>
                  </div>
                </td>

                {/* Venue */}
                <td className="py-3 px-4 text-slate-400 max-w-[180px] truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {event.venue ? `${event.venue}, ` : ''}
                      {event.city || '—'}{event.state ? `/${event.state}` : ''}
                    </span>
                  </div>
                </td>

                {/* Capacity / Sold */}
                <td className="py-3 px-4">
                  {capacity > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-200">
                          {formatNumber(sold)} / {formatNumber(capacity)}
                        </span>
                        {occupancy !== null && (
                          <span className="text-orange-400 font-semibold">{occupancy}%</span>
                        )}
                      </div>
                      <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                          style={{ width: `${Math.min(100, occupancy || 0)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500">A definir</span>
                  )}
                </td>

                {/* Status */}
                <td className="py-3 px-4">
                  <EventStatusBadge status={event.status} size="sm" />
                </td>

                {/* Action */}
                <td className="py-3 px-4 text-right">
                  {event.status === 'DRAFT' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onConfigureDraft) {
                          onConfigureDraft(event.id);
                        } else {
                          onSelectEvent(event.id);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded border border-amber-500/30 transition-colors cursor-pointer"
                    >
                      Configurar
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(event.id);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 cursor-pointer"
                    >
                      Acessar
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
