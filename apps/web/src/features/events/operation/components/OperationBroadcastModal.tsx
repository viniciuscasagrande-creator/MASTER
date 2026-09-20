import React, { useState } from 'react';
import { Send, X, AlertTriangle } from 'lucide-react';
import { OperationAreaDTO } from '@shared/types/index';

interface OperationBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: OperationAreaDTO[];
  onSendBroadcast: (data: {
    targetAreaId?: string | null;
    priority: 'INFO' | 'WARNING' | 'CRITICAL';
    title: string;
    message: string;
    requiresAck: boolean;
  }) => Promise<void>;
  isSending: boolean;
}

export const OperationBroadcastModal: React.FC<OperationBroadcastModalProps> = ({
  isOpen,
  onClose,
  areas,
  onSendBroadcast,
  isSending
}) => {
  const [targetAreaId, setTargetAreaId] = useState<string>('');
  const [priority, setPriority] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('INFO');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [requiresAck, setRequiresAck] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMsg('Título e mensagem são obrigatórios.');
      return;
    }

    try {
      setErrorMsg('');
      await onSendBroadcast({
        targetAreaId: targetAreaId || null,
        priority,
        title: title.trim(),
        message: message.trim(),
        requiresAck
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao emitir comunicado');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Emitir Comunicado Operacional</h3>
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

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Destinatário (Área Operacional):
            </label>
            <select
              value={targetAreaId}
              onChange={(e) => setTargetAreaId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Todas as Áreas Operacionais (Broadcast Geral)</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.areaCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Prioridade:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('INFO')}
                className={`py-1.5 rounded-lg text-xs font-medium border transition ${
                  priority === 'INFO'
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Informativo
              </button>
              <button
                type="button"
                onClick={() => setPriority('WARNING')}
                className={`py-1.5 rounded-lg text-xs font-medium border transition ${
                  priority === 'WARNING'
                    ? 'bg-amber-600/30 text-amber-300 border-amber-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Atenção
              </button>
              <button
                type="button"
                onClick={() => setPriority('CRITICAL')}
                className={`py-1.5 rounded-lg text-xs font-medium border transition ${
                  priority === 'CRITICAL'
                    ? 'bg-red-600/30 text-red-300 border-red-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Crítico / Urgente
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Título do Comunicado:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reforço na triagem do Portão Norte"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Mensagem:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Detalhes da instrução ou alerta..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="requiresAck"
              checked={requiresAck}
              onChange={(e) => setRequiresAck(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0 focus:ring-offset-0"
            />
            <label htmlFor="requiresAck" className="text-xs text-slate-300 cursor-pointer">
              Exigir confirmação de leitura obrigatória pelos operadores
            </label>
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
              disabled={isSending}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Emitindo...' : 'Emitir Comunicado'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
