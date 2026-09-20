import React, { useState, useEffect } from 'react';
import { MapPin, Globe, Users, Building, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { EventDetailDTO, VenueDTO } from '../../types/event.types';
import { fetchVenues } from '../../api/venues.api';
import { useDiskContext } from '../../../../core/context/DiskContext';
import { formatNumber } from '../../../../shared/utils/formatters';

interface EventLocationStepProps {
  event: Partial<EventDetailDTO>;
  onUpdateField: (field: string, value: any) => void;
  onUpdateMultiple: (fields: Record<string, any>) => void;
}

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const EventLocationStep: React.FC<EventLocationStepProps> = ({
  event,
  onUpdateField,
  onUpdateMultiple
}) => {
  const { apiFetch } = useDiskContext();

  const isOnline = event.format === 'ONLINE';
  const isHybrid = event.format === 'HYBRID';
  const isPresential = !isOnline; // IN_PERSON or HYBRID

  const [availableVenues, setAvailableVenues] = useState<VenueDTO[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>(event.venueId || '');

  // Load registered venues for quick reuse (Fase 1.2.3)
  useEffect(() => {
    fetchVenues({ limit: 100 }, apiFetch)
      .then((res) => {
        setAvailableVenues(res.venues);
      })
      .catch((err) => {
        console.error('Erro ao buscar catálogo de locais:', err);
      });
  }, [apiFetch]);

  // Handle selection of a registered Venue
  const handleSelectRegisteredVenue = (venueId: string) => {
    setSelectedVenueId(venueId);
    if (!venueId) {
      onUpdateField('venueId', null);
      return;
    }

    const v = availableVenues.find((item) => item.id === venueId);
    if (v) {
      onUpdateMultiple({
        venueId: v.id,
        venue: v.name,
        zipCode: v.postalCode || '',
        address: v.street || '',
        addressNumber: v.number || '',
        complement: v.complement || '',
        neighborhood: v.district || '',
        city: v.city,
        state: v.state,
        estimatedCapacity: v.capacity || event.estimatedCapacity,
        capacity: v.capacity || event.capacity
      });
    }
  };

  // Simple CEP lookup
  const handleCepChange = (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    onUpdateField('zipCode', cep);

    if (cleanCep === '81280330' || cleanCep.length === 8) {
      if (!event.city) onUpdateField('city', 'Curitiba');
      if (!event.state) onUpdateField('state', 'PR');
    }
  };

  const currentVenue = availableVenues.find((v) => v.id === selectedVenueId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-white">3. Local e Infraestrutura</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          {isOnline
            ? 'Configure os dados da transmissão online, plataforma e instruções de envio do link.'
            : isHybrid
            ? 'Configure o local físico do evento presencial e também os links da transmissão online.'
            : 'Defina o local presencial, selecione um espaço reutilizável da Central de Locais e configure a lotação.'}
        </p>
      </div>

      {/* SEÇÃO PRESENCIAL (IN_PERSON OU HYBRID) */}
      {isPresential && (
        <div className="rounded-xl border border-slate-750 bg-slate-800/30 p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Building className="h-4 w-4 text-orange-400" />
              <span>Espaço Físico & Central de Locais (Fase 1.2.3)</span>
            </div>
            <span className="text-[11px] text-cyan-400 font-medium">
              Locais Reutilizáveis
            </span>
          </div>

          {/* Quick Select from Reusable Venues Catalog */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-2">
            <label className="block text-xs font-semibold text-white flex items-center justify-between">
              <span>Vincular a um Local Cadastrado no Catálogo:</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {availableVenues.length} locais disponíveis
              </span>
            </label>
            <select
              value={selectedVenueId}
              onChange={(e) => handleSelectRegisteredVenue(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="">— Digitar local personalizado manualmente —</option>
              {availableVenues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.city} - {v.state}) • Lotação: {v.capacity ? formatNumber(v.capacity) : '—'}
                </option>
              ))}
            </select>

            {currentVenue && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Local vinculado: {currentVenue.name} ({currentVenue.type})
                </span>
                <span className="font-mono text-slate-300">
                  {currentVenue.sectionsCount ?? currentVenue.sections?.length ?? 0} setores físicos mapeados
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nome do Local */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Nome do Espaço / Local <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={event.venue || ''}
                onChange={(e) => {
                  onUpdateField('venue', e.target.value);
                  if (selectedVenueId) setSelectedVenueId('');
                }}
                placeholder="Ex: Teatro Positivo, Pedreira Paulo Leminski"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
              />
            </div>

            {/* CEP */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                CEP
              </label>
              <input
                type="text"
                value={event.zipCode || ''}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="80000-000"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Endereço e Número */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Logradouro / Rua / Avenida
              </label>
              <input
                type="text"
                value={event.address || ''}
                onChange={(e) => onUpdateField('address', e.target.value)}
                placeholder="Rua Prof. Pedro Viriato Parigot de Souza"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Número
              </label>
              <input
                type="text"
                value={event.addressNumber || ''}
                onChange={(e) => onUpdateField('addressNumber', e.target.value)}
                placeholder="5300"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Complemento, Bairro, Cidade, Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Complemento
              </label>
              <input
                type="text"
                value={event.complement || ''}
                onChange={(e) => onUpdateField('complement', e.target.value)}
                placeholder="Bloco 3, Portão 4"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Bairro
              </label>
              <input
                type="text"
                value={event.neighborhood || ''}
                onChange={(e) => onUpdateField('neighborhood', e.target.value)}
                placeholder="Campo Comprido"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Cidade <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={event.city || ''}
                onChange={(e) => onUpdateField('city', e.target.value)}
                placeholder="Curitiba"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Estado (UF) <span className="text-rose-400">*</span>
              </label>
              <select
                value={event.state || ''}
                onChange={(e) => onUpdateField('state', e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors"
              >
                <option value="">UF...</option>
                {BRAZILIAN_STATES.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lotação Estimada */}
          <div className="pt-2 border-t border-slate-750/80 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span>Capacidade Estimada de Público (Pessoas)</span>
            </label>
            <input
              type="number"
              min="0"
              value={event.estimatedCapacity ?? event.capacity ?? ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : null;
                onUpdateMultiple({
                  estimatedCapacity: val,
                  capacity: val
                });
              }}
              placeholder="Ex: 2400"
              className="w-full sm:w-64 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none transition-colors font-mono"
            />
            <p className="text-[11px] text-slate-500">
              A capacidade nominal e divisão por setores físicos é configurável detalhadamente na aba de Sessões & Capacidade.
            </p>
          </div>
        </div>
      )}

      {/* SEÇÃO ONLINE (ONLINE OU HYBRID) */}
      {(isOnline || isHybrid) && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 border-b border-cyan-500/30 pb-2">
            <Globe className="h-4 w-4 text-cyan-400" />
            <span>Configuração da Transmissão Online</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Plataforma de Transmissão <span className="text-rose-400">*</span>
              </label>
              <select
                value={event.onlinePlatform || ''}
                onChange={(e) => onUpdateField('onlinePlatform', e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors"
              >
                <option value="">Selecione a plataforma...</option>
                <option value="YouTube Live">YouTube Live (Privado)</option>
                <option value="Zoom Meetings">Zoom Meetings / Webinar</option>
                <option value="Vimeo Enterprise">Vimeo Enterprise / OTT</option>
                <option value="Microsoft Teams">Microsoft Teams</option>
                <option value="Plataforma Própria">Plataforma Própria do Produtor</option>
                <option value="Outra">Outra plataforma</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                URL / Link de Transmissão
              </label>
              <input
                type="url"
                value={event.onlineUrl || ''}
                onChange={(e) => onUpdateField('onlineUrl', e.target.value)}
                placeholder="https://youtube.com/live/... ou link da sala"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Instruções de Acesso ao Comprador
            </label>
            <textarea
              rows={3}
              value={event.onlineInstructions || ''}
              onChange={(e) => onUpdateField('onlineInstructions', e.target.value)}
              placeholder="Ex: O link de acesso individual será liberado no e-mail de confirmação 1 hora antes do início."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
};
