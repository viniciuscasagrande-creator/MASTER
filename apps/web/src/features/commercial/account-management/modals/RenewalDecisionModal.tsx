import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { CommercialAccountsApi } from '../api/commercial-accounts.api';
import { CommercialRenewalDTO } from '@shared/types/index';

interface RenewalDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  renewal: CommercialRenewalDTO;
  onSuccess: () => void;
}

export const RenewalDecisionModal: React.FC<RenewalDecisionModalProps> = ({
  isOpen,
  onClose,
  renewal,
  onSuccess
}) => {
  const [decision, setDecision] = useState<'COMPLETED' | 'NOT_RENEWED' | 'CANCELLED'>('COMPLETED');
  const [decisionReason, setDecisionReason] = useState<string>('');
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [targetEffectiveUntil, setTargetEffectiveUntil] = useState<string>(
    renewal.targetEffectiveUntil ? renewal.targetEffectiveUntil.split('T')[0] : ''
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (decision === 'COMPLETED' && renewal.renewalType === 'SIMPLE' && !targetEffectiveUntil) {
      setError('Para concluir uma renovação simples, é obrigatório informar a nova data de vigência.');
      setIsLoading(false);
      return;
    }

    if (decision === 'NOT_RENEWED' && !decisionReason) {
      setError('Por favor selecione o motivo da não renovação.');
      setIsLoading(false);
      return;
    }

    try {
      await CommercialAccountsApi.decideRenewal(renewal.id, {
        status: decision,
        decisionReason: decisionReason || undefined,
        decisionNotes: decisionNotes || undefined,
        targetEffectiveUntil: targetEffectiveUntil ? new Date(targetEffectiveUntil).toISOString() : undefined,
        version: renewal.version
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar decisão de renovação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div>
            <h2 className="text-lg font-semibold text-white">Registrar Decisão de Renovação</h2>
            <p className="text-xs text-slate-400">
              {renewal.contractPublicCode} • {renewal.producerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Seleção da Decisão */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Resultado da Negociação
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecision('COMPLETED')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition ${
                  decision === 'COMPLETED'
                    ? 'border-emerald-500 bg-emerald-500/15 text-white'
                    : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
                  <CheckCircle className="h-4 w-4" />
                  <span>Renovado</span>
                </div>
                <span className="text-[11px] opacity-75">Concluir ciclo com sucesso.</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('NOT_RENEWED')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition ${
                  decision === 'NOT_RENEWED'
                    ? 'border-rose-500 bg-rose-500/15 text-white'
                    : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 text-rose-400 text-sm font-semibold">
                  <XCircle className="h-4 w-4" />
                  <span>Não Renovado</span>
                </div>
                <span className="text-[11px] opacity-75">Produtor encerrou relação.</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('CANCELLED')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition ${
                  decision === 'CANCELLED'
                    ? 'border-amber-500 bg-amber-500/15 text-white'
                    : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 text-amber-400 text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Cancelado</span>
                </div>
                <span className="text-[11px] opacity-75">Processo descontinuado.</span>
              </button>
            </div>
          </div>

          {/* Se COMPLETED e Renovação Simples: requer nova data de vigência */}
          {decision === 'COMPLETED' && renewal.renewalType === 'SIMPLE' && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-2">
              <span className="text-xs text-emerald-400 font-semibold uppercase">Efeito Jurídico Direto</span>
              <p className="text-xs text-slate-300">
                Por se tratar de uma renovação simples de aditamento de prazo, a vigência do contrato{' '}
                <strong className="text-white">{renewal.contractPublicCode}</strong> será estendida no sistema para a nova data informada abaixo:
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nova Data de Término do Contrato
                </label>
                <div className="relative">
                  <Calendar className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="date"
                    required
                    value={targetEffectiveUntil}
                    onChange={(e) => setTargetEffectiveUntil(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Se NOT_RENEWED: motivo */}
          {decision === 'NOT_RENEWED' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Motivo da Não Renovação
              </label>
              <select
                required
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-rose-500"
              >
                <option value="">Selecione um motivo...</option>
                <option value="PRECO_TAXA">Divergência de Taxas / Concorrência</option>
                <option value="ENCERRAMENTO_ATIVIDADES">Produtor Encerrou Atividades ou Eventos</option>
                <option value="INSATISFACAO_OPERACIONAL">Insatisfação com Atendimento ou Catracas</option>
                <option value="MUDANCA_ESTRATEGICA">Decisão Corporativa do Produtor</option>
                <option value="OUTRO">Outro Motivo</option>
              </select>
            </div>
          )}

          {/* Notas da Decisão */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Justificativa & Detalhes da Decisão
            </label>
            <textarea
              rows={3}
              placeholder="Explique o acordo fechado ou as razões alegadas pelo produtor..."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-slate-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-lg transition flex items-center gap-2 disabled:opacity-50 ${
                decision === 'COMPLETED'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : decision === 'NOT_RENEWED'
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              <span>Confirmar Decisão</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
