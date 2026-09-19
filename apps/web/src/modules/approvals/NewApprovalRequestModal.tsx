import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Send,
  AlertTriangle,
  DollarSign,
  Building2,
  Calendar,
  FileText,
  Paperclip,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { useDiskContext } from '../../core/context/DiskContext';
import { formatCurrency } from '../../shared/utils/formatters';

interface NewApprovalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requestData: any) => Promise<void>;
  onSimulate: (simulationData: any) => Promise<any>;
}

export const NewApprovalRequestModal: React.FC<NewApprovalRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSimulate
}) => {
  const { availableProducers, availableEvents } = useDiskContext();

  const [operation, setOperation] = useState('FINANCE_TRANSFER');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [producerId, setProducerId] = useState<string>('');
  const [eventId, setEventId] = useState<string>('');
  const [attachments, setAttachments] = useState<Array<{ fileName: string; fileUrl: string; fileType: string }>>([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('NOTA_FISCAL');

  const [simulation, setSimulation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-simulate rule on input change
  useEffect(() => {
    let isCancelled = false;
    const runSim = async () => {
      try {
        const numAmount = typeof amount === 'number' ? amount : null;
        const res = await onSimulate({
          operation,
          amount: numAmount,
          producerId: producerId || null,
          eventId: eventId || null
        });
        if (!isCancelled) {
          setSimulation(res);
        }
      } catch {
        // simulation error ignored in background
      }
    };

    if (isOpen) {
      runSim();
    }

    return () => {
      isCancelled = true;
    };
  }, [operation, amount, producerId, eventId, isOpen, onSimulate]);

  if (!isOpen) return null;

  const handleAddAttachment = () => {
    if (!newDocName.trim()) return;
    setAttachments(prev => [
      ...prev,
      {
        fileName: newDocName.trim(),
        fileUrl: `https://storage.diskingressos.com.br/docs/${encodeURIComponent(newDocName.trim())}.pdf`,
        fileType: newDocType
      }
    ]);
    setNewDocName('');
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('O título da solicitação é obrigatório.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await onSubmit({
        operation,
        title: title.trim(),
        description: description.trim() || undefined,
        amount: typeof amount === 'number' ? amount : null,
        producerId: producerId || null,
        eventId: eventId || null,
        attachments
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar solicitação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1e222d] border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/40">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Nova Solicitação de Aprovação</h2>
            <p className="text-xs text-gray-400 mt-1">
              Cadastre uma operação com avaliação automática de alçada e duplo aval.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Operation & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Tipo de Operação</label>
              <select
                value={operation}
                onChange={e => setOperation(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="FINANCE_TRANSFER">Transferência Bancária / Pagamento</option>
                <option value="REFUND_REQUEST">Estorno / Devolução de Saldo</option>
                <option value="FINANCE_ADVANCE">Antecipação Financeira</option>
                <option value="FINANCE_PAYOUT">Repasse de Bilheteria</option>
                <option value="ACCOUNTING_ADJUSTMENT">Ajuste Contábil Extraordinário</option>
                <option value="ADMIN_PERMISSION_CHANGE">Alteração de Permissões Críticas</option>
                <option value="EVENT_BATCH_DISCOUNT">Liberação de Desconto / Cortesia</option>
                <option value="MARKETING_BUDGET_RELEASE">Liberação de Verba de Marketing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Valor Estimado (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Título da Solicitação *</label>
            <input
              type="text"
              placeholder="Ex: Transferência de Cachê Artístico - Palco Mundo"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Producer & Event */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Produtor / Organização</label>
              <select
                value={producerId}
                onChange={e => setProducerId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">(Global / Não Restrito)</option>
                {availableProducers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Evento Vinculado</label>
              <select
                value={eventId}
                onChange={e => setEventId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">(Todos os Eventos)</option>
                {availableEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title || ev.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Justificativa Operacional</label>
            <textarea
              rows={3}
              placeholder="Descreva o contexto, motivação e impacto desta solicitação..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Real-time Rule Simulator Preview */}
          {simulation && simulation.matchedRule && (
            <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-orange-300">
                <Sparkles className="h-4 w-4" />
                Regra Aplicável Identificada: {simulation.matchedRule.name} ({simulation.matchedRule.code})
              </div>
              <p className="text-gray-300">
                Nível de Escopo: <strong className="text-orange-400">{simulation.matchedRule.scopeLevel}</strong> •{' '}
                Aprovações: <strong className="text-white">{simulation.stepsRequired} etapa(s)</strong> (
                {simulation.isSequential ? 'Sequencial' : 'Paralelo'}) • Perfis:{' '}
                <strong className="text-white">{simulation.eligibleRoles.join(', ')}</strong>
                {simulation.requireStepUp && <span className="text-amber-400 ml-1">★ Requer Step-Up 2FA</span>}
              </p>
            </div>
          )}

          {/* Attachments Section */}
          <div className="pt-2 border-t border-gray-800 space-y-2">
            <label className="block text-xs font-medium text-gray-300">Documentos e Anexos Comprobatórios</label>
            <div className="flex gap-2">
              <select
                value={newDocType}
                onChange={e => setNewDocType(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="NOTA_FISCAL">Nota Fiscal</option>
                <option value="CONTRATO">Contrato</option>
                <option value="COMPROVANTE">Comprovante</option>
                <option value="AUTORIZACAO">Autorização</option>
              </select>
              <input
                type="text"
                placeholder="Nome do arquivo ou documento..."
                value={newDocName}
                onChange={e => setNewDocName(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
              <Button type="button" size="xs" variant="secondary" onClick={handleAddAttachment}>
                Adicionar
              </Button>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-gray-900/60 p-2 rounded-lg border border-gray-800">
                    <span className="text-gray-300">{att.fileType}: <strong>{att.fileName}</strong></span>
                    <button type="button" onClick={() => handleRemoveAttachment(i)} className="text-rose-400 hover:text-rose-300">
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-gray-800 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Send className="h-4 w-4 mr-1.5" /> Enviar para Aprovação
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
