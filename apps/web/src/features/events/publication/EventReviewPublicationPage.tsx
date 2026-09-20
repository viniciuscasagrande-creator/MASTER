import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Pause,
  Play,
  RotateCw,
  FileCheck2,
  Lock,
  ArrowRight,
  Send,
  Eye,
  Copy,
  Check
} from 'lucide-react';
import {
  EventStatus,
  AvailableTransitionDTO,
  EventReviewSnapshotDTO,
  EventPublicationScheduleDTO,
  EventPreviewTokenDTO
} from '@shared/types/index';
import {
  fetchEventTransitions,
  requestEventTransition,
  fetchLatestSnapshot,
  createReviewSnapshot,
  verifySnapshotIntegrity,
  publishEventImmediate,
  schedulePublication,
  fetchPublicationSchedules,
  pauseSales,
  resumeSales,
  fetchPreviewToken
} from '../api/lifecycle.api';
import { PublicPreviewModal } from './PublicPreviewModal';
import { EventStatusBadge } from '../components/EventStatusBadge';

interface EventReviewPublicationPageProps {
  eventId: string;
  eventName: string;
}

export const EventReviewPublicationPage: React.FC<EventReviewPublicationPageProps> = ({
  eventId,
  eventName
}) => {
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<EventStatus>('CONFIGURING');
  const [transitions, setTransitions] = useState<AvailableTransitionDTO[]>([]);
  const [snapshot, setSnapshot] = useState<EventReviewSnapshotDTO | null>(null);
  const [schedules, setSchedules] = useState<EventPublicationScheduleDTO[]>([]);
  const [integrityStatus, setIntegrityStatus] = useState<{ checked: boolean; valid: boolean; message?: string } | null>(null);

  // Modals e Ações
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewTokenData, setPreviewTokenData] = useState<EventPreviewTokenDTO | null>(null);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Agendamento de Publicação
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transData, snapData, schedData] = await Promise.all([
        fetchEventTransitions(eventId),
        fetchLatestSnapshot(eventId),
        fetchPublicationSchedules(eventId).catch(() => [])
      ]);

      setCurrentStatus(transData.currentStatus);
      setTransitions(transData.transitions);
      setSnapshot(snapData);
      setSchedules(schedData);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao carregar dados do ciclo de vida' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  const handleCreateSnapshot = async () => {
    try {
      setIsTransitioning(true);
      const res = await createReviewSnapshot(eventId);
      setSnapshot(res.snapshot);
      setFeedbackMessage({ type: 'success', text: 'Snapshot imutável de revisão gerado com sucesso!' });
      await loadData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    try {
      const res = await verifySnapshotIntegrity(eventId);
      setIntegrityStatus({
        checked: true,
        valid: res.valid,
        message: res.valid
          ? 'A configuração atual confere 100% com o snapshot congelado.'
          : res.reason || 'Divergência detectada com o snapshot congelado.'
      });
    } catch (err: any) {
      setIntegrityStatus({ checked: true, valid: false, message: err.message });
    }
  };

  const handleExecuteTransition = async (targetStatus: EventStatus, label: string) => {
    try {
      setIsTransitioning(true);
      await requestEventTransition(eventId, {
        targetStatus,
        reason: `Transição solicitada: ${label}`
      });
      setFeedbackMessage({ type: 'success', text: `Evento transicionado para ${targetStatus} com sucesso!` });
      await loadData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    } finally {
      setIsTransitioning(false);
    }
  };

  const handlePublishImmediate = async () => {
    if (!window.confirm('Tem certeza de que deseja abrir as vendas imediatamente para este evento?')) return;
    try {
      setIsTransitioning(true);
      await publishEventImmediate(eventId, { mode: 'IMMEDIATE', openSalesImmediately: true });
      setFeedbackMessage({ type: 'success', text: 'Evento publicado com sucesso! Vendas abertas.' });
      await loadData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleSchedulePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate || !scheduledTime) {
      alert('Informe a data e o horário para agendamento.');
      return;
    }
    try {
      setIsTransitioning(true);
      const isoDatetime = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      await schedulePublication(eventId, {
        mode: 'SCHEDULED',
        scheduledAt: isoDatetime,
        timezone: 'America/Sao_Paulo'
      });
      setFeedbackMessage({ type: 'success', text: 'Publicação programada com sucesso!' });
      setScheduledDate('');
      setScheduledTime('');
      await loadData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    } finally {
      setIsTransitioning(false);
    }
  };

  const handlePauseSales = async () => {
    if (!pauseReason || pauseReason.trim().length < 5) {
      alert('Informe o motivo da pausa (mínimo 5 caracteres).');
      return;
    }
    try {
      setIsTransitioning(true);
      await pauseSales(eventId, { reason: pauseReason });
      setIsPauseModalOpen(false);
      setPauseReason('');
      setFeedbackMessage({ type: 'success', text: 'Vendas pausadas temporariamente.' });
      await loadData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleResumeSales = async () => {
    try {
      setIsTransitioning(true);
      await resumeSales(eventId);
      setFeedbackMessage({ type: 'success', text: 'Vendas retomadas com sucesso!' });
      await loadData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleOpenPreview = async () => {
    try {
      const tokenData = await fetchPreviewToken(eventId);
      setPreviewTokenData(tokenData);
      setIsPreviewModalOpen(true);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message });
    }
  };

  const copyHashToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <RotateCw className="w-6 h-6 animate-spin mr-3 text-blue-500" />
        Carregando ciclo de vida e estado do evento...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner de Feedback */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3 text-sm">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs hover:underline opacity-80"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Header com Status Atual e Controles Principais */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Revisão, Aprovação & Publicação</h2>
            <EventStatusBadge status={currentStatus} />
          </div>
          <p className="text-xs text-slate-400">
            Controle de homologação, congelamento de snapshots imutáveis e esteira de aprovação governada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenPreview}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <Eye className="w-4 h-4 text-blue-400" />
            Visualizar Página Pública
          </button>

          {currentStatus === 'ON_SALE' && (
            <button
              onClick={() => setIsPauseModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl transition-colors"
            >
              <Pause className="w-4 h-4" />
              Pausar Vendas
            </button>
          )}

          {currentStatus === 'SALES_PAUSED' && (
            <button
              onClick={handleResumeSales}
              disabled={isTransitioning}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-900/30"
            >
              <Play className="w-4 h-4" />
              Retomar Vendas
            </button>
          )}

          {(currentStatus === 'APPROVAL_PENDING' || currentStatus === 'SCHEDULED' || currentStatus === 'REVIEW') && (
            <button
              onClick={handlePublishImmediate}
              disabled={isTransitioning}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-blue-900/30"
            >
              <Send className="w-4 h-4" />
              Publicar Imediatamente
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Esquerdo (2 colunas): Snapshot Imutável e Transições da State Machine */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Snapshot Imutável de Revisão */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-white">Snapshot Imutável de Configuração</h3>
              </div>
              <button
                onClick={handleCreateSnapshot}
                disabled={isTransitioning}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Congelar Novo Snapshot
              </button>
            </div>

            {snapshot ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block">Versão do Snapshot</span>
                    <span className="text-white font-semibold">v{snapshot.eventVersion}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Status do Snapshot</span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-semibold text-[11px] ${
                        snapshot.status === 'VALID'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {snapshot.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Submetido em</span>
                    <span className="text-white font-mono">
                      {new Date(snapshot.submittedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Responsável</span>
                    <span className="text-white truncate block">{snapshot.submittedByName || 'Sistema'}</span>
                  </div>
                </div>

                {/* Hash Criptográfico SHA-256 */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div className="truncate text-xs font-mono text-slate-400">
                    <span className="text-slate-500 mr-2">SHA-256:</span>
                    {snapshot.configurationHash}
                  </div>
                  <button
                    onClick={() => copyHashToClipboard(snapshot.configurationHash)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Copiar Hash"
                  >
                    {copiedHash ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Botão de Verificação de Integridade em Tempo Real */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleVerifyIntegrity}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-700"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Verificar Integridade do Snapshot
                  </button>

                  {integrityStatus && (
                    <div
                      className={`text-xs flex items-center gap-1.5 ${
                        integrityStatus.valid ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {integrityStatus.valid ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      {integrityStatus.message}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400 mb-3">Nenhum snapshot de revisão congelado até o momento.</p>
                <button
                  onClick={handleCreateSnapshot}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
                >
                  Congelar Primeiro Snapshot
                </button>
              </div>
            )}
          </div>

          {/* Card: Máquina de Estados (State Machine) & Transições Permitidas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Lock className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">Transições Oficiais da State Machine</h3>
            </div>

            <div className="space-y-3">
              {transitions.map((t) => (
                <div
                  key={t.targetStatus}
                  className={`p-4 rounded-xl border transition-all ${
                    t.allowed
                      ? 'bg-slate-800/40 border-slate-700/60'
                      : 'bg-slate-950/40 border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="text-sm font-bold text-white">{t.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        <EventStatusBadge status={t.targetStatus} />
                      </div>
                      <p className="text-xs text-slate-400">{t.targetStatus}</p>
                    </div>

                    <button
                      onClick={() => handleExecuteTransition(t.targetStatus, t.label)}
                      disabled={!t.allowed || isTransitioning}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                        t.allowed
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/40'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
                      }`}
                    >
                      {t.allowed ? 'Executar Transição' : 'Bloqueado'}
                    </button>
                  </div>

                  {/* Detalhes de Bloqueio se houver */}
                  {!t.allowed && t.blockReasons && t.blockReasons.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Requisitos de Guarda não homologados:
                      </div>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pl-1">
                        {t.blockReasons.map((b, idx) => (
                          <li key={idx}>{b.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Painel Direito (1 coluna): Agendamento e Histórico de Publicação */}
        <div className="space-y-6">
          {/* Card: Publicação Programada */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <Calendar className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-semibold text-white">Agendar Publicação</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Programe o evento para abrir vendas automaticamente em data e fuso específicos.
            </p>

            <form onSubmit={handleSchedulePublication} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Data de Abertura</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Horário (Fuso de Brasília)</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isTransitioning}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-purple-900/20 mt-2"
              >
                Agendar Abertura de Vendas
              </button>
            </form>
          </div>

          {/* Histórico de Agendamentos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <Clock className="w-5 h-5 text-slate-400" />
              <h3 className="text-sm font-semibold text-white">Histórico de Agendamentos</h3>
            </div>

            {schedules.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhum agendamento registrado.</p>
            ) : (
              <div className="space-y-2.5">
                {schedules.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-white">
                        {new Date(s.scheduledAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {s.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">{s.timezone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Pausa de Vendas */}
      {isPauseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Pause className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Pausar Vendas do Evento</h3>
                <p className="text-xs text-slate-400">Interrompe a emissão de ingressos em todos os canais.</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Justificativa Operacional (Obrigatório para Auditoria)
              </label>
              <textarea
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="Ex: Ajuste no mapa de setores ou parada técnica autorizada..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 h-24 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPauseModalOpen(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handlePauseSales}
                disabled={isTransitioning}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl"
              >
                Confirmar Pausa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Preview Público */}
      <PublicPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        previewTokenData={previewTokenData}
        eventName={eventName}
      />
    </div>
  );
};
