import React from 'react';
import { Calendar, MapPin, Building2, Globe, Users, ExternalLink, Sparkles } from 'lucide-react';
import { EventDetailDTO } from '../../types/event.types';
import { EventStatusBadge } from '../../components/EventStatusBadge';
import { formatDateTime, formatNumber } from '../../../../shared/utils/formatters';

interface EventPreviewCardProps {
  event: Partial<EventDetailDTO> | null;
  categoryName?: string;
  subcategoryName?: string;
}

export const EventPreviewCard: React.FC<EventPreviewCardProps> = ({
  event,
  categoryName,
  subcategoryName
}) => {
  if (!event) return null;

  const isOnline = event.format === 'ONLINE';
  const isHybrid = event.format === 'HYBRID';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-orange-400" />
          <span>Pré-visualização do Card</span>
        </div>
        <EventStatusBadge status={event.status || 'DRAFT'} size="sm" />
      </div>

      {/* Simulated Event Card */}
      <div className="rounded-xl border border-slate-750 bg-slate-850/80 p-4 space-y-3 relative overflow-hidden">
        {/* Cover Placeholder or Image */}
        <div className="relative h-32 w-full rounded-lg bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 flex items-center justify-center border border-slate-700/50 overflow-hidden group">
          {event.coverDocumentId ? (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span>Imagem de Capa Vinculada</span>
            </div>
          ) : (
            <div className="text-center p-3 text-slate-500 text-xs">
              <span className="font-semibold block text-slate-400">Identidade Visual</span>
              <span>Capa a definir na Etapa 5</span>
            </div>
          )}

          {/* Format badge overlay */}
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/90 text-slate-300 border border-slate-700/60 uppercase">
              {event.format === 'ONLINE' ? 'Online' : event.format === 'HYBRID' ? 'Híbrido' : 'Presencial'}
            </span>
          </div>
        </div>

        {/* Public Code & Category */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-mono text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
            {event.publicCode || 'EVT-2026-XXXXXX'}
          </span>

          {(categoryName || event.categoryName) && (
            <span className="text-[11px] text-slate-400 font-medium truncate">
              {categoryName || event.categoryName}
              {subcategoryName ? ` • ${subcategoryName}` : ''}
            </span>
          )}
        </div>

        {/* Event Title */}
        <h4 className="text-sm font-bold text-white line-clamp-2">
          {event.name || event.title || 'Título do evento ainda não informado'}
        </h4>

        {/* Slug link preview */}
        {event.slug && (
          <div className="flex items-center gap-1 text-[11px] text-cyan-400/90 truncate font-mono">
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">diskingressos.com.br/evento/{event.slug}</span>
          </div>
        )}

        {/* Metadata Details */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-400">
          {/* Producer */}
          {event.producerName && (
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{event.producerName}</span>
            </div>
          )}

          {/* Dates */}
          {event.startAt && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-orange-400 shrink-0" />
              <span>{formatDateTime(event.startAt)}</span>
            </div>
          )}

          {/* Location / Venue */}
          {!isOnline && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {event.venue ? `${event.venue} • ` : ''}
                {event.city || 'Cidade a definir'}{event.state ? `/${event.state}` : ''}
              </span>
            </div>
          )}

          {/* Online info */}
          {(isOnline || isHybrid) && (
            <div className="flex items-center gap-1.5 text-cyan-300 truncate">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span>Transmissão: {event.onlinePlatform || 'Plataforma a definir'}</span>
            </div>
          )}

          {/* Capacity */}
          {event.estimatedCapacity && event.estimatedCapacity > 0 && (
            <div className="flex items-center gap-1.5 text-slate-300">
              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>Capacidade prevista: {formatNumber(event.estimatedCapacity)} pessoas</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
