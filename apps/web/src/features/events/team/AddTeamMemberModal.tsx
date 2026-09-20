import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { EventTeamDTO, CreateEventTeamMemberInput } from '@shared/types/index';
import { addTeamMember } from '../api/team.api';
import { AlertCircle, UserPlus, ShieldAlert } from 'lucide-react';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  teams: EventTeamDTO[];
  onSaved: () => void;
}

export const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  isOpen,
  onClose,
  eventId,
  teams,
  onSaved
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleName, setRoleName] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?.id || '');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !roleName.trim()) {
      setError('Preencha nome, e-mail e função operacional');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const input: CreateEventTeamMemberInput = {
        name,
        email,
        phone: phone.trim() ? phone : undefined,
        roleName,
        teamId: teamId || undefined,
        emergencyContact: emergencyContact.trim() ? emergencyContact : undefined
      };
      await addTeamMember(eventId, input);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar membro da equipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar Membro da Equipe Operacional"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Alerta de Desacoplamento RBAC */}
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <span>
            <strong>Observação Operacional:</strong> Este cadastro registra o colaborador para escalas de trabalho, turnos e contato de emergência. Ele <strong>não concede</strong> permissões sistêmicas administrativas no painel.
          </span>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Nome Completo</label>
          <input
            type="text"
            placeholder="Ex: Roberto Carlos Mendonça"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">E-mail de Notificação</label>
            <input
              type="email"
              placeholder="roberto@empresa.com.br"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Telefone / WhatsApp</label>
            <input
              type="text"
              placeholder="(41) 98888-7777"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Equipe Funcional</label>
            <select
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Função / Cargo no Evento</label>
            <input
              type="text"
              placeholder="Ex: Operador de Catraca / Fiscal"
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Contato de Emergência</label>
          <input
            type="text"
            placeholder="Ex: Maria (Esposa) - (41) 99999-1234"
            value={emergencyContact}
            onChange={e => setEmergencyContact(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
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
            <UserPlus className="h-4 w-4" />
            <span>{loading ? 'Cadastrando...' : 'Cadastrar Membro'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
