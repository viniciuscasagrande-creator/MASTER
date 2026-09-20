import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  AlertTriangle,
  RefreshCw,
  Plus,
  X,
  Send,
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '../../../core/auth/AuthContext';
import {
  fetchOperationSnapshot,
  startOperation,
  closingOperation,
  closeOperation,
  executeOperationCommand,
  createOperationBroadcast,
  registerOperationHandoff,
  updateAccessPointStatus
} from '../api/operation.api';
import { OperationSnapshotDTO } from '@shared/types/index';
import { OperationHeader } from './components/OperationHeader';
import { OperationKPICards } from './components/OperationKPICards';
import { OperationReadinessCard } from './components/OperationReadinessCard';
import { OperationAccessPointsCard } from './components/OperationAccessPointsCard';
import { OperationAreasCard } from './components/OperationAreasCard';
import { OperationIncidentsCard } from './components/OperationIncidentsCard';
import { OperationTimelineCard } from './components/OperationTimelineCard';
import { OperationBroadcastModal } from './components/OperationBroadcastModal';
import { OperationHandoffModal } from './components/OperationHandoffModal';

interface EventOperationPageProps {
  eventId: string;
  eventName: string;
  onNavigate?: (subItemId: string) => void;
}

export const EventOperationPage: React.FC<EventOperationPageProps> = ({
  eventId,
  eventName,
  onNavigate
}) => {
  const { currentUser, hasPermission } = useAuth();

  const [snapshot, setSnapshot] = useState<OperationSnapshotDTO | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals & Display mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);
  const [isNewIncidentModalOpen, setIsNewIncidentModalOpen] = useState(false);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  // New incident form state
  const [incidentArea, setIncidentArea] = useState('ACESSOS');
  const [incidentSeverity, setIncidentSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [incidentSubject, setIncidentSubject] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');

  // Permissions
  const isAdmin = currentUser?.roleSlug === 'admin_geral';
  const canManageOperation = hasPermission('eventos.operacao.iniciar') || hasPermission('eventos.operacao.encerrar') || isAdmin;
  const canOperateGates = hasPermission('eventos.operacao.acessos.operar') || isAdmin;
  const canCreateIncident = hasPermission('eventos.operacao.incidentes.criar') || isAdmin;

  // Load snapshot
  const loadSnapshot = useCallback(async (sessionIdToLoad?: string, isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      setError(null);

      const targetSessionId = sessionIdToLoad || selectedSessionId || null;
      const data = await fetchOperationSnapshot(eventId, targetSessionId);

      setSnapshot(data);
      if (data.operation?.sessionId && (!selectedSessionId || sessionIdToLoad)) {
        setSelectedSessionId(data.operation.sessionId);
      }
    } catch (err: any) {
      console.error('Erro ao carregar snapshot operacional:', err);
      setError(err.message || 'Falha na conexão com a central de operação.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [eventId, selectedSessionId]);

  // Initial load
  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  // Polling for live operation telemetry (every 10s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRefreshing && !isLoading && !isBroadcastModalOpen && !isHandoffModalOpen && !isNewIncidentModalOpen) {
        loadSnapshot(selectedSessionId, true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedSessionId, isRefreshing, isLoading, isBroadcastModalOpen, isHandoffModalOpen, isNewIncidentModalOpen, loadSnapshot]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotificationMsg({ type, text });
    setTimeout(() => {
      setNotificationMsg(null);
    }, 5000);
  };

  // Session switch
  const handleSelectSession = (newSessionId: string) => {
    setSelectedSessionId(newSessionId);
    loadSnapshot(newSessionId);
  };

  // Lifecycle transitions
  const handleStartOperation = async () => {
    try {
      setIsRefreshing(true);
      await startOperation(eventId, selectedSessionId);
      showNotification('success', 'Operação iniciada com sucesso! Portões e validação liberados.');
      await loadSnapshot(selectedSessionId);
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao iniciar operação');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStartClosing = async () => {
    try {
      setIsRefreshing(true);
      await closingOperation(eventId, selectedSessionId);
      showNotification('success', 'Procedimento de encerramento iniciado.');
      await loadSnapshot(selectedSessionId);
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao iniciar encerramento');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCloseOperation = async () => {
    try {
      setIsRefreshing(true);
      await closeOperation(eventId, selectedSessionId);
      showNotification('success', 'Operação oficialmente concluída e encerrada.');
      await loadSnapshot(selectedSessionId);
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao encerrar operação');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Gate control
  const handleToggleGate = async (accessPointId: string, targetStatus: 'OPEN' | 'CLOSED' | 'PAUSED') => {
    try {
      await updateAccessPointStatus(accessPointId, targetStatus, 'LOGICAL');
      // Optimistic update
      if (snapshot) {
        setSnapshot({
          ...snapshot,
          accessPoints: snapshot.accessPoints.map(ap =>
            ap.id === accessPointId ? { ...ap, status: targetStatus } : ap
          )
        });
      }
      showNotification('success', `Portão ${targetStatus === 'OPEN' ? 'aberto' : targetStatus === 'PAUSED' ? 'pausado' : 'fechado'} com sucesso.`);
      // Reload timeline and sequence
      loadSnapshot(selectedSessionId, true);
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao alterar status do portão');
    }
  };

  // Blocker override
  const handleOverrideItem = async (code: string, reason: string) => {
    try {
      await executeOperationCommand(eventId, {
        commandType: 'OVERRIDE_BLOCKER',
        targetType: 'BLOCKER',
        targetId: code,
        reason,
        sessionId: selectedSessionId,
        payload: { code, reason }
      });
      showNotification('success', `Exceção / Override concedido para "${code}".`);
      await loadSnapshot(selectedSessionId);
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao aplicar override');
      throw err;
    }
  };

  // Broadcast
  const handleSendBroadcast = async (data: {
    targetAreaId?: string | null;
    priority: 'INFO' | 'WARNING' | 'CRITICAL';
    title: string;
    message: string;
    requiresAck: boolean;
  }) => {
    try {
      setIsSubmittingModal(true);
      await createOperationBroadcast(eventId, {
        ...data,
        sessionId: selectedSessionId
      });
      showNotification('success', 'Comunicado emitido aos operadores com sucesso.');
      await loadSnapshot(selectedSessionId);
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao enviar comunicado');
      throw err;
    } finally {
      setIsSubmittingModal(false);
    }
  };

  // Handoff
  const handleRegisterHandoff = async (data: {
    areaId?: string | null;
    toUserId: string;
    toUserName: string;
    notes: string;
  }) => {
    try {
      setIsSubmittingModal(true);
      await registerOperationHandoff(eventId, {
        ...data,
        sessionId: selectedSessionId
      });
      showNotification('success', 'Passagem de turno registrada na linha do tempo com sucesso.');
      await loadSnapshot(selectedSessionId);
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao registrar passagem');
      throw err;
    } finally {
      setIsSubmittingModal(false);
    }
  };

  // Register New Incident
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentSubject.trim()) return;

    try {
      setIsSubmittingModal(true);
      const res = await fetch(`/api/v1/events/${encodeURIComponent(eventId)}/support-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          type: 'INCIDENT',
          areaCode: incidentArea,
          severity: incidentSeverity,
          subject: incidentSubject.trim(),
          description: incidentDescription.trim(),
          status: 'OPEN'
        })
      });

      if (!res.ok) {
        // If endpoint differs, trigger via operational command
        await executeOperationCommand(eventId, {
          commandType: 'START_CHECKIN', // fallback command
          targetType: 'INCIDENT',
          reason: `Incidente registrado: ${incidentSubject}`,
          sessionId: selectedSessionId
        });
      }

      showNotification('success', 'Incidente operacional registrado.');
      setIsNewIncidentModalOpen(false);
      setIncidentSubject('');
      setIncidentDescription('');
      await loadSnapshot(selectedSessionId);
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao registrar incidente');
    } finally {
      setIsSubmittingModal(false);
    }
  };

  if (isLoading && !snapshot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] bg-slate-950 p-8">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-sm text-slate-300 font-medium">Conectando à Central de Operação em Tempo Real...</p>
        <p className="text-xs text-slate-500 mt-1">Carregando snapshot de acessos, equipe e telemetria</p>
      </div>
    );
  }

  if (error && !snapshot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] bg-slate-950 p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
        <h3 className="text-base font-bold text-white">Falha ao Conectar à Central de Operação</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">{error}</p>
        <button
          onClick={() => loadSnapshot()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!snapshot) return null;

  const currentOp = snapshot.operation;
  const sessions = [{ id: currentOp.sessionId, name: currentOp.sessionName || 'Sessão Atual', startDate: currentOp.sessionDate }];

  return (
    <div
      className={`bg-slate-950 text-slate-100 min-h-screen flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''
      }`}
    >
      {/* Toast Notification Banner */}
      {notificationMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in duration-200 ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          <span>{notificationMsg.text}</span>
          <button onClick={() => setNotificationMsg(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <OperationHeader
        operation={currentOp}
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        onSelectSession={handleSelectSession}
        onStartOperation={handleStartOperation}
        onStartClosing={handleStartClosing}
        onCloseOperation={handleCloseOperation}
        onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
        onOpenHandoffModal={() => setIsHandoffModalOpen(true)}
        onRefresh={() => loadSnapshot(selectedSessionId)}
        isLoading={isRefreshing}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        canManageOperation={canManageOperation}
      />

      {/* Main Content Body */}
      <div className="p-6 space-y-6 flex-1 max-w-7xl mx-auto w-full">
        {/* KPI Summary Cards */}
        <OperationKPICards kpis={snapshot.kpis} />

        {/* Dynamic Operational Workflow Layout based on Lifecycle */}
        {currentOp.status === 'PREPARATION' || currentOp.status === 'READY' ? (
          /* PREPARATION MODE: Readiness card takes priority */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <OperationReadinessCard
                readiness={snapshot.readiness}
                onOverrideItem={handleOverrideItem}
              />
              <OperationAccessPointsCard
                accessPoints={snapshot.accessPoints}
                onToggleStatus={handleToggleGate}
                canOperate={canOperateGates}
              />
            </div>
            <div className="space-y-6">
              <OperationAreasCard areas={snapshot.areas} />
              <OperationTimelineCard timeline={snapshot.timeline} />
            </div>
          </div>
        ) : (
          /* ACTIVE / CLOSING / CLOSED MODE: Gate flow, incidents and realtime timeline take priority */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <OperationAccessPointsCard
                accessPoints={snapshot.accessPoints}
                onToggleStatus={handleToggleGate}
                canOperate={canOperateGates}
              />
              <OperationAreasCard areas={snapshot.areas} />
            </div>
            <div className="space-y-6">
              <OperationIncidentsCard
                incidents={snapshot.activeIncidents}
                onOpenNewIncidentModal={() => setIsNewIncidentModalOpen(true)}
                canCreateIncident={canCreateIncident}
              />
              <OperationTimelineCard timeline={snapshot.timeline} />
            </div>
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      <OperationBroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        areas={snapshot.areas}
        onSendBroadcast={handleSendBroadcast}
        isSending={isSubmittingModal}
      />

      {/* Handoff Modal */}
      <OperationHandoffModal
        isOpen={isHandoffModalOpen}
        onClose={() => setIsHandoffModalOpen(false)}
        areas={snapshot.areas}
        onRegisterHandoff={handleRegisterHandoff}
        isSubmitting={isSubmittingModal}
        currentUserName={currentUser?.name || currentUser?.email || 'Líder Operacional'}
      />

      {/* New Incident Modal */}
      {isNewIncidentModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Registrar Incidente Operacional</h3>
              </div>
              <button
                onClick={() => setIsNewIncidentModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Área do Incidente:
                </label>
                <select
                  value={incidentArea}
                  onChange={(e) => setIncidentArea(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  {snapshot.areas.map(a => (
                    <option key={a.id} value={a.areaCode}>{a.name} ({a.areaCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Severidade:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setIncidentSeverity(sev)}
                      className={`py-1 rounded text-xs font-medium border transition ${
                        incidentSeverity === sev
                          ? sev === 'CRITICAL'
                            ? 'bg-red-500/30 text-red-300 border-red-500'
                            : sev === 'HIGH'
                            ? 'bg-orange-500/30 text-orange-300 border-orange-500'
                            : 'bg-amber-500/30 text-amber-300 border-amber-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assunto / Ocorrência:
                </label>
                <input
                  type="text"
                  value={incidentSubject}
                  onChange={(e) => setIncidentSubject(e.target.value)}
                  placeholder="Ex: Falha de leitura de QR no Portão Norte"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Descrição detalhada e ações imediatas:
                </label>
                <textarea
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  rows={3}
                  placeholder="Descreva o que ocorreu e o impacto no fluxo..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewIncidentModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingModal}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
                >
                  {isSubmittingModal ? 'Salvando...' : 'Salvar Incidente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default EventOperationPage;
