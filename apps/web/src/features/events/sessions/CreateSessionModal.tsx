import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, AlertCircle, X, Check } from 'lucide-react';
import { CreateEventSessionInput, VenueDTO } from '@shared/types/index';
import { checkSessionConflicts } from '../api/sessions.api';
import { useDiskContext } from '../../../core/context/DiskContext';

interface CreateSessionModalProps {
  eventId: string;
  availableVenues: VenueDTO[];
  defaultVenueId?: string;
  defaultCapacity?: number;
  onClose: () => void;
  onSubmit: (input: CreateEventSessionInput) => Promise<void>;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  eventId,
  availableVenues,
  defaultVenueId,
  defaultCapacity,
  onClose,
  onSubmit
}) => {
  const { apiFetch } = useDiskContext();

  const [name, setName] = useState('');
  const [startAt, setStartAt] = useState('');
  const [doorsOpenAt, setDoorsOpenAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [venueId, setVenueId] = useState(defaultVenueId || (availableVenues[0]?.id || ''));
  const [capacity, setCapacity] = useState<number>(defaultCapacity || 1000);

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check temporal conflicts when dates change
  useEffect(() => {
    if (!startAt || !venueId) {
      setConflictWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const startIso = new Date(startAt).toISOString();
        const endIso = endAt ? new Date(endAt).toISOString() : undefined;
        const doorsIso = doorsOpenAt ? new Date(doorsOpenAt).toISOString() : undefined;

        const res = await checkSessionConflicts(
          eventId,
          {
            venueId,
            startAt: startIso,
            endAt: endIso,
            doorsOpenAt: doorsIso
          },
          apiFetch
        );

        if (res.hasConflicts && res.conflicts.length > 0) {
          setConflictWarning(res.conflicts.map((c) => c.message).join(' | '));
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        // ignore background conflict check errors
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [startAt, doorsOpenAt, endAt, venueId, eventId, apiFetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startAt) {
      setErrorMessage('Informe a data e horário de início da sessão.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const input: CreateEventSessionInput = {
        name: name.trim() || undefined,
        startAt: new Date(startAt).toISOString(),
        doorsOpenAt: doorsOpenAt ? new Date(doorsOpenAt).toISOString() : undefined,
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        venueId: venueId || undefined,
        capacity: capacity > 0 ? capacity : undefined,
        timezone: 'America/Sao_Paulo'
      };

      await onSubmit(input);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar sessão');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-400" />
            Adicionar Nova Sessão / Apresentação
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {conflictWarning && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-bold">Aviso de sobreposição detectado:</span>
              <p className="mt-0.5">{conflictWarning}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Nome da Sessão (opcional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Sessão das 21h, Matinê de Domingo, Noite de Estreia"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Abertura dos Portões
              </label>
              <input
                type="datetime-local"
                value={doorsOpenAt}
                onChange={(e) => setDoorsOpenAt(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Início do Espetáculo <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Previsão de Término
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Capacidade Nominal
              </label>
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Local de Realização (Venue)
            </label>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="">Manter local padrão do evento</option>
              {availableVenues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.city} - {v.state})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-xs text-white font-semibold shadow-lg shadow-orange-500/20"
            >
              <Check className="h-4 w-4" />
              {isSubmitting ? 'Salvando...' : 'Adicionar Sessão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
