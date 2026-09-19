import React, { useState } from 'react';
import { X, Plus, Trash2, CheckSquare, Calendar, Users, AlertCircle } from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { useDiskContext } from '../../core/context/DiskContext';
import { TaskModule, TaskPriority } from './tasks.types';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated
}) => {
  const { apiFetch, activeProducer, activeEvent } = useDiskContext();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [module, setModule] = useState<TaskModule>('FINANCEIRO');
  const [priority, setPriority] = useState<TaskPriority>('NORMAL');
  const [estimatedMinutes, setEstimatedMinutes] = useState(120);
  const [dueAt, setDueAt] = useState('');
  const [checklist, setChecklist] = useState<Array<{ text: string; isRequired: boolean }>>([
    { text: 'Conferir dados iniciais', isRequired: true }
  ]);
  const [newItemText, setNewItemText] = useState('');
  const [newItemRequired, setNewItemRequired] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddChecklistItem = () => {
    if (!newItemText.trim()) return;
    setChecklist([...checklist, { text: newItemText.trim(), isRequired: newItemRequired }]);
    setNewItemText('');
    setNewItemRequired(false);
  };

  const handleRemoveChecklistItem = (idx: number) => {
    setChecklist(checklist.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('O título da tarefa é obrigatório.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await apiFetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          module,
          priority,
          estimatedMinutes: Number(estimatedMinutes) || 120,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
          producerId: activeProducer?.id || undefined,
          eventId: activeEvent?.id || undefined,
          checklist: checklist.length > 0 ? checklist : undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao criar tarefa.');
      }

      onTaskCreated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Criar Nova Tarefa Operacional</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Título da Tarefa <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Conciliação de vendas em lote..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Módulo Responsável <span className="text-amber-400">*</span>
              </label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value as TaskModule)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="FINANCEIRO">Financeiro</option>
                <option value="SAC">Atendimento SAC</option>
                <option value="EVENTOS">Eventos & Portaria</option>
                <option value="ESTORNO">Estorno & Contestação</option>
                <option value="CONTABILIDADE">Contabilidade</option>
                <option value="MARKETING">Marketing & Tráfego</option>
                <option value="COMERCIAL">Comercial</option>
                <option value="OPERACOES">Operações</option>
                <option value="SEGURANCA">Segurança & Fraude</option>
                <option value="GERAL">Geral</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="LOW">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">SLA Estimado (minutos)</label>
              <input
                type="number"
                min="10"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 120)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Data / Hora de Vencimento</label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Descrição / Instruções</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o contexto e os procedimentos a serem seguidos..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white h-24 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Checklist Builder */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-amber-400" /> Checklist Operacional
            </h4>

            <div className="space-y-2">
              {checklist.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-white">{item.text}</span>
                    {item.isRequired && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                        Obrigatório
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Novo item de checklist..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
              />
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newItemRequired}
                  onChange={(e) => setNewItemRequired(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500"
                />
                Obrigatório
              </label>
              <Button type="button" size="sm" variant="outline" onClick={handleAddChecklistItem}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950/40 -mx-6 -mb-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
