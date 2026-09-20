import React, { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import {
  ComplimentaryCategoryDTO,
  CreateComplimentaryRequestInput
} from '@shared/types/index';
import { createComplimentaryRequest, fetchComplimentaryCategories } from '../api/complimentary.api';
import { fetchEventSessions } from '../api/sessions.api';
import { fetchEventSections } from '../api/venues.api';
import { AlertCircle, Plus, Trash2, Gift, Send, Users } from 'lucide-react';

interface ComplimentaryRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onSaved: () => void;
}

export const ComplimentaryRequestModal: React.FC<ComplimentaryRequestModalProps> = ({
  isOpen,
  onClose,
  eventId,
  onSaved
}) => {
  const [categories, setCategories] = useState<ComplimentaryCategoryDTO[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [sessionId, setSessionId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [guests, setGuests] = useState<Array<{ name: string; email: string; document: string }>>([
    { name: '', email: '', document: '' }
  ]);

  useEffect(() => {
    if (!isOpen) return;

    const loadFormData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [cats, sesList, secsList] = await Promise.all([
          fetchComplimentaryCategories(eventId),
          fetchEventSessions(eventId),
          fetchEventSections(eventId)
        ]);

        setCategories(cats || []);
        if (cats && cats.length > 0) setCategoryId(cats[0].id);

        setSessions(sesList || []);
        if (sesList && sesList.length > 0) setSessionId(sesList[0].id);

        setSections(secsList || []);
        if (secsList && secsList.length > 0) setSectionId(secsList[0].id);
      } catch (err: any) {
        console.error('Erro ao carregar dados do formulário:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [isOpen, eventId]);

  const addGuestRow = () => {
    setGuests(prev => [...prev, { name: '', email: '', document: '' }]);
    setQuantity(prev => prev + 1);
  };

  const removeGuestRow = (idx: number) => {
    if (guests.length <= 1) return;
    setGuests(prev => prev.filter((_, i) => i !== idx));
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const updateGuest = (idx: number, field: string, value: string) => {
    setGuests(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !sectionId || !categoryId) {
      setError('Selecione sessão, setor e categoria');
      return;
    }

    if (!reason || reason.trim().length < 5) {
      setError('A justificativa da cortesia deve conter ao menos 5 caracteres');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const validGuests = guests.filter(g => g.name.trim().length > 0);
      const input: CreateComplimentaryRequestInput = {
        sessionId,
        sectionId,
        categoryId,
        quantity: Math.max(quantity, validGuests.length),
        reason,
        guests: validGuests.length > 0 ? validGuests : undefined
      };

      await createComplimentaryRequest(eventId, input);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao submeter solicitação de cortesia');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Solicitação de Cortesia / Convite"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Categoria */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Categoria de Cortesia</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sessão */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Sessão</label>
            <select
              value={sessionId}
              onChange={e => setSessionId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name || `Sessão ${s.sessionNumber || ''}`}
                </option>
              ))}
            </select>
          </div>

          {/* Setor */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Setor Desejado</label>
            <select
              value={sectionId}
              onChange={e => setSectionId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {sections.map(sec => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantidade e Justificativa */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Quantidade Total</label>
            <input
              type="number"
              min="1"
              max="500"
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Justificativa Operacional / Comercial</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Cota contratual patrocinador Master ou Imprensa credenciada"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Lista de Convidados (Nominal) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              Identificação dos Convidados (Nominal)
            </label>
            <button
              type="button"
              onClick={addGuestRow}
              className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Adicionar Convidado</span>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            {guests.map((g, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nome completo do convidado"
                  value={g.name}
                  onChange={e => updateGuest(idx, 'name', e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="E-mail (para envio do ingresso)"
                  value={g.email}
                  onChange={e => updateGuest(idx, 'email', e.target.value)}
                  className="w-48 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="CPF / Documento"
                  value={g.document}
                  onChange={e => updateGuest(idx, 'document', e.target.value)}
                  className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                {guests.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGuestRow(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{submitting ? 'Submetendo...' : 'Submeter Solicitação'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
