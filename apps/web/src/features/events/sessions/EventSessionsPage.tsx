import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Sparkles,
  AlertTriangle,
  Layers,
  MapPin,
  CheckCircle2,
  Users,
  Copy,
  Trash2,
  RefreshCw,
  LayoutGrid,
  List,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import {
  EventSessionDTO,
  EventSessionStatus,
  VenueDTO,
  SessionConflictDTO,
  CreateEventSessionInput,
  DuplicateEventSessionInput
} from '@shared/types/index';
import {
  fetchEventSessions,
  fetchSessionSummary,
  createEventSession,
  duplicateSession,
  archiveSession,
  checkSessionConflicts,
  SessionSummaryDTO
} from '../api/sessions.api';
import { fetchVenues } from '../api/venues.api';
import { useDiskContext } from '../../../core/context/DiskContext';
import { Badge } from '../../../shared/components/Badge';
import { StatCard } from '../../../shared/components/StatCard';
import { formatNumber, formatDateTime } from '../../../shared/utils/formatters';
import { SessionConflictBanner } from './SessionConflictBanner';
import { CreateSessionModal } from './CreateSessionModal';
import { DuplicateSessionModal } from './DuplicateSessionModal';
import { BulkSessionsModal } from './BulkSessionsModal';
import { SESSION_STATUS_LABELS } from './EventSessionDetailsPage';

interface EventSessionsPageProps {
  eventId: string;
  eventName?: string;
  onSelectSession: (sessionId: string) => void;
  onBackToDashboard?: () => void;
}

