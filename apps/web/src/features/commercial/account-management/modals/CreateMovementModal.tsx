import React, { useState } from 'react';
import { X, TrendingUp, AlertCircle, RefreshCw, Calendar, DollarSign, Tag } from 'lucide-react';
import { CommercialAccountsApi } from '../api/commercial-accounts.api';
import { CommercialMovementType, CommercialOfferingDTO } from '@shared/types/index';

interface CreateMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  producerId: string;
  producerName?: string;
  contractId?: string;
  availableOfferings?: CommercialOfferingDTO[];
  onSuccess: () => void;
}

export const CreateMovementModal: React.FC<CreateMovementModalProps> = ({
  isOpen,
  onClose,
  producerId,
  producerName,
  contractId,
  availableOfferings = [],
  onSuccess
}) => {
  const [movementType, setMovementType] = useState<CommercialMovementType>('UPGRADE');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [proposedOfferingId, setProposedOfferingId] = useState<string>('');
  const [changeReason, setChangeReason] = useState<string>('');
  const [estimatedValue, setEstimatedValue] = useState<string>('');
  const [expectedDecisionAt, setExpectedDecisionAt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError('O título da oportunidade é obrigatório.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await CommercialAccountsApi.createMovement({
        producerId,
        movementType,
        title,
        description: description || undefined,
        originContractId: contractId || undefined,
        proposedOfferingId: proposedOfferingId || undefined,
        changeReason: changeReason || undefined,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
        expectedDecisionAt: expectedDecisionAt ? new Date(expectedDecisionAt).toISOString() : undefined
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar oportunidade de movimentação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nova Movimentação Comercial</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {producerName || 'Produtor'} • Oportunidade no CRM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tipo de Movimentação */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tipo de Movimentação
            </label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as CommercialMovementType)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
            >
              <option value="EXPANSION">Expansão de Conta (Mais eventos / novas praças)</option>
              <option value="UPGRADE">Upgrade de Pacote / Plano (Adição de recursos)</option>
              <option value="DOWNGRADE">Downgrade / Readequação (Redução de escopo)</option>
              <option value="ADDITIONAL_SERVICE">Serviço Adicional (Módulo avulso / consultoria)</option>
              <option value="CONTRACT_CHANGE">Alteração Contratual / Termo Aditivo</option>
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título da Oportunidade *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Expansão Festival 2027 — 4 novas capitais"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Oferta Pretendida (se houver catálogo) */}
          {availableOfferings.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Oferta Pretendida do Catálogo
              </label>
              <select
                value={proposedOfferingId}
                onChange={(e) => setProposedOfferingId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
              >
                <option value="">Nenhuma oferta vinculada inicialmente</option>
                {availableOfferings.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.name} ({off.code}) — {off.type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Valor Estimado & Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Estimado (R$)
              </label>
              <div className="relative">
                <DollarSign className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Previsão de Fechamento
              </label>
              <div className="relative">
                <Calendar className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="date"
                  value={expectedDecisionAt}
                  onChange={(e) => setExpectedDecisionAt(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Motivo da Mudança */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motivação da Mudança / Demanda do Produtor
            </label>
            <input
              type="text"
              placeholder="Ex: Produtor quer reduzir custos ou expandir portfólio"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição & Contexto Comercial
            </label>
            <textarea
              rows={2}
              placeholder="Descreva as tratativas iniciais ou necessidades levantadas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>Criar Oportunidade</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
