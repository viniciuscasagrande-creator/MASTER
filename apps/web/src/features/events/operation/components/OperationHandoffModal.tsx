import React, { useState } from 'react';
import { ArrowRightLeft, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { OperationAreaDTO } from '@shared/types/index';

interface OperationHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: OperationAreaDTO[];
  onRegisterHandoff: (data: {
    areaId?: string | null;
    toUserId: string;
    toUserName: string;
    notes: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  currentUserName: string;
}

export const OperationHandoffModal: React.FC<OperationHandoffModalProps> = ({
  isOpen,
  onClose,
  areas,
  onRegisterHandoff,
  isSubmitting,
  currentUserName
}) => {
  const [areaId, setAreaId] = useState('');
  const [toUserName, setToUserName] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toUserName.trim()) {
      setErrorMsg('Informe o nome do profissional/líder receptor do turno.');
      return;
    }
    if (!notes.trim() || notes.trim().length < 5) {
      setErrorMsg('Descreva as observações operacionais da passagem de turno (mínimo 5 caracteres).');
      return;
    }

    try {
      setErrorMsg('');
      await onRegisterHandoff({
        areaId: areaId || null,
        toUserId: `usr_${Date.now()}`,
        toUserName: toUserName.trim(),
        notes: notes.trim()
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao registrar passagem de turno');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Registrar Passagem de Turno (Handoff)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Líder transmissor:{' '}
              <strong className="text-slate-200">{currentUserName}</strong>
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Área Operacional:
            </label>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">Coordenação Geral (Todas as Áreas)</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.areaCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nome do Líder Receptor (Novo Responsável):
            </label>
            <input
              type="text"
              value={toUserName}
              onChange={(e) => setToUserName(e.target.value)}
              placeholder="Ex: Beatriz Coordenadora Noite"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Relatório e Observações da Passagem:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Descreva o status atual do evento, pontos de atenção, filas, incidentes em andamento ou orientações para a nova equipe..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Registrando...' : 'Concluir Passagem'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