export const EventSessionsPage: React.FC<EventSessionsPageProps> = ({
  eventId,
  eventName,
  onSelectSession,
  onBackToDashboard
}) => {
  const { apiFetch } = useDiskContext();

  const [sessions, setSessions] = useState<EventSessionDTO[]>([]);
  const [summary, setSummary] = useState<SessionSummaryDTO | null>(null);
  const [availableVenues, setAvailableVenues] = useState<VenueDTO[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Views
  const [statusFilter, setStatusFilter] = useState<EventSessionStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Conflict banner state
  const [conflictData, setConflictData] = useState<SessionConflictDTO | null>(null);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [sessionToDuplicate, setSessionToDuplicate] = useState<EventSessionDTO | null>(null);

  // Load venues catalog
  const loadVenuesData = useCallback(async () => {
    try {
      const res = await fetchVenues({ limit: 50 }, apiFetch);
      setAvailableVenues(res.venues);
    } catch (err) {
      console.error('Erro ao buscar catálogo de locais:', err);
    }
  }, [apiFetch]);

  // Load Sessions
  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await fetchEventSessions(
        eventId,
        statusFilter !== 'ALL' ? { status: statusFilter } : undefined,
        apiFetch
      );
      setSessions(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar sessões do evento');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, statusFilter, apiFetch]);

  // Load Summary KPIs
  const loadSummary = useCallback(async () => {
    try {
      setIsSummaryLoading(true);
      const data = await fetchSessionSummary(eventId, apiFetch);
      setSummary(data);
    } catch (err: any) {
      console.error('Erro ao carregar resumo de sessões:', err);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [eventId, apiFetch]);

  // Run Conflict check across the event's sessions
  const runConflictCheck = async () => {
    try {
      setIsCheckingConflicts(true);
      const res = await checkSessionConflicts(eventId, {}, apiFetch);
      setConflictData(res);
    } catch (err: any) {
      alert(err.message || 'Erro ao analisar conflitos');
    } finally {
      setIsCheckingConflicts(false);
    }
  };

  useEffect(() => {
    loadVenuesData();
    loadSummary();
    loadSessions();
  }, [loadVenuesData, loadSummary, loadSessions]);

  // Modal Handlers
  const handleCreateSession = async (input: CreateEventSessionInput) => {
    await createEventSession(eventId, input, apiFetch);
    await loadSessions();
    await loadSummary();
  };

  const handleDuplicateSession = async (input: DuplicateEventSessionInput) => {
    if (!sessionToDuplicate) return;
    await duplicateSession(eventId, sessionToDuplicate.id, input, apiFetch);
    setSessionToDuplicate(null);
    await loadSessions();
    await loadSummary();
  };

  const handleArchiveSession = async (sessionId: string) => {
    if (confirm('Deseja realmente arquivar esta sessão?')) {
      try {
        await archiveSession(eventId, sessionId, apiFetch);
        await loadSessions();
        await loadSummary();
      } catch (err: any) {
        alert(err.message || 'Erro ao arquivar sessão');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan" size="sm">
              Datas & Capacidade Operacional
            </Badge>
            {eventName && (
              <span className="text-xs text-slate-400 font-medium">
                • {eventName}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-orange-400" />
            Sessões, Horários & Capacidade do Evento
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie múltiplas apresentações, fusos, portões, recorrências em lote e divisão de capacidade por setores.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={runConflictCheck}
            disabled={isCheckingConflicts}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors"
            title="Conferir se há sobreposição de horário ou gates"
          >
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            {isCheckingConflicts ? 'Analisando...' : 'Verificar Conflitos'}
          </button>

          <button
            onClick={() => setIsBulkOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-purple-400" />
            Gerador em Lote / Recorrência
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            Nova Sessão
          </button>
        </div>
      </div>

      {/* 2. Conflict Alert Banner */}
      <SessionConflictBanner
        conflictData={conflictData}
        onDismiss={() => setConflictData(null)}
      />

      {/* 3. KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TOTAL DE SESSÕES"
          value={isSummaryLoading ? '...' : formatNumber(summary?.total || 0)}
          subtitle="Apresentações cadastradas"
          icon={<Calendar className="h-4 w-4 text-cyan-400" />}
          badge="Agenda"
          badgeVariant="cyan"
        />

        <StatCard
          title="SESSÕES ABERTAS / EM VENDA"
          value={isSummaryLoading ? '...' : formatNumber(summary?.byStatus?.OPEN || 0)}
          subtitle="Bilheteria disponível ao público"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          badge="Vendas"
          badgeVariant="emerald"
        />

        <StatCard
          title="SESSÕES AGENDADAS"
          value={isSummaryLoading ? '...' : formatNumber(summary?.byStatus?.SCHEDULED || 0)}
          subtitle="Aguardando abertura de vendas"
          icon={<Clock className="h-4 w-4 text-orange-400" />}
          badge="Próximas"
          badgeVariant="orange"
        />

        <StatCard
          title="CAPACIDADE TOTAL OFERTADA"
          value={isSummaryLoading ? '...' : formatNumber(summary?.totalCapacity || 0)}
          subtitle={`${formatNumber(summary?.totalReserved || 0)} reservados`}
          icon={<Users className="h-4 w-4 text-purple-400" />}
          badge="Capacidade"
          badgeVariant="purple"
        />
      </div>

      {/* 4. Filter Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-400 shrink-0">Filtrar por Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="ALL">Todas as Sessões</option>
            {Object.entries(SESSION_STATUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-slate-700 rounded-xl p-1 bg-slate-800/80 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Tabela de Sessões"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Cards de Sessões"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Sessions Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px] text-slate-400">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span>Carregando sessões...</span>
          </div>
        </div>
      ) : errorMessage ? (
        <div className="p-8 text-center text-rose-400 bg-rose-500/10 rounded-2xl border border-rose-500/30">
          <AlertCircle className="h-6 w-6 mx-auto mb-2" />
          <p className="text-xs font-semibold">{errorMessage}</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/20">
          <Calendar className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">Nenhuma sessão encontrada</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {statusFilter !== 'ALL'
              ? 'Nenhuma sessão corresponde ao filtro de status selecionado.'
              : 'Este evento ainda não possui sessões configuradas. Adicione uma sessão avulsa ou utilize o motor de recorrência.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsBulkOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors"
            >
              <Sparkles className="h-4 w-4 text-purple-400" />
              Gerador em Lote
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-lg shadow-orange-500/20"
            >
              <Plus className="h-4 w-4" />
              Criar Nova Sessão
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Código / Nome</th>
                <th className="px-4 py-3.5">Data & Horário</th>
                <th className="px-4 py-3.5">Portões</th>
                <th className="px-4 py-3.5">Local (Venue)</th>
                <th className="px-4 py-3.5">Capacidade</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sessions.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{s.name || 'Sessão sem título'}</span>
                      {s.isPrimary && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-400">
                          Principal
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">{s.publicCode}</div>
                  </td>

                  <td className="px-4 py-3.5 font-mono text-white">
                    {formatDateTime(s.startAt)}
                  </td>

                  <td className="px-4 py-3.5 font-mono text-slate-400">
                    {s.doorsOpenAt ? formatDateTime(s.doorsOpenAt).split(' ')[1] : '—'}
                  </td>

                  <td className="px-4 py-3.5 text-slate-300">
                    {s.venueName || 'Local Padrão'}
                  </td>

                  <td className="px-4 py-3.5 font-mono">
                    <span className="text-white font-bold">{formatNumber(s.capacity)}</span>
                    {s.reservedCapacity > 0 && (
                      <span className="text-[10px] text-amber-400 ml-1.5">
                        ({formatNumber(s.reservedCapacity)} res.)
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <Badge
                      variant={
                        s.status === 'OPEN'
                          ? 'emerald'
                          : s.status === 'CANCELLED'
                          ? 'rose'
                          : s.status === 'FINISHED'
                          ? 'slate'
                          : 'orange'
                      }
                      size="sm"
                    >
                      {SESSION_STATUS_LABELS[s.status] || s.status}
                    </Badge>
                  </td>

                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSessionToDuplicate(s)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Duplicar sessão"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleArchiveSession(s.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Arquivar sessão"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => onSelectSession(s.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-orange-400 transition-colors"
                        title="Ver detalhes operacionais"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-orange-500/50 hover:bg-slate-900/90 transition-all cursor-pointer shadow-lg"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge
                  variant={
                    s.status === 'OPEN'
                      ? 'emerald'
                      : s.status === 'CANCELLED'
                      ? 'rose'
                      : s.status === 'FINISHED'
                      ? 'slate'
                      : 'orange'
                  }
                  size="sm"
                >
                  {SESSION_STATUS_LABELS[s.status] || s.status}
                </Badge>

                <span className="font-mono text-[11px] text-slate-500">
                  {s.publicCode}
                </span>
              </div>

              <h4 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                {s.name || 'Sessão sem título'}
              </h4>

              <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                  <Calendar className="h-3.5 w-3.5 text-orange-400" />
                  <span>{formatDateTime(s.startAt)}</span>
                </div>
                {s.doorsOpenAt && (
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Portões: {formatDateTime(s.doorsOpenAt).split(' ')[1]}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <MapPin className="h-3.5 w-3.5 text-purple-400" />
                  <span className="truncate">{s.venueName || 'Local Padrão'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-500">Capacidade: </span>
                  <span className="font-mono font-bold text-white">{formatNumber(s.capacity)}</span>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {isCreateOpen && (
        <CreateSessionModal
          eventId={eventId}
          availableVenues={availableVenues}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateSession}
        />
      )}

      {sessionToDuplicate && (
        <DuplicateSessionModal
          session={sessionToDuplicate}
          onClose={() => setSessionToDuplicate(null)}
          onSubmit={handleDuplicateSession}
        />
      )}

      {isBulkOpen && (
        <BulkSessionsModal
          eventId={eventId}
          availableVenues={availableVenues}
          onClose={() => setIsBulkOpen(false)}
          onSuccess={() => {
            loadSessions();
            loadSummary();
          }}
        />
      )}
    </div>
  );
};
