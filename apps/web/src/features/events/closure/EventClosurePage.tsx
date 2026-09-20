import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  FileText,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  AlertOctagon,
  FileCheck2,
  Archive,
  Ban
} from 'lucide-react';
import { useAuth } from '../../../core/auth/AuthContext';
import {
  fetchEventClosureReadiness,
  fetchSessionClosureReadiness,
  closeSession,
  closeEvent,
  applyClosureOverride
} from '../api/closure.api';
import {
  EventClosureReadinessDTO,
  SessionClosureReadinessDTO,
  ClosureCheckItemDTO,
  SessionClosureRecordDTO,
  EventClosureRecordDTO
} from '@shared/types/index';

interface EventClosurePageProps {
  eventId: string;
  eventName: string;
  onNavigate?: (subItemId: string) => void;
}

export const EventClosurePage: React.FC<EventClosurePageProps> = ({
  eventId,
  eventName,
  onNavigate
}) => {
  const { currentUser, hasPermission } = useAuth();

  // Tab: 'sessions' | 'event'
  const [activeTab, setActiveTab] = useState<'sessions' | 'event'>('sessions');

  // Event Readiness State
  const [eventReadiness, setEventReadiness] = useState<EventClosureReadinessDTO | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);

  // Selected Session & Readiness State
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionReadiness, setSessionReadiness] = useState<SessionClosureReadinessDTO | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  // General Loading & Feedback
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals State
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [sessionCloseNotes, setSessionCloseNotes] = useState('');
  const [isClosingSession, setIsClosingSession] = useState(false);

  const [isCloseEventModalOpen, setIsCloseEventModalOpen] = useState(false);
  const [eventCloseNotes, setEventCloseNotes] = useState('');
  const [isClosingEvent, setIsClosingEvent] = useState(false);

  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    scope: 'SESSION' | 'EVENT';
    targetId: string;
    checkCode: string;
    checkTitle: string;
    justification: string;
  }>({
    isOpen: false,
    scope: 'SESSION',
    targetId: '',
    checkCode: '',
    checkTitle: '',
    justification: ''
  });
  const [isApplyingOverride, setIsApplyingOverride] = useState(false);

  // Permissions
  const canCloseSession = hasPermission('eventos.encerramento.sessao.encerrar');
  const canCloseEvent = hasPermission('eventos.encerramento.evento.encerrar');
  const canApplyOverride = hasPermission('eventos.encerramento.override.aplicar');

  // Load Event Readiness
  const loadEventReadiness = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchEventClosureReadiness(eventId);
      setEventReadiness(data);
      if (!selectedSessionId && data.sessionsSummary && data.sessionsSummary.length > 0) {
        setSelectedSessionId(data.sessionsSummary[0].sessionId);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar prontidão do evento');
    } finally {
      setIsLoadingEvent(false);
      setIsRefreshing(false);
    }
  }, [eventId, selectedSessionId]);

  useEffect(() => {
    loadEventReadiness();
  }, [loadEventReadiness]);

  // Load Selected Session Readiness
  const loadSessionReadiness = useCallback(async (sessionId: string) => {
    setIsLoadingSession(true);
    try {
      const data = await fetchSessionClosureReadiness(eventId, sessionId);
      setSessionReadiness(data);
    } catch (err: any) {
      console.error('Erro ao buscar prontidão da sessão:', err);
    } finally {
      setIsLoadingSession(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionReadiness(selectedSessionId);
    }
  }, [selectedSessionId, loadSessionReadiness]);

  // Handle Session Close
  const handleConfirmCloseSession = async () => {
    if (!selectedSessionId) return;
    setIsClosingSession(true);
    setError(null);
    try {
      await closeSession(eventId, selectedSessionId, sessionCloseNotes);
      setSuccessMessage('Sessão encerrada com sucesso!');
      setIsCloseSessionModalOpen(false);
      setSessionCloseNotes('');
      // Reload both
      await loadEventReadiness();
      await loadSessionReadiness(selectedSessionId);
    } catch (err: any) {
      setError(err.message || 'Erro ao encerrar sessão');
    } finally {
      setIsClosingSession(false);
    }
  };

  // Handle Event Close
  const handleConfirmCloseEvent = async () => {
    setIsClosingEvent(true);
    setError(null);
    try {
      const res = await closeEvent(eventId, eventCloseNotes);
      setSuccessMessage(`Evento encerrado com sucesso! Status alterado para FINALIZADO.`);
      setIsCloseEventModalOpen(false);
      setEventCloseNotes('');
      await loadEventReadiness();
    } catch (err: any) {
      setError(err.message || 'Erro ao encerrar evento');
    } finally {
      setIsClosingEvent(false);
    }
  };

  // Handle Override
  const handleConfirmOverride = async () => {
    if (overrideModal.justification.trim().length < 10) {
      setError('A justificativa do override deve conter ao menos 10 caracteres.');
      return;
    }
    setIsApplyingOverride(true);
    setError(null);
    try {
      await applyClosureOverride(eventId, {
        scope: overrideModal.scope,
        targetId: overrideModal.targetId,
        checkCode: overrideModal.checkCode,
        justification: overrideModal.justification
      });
      setSuccessMessage(`Override aplicado para o critério ${overrideModal.checkCode}.`);
      setOverrideModal({ isOpen: false, scope: 'SESSION', targetId: '', checkCode: '', checkTitle: '', justification: '' });
      if (overrideModal.scope === 'SESSION') {
        await loadSessionReadiness(overrideModal.targetId);
      }
      await loadEventReadiness();
    } catch (err: any) {
      setError(err.message || 'Erro ao aplicar override');
    } finally {
      setIsApplyingOverride(false);
    }
  };

  const selectedSessionInfo = eventReadiness?.sessionsSummary.find(s => s.sessionId === selectedSessionId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Encerramento do Evento & Sessões
            </h1>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Fase 1.2.14
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Controle de prontidão, encerramento oficial de turnos/sessões, transição para FINALIZADO e consolidação pós-evento para <strong className="text-slate-200">{eventName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadEventReadiness();
              if (selectedSessionId) loadSessionReadiness(selectedSessionId);
            }}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors disabled:opacity-50"
            title="Recarregar prontidão"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={() => onNavigate?.('events-post-event')}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-750 text-orange-400 border border-orange-500/30 transition-all"
          >
            <FileCheck2 className="h-4 w-4" />
            <span>Relatório Pós-Evento</span>
          </button>

          <button
            onClick={() => onNavigate?.('events-cancellation')}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-750 text-rose-400 border border-rose-500/30 transition-all"
          >
            <Ban className="h-4 w-4" />
            <span>Cancelamento</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200 text-xs">
            Fechar
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">{successMessage}</div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200 text-xs">
            Fechar
          </button>
        </div>
      )}

      {/* Distinction Banner */}
      <div className="p-3.5 rounded-xl border border-sky-500/20 bg-sky-950/20 flex items-center justify-between text-xs text-sky-200">
        <div className="flex items-center gap-2.5">
          <Info className="h-4 w-4 text-sky-400 shrink-0" />
          <span>
            <strong>Regra Arquitetural:</strong> Encerrar uma Sessão fecha os acessos, estorna dispositivos e congela a bilheteria daquela sessão. O Evento só pode ser encerrado quando <em>todas as sessões ativas estiverem encerradas</em>.
          </span>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'sessions'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>1. Encerramento de Sessões</span>
          {eventReadiness && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              {eventReadiness.sessionsSummary.filter(s => s.isClosed).length} / {eventReadiness.sessionsSummary.length} encerradas
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('event')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'event'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>2. Encerramento do Evento (Finalizar)</span>
          {eventReadiness?.canClose && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab 1: Sessions Closure */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Sessões do Evento
            </h2>

            {isLoadingEvent ? (
              <div className="p-8 text-center text-slate-500">Carregando sessões...</div>
            ) : !eventReadiness || eventReadiness.sessionsSummary.length === 0 ? (
              <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 text-center text-slate-400 text-sm">
                Nenhuma sessão encontrada para este evento.
              </div>
            ) : (
              <div className="space-y-2">
                {eventReadiness.sessionsSummary.map((session) => {
                  const isSelected = session.sessionId === selectedSessionId;
                  const isClosed = session.isClosed;

                  return (
                    <div
                      key={session.sessionId}
                      onClick={() => setSelectedSessionId(session.sessionId)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-orange-500/80 bg-orange-950/20 shadow-lg'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          {session.sessionName}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-medium border ${
                              isClosed
                                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                                : session.status === 'CANCELLED'
                                ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                                : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {isClosed ? 'Encerrada' : session.status === 'CANCELLED' ? 'Cancelada' : 'Em Aberto'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 ${isSelected ? 'text-orange-400' : 'text-slate-600'}`} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Session Details & Readiness Checklist */}
          <div className="lg:col-span-8 space-y-4">
            {selectedSessionInfo ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{selectedSessionInfo.sessionName}</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      ID: {selectedSessionInfo.sessionId}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedSessionInfo.isClosed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
                        <CheckCircle2 className="h-4 w-4" />
                        Sessão Encerrada Oficialmente
                      </span>
                    ) : (
                      <button
                        onClick={() => setIsCloseSessionModalOpen(true)}
                        disabled={!sessionReadiness?.canClose || !canCloseSession}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md transition-all"
                      >
                        <Lock className="h-4 w-4" />
                        <span>Encerrar Esta Sessão</span>
                      </button>
                    )}
                  </div>
                </div>

                {isLoadingSession ? (
                  <div className="p-8 text-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-slate-500" />
                    Avaliando prontidão da sessão...
                  </div>
                ) : sessionReadiness ? (
                  <div className="space-y-6">
                    {/* Summary Counters */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <div className="text-xs text-slate-400">Aprovados</div>
                        <div className="text-lg font-bold text-emerald-400">
                          {sessionReadiness.summary.passedCount}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <div className="text-xs text-slate-400">Alertas</div>
                        <div className="text-lg font-bold text-amber-400">
                          {sessionReadiness.summary.warningCount}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <div className="text-xs text-slate-400">Bloqueadores</div>
                        <div className="text-lg font-bold text-rose-400">
                          {sessionReadiness.summary.blockerCount}
                        </div>
                      </div>
                    </div>

                    {/* Readiness Status Message */}
                    {sessionReadiness.canClose ? (
                      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 flex items-center gap-3 text-emerald-300 text-xs">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                        <div>
                          <strong>Pronta para Encerramento!</strong> Todos os critérios de conformidade foram satisfeitos ou dispensados via override autorizado.
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/30 flex items-center gap-3 text-rose-300 text-xs">
                        <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0" />
                        <div>
                          <strong>Encerramento Bloqueado:</strong> Existem {sessionReadiness.summary.blockerCount} pendência(s) impeditiva(s) ativas. Resolva-as ou aplique um override com justificativa registrada.
                        </div>
                      </div>
                    )}

                    {/* Checks List */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Critérios de Validação da Sessão
                      </h3>

                      <div className="space-y-2.5">
                        {sessionReadiness.checks.map((chk) => (
                          <div
                            key={chk.code}
                            className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                              chk.status === 'PASSED'
                                ? 'border-slate-800 bg-slate-900/40'
                                : chk.status === 'WARNING'
                                ? 'border-amber-500/30 bg-amber-950/20'
                                : 'border-rose-500/30 bg-rose-950/20'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {chk.status === 'PASSED' ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                ) : chk.status === 'WARNING' ? (
                                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-rose-400" />
                                )}
                                <span className="text-sm font-semibold text-slate-200">
                                  {chk.title}
                                </span>
                                <span className="text-xs font-mono text-slate-500">
                                  [{chk.code}]
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 pl-6">
                                {chk.description}
                              </p>
                              {chk.resolutionAdvice && chk.status !== 'PASSED' && (
                                <p className="text-xs text-amber-300/90 pl-6 italic">
                                  Sugestão: {chk.resolutionAdvice}
                                </p>
                              )}
                            </div>

                            {/* Override Action if Blocker */}
                            {chk.status === 'BLOCKER' && !selectedSessionInfo.isClosed && (
                              <div className="shrink-0 pl-6 md:pl-0">
                                <button
                                  onClick={() =>
                                    setOverrideModal({
                                      isOpen: true,
                                      scope: 'SESSION',
                                      targetId: selectedSessionInfo.sessionId,
                                      checkCode: chk.code,
                                      checkTitle: chk.title,
                                      justification: ''
                                    })
                                  }
                                  disabled={!canApplyOverride}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-900/50 hover:bg-rose-900 text-rose-200 border border-rose-600/40 disabled:opacity-40 transition-all flex items-center gap-1.5"
                                  title="Aplicar Override com Justificativa"
                                >
                                  <ShieldAlert className="h-3.5 w-3.5" />
                                  <span>Aplicar Override</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center text-slate-400">
                Selecione uma sessão ao lado para verificar seus critérios de encerramento.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Event Closure (Finalize) */}
      {activeTab === 'event' && (
        <div className="space-y-6">
          {isLoadingEvent ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-500" />
              Verificando prontidão geral do evento...
            </div>
          ) : eventReadiness ? (
            <div className="space-y-6">
              {/* Event Status Banner */}
              <div
                className={`p-6 rounded-2xl border ${
                  eventReadiness.canClose
                    ? 'border-emerald-500/40 bg-emerald-950/30'
                    : 'border-amber-500/40 bg-amber-950/20'
                } flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">
                      Status de Fechamento Geral
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        eventReadiness.canClose
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {eventReadiness.canClose ? 'Apto para Encerramento' : 'Bloqueado'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {eventReadiness.allSessionsClosed
                      ? 'Todas as sessões estão devidamente encerradas.'
                      : 'Ainda existem sessões abertas no evento. Todas devem ser encerradas antes de finalizar o evento.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsCloseEventModalOpen(true)}
                    disabled={!eventReadiness.canClose || !canCloseEvent}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg transition-all flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    <span>Encerrar Evento (FINALIZADO)</span>
                  </button>
                </div>
              </div>

              {/* Sessions Status Matrix */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">
                  Status de Cada Sessão
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {eventReadiness.sessionsSummary.map((s) => (
                    <div
                      key={s.sessionId}
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        s.isClosed
                          ? 'border-emerald-500/30 bg-emerald-950/20'
                          : 'border-rose-500/30 bg-rose-950/20'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-white">
                          {s.sessionName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {s.isClosed ? 'Encerrada' : 'Ainda aberta'}
                        </div>
                      </div>
                      {s.isClosed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Checks */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">
                  Critérios Globais de Fechamento
                </h3>
                <div className="space-y-2.5">
                  {eventReadiness.checks.map((chk) => (
                    <div
                      key={chk.code}
                      className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        chk.status === 'PASSED'
                          ? 'border-slate-800 bg-slate-900/40'
                          : chk.status === 'WARNING'
                          ? 'border-amber-500/30 bg-amber-950/20'
                          : 'border-rose-500/30 bg-rose-950/20'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {chk.status === 'PASSED' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : chk.status === 'WARNING' ? (
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-400" />
                          )}
                          <span className="text-sm font-semibold text-slate-200">
                            {chk.title}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            [{chk.code}]
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 pl-6">{chk.description}</p>
                        {chk.resolutionAdvice && chk.status !== 'PASSED' && (
                          <p className="text-xs text-amber-300/90 pl-6 italic">
                            Sugestão: {chk.resolutionAdvice}
                          </p>
                        )}
                      </div>

                      {chk.status === 'BLOCKER' && (
                        <button
                          onClick={() =>
                            setOverrideModal({
                              isOpen: true,
                              scope: 'EVENT',
                              targetId: eventId,
                              checkCode: chk.code,
                              checkTitle: chk.title,
                              justification: ''
                            })
                          }
                          disabled={!canApplyOverride}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-900/50 hover:bg-rose-900 text-rose-200 border border-rose-600/40 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>Override Global</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Modal: Close Session */}
      {isCloseSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-orange-400">
              <Lock className="h-6 w-6" />
              <h2 className="text-lg font-bold text-white">
                Confirmar Encerramento da Sessão
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Você está prestes a encerrar oficialmente a sessão{' '}
              <strong className="text-white">{selectedSessionInfo?.sessionName}</strong>. Isso
              desativará novas leituras de portaria para esta sessão e registrará o snapshot de fechamento.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">
                Observações de Fechamento (opcional):
              </label>
              <textarea
                value={sessionCloseNotes}
                onChange={(e) => setSessionCloseNotes(e.target.value)}
                placeholder="Ex: Operação transcorreu normalmente com evacuação finalizada às 23:45..."
                rows={3}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCloseSessionModalOpen(false)}
                disabled={isClosingSession}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCloseSession}
                disabled={isClosingSession}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow transition-all flex items-center gap-2"
              >
                {isClosingSession ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                <span>Confirmar Encerramento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Close Event */}
      {isCloseEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-orange-400">
              <Lock className="h-6 w-6" />
              <h2 className="text-lg font-bold text-white">
                Finalizar Evento Oficialmente
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              O evento transitará para o status definitivo de <strong className="text-emerald-400">FINALIZADO</strong>. O relatório pós-evento e o snapshot operacional serão consolidados.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">
                Parecer Final do Evento (opcional):
              </label>
              <textarea
                value={eventCloseNotes}
                onChange={(e) => setEventCloseNotes(e.target.value)}
                placeholder="Ex: Evento transcorreu conforme planejado com público recorde..."
                rows={3}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCloseEventModalOpen(false)}
                disabled={isClosingEvent}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCloseEvent}
                disabled={isClosingEvent}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow transition-all flex items-center gap-2"
              >
                {isClosingEvent ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                <span>Finalizar Evento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Override Blocker */}
      {overrideModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="h-6 w-6" />
              <div>
                <h2 className="text-lg font-bold text-white">
                  Override de Bloqueador
                </h2>
                <p className="text-xs text-slate-400">
                  {overrideModal.checkTitle} ({overrideModal.checkCode})
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200">
              <strong>Atenção de Auditoria:</strong> O override dispensa a regra impeditiva e registra formalmente o seu usuário, data/hora e a justificativa operacional no histórico imutável do evento.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Justificativa Operacional (mínimo 10 caracteres) *:
              </label>
              <textarea
                value={overrideModal.justification}
                onChange={(e) =>
                  setOverrideModal((prev) => ({ ...prev, justification: e.target.value }))
                }
                placeholder="Descreva detalhadamente o motivo da liberação excepcional..."
                rows={4}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <div className="text-right text-xs text-slate-500">
                {overrideModal.justification.trim().length} / 10 caracteres mínimos
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() =>
                  setOverrideModal({ isOpen: false, scope: 'SESSION', targetId: '', checkCode: '', checkTitle: '', justification: '' })
                }
                disabled={isApplyingOverride}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmOverride}
                disabled={isApplyingOverride || overrideModal.justification.trim().length < 10}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow transition-all flex items-center gap-2"
              >
                {isApplyingOverride ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldAlert className="h-3.5 w-3.5" />
                )}
                <span>Registrar e Aplicar Override</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
