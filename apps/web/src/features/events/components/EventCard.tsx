import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Building2,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { EventListItemDTO } from '../types/event.types';
import { EventStatusBadge } from './EventStatusBadge';
import { formatNumber, formatDateTime } from '../../../shared/utils/formatters';

interface EventCardProps {
  event: EventListItemDTO;
  onSelectEvent: (eventId: string) => void;
  onConfigureDraft?: (eventId: string) => void;
  isSelected?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onSelectEvent,
  onConfigureDraft,
  isSelected = false
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(event.publicCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const occupancy = event.occupancyPercentage ?? null;
  const sold = event.soldTickets || 0;
  const capacity = event.capacity || 0;

  return (
    <div
      onClick={() => onSelectEvent(event.id)}
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-5 shadow-lg ${
        isSelected
          ? 'border-orange-500/80 bg-slate-900/90 ring-1 ring-orange-500/50'
          : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80'
      }`}
    >
      {/* Top Header: Public Code & Status */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              onClick={handleCopyCode}
              title="Copiar Código Público"
              className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-400 bg-slate-800/80 hover:bg-slate-750 hover:text-white px-2 py-0.5 rounded border border-slate-700/60 transition-colors"
            >
              {event.publicCode}
              {copiedCode ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-2.5 w-2.5 text-slate-500 group-hover:text-slate-300" />
              )}
            </span>
          </div>

          <EventStatusBadge status={event.status} size="sm" />
        </div>

        {/* Event Name */}
        <h3 className="mt-3 text-base font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-2">
          {event.name || event.title}
        </h3>

        {/* Metadata info */}
        <div className="mt-3 space-y-1.5 text-xs text-slate-400">
          {/* Producer */}
          {event.producerName && (
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{event.producerName}</span>
            </div>
          )}

          {/* Date & Time */}
          {event.startAt && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-orange-400 shrink-0" />
              <span>{formatDateTime(event.startAt)}</span>
            </div>
          )}

          {/* Venue & Location */}
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {event.venue ? `${event.venue} • ` : ''}
              {event.city || 'Cidade a definir'}{event.state ? `/${event.state}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom section: Occupancy & Action */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/80 space-y-3">
        {/* Capacity & Occupancy Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-slate-400" />
              Vendas / Lotação:
            </span>
            {capacity > 0 ? (
              <span className="font-mono text-slate-200 text-[11px] font-semibold">
                {formatNumber(sold)} / {formatNumber(capacity)}
                {occupancy !== null && (
                  <span className="text-orange-400 ml-1">({occupancy}%)</span>
                )}
              </span>
            ) : (
              <span className="text-[10px] text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Capacidade a definir
              </span>
            )}
          </div>

          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            {capacity > 0 ? (
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (occupancy || 0) >= 90
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : (occupancy || 0) >= 40
                    ? 'bg-gradient-to-r from-orange-500 to-amber-400'
                    : 'bg-gradient-to-r from-slate-600 to-slate-500'
                }`}
                style={{ width: `${Math.min(100, occupancy || 0)}%` }}
              />
            ) : (
              <div className="h-full w-0 bg-slate-700" />
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500">
            Fuso: {event.timezone || 'America/Sao_Paulo'}
          </span>

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
              className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all group-hover:translate-x-0.5 cursor-pointer"
            >
              <span>Continuar configuração</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectEvent(event.id);
              }}
              className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors group-hover:translate-x-0.5 cursor-pointer"
            >
              Acessar Evento
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
