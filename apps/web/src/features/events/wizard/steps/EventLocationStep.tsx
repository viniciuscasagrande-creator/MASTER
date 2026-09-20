import React from 'react';
import { MapPin, Globe, Users, Building, AlertCircle } from 'lucide-react';
import { EventDetailDTO } from '../../types/event.types';

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
  const isOnline = event.format === 'ONLINE';
  const isHybrid = event.format === 'HYBRID';
  const isPresential = !isOnline; // IN_PERSON or HYBRID

  // Simple CEP lookup mock/simulator
  const handleCepChange = (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    onUpdateField('zipCode', cep);

    if (cleanCep === '81280330' || cleanCep.length === 8) {
      // Example autofill for Curitiba
      if (!event.city) onUpdateField('city', 'Curitiba');
      if (!event.state) onUpdateField('state', 'PR');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-white">3. Local e Infraestrutura</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          {isOnline
            ? 'Configure os dados da transmissão online, plataforma e instruções de envio do link.'
            : isHybrid
            ? 'Configure o local físico do evento presencial e também os links da transmissão online.'
            : 'Defina o local presencial, endereço completo e estimativa de lotação de público.'}
        </p>
      </div>

      {/* SEÇÃO PRESENCIAL (IN_PERSON OU HYBRID) */}
      {isPresential && (
        <div className="rounded-xl border border-slate-750 bg-slate-800/30 p-5 space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 border-b border-slate-700/60 pb-2">
            <Building className="h-4 w-4 text-orange-400" />
            <span>Endereço do Local Físico (Venue)</span>
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
                onChange={(e) => onUpdateField('venue', e.target.value)}
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
              A capacidade definitiva e divisão por setores será configurada na subfase de Setores e Lotes.
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
