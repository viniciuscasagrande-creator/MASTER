import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  RotateCw,
  Send,
  ThumbsUp,
  ThumbsDown,
  Play,
  Ban,
  TrendingDown,
  DollarSign,
  Ticket,
  Users
} from 'lucide-react';
import { EventChangeRequestDTO } from '@shared/types/index';
import {
  recalculateChangeImpact,
  submitChangeForApproval,
  approveChangeRequest,
  rejectChangeRequest,
  executeChangeRequest,
  cancelChangeRequest
} from '../api/changes.api';

interface ChangeRequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  changeRequest: EventChangeRequestDTO | null;
  eventId: string;
  onUpdated: () => void;
}

export const ChangeRequestDetailsModal: React.FC<ChangeRequestDetailsModalProps> = ({
  isOpen,
  onClose,
  changeRequest,
  eventId,
  onUpdated
}) => {
  if (!isOpen || !changeRequest) return null;

  const [loadingAction, setLoadingAction] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const impact = changeRequest.impact;
  const isStale = Boolean(impact?.isStale);
  const hasBlockers = Boolean(impact?.blockers && impact.blockers.length > 0);

  const handleRecalculate = async () => {
    try {
      setLoadingAction(true);
      setErrorMsg(null);
      await recalculateChangeImpact(eventId, changeRequest.id);
      onUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoadingAction(true);
      setErrorMsg(null);
      await submitChangeForApproval(eventId, changeRequest.id);
      onUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoadingAction(true);
      setErrorMsg(null);
      await approveChangeRequest(eventId, changeRequest.id);
      onUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason || rejectReason.trim().length < 5) {
      alert('Informe o motivo da rejeição (mínimo 5 caracteres).');
      return;
    }
    try {
      setLoadingAction(true);
      setErrorMsg(null);
      await rejectChangeRequest(eventId, changeRequest.id, rejectReason);
      setIsRejecting(false);
      onUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleExecute = async () => {
    if (!window.confirm('Confirmar a execução desta alteração no evento? O modelo de dados será atualizado.')) return;
    try {
      setLoadingAction(true);
      setErrorMsg(null);
      await executeChangeRequest(eventId, changeRequest.id);
      onUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Deseja cancelar esta solicitação de alteração?')) return;
    try {
      setLoadingAction(true);
      setErrorMsg(null);
      await cancelChangeRequest(eventId, changeRequest.id);
      onUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-800/40">
              {changeRequest.publicCode}
            </span>
            <span className="text-sm font-bold text-white">{changeRequest.changeType}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
              {changeRequest.classification}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Alerta de STALE se novas vendas ocorreram */}
          {isStale && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-semibold block">Análise de Impacto Desatualizada (STALE)</span>
                  Novas vendas ou movimentações ocorreram desde a análise original. Recalcule para homologar.
                </div>
              </div>
              <button
                onClick={handleRecalculate}
                disabled={loadingAction}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
              >
                Recalcular
              </button>
            </div>
          )}

          {/* Comparativo de Campos (Before / After) */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Modificação Proposta</h4>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Valor Atual (Antes)</span>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
                  {changeRequest.changePayload.beforeFormatted || String(changeRequest.changePayload.before ?? '—')}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-emerald-400 block mb-1">Novo Valor (Depois)</span>
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-300 font-mono font-semibold">
                  {changeRequest.changePayload.afterFormatted || String(changeRequest.changePayload.after ?? '—')}
                </div>
              </div>
            </div>
          </div>

          {/* Motivo e Justificativa */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Motivo Técnico:</span>
              <span className="text-slate-200">{changeRequest.reason}</span>
            </div>
            {changeRequest.businessJustification && (
              <div>
                <span className="text-slate-500 block mb-0.5">Justificativa Comercial:</span>
                <span className="text-slate-200">{changeRequest.businessJustification}</span>
              </div>
            )}
            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {changeRequest.requestedByName || 'Operador'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(changeRequest.requestedAt).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Análise de Impacto em Tempo Real */}
          {impact && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Impacto Operacional & Financeiro
                </h4>
                <button
                  onClick={handleRecalculate}
                  disabled={loadingAction}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <RotateCw className="w-3 h-3" />
                  Recalcular Métricas
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <Ticket className="w-3.5 h-3.5 text-blue-400" />
                    Ingressos
                  </div>
                  <div className="text-base font-bold text-white">{impact.affectedTickets}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Montante
                  </div>
                  <div className="text-base font-bold text-white">
                    R$ {(impact.financialAmount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    Clientes
                  </div>
                  <div className="text-base font-bold text-white">{impact.affectedCustomers}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    Check-ins
                  </div>
                  <div className="text-base font-bold text-white">{impact.checkedInTickets}</div>
                </div>
              </div>

              {/* Card de Bloqueador de Déficit de Capacidade */}
              {impact.affectedInventory.isDeficit && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3">
                  <TrendingDown className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-rose-300 mb-0.5">Déficit Crítico de Capacidade Detectado</div>
                    <p className="text-rose-200/90">
                      A redução solicitada deixaria um déficit de {impact.affectedInventory.deficit} lugares em relação aos ingressos já emitidos ou reservados ({impact.affectedInventory.committed}).
                    </p>
                  </div>
                </div>
              )}

              {/* Avisos e Recomendações */}
              {impact.warnings && impact.warnings.length > 0 && (
                <div className="space-y-1.5">
                  {impact.warnings.map((w, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Painel de Rejeição quando aberto */}
          {isRejecting && (
            <div className="p-4 bg-slate-950 rounded-xl border border-rose-800/60 space-y-3">
              <label className="text-xs font-semibold text-rose-400 block">
                Motivo da Rejeição (Obrigatório)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Descreva o motivo da recusa da alteração..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 h-20 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsRejecting(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  disabled={loadingAction}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg"
                >
                  Confirmar Rejeição
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer com Ações Conforme o Estado */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {changeRequest.status !== 'EXECUTED' && changeRequest.status !== 'CANCELLED' && (
              <button
                onClick={handleCancel}
                disabled={loadingAction}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                Cancelar Solicitação
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {changeRequest.status === 'READY_FOR_SUBMISSION' && !hasBlockers && (
              <button
                onClick={handleSubmit}
                disabled={loadingAction}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-blue-900/30"
              >
                <Send className="w-3.5 h-3.5" />
                Submeter para Aprovação
              </button>
            )}

            {changeRequest.status === 'APPROVAL_PENDING' && (
              <>
                <button
                  onClick={() => setIsRejecting(true)}
                  disabled={loadingAction}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl transition-colors"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  Rejeitar
                </button>

                <button
                  onClick={handleApprove}
                  disabled={loadingAction || isStale}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-900/30"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Aprovar Alteração
                </button>
              </>
            )}

            {changeRequest.status === 'APPROVED' && (
              <button
                onClick={handleExecute}
                disabled={loadingAction || isStale}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-purple-900/30"
              >
                <Play className="w-3.5 h-3.5" />
                Executar Alteração
              </button>
            )}

            {changeRequest.status === 'EXECUTED' && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold px-3 py-1.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                Alteração Executada e Sincronizada
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
