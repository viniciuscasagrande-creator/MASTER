import React, { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import {
  EventTeamDTO,
  EventTeamMemberDTO,
  CreateEventTeamShiftInput,
  ShiftConflictDTO
} from '@shared/types/index';
import { createShift, assignMembersToShift, fetchTeamMembers } from '../api/team.api';
import { fetchEventSessions } from '../api/sessions.api';
import { AlertCircle, Clock, Calendar, Check, Users } from 'lucide-react';

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  teams: EventTeamDTO[];
  onSaved: () => void;
}

export const AddShiftModal: React.FC<AddShiftModalProps> = ({
  isOpen,
  onClose,
  eventId,
  teams,
  onSaved
}) => {
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?.id || '');
  const [sessionId, setSessionId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [members, setMembers] = useState<EventTeamMemberDTO[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ShiftConflictDTO[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [sesList, memList] = await Promise.all([
          fetchEventSessions(eventId),
          fetchTeamMembers(eventId)
        ]);
        setSessions(sesList || []);
        if (sesList && sesList.length > 0) {
          setSessionId(sesList[0].id);
          // Sugere horários baseados na sessão
          const s = sesList[0];
          if (s.startAt) {
            const d = new Date(s.startAt);
            setStartAt(new Date(d.getTime() - 2 * 60 * 60 * 1000).toISOString().slice(0, 16));
            setEndAt(new Date(d.getTime() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16));
          }
        }
        setMembers(memList || []);
      } catch (err) {
        console.error('Erro ao carregar dados do turno:', err);
      }
    };

    loadData();
  }, [isOpen, eventId]);

  const toggleMember = (mId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(mId) ? prev.filter(id => id !== mId) : [...prev, mId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startAt || !endAt || !teamId) {
      setError('Preencha nome do turno, horários de início e término');
      return;
    }

    if (new Date(endAt) <= new Date(startAt)) {
      setError('O horário de término deve ser posterior ao horário de início');
      return;
    }

    setLoading(true);
    setError(null);
    setConflicts([]);

    try {
      // 1. Cria o turno
      const input: CreateEventTeamShiftInput = {
        name,
        teamId,
        sessionId: sessionId || undefined,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString()
      };
      const created = await createShift(eventId, input);

      // 2. Se houver membros selecionados, aloca com detecção de conflitos
      if (selectedMemberIds.length > 0) {
        const assignRes = await assignMembersToShift(eventId, created.id, selectedMemberIds);
        if (assignRes.conflicts && assignRes.conflicts.length > 0) {
          setConflicts(assignRes.conflicts);
          setError('Turno criado, mas foram detectados conflitos de escala com outros turnos.');
          setLoading(false);
          return;
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar turno de trabalho');
    } finally {
      setLoading(false);
    }
  };

  const teamMembers = members.filter(m => !teamId || m.teamId === teamId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agendar Novo Turno / Escala de Trabalho"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 space-y-2">
            <div className="text-xs font-bold text-rose-300">Conflitos de Escala Detectados:</div>
            {conflicts.map((c, i) => (
              <div key={i} className="text-xs text-rose-400 pl-2 border-l-2 border-rose-500">
                {c.message}
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Nome do Turno / Posto</label>
          <input
            type="text"
            placeholder="Ex: Turno 1 — Validação e Triagem Portão A"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Equipe Escalada</label>
            <select
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Sessão Vinculada</label>
            <select
              value={sessionId}
              onChange={e => setSessionId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Geral do Evento (Sem sessão específica)</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name || `Sessão ${s.sessionNumber || ''}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Início do Turno</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={e => setStartAt(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Término do Turno</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={e => setEndAt(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Seleção de Membros para Escalar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              Alocar Membros nesta Escala
            </label>
            <span className="text-[11px] text-slate-500">{selectedMemberIds.length} selecionado(s)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
            {teamMembers.map(m => {
              const checked = selectedMemberIds.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    checked
                      ? 'border-indigo-500/40 bg-indigo-500/10 text-white'
                      : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-white truncate">{m.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{m.roleName}</div>
                  </div>
                  <div
                    className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                      checked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {checked && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
            {teamMembers.length === 0 && (
              <div className="col-span-2 p-4 text-center text-xs text-slate-500">
                Nenhum membro cadastrado nesta equipe.
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:opacity-50"
          >
            <Clock className="h-4 w-4" />
            <span>{loading ? 'Salvando Turno...' : 'Salvar Escala'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
