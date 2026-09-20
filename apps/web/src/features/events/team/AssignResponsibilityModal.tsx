import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import {
  EventTeamMemberDTO,
  CreateEventResponsibilityInput,
  EventResponsibilityType
} from '@shared/types/index';
import { assignResponsibility } from '../api/team.api';
import { AlertCircle, Award } from 'lucide-react';

interface AssignResponsibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  members: EventTeamMemberDTO[];
  onSaved: () => void;
}

const RESPONSIBILITY_TYPES: Array<{ type: EventResponsibilityType; label: string; desc: string }> = [
  { type: 'BOX_OFFICE_LEAD', label: 'Chefe de Bilheteria / Caixa Geral', desc: 'Conferência de sangrias, maquininhas e relatórios' },
  { type: 'ACCESS_COORDINATOR', label: 'Coordenador de Controle de Acesso', desc: 'Supervisão de portões, leitores e catracas' },
  { type: 'CREDENTIALING_LEAD', label: 'Líder de Credenciamento', desc: 'Emissão de crachás, cortesias e convidados VIP' },
  { type: 'PRODUCTION_COORDINATOR', label: 'Coordenador Geral de Produção', desc: 'Operação de palco, camarins e logística' },
  { type: 'TECHNICAL_LEAD', label: 'Responsável Técnico / Engenharia', desc: 'Acompanhamento de laudos e estruturas temporárias' },
  { type: 'FINANCIAL_LEAD', label: 'Responsável Financeiro no Local', desc: 'Fechamento operacional e adiantamentos' },
  { type: 'SECURITY_LEAD', label: 'Chefe de Segurança & Brigada', desc: 'Plano de emergência e contingência no local' },
  { type: 'OTHER', label: 'Outro Papel Especial', desc: 'Papel operacional customizado' }
];

export const AssignResponsibilityModal: React.FC<AssignResponsibilityModalProps> = ({
  isOpen,
  onClose,
  eventId,
  members,
  onSaved
}) => {
  const [memberId, setMemberId] = useState(members[0]?.id || '');
  const [responsibilityType, setResponsibilityType] = useState<EventResponsibilityType>('BOX_OFFICE_LEAD');
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<'EVENT' | 'SESSION' | 'SECTION'>('EVENT');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      setError('Selecione um membro da equipe');
      return;
    }

    const matchedType = RESPONSIBILITY_TYPES.find(r => r.type === responsibilityType);
    const finalTitle = title.trim() || matchedType?.label || 'Responsável';

    setLoading(true);
    setError(null);

    try {
      const input: CreateEventResponsibilityInput = {
        memberId,
        responsibilityType,
        title: finalTitle,
        scope,
        notes: notes.trim() ? notes : undefined
      };
      await assignResponsibility(eventId, input);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao atribuir responsabilidade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Atribuir Responsabilidade Operacional Formal"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Membro Responsável</label>
          <select
            value={memberId}
            onChange={e => setMemberId(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            required
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.roleName} ({m.teamName || 'Equipe Geral'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Papel Formal</label>
          <select
            value={responsibilityType}
            onChange={e => {
              const val = e.target.value as EventResponsibilityType;
              setResponsibilityType(val);
              const found = RESPONSIBILITY_TYPES.find(r => r.type === val);
              if (found) setTitle(found.label);
            }}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            {RESPONSIBILITY_TYPES.map(r => (
              <option key={r.type} value={r.type}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Título / Cargo Exibido</label>
          <input
            type="text"
            placeholder="Ex: Coordenador Chefe de Catracas e Validação"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Escopo de Atuação</label>
          <select
            value={scope}
            onChange={e => setScope(e.target.value as any)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="EVENT">Evento Completo</option>
            <option value="SESSION">Sessão Específica</option>
            <option value="SECTION">Setor Específico</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Instruções Operacionais / Observações</label>
          <textarea
            rows={3}
            placeholder="Atribuições essenciais, horário de chegada e canal de rádio comunicador"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
          />
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
            <Award className="h-4 w-4" />
            <span>{loading ? 'Salvando...' : 'Atribuir Responsabilidade'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
