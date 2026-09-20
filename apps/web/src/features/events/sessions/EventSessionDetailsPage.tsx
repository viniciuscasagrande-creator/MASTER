import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Layers,
  Shield,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Play,
  Check,
  X,
  Lock,
  Archive,
  Ban
} from 'lucide-react';
import {
  EventSessionDTO,
  EventSessionStatus,
  SessionSectionDTO,
  SessionCapacityReservationDTO,
  SessionReservationType
} from '@shared/types/index';
import {
  fetchSessionById,
  changeSessionStatus,
  addSessionReservation,
  removeSessionReservation,
  archiveSession
} from '../api/sessions.api';
import { useDiskContext } from '../../../core/context/DiskContext';
import { Badge } from '../../../shared/components/Badge';
import { StatCard } from '../../../shared/components/StatCard';
import { formatNumber, formatDateTime } from '../../../shared/utils/formatters';

interface EventSessionDetailsPageProps {
  eventId: string;
  sessionId: string;
  onBack: () => void;
}

export const SESSION_STATUS_LABELS: Record<EventSessionStatus, string> = {
  DRAFT: 'Rascunho',
  CONFIGURED: 'Configurada',
  SCHEDULED: 'Agendada',
  OPEN: 'Aberta / Em Venda',
  IN_PROGRESS: 'Em Andamento',
  FINISHED: 'Encerrada',
  CANCELLED: 'Cancelada',
  ARCHIVED: 'Arquivada'
};

const RESERVATION_TYPE_LABELS: Record<SessionReservationType, string> = {
  PRODUCTION: 'Produção / Equipe',
  ARTIST: 'Artista / Rider',
  SPONSOR: 'Patrocinador / Convidados',
  SECURITY: 'Segurança / Bombeiros',
  ACCESSIBILITY: 'Cotas Legais / PCD',
  TECHNICAL: 'Bloqueio Técnico de Visão',
  OTHER: 'Outras Reservas'
};

