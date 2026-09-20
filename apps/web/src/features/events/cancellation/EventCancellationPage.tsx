import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Ban,
  CheckCircle2,
  DollarSign,
  Users,
  Layers,
  ArrowRight,
  ShieldAlert,
  Send,
  RefreshCw,
  Clock,
  FileText,
  Radio,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../../../core/auth/AuthContext';
import {
  calculateCancellationImpact,
  requestEventCancellation,
  cancelSessionOnly,
  executeEventCancellation,
  listCancellationRequests,
  fetchEventClosureReadiness
} from '../api/closure.api';
import {
  CancellationImpactSnapshotDTO,
  EventCancellationRequestDTO
} from '@shared/types/index';

interface EventCancellationPageProps {
  eventId: string;
  eventName: string;
  onNavigate?: (subItemId: string) => void;
}

export const EventCancellationPage: React.FC<EventCancellationPageProps> = ({
  eventId,
  eventName,
  onNavigate
}) => {
  const { hasPermission } = useAuth();

  // Permissions
  const canRequestCancellation = hasPermission('eventos.cancelamento.solicitar');
  const canExecuteCancellation = hasPermission('eventos.cancelamento.executar');
  const canViewImpact = hasPermission('eventos.cancelamento.avaliar_impacto');

  // Scope & Sessions
  const [availableSessions, setAvailableSessions] = useState<Array<{ sessionId: string; sessionName: string }>>([]);
  const [selectedScope, setSelectedScope] = useState<'EVENT' | 'SESSION'>('EVENT');
  const [targetSessionId, setTargetSessionId] = useState<string>('');

  // Blast Radius Impact
  const [impact, setImpact] = useState<CancellationImpactSnapshotDTO | null>(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);

  // Request Form
  const [category, setCategory] = useState<'FORCE_MAJEURE' | 'ORGANIZER_DECISION' | 'WEATHER' | 'SECURITY' | 'LEGAL' | 'OTHER'>('FORCE_MAJEURE');
  const [reason, setReason] = useState('');
  const [refundPolicyNotes, setRefundPolicyNotes] = useState(
    'Estorno total aos compradores através da forma original de pagamento em até 30 dias úteis.'
  );
  const [notifyCustomers, setNotifyCustomers] = useState(true);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Historic Requests
  const [requests, setRequests] = useState<EventCancellationRequestDTO[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Execution Modal
  const [executeModal, setExecuteModal] = useState<{
    isOpen: boolean;
    requestId: string;
    confirmText: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    requestId: '',
    confirmText: '',
    isSubmitting: false
  });

  // Feedback State
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load Sessions
  const loadSessions = useCallback(async () => {
    try {
      const readiness = await fetchEventClosureReadiness(eventId);
      if (readiness.sessionsSummary) {
        setAvailableSessions(readiness.sessionsSummary);
        if (readiness.sessionsSummary.length > 0 && !targetSessionId) {
          setTargetSessionId(readiness.sessionsSummary[0].sessionId);
        }
      }
    } catch (err: any) {
      console.error('Erro ao listar sessões:', err);
    }
  }, [eventId, targetSessionId]);

  // Load Impact
  const loadImpact = useCallback(async () => {
    if (!canViewImpact) return;
    setIsLoadingImpact(true);
    try {
      const sId = selectedScope === 'SESSION' ? targetSessionId : undefined;
      const data = await calculateCancellationImpact(eventId, sId);
      setImpact(data);
    } catch (err: any) {
      console.error('Erro ao calcular impacto de cancelamento:', err);
    } finally {
      setIsLoadingImpact(false);
    }
  }, [eventId, selectedScope, targetSessionId, canViewImpact]);

  // Load Requests History
  const loadRequests = useCallback(async () => {
    setIsLoadingRequests(true);
    try {
      const list = await listCancellationRequests(eventId);
      setRequests(list);
    } catch (err: any) {
      console.error('Erro ao listar histórico de cancelamento:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadSessions();
    loadRequests();
  }, [loadSessions, loadRequests]);

  useEffect(() => {
    loadImpact();
  }, [loadImpact]);

  // Submit Request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError('O motivo do cancelamento deve ter ao menos 10 caracteres explicativos.');
      return;
    }
    if (!refundPolicyNotes.trim()) {
      setError('A política de estorno aos compradores é obrigatória.');
      return;
    }

    setIsSubmittingRequest(true);
    setError(null);
    try {
      if (selectedScope === 'SESSION') {
        if (!targetSessionId) throw new Error('Selecione a sessão a ser cancelada');
        await cancelSessionOnly(eventId, targetSessionId, {
          reason: reason.trim(),
          cancellationCategory: category,
          refundPolicyNotes: refundPolicyNotes.trim(),
          notifyCustomers
        });
        setSuccessMessage('Cancelamento da sessão solicitado com sucesso.');
      } else {
        await requestEventCancellation(eventId, {
          reason: reason.trim(),
          cancellationCategory: category,
          refundPolicyNotes: refundPolicyNotes.trim(),
          notifyCustomers,
          immediateExecuteIfPermitted: canExecuteCancellation
        });
        setSuccessMessage('Solicitação de cancelamento do evento registrada com sucesso.');
      }

      setReason('');
      await loadRequests();
      await loadImpact();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar cancelamento');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Confirm Execute
  const handleConfirmExecute = async () => {
    if (executeModal.confirmText !== 'CANCELAR') {
      setError('Digite "CANCELAR" exatamente em maiúsculas para autorizar a execução.');
      return;
    }

    setExecuteModal((prev) => ({ ...prev, isSubmitting: true }));
    setError(null);
    try {
      await executeEventCancellation(eventId, executeModal.requestId);
      setSuccessMessage('Cancelamento executado! Ingressos invalidados e status atualizado.');
      setExecuteModal({ isOpen: false, requestId: '', confirmText: '', isSubmitting: false });
      await loadRequests();
      await loadImpact();
    } catch (err: any) {
      setError(err.message || 'Erro ao executar cancelamento');
      setExecuteModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Ban className="h-6 w-6 text-rose-500" />
              Gestão de Cancelamento & Impacto Sistêmico
            </h1>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-950/60 text-rose-300 border border-rose-500/30">
              Irreversível
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulação de raio de impacto, cancelamento total ou parcial e acionamento de fluxos de estorno para <strong className="text-slate-200">{eventName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadImpact();
              loadRequests();
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Atualizar Dados</span>
          </button>

          <button
            onClick={() => onNavigate?.('events-closure')}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white"
          >
            <span>Voltar ao Encerramento</span>
          </button>
        </div>
      </div>

      {/* Irreversibility Warning */}
      <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/30 flex items-start gap-3.5 text-rose-200">
        <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <strong className="text-rose-100 font-semibold text-sm block">
            Atenção: Ação de Alto Impacto
          </strong>
          <p className="leading-relaxed">
            O cancelamento de um evento ou sessão é uma operação definitiva. Ao ser executado, os ingressos associados são imediatamente invalidados na portaria, os lotes são suspensos e as rotinas de estorno financeiro aos compradores são disparadas.
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 flex items-start gap-3 text-xs">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            Fechar
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 flex items-start gap-3 text-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">{successMessage}</div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            Fechar
          </button>
        </div>
      )}

      {/* Scope Selector */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          1. Selecione o Escopo do Cancelamento
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => setSelectedScope('EVENT')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
              selectedScope === 'EVENT'
                ? 'border-rose-500 bg-rose-950/20'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <Radio className={`h-4 w-4 mt-1 ${selectedScope === 'EVENT' ? 'text-rose-400' : 'text-slate-600'}`} />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white">
                Evento Completo (Todas as Sessões)
              </div>
              <p className="text-xs text-slate-400">
                Invalida 100% dos ingressos e cancela todas as sessões cadastradas.
              </p>
            </div>
          </div>

          <div
            onClick={() => setSelectedScope('SESSION')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
              selectedScope === 'SESSION'
                ? 'border-rose-500 bg-rose-950/20'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <Radio className={`h-4 w-4 mt-1 ${selectedScope === 'SESSION' ? 'text-rose-400' : 'text-slate-600'}`} />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white">
                Cancelamento Parcial (Sessão Específica)
              </div>
              <p className="text-xs text-slate-400">
                Preserva o restante do evento e cancela apenas uma sessão individual.
              </p>
            </div>
          </div>
        </div>

        {selectedScope === 'SESSION' && (
          <div className="pt-2 space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Escolha a Sessão Afetada:
            </label>
            <select
              value={targetSessionId}
              onChange={(e) => setTargetSessionId(e.target.value)}
              className="w-full sm:w-80 rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              {availableSessions.map((s) => (
                <option key={s.sessionId} value={s.sessionId}>
                  {s.sessionName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Blast Radius Impact Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-400" />
          <span>2. Raio de Impacto Sistêmico Estimado (Blast Radius)</span>
        </h2>

        {isLoadingImpact ? (
          <div className="p-8 text-center text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
            Calculando impacto sistêmico...
          </div>
        ) : impact ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tickets Sold Impacted */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Ingressos Vendidos Afetados</span>
                <Layers className="h-4 w-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {impact.totalTicketsSold.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-slate-500">
                De um total de {impact.totalTicketsIssued} emitidos
              </div>
            </div>

            {/* Gross Revenue to Refund */}
            <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 space-y-2">
              <div className="flex items-center justify-between text-xs text-rose-300">
                <span>Total a Estornar (Bruto)</span>
                <DollarSign className="h-4 w-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-rose-300">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(impact.grossRevenueToRefund)}
              </div>
              <div className="text-xs text-rose-400/80">
                {impact.totalOrdersCount} pedidos a reembolsar
              </div>
            </div>

            {/* Customers Affected */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Compradores Impactados</span>
                <Users className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {impact.customersAffectedCount.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-slate-500">
                Titulares de compra que receberão notificação
              </div>
            </div>

            {/* Operational Desmobilization */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Portarias / Equipe a Desmobilizar</span>
                <AlertTriangle className="h-4 w-4 text-sky-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {impact.activeAccessPointsCount} portarias
              </div>
              <div className="text-xs text-slate-500">
                {impact.activeStaffAllocatedCount} colaboradores alocados
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 text-center text-slate-400 text-xs">
            Nenhum dado de impacto disponível.
          </div>
        )}
      </div>

      {/* Cancellation Request Form */}
      <form onSubmit={handleSubmitRequest} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-5">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          3. Formalizar Solicitação de Cancelamento
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Categoria do Cancelamento *:
            </label>
            <select
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="FORCE_MAJEURE">Força Maior / Evento Imprevisível</option>
              <option value="WEATHER">Condições Climáticas Adversas</option>
              <option value="SECURITY">Segurança / Exigência de Autoridades</option>
              <option value="LEGAL">Decisão Jurídica / Administrativa</option>
              <option value="ORGANIZER_DECISION">Decisão do Organizador / Comercial</option>
              <option value="OTHER">Outros Motivos</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Comunicação com Compradores:
            </label>
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyCustomers}
                onChange={(e) => setNotifyCustomers(e.target.checked)}
                className="rounded text-rose-500 focus:ring-rose-500"
              />
              <span>Disparar comunicado oficial automático aos compradores via e-mail e push</span>
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Justificativa e Motivo Detalhado *:
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Descreva detalhadamente a causa do cancelamento (mínimo 10 caracteres)..."
            className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
          <div className="text-right text-[11px] text-slate-500">
            {reason.trim().length} / 10 caracteres mínimos
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Regras e Prazos do Estorno aos Clientes *:
          </label>
          <textarea
            value={refundPolicyNotes}
            onChange={(e) => setRefundPolicyNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmittingRequest || !canRequestCancellation || reason.trim().length < 10}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg transition-all flex items-center gap-2"
          >
            {isSubmittingRequest ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>Registrar Cancelamento</span>
          </button>
        </div>
      </form>

      {/* Cancellation Requests & History Table */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Histórico de Solicitações de Cancelamento
          </h2>
          <span className="text-xs text-slate-400">
            {requests.length} solicitação(ões)
          </span>
        </div>

        {isLoadingRequests ? (
          <div className="p-6 text-center text-slate-500">Carregando histórico...</div>
        ) : requests.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 text-center text-slate-400 text-xs">
            Nenhuma solicitação de cancelamento registrada para este evento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Escopo</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Solicitante</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(req.requestedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {req.isPartialSession ? `Sessão: ${req.sessionId}` : 'Evento Completo'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {req.cancellationCategory}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {req.requestedByName}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                          req.status === 'EXECUTED'
                            ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                            : req.status === 'APPROVED'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            : req.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {req.status === 'EXECUTED'
                          ? 'Cancelado (Executado)'
                          : req.status === 'APPROVED'
                          ? 'Aprovado para Execução'
                          : req.status === 'PENDING_APPROVAL'
                          ? 'Pendente de Aprovação'
                          : req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {(req.status === 'APPROVED' || req.status === 'PENDING_APPROVAL') && (
                        <button
                          onClick={() =>
                            setExecuteModal({
                              isOpen: true,
                              requestId: req.id,
                              confirmText: '',
                              isSubmitting: false
                            })
                          }
                          disabled={!canExecuteCancellation}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white transition-all"
                        >
                          Executar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Confirm Execute Cancellation */}
      {executeModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <Ban className="h-6 w-6" />
              <h2 className="text-lg font-bold text-white">
                Confirmação Crítica de Execução
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Você está prestes a efetivar o cancelamento. Os ingressos serão invalidados e não haverá reversão automática.
            </p>

            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200">
              Para prosseguir, digite exatamente a palavra <strong className="text-white font-mono">CANCELAR</strong> abaixo:
            </div>

            <input
              type="text"
              value={executeModal.confirmText}
              onChange={(e) =>
                setExecuteModal((prev) => ({ ...prev, confirmText: e.target.value }))
              }
              placeholder="Digite CANCELAR"
              className="w-full rounded-xl bg-slate-800 border border-rose-500/40 p-3 text-sm text-center font-bold tracking-widest text-white uppercase focus:outline-none focus:border-rose-500"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() =>
                  setExecuteModal({ isOpen: false, requestId: '', confirmText: '', isSubmitting: false })
                }
                disabled={executeModal.isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmExecute}
                disabled={executeModal.isSubmitting || executeModal.confirmText !== 'CANCELAR'}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow transition-all flex items-center gap-2"
              >
                {executeModal.isSubmitting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Ban className="h-3.5 w-3.5" />
                )}
                <span>Efetivar Cancelamento</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
