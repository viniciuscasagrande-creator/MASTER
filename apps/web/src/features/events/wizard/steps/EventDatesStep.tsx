import React from 'react';
import { Calendar, Clock, AlertTriangle, Layers, DoorOpen, Sparkles } from 'lucide-react';
import { EventDetailDTO } from '../../types/event.types';

interface EventDatesStepProps {
  event: Partial<EventDetailDTO>;
  onUpdateField: (field: string, value: any) => void;
  onUpdateMultiple: (fields: Record<string, any>) => void;
}

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3) - Padrão Nacional' },
  { value: 'America/Manaus', label: 'Manaus / Amazonas (GMT-4)' },
  { value: 'America/Cuiaba', label: 'Cuiabá / Mato Grosso (GMT-4)' },
  { value: 'America/Belem', label: 'Belém / Pará (GMT-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza / Nordeste (GMT-3)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)' }
];

export const EventDatesStep: React.FC<EventDatesStepProps> = ({
  event,
  onUpdateField,
  onUpdateMultiple
}) => {
  // Helpers to convert ISO string to date/time inputs
  const formatDateForInput = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    } catch {
      return '';
    }
  };

  const handleDateChange = (field: 'startAt' | 'endAt' | 'doorsOpenAt', val: string) => {
    if (!val) {
      onUpdateField(field, null);
      return;
    }
    const isoString = new Date(val).toISOString();
    onUpdateField(field, isoString);
  };

  const isDivergentTimezone =
    event.timezone && event.timezone !== 'America/Sao_Paulo';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-white">4. Datas, Horários e Fuso Horário</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Defina o momento de início, abertura de portões e encerramento da realização do evento (Sessão Principal).
        </p>
      </div>

      {/* Grid de Datas da Sessão Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Abertura de Portões */}
        <div className="rounded-xl border border-slate-750 bg-slate-800/40 p-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <DoorOpen className="h-4 w-4 text-emerald-400" />
            <span>Abertura dos Portões</span>
          </label>
          <input
            type="datetime-local"
            value={formatDateForInput(event.doorsOpenAt)}
            onChange={(e) => handleDateChange('doorsOpenAt', e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-850 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono"
          />
          <p className="text-[11px] text-slate-500">
            Horário previsto para início do check-in e catracas.
          </p>
        </div>

        {/* Data e Hora de Início */}
        <div className="rounded-xl border border-slate-750 bg-slate-800/40 p-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-orange-400" />
            <span>Início da Sessão <span className="text-rose-400">*</span></span>
          </label>
          <input
            type="datetime-local"
            value={formatDateForInput(event.startAt)}
            onChange={(e) => handleDateChange('startAt', e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-850 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono"
          />
          <p className="text-[11px] text-slate-500">
            Horário previsto para subida ao palco ou início da apresentação.
          </p>
        </div>

        {/* Data e Hora de Término */}
        <div className="rounded-xl border border-slate-750 bg-slate-800/40 p-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>Previsão de Término</span>
          </label>
          <input
            type="datetime-local"
            value={formatDateForInput(event.endAt)}
            onChange={(e) => handleDateChange('endAt', e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-850 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors font-mono"
          />
          <p className="text-[11px] text-slate-500">
            Horário estimado para encerramento das atividades.
          </p>
        </div>
      </div>

      {/* Fuso Horário */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <label className="block text-xs font-semibold text-slate-300">
          Fuso Horário Operacional
        </label>
        <select
          value={event.timezone || 'America/Sao_Paulo'}
          onChange={(e) => onUpdateField('timezone', e.target.value)}
          className="w-full sm:w-96 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>

        {isDivergentTimezone && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              Atenção: O fuso selecionado ({event.timezone}) difere do fuso oficial de Brasília. Os horários serão convertidos adequadamente na emissão do ingresso.
            </span>
          </div>
        )}
      </div>

      {/* Múltiplas Sessões Toggle */}
      <div className="rounded-xl border border-slate-750 bg-slate-800/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-orange-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Evento com Múltiplas Sessões / Turnês</div>
              <div className="text-[11px] text-slate-400">
                Ative caso o evento possua diferentes horários, sessões diárias ou temporadas de apresentações.
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(event.hasMultipleSessions)}
              onChange={(e) => onUpdateField('hasMultipleSessions', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
          </label>
        </div>

        {event.hasMultipleSessions && (
          <div className="mt-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-purple-400" />
            <div>
              <span className="font-bold">Motor Central de Sessões & Recorrência Habilitado:</span>
              <p className="mt-0.5 text-[11px] text-slate-300">
                Após salvar este cadastro inicial, você poderá gerar dezenas de sessões recorrentes em lote (diárias, semanais ou mensais) e gerenciar a capacidade e reservas técnicas de cada sessão na aba <strong>Sessões & Capacidade</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