export const EventSessionDetailsPage: React.FC<EventSessionDetailsPageProps> = ({
  eventId,
  sessionId,
  onBack
}) => {
  const { apiFetch } = useDiskContext();

  const [session, setSession] = useState<EventSessionDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Reservation modal state
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [resType, setResType] = useState<SessionReservationType>('PRODUCTION');
  const [resQuantity, setResQuantity] = useState<number>(50);
  const [resReason, setResReason] = useState('');
  const [resSectionId, setResSectionId] = useState<string>('');

  const loadSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await fetchSessionById(eventId, sessionId, apiFetch);
      setSession(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar detalhes da sessão');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, sessionId, apiFetch]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // State machine transition
  const handleTransition = async (nextStatus: EventSessionStatus, notes?: string) => {
    try {
      setIsActionLoading(true);
      await changeSessionStatus(eventId, sessionId, nextStatus, notes, apiFetch);
      await loadSession();
    } catch (err: any) {
      alert(err.message || 'Erro na transição de estado da sessão');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Add Reservation
  const handleAddReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resQuantity <= 0) return;

    try {
      setIsActionLoading(true);
      await addSessionReservation(
        eventId,
        sessionId,
        {
          type: resType,
          quantity: resQuantity,
          reason: resReason.trim() || undefined,
          sectionId: resSectionId || undefined
        },
        apiFetch
      );
      setIsReservationModalOpen(false);
      setResReason('');
      await loadSession();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar reserva técnica');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Remove Reservation
  const handleRemoveReservation = async (reservationId: string) => {
    if (confirm('Deseja liberar e remover esta reserva técnica?')) {
      try {
        setIsActionLoading(true);
        await removeSessionReservation(eventId, sessionId, reservationId, apiFetch);
        await loadSession();
      } catch (err: any) {
        alert(err.message || 'Erro ao remover reserva');
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-slate-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span>Carregando dados da sessão...</span>
        </div>
      </div>
    );
  }

  if (errorMessage || !session) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Sessão não encontrada</h3>
        <p className="text-xs text-slate-400">{errorMessage}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
        >
          Voltar às Sessões
        </button>
      </div>
    );
  }

  const nominalCapacity = session.capacity || 0;
  const reservedCapacity = session.reservedCapacity || 0;
  const availableCapacity = Math.max(0, nominalCapacity - reservedCapacity);

  const sections = session.sessionSections || [];
  const reservations = session.reservations || [];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Top Header with Status & Machine actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors mt-0.5"
            title="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge
                variant={
                  session.status === 'OPEN'
                    ? 'emerald'
                    : session.status === 'CANCELLED'
                    ? 'rose'
                    : session.status === 'FINISHED'
                    ? 'slate'
                    : 'orange'
                }
                size="sm"
              >
                {SESSION_STATUS_LABELS[session.status] || session.status}
              </Badge>

              {session.isPrimary && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Sessão Principal
                </span>
              )}

              <span className="font-mono text-xs text-slate-500">
                {session.publicCode}
              </span>
            </div>

            <h1 className="text-xl font-bold text-white">
              {session.name || `Sessão ${formatDateTime(session.startAt)}`}
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-orange-400" />
                {formatDateTime(session.startAt)}
              </span>
              {session.doorsOpenAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  Portões: {formatDateTime(session.doorsOpenAt).split(' ')[1]}
                </span>
              )}
              {session.venueName && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-purple-400" />
                  {session.venueName}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* State Machine Transition Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {session.status === 'DRAFT' && (
            <button
              onClick={() => handleTransition('CONFIGURED')}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Check className="h-3.5 w-3.5" />
              Concluir Configuração
            </button>
          )}

          {session.status === 'CONFIGURED' && (
            <button
              onClick={() => handleTransition('SCHEDULED')}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Calendar className="h-3.5 w-3.5" />
              Agendar Sessão
            </button>
          )}

          {session.status === 'SCHEDULED' && (
            <button
              onClick={() => handleTransition('OPEN')}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Play className="h-3.5 w-3.5" />
              Abrir para Vendas
            </button>
          )}

          {session.status === 'OPEN' && (
            <button
              onClick={() => handleTransition('IN_PROGRESS')}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Play className="h-3.5 w-3.5" />
              Iniciar Apresentação
            </button>
          )}

          {session.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleTransition('FINISHED')}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Encerrar Sessão
            </button>
          )}

          {session.status !== 'CANCELLED' && session.status !== 'FINISHED' && session.status !== 'ARCHIVED' && (
            <button
              onClick={() => {
                const reason = prompt('Motivo do cancelamento da sessão:');
                if (reason) handleTransition('CANCELLED', reason);
              }}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-all"
            >
              <Ban className="h-3.5 w-3.5" />
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* 2. Capacity Hierarchy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="CAPACIDADE NOMINAL DA SESSÃO"
          value={formatNumber(nominalCapacity)}
          subtitle="Carga autorizada para esta sessão"
          icon={<Users className="h-4 w-4 text-cyan-400" />}
          badge="Nominal"
          badgeVariant="cyan"
        />

        <StatCard
          title="RESERVAS TÉCNICAS (BLOQUEIOS)"
          value={formatNumber(reservedCapacity)}
          subtitle={`${reservations.length} bloqueio(s) técnico(s)`}
          icon={<Lock className="h-4 w-4 text-amber-400" />}
          badge="Bloqueado"
          badgeVariant="amber"
        />

        <StatCard
          title="CAPACIDADE DISPONÍVEL PARA VENDA"
          value={formatNumber(availableCapacity)}
          subtitle="Assentos / ingressos liberados"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          badge="Livre"
          badgeVariant="emerald"
        />
      </div>

      {/* 3. Operational Sections Breakdown */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              Divisão de Capacidade por Setores Operacionais
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hierarquia: Físico do Local &ge; Configurado no Evento &ge; Ofertado nesta Sessão
            </p>
          </div>
        </div>

        {sections.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            Nenhum setor operacional vinculado a esta sessão.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Setor</th>
                  <th className="py-2.5 px-3">Capacidade Física</th>
                  <th className="py-2.5 px-3">Capacidade do Evento</th>
                  <th className="py-2.5 px-3 font-bold text-white">Nesta Sessão</th>
                  <th className="py-2.5 px-3">Bloqueado</th>
                  <th className="py-2.5 px-3">Disponível</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sections.map((sec) => {
                  const free = Math.max(0, sec.capacity - (sec.reservedCapacity || 0));
                  return (
                    <tr key={sec.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-sans font-bold text-white">
                        {sec.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {formatNumber(sec.physicalCapacity)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {formatNumber(sec.eventCapacity)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-cyan-400">
                        {formatNumber(sec.capacity)}
                      </td>
                      <td className="py-2.5 px-3 text-amber-400">
                        {formatNumber(sec.reservedCapacity || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">
                        {formatNumber(free)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Technical Reservations Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              Reservas Técnicas de Capacidade
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cotas de segurança, produção, patrocinadores e exigências legais protegidas de venda comercial.
            </p>
          </div>

          <button
            onClick={() => setIsReservationModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova Reserva Técnica
          </button>
        </div>

        {reservations.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
            <Lock className="h-6 w-6 text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs text-slate-400 font-semibold">Nenhuma reserva técnica cadastrada</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Toda a capacidade nominal desta sessão está disponível para emissão e venda de ingressos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Finalidade / Tipo</th>
                  <th className="py-2.5 px-3">Quantidade Reservada</th>
                  <th className="py-2.5 px-3">Setor Vinculado</th>
                  <th className="py-2.5 px-3">Motivo / Justificativa</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      <Badge variant="amber" size="sm">
                        {RESERVATION_TYPE_LABELS[res.type] || res.type}
                      </Badge>
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                      {formatNumber(res.quantity)} lugares
                    </td>

                    <td className="py-2.5 px-3 text-slate-300">
                      {res.sectionName || 'Geral / Toda a Sessão'}
                    </td>

                    <td className="py-2.5 px-3 text-slate-400 italic">
                      {res.reason || '—'}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleRemoveReservation(res.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Liberar reserva técnica"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nova Reserva Técnica */}
      {isReservationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-400" />
                Adicionar Reserva Técnica
              </h3>
              <button
                onClick={() => setIsReservationModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddReservation} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">
                  Tipo / Destinação da Reserva <span className="text-rose-400">*</span>
                </label>
                <select
                  value={resType}
                  onChange={(e) => setResType(e.target.value as SessionReservationType)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                >
                  {Object.entries(RESERVATION_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">
                  Quantidade de Lugares Bloqueados <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={nominalCapacity}
                  value={resQuantity}
                  onChange={(e) => setResQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">
                  Setor Específico (opcional)
                </label>
                <select
                  value={resSectionId}
                  onChange={(e) => setResSectionId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Geral / Capacidade da Sessão</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Capacidade: {s.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">
                  Justificativa / Motivo
                </label>
                <input
                  type="text"
                  value={resReason}
                  onChange={(e) => setResReason(e.target.value)}
                  placeholder="Ex: Cota contratual patrocinador máster"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReservationModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                >
                  {isActionLoading ? 'Salvando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
