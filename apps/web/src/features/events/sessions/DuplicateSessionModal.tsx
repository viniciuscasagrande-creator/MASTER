import React, { useState } from 'react';
import { Copy, Calendar, Clock, X, Check, AlertCircle } from 'lucide-react';
import { EventSessionDTO, DuplicateEventSessionInput } from '@shared/types/index';

interface DuplicateSessionModalProps {
  session: EventSessionDTO;
  onClose: () => void;
  onSubmit: (input: DuplicateEventSessionInput) => Promise<void>;
}

export const DuplicateSessionModal: React.FC<DuplicateSessionModalProps> = ({
  session,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState(session.name ? `${session.name} (Cópia)` : '');
  const [startAt, setStartAt] = useState('');
  const [doorsOpenAt, setDoorsOpenAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [copyCapacity, setCopyCapacity] = useState(true);
  const [replicateSections, setReplicateSections] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startAt) {
      setErrorMessage('Informe a nova data e horário de início da sessão.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await onSubmit({
        name: name.trim() || undefined,
        startAt: new Date(startAt).toISOString(),
        doorsOpenAt: doorsOpenAt ? new Date(doorsOpenAt).toISOString() : undefined,
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        copyCapacity,
        replicateSections
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao duplicar sessão');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Copy className="h-4 w-4 text-orange-400" />
            Duplicar Sessão de Evento
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Crie uma nova sessão com as mesmas configurações de setores e capacidade a partir de{' '}
          <strong className="text-white">{session.name || session.publicCode}</strong>.
        </p>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Nome da Nova Sessão (opcional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Sessão Extra das 22h"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Nova Data e Horário de Início <span className="text-rose-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                Previsão Término
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={copyCapacity}
                onChange={(e) => setCopyCapacity(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-orange-500"
              />
              <span>Manter a mesma capacidade nominal ({session.capacity} lugares)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={replicateSections}
                onChange={(e) => setReplicateSections(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-orange-500"
              />
              <span>Replicar os setores operacionais configurados</span>
            </label>
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
              {isSubmitting ? 'Duplicando...' : 'Duplicar Sessão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
