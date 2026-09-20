import React from 'react';
import { Building2, MapPin, Users, Layers, Map, ShieldCheck, ChevronRight } from 'lucide-react';
import { VenueDTO, VenueType } from '@shared/types/index';
import { Badge } from '../../../shared/components/Badge';
import { formatNumber } from '../../../shared/utils/formatters';

interface VenueCardProps {
  venue: VenueDTO;
  onSelect: (venueId: string) => void;
}

export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  ARENA: 'Arena Multiúso',
  STADIUM: 'Estádio',
  THEATER: 'Teatro',
  CONCERT_HALL: 'Casa de Shows',
  CONVENTION_CENTER: 'Centro de Convenções',
  CLUB: 'Club / Balada',
  BAR_RESTAURANT: 'Bar / Restaurante',
  OPEN_AIR: 'Espaço Aberto / Parque',
  RACETRACK: 'Autódromo',
  GYMNASIUM: 'Ginásio Poliesportivo',
  OTHER: 'Espaço Operacional'
};

export const VenueCard: React.FC<VenueCardProps> = ({ venue, onSelect }) => {
  const isGlobal = venue.scope === 'GLOBAL';
  const typeLabel = VENUE_TYPE_LABELS[venue.type] || venue.type;
  const sectionsCount = venue.sectionsCount ?? venue.sections?.length ?? 0;
  const mapsCount = venue.mapsCount ?? venue.maps?.length ?? 0;

  return (
    <div
      onClick={() => onSelect(venue.id)}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-orange-500/50 hover:bg-slate-900/90 transition-all cursor-pointer shadow-lg hover:shadow-orange-500/5"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="cyan" size="sm">
              {typeLabel}
            </Badge>
            {isGlobal ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                <ShieldCheck className="h-3 w-3" />
                Global
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Produtor
              </span>
            )}
          </div>

          <span
            className={`h-2 w-2 rounded-full ${
              venue.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-600'
            }`}
            title={venue.status === 'ACTIVE' ? 'Ativo' : 'Arquivado'}
          />
        </div>

        {/* Title & Code */}
        <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
          {venue.name}
        </h3>
        <p className="font-mono text-[11px] text-slate-500 mt-0.5">
          {venue.publicCode}
        </p>

        {/* Location info */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="truncate">
            {venue.district ? `${venue.district}, ` : ''}{venue.city} - {venue.state}
          </span>
        </div>
      </div>

      {/* Stats Bottom Bar */}
      <div className="mt-5 pt-4 border-t border-slate-800/80">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-950/50 p-2">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
              <Users className="h-3 w-3 text-orange-400" />
              <span>Capacidade</span>
            </div>
            <div className="text-xs font-bold text-white mt-0.5 font-mono">
              {venue.capacity ? formatNumber(venue.capacity) : '—'}
            </div>
          </div>

          <div className="rounded-lg bg-slate-950/50 p-2">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
              <Layers className="h-3 w-3 text-cyan-400" />
              <span>Setores</span>
            </div>
            <div className="text-xs font-bold text-white mt-0.5 font-mono">
              {sectionsCount}
            </div>
          </div>

          <div className="rounded-lg bg-slate-950/50 p-2">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
              <Map className="h-3 w-3 text-purple-400" />
              <span>Plantas</span>
            </div>
            <div className="text-xs font-bold text-white mt-0.5 font-mono">
              {mapsCount}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end text-xs font-medium text-slate-400 group-hover:text-orange-400 transition-colors">
          <span>Gerenciar estrutura</span>
          <ChevronRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
};
