import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  Check,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  BulkSessionsPreviewInput,
  BulkSessionsPreviewResult,
  EventSessionDTO,
  VenueDTO
} from '@shared/types/index';
import { previewSessionRecurrence, createBulkSessions } from '../api/sessions.api';
import { useDiskContext } from '../../../core/context/DiskContext';
import { formatDateTime } from '../../../shared/utils/formatters';

interface BulkSessionsModalProps {
  eventId: string;
  availableVenues: VenueDTO[];
  defaultVenueId?: string;
  defaultCapacity?: number;
  onClose: () => void;
  onSuccess: (sessions: EventSessionDTO[]) => void;
}

const DAYS_OF_WEEK = [
  { id: 0, label: 'Dom' },
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' }
];

export const BulkSessionsModal: React.FC<BulkSessionsModalProps> = ({
  eventId,
  availableVenues,
  defaultVenueId,
  defaultCapacity,
  onClose,
  onSuccess
}) => {
  const { apiFetch } = useDiskContext();

  const [pattern, setPattern] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM_DATES'>('WEEKLY');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [occurrencesCount, setOccurrencesCount] = useState<number>(4);
  const [useOccurrences, setUseOccurrences] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number[]>([5, 6]); // Sex, Sáb

  const [doorsOpenTime, setDoorsOpenTime] = useState('19:00');
  const [startTime, setStartTime] = useState('21:00');
  const [endTime, setEndTime] = useState('23:30');

  const [venueId, setVenueId] = useState(defaultVenueId || availableVenues[0]?.id || '');
  const [capacity, setCapacity] = useState<number>(defaultCapacity || 1000);
  const [namePrefix, setNamePrefix] = useState('Apresentação');

  // Preview state
  const [previewResult, setPreviewResult] = useState<BulkSessionsPreviewResult | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort()
    );
  };

  const buildInput = (): BulkSessionsPreviewInput => {
    return {
      pattern,
      startDate,
      endDate: !useOccurrences && endDate ? endDate : undefined,
      occurrencesCount: useOccurrences ? occurrencesCount : undefined,
      daysOfWeek: pattern === 'WEEKLY' ? selectedDays : undefined,
      doorsOpenTime,
      startTime,
      endTime,
      venueId: venueId || undefined,
      capacity: capacity > 0 ? capacity : undefined,
      namePrefix: namePrefix.trim() || undefined
    };
  };

  const handlePreview = async () => {
    if (!startDate || !startTime) {
      setErrorMessage('Informe a data inicial e horário de início.');
      return;
    }
    if (pattern === 'WEEKLY' && selectedDays.length === 0) {
      setErrorMessage('Selecione ao menos um dia da semana para o padrão semanal.');
      return;
    }

    try {
      setIsPreviewing(true);
      setErrorMessage(null);
      const res = await previewSessionRecurrence(eventId, buildInput(), apiFetch);
      setPreviewResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao gerar prévia da recorrência');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      setErrorMessage(null);
      const res = await createBulkSessions(eventId, buildInput(), apiFetch);
      onSuccess(res.sessions);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar sessões em lote');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-400" />
              Motor de Recorrência & Sessões em Lote
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Gere dezenas de sessões automaticamente com conferência prévia de conflitos de agenda.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Padrão de Recorrência */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Padrão Temporal</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPattern('DAILY');
                  setPreviewResult(null);
                }}
                className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                  pattern === 'DAILY'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                Diário (Todo dia)
              </button>

              <button
                type="button"
                onClick={() => {
                  setPattern('WEEKLY');
                  setPreviewResult(null);
                }}
                className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                  pattern === 'WEEKLY'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                Semanal (Dias específicos)
              </button>

              <button
                type="button"
                onClick={() => {
                  setPattern('MONTHLY');
                  setPreviewResult(null);
                }}
                className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                  pattern === 'MONTHLY'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                Mensal (Mesmo dia)
              </button>
            </div>
          </div>

          {/* Dias da semana (se WEEKLY) */}
          {pattern === 'WEEKLY' && (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <label className="block font-semibold text-slate-300">
                Dias de Apresentação na Semana:
              </label>
              <div className="flex items-center gap-2">
                {DAYS_OF_WEEK.map((d) => {
                  const isSelected = selectedDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id)}
                      className={`h-8 w-11 rounded-lg font-bold text-xs transition-all ${
                        isSelected
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Período / Ocorrências */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Data de Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPreviewResult(null);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">Término / Limite</label>
                <button
                  type="button"
                  onClick={() => setUseOccurrences(!useOccurrences)}
                  className="text-[11px] text-orange-400 hover:underline"
                >
                  {useOccurrences ? 'Mudar para Data Limite' : 'Mudar para Total de Vezes'}
                </button>
              </div>

              {useOccurrences ? (
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={occurrencesCount}
                  onChange={(e) => {
                    setOccurrencesCount(parseInt(e.target.value, 10) || 1);
                    setPreviewResult(null);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                  placeholder="Ex: 8 sessões"
                />
              ) : (
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPreviewResult(null);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Horários das sessões */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Portões</label>
              <input
                type="time"
                value={doorsOpenTime}
                onChange={(e) => setDoorsOpenTime(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Início</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Término</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Botão de Prévia */}
          <div>
            <button
              type="button"
              onClick={handlePreview}
              disabled={isPreviewing}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-400 font-semibold border border-cyan-500/30 flex items-center justify-center gap-2 transition-colors"
            >
              <Calendar className="h-4 w-4" />
              {isPreviewing ? 'Calculando datas...' : 'Pré-visualizar e Verificar Conflitos'}
            </button>
          </div>

          {/* Tabela de Pré-visualização com Conflitos */}
          {previewResult && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">
                  Prévia: {previewResult.totalCount} sessões calculadas
                </span>
                {previewResult.hasConflicts ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" /> Conflitos encontrados
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Nenhum conflito de agenda
                  </span>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60 rounded-lg border border-slate-800/80 bg-slate-900/50 text-[11px]">
                {previewResult.sessions.map((s, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">#{idx + 1}</span>
                      <span className="font-semibold text-white">{s.name || `Sessão ${idx + 1}`}</span>
                      <span className="text-slate-400 font-mono">
                        {formatDateTime(s.startAt)}
                      </span>
                    </div>

                    <div>
                      {s.hasConflict ? (
                        <span className="text-amber-400 font-semibold" title={s.conflictMessage}>
                          Conflito detectado
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Livre</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 p-4 shrink-0 bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!previewResult || previewResult.totalCount === 0 || isCreating}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-xs text-white font-semibold shadow-lg shadow-orange-500/20 transition-all"
          >
            <Check className="h-4 w-4" />
            {isCreating
              ? 'Gerando Sessões...'
              : `Confirmar e Gerar ${previewResult?.totalCount || 0} Sessões`}
          </button>
        </div>
      </div>
    </div>
  );
};
