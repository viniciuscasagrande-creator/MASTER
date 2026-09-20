import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { CreateEventTaskInput } from '@shared/types/index';
import { createEventTask } from '../api/tasks.api';
import { AlertCircle, Plus } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onSaved: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  eventId,
  onSaved
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [assigneeName, setAssigneeName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [blockingPublication, setBlockingPublication] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('O título da pendência é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const input: CreateEventTaskInput = {
        title,
        description: description.trim() ? description : undefined,
        priority,
        assigneeName: assigneeName.trim() ? assigneeName : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        blockingPublication,
        origin: 'OPERATION'
      };
      await createEventTask(eventId, input);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar pendência');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nova Pendência / Tarefa Operacional"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Título da Tarefa</label>
          <input
            type="text"
            placeholder="Ex: Alinhar instalação do gerador de energia reserva"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Descrição Detalhada</label>
          <textarea
            rows={3}
            placeholder="Detalhes operacionais, fornecedor envolvido ou critérios de aceite"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Prioridade</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Prazo de Resolução</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Responsável Designado</label>
          <input
            type="text"
            placeholder="Ex: Carlos (Coordenador Técnico)"
            value={assigneeName}
            onChange={e => setAssigneeName(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="blockingPublication"
            checked={blockingPublication}
            onChange={e => setBlockingPublication(e.target.checked)}
            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
          />
          <label htmlFor="blockingPublication" className="text-xs font-semibold text-slate-300">
            Bloqueante para Publicação do Evento (Readiness Blocker)
          </label>
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
            <Plus className="h-4 w-4" />
            <span>{loading ? 'Salvando...' : 'Criar Pendência'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
