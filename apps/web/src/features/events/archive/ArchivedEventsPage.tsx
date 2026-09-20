import React, { useState, useEffect, useCallback } from 'react';
import {
  Archive,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  ShieldCheck,
  FileText,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAuth } from '../../../core/auth/AuthContext';
import {
  listArchivedEvents,
  archiveEvent,
  fetchEventArchiveRecord
} from '../api/closure.api';
import { EventArchiveRecordDTO } from '@shared/types/index';

interface ArchivedEventsPageProps {
  currentEventId?: string;
  currentEventName?: string;
  onNavigate?: (subItemId: string) => void;
}

export const ArchivedEventsPage: React.FC<ArchivedEventsPageProps> = ({
  currentEventId,
  currentEventName,
  onNavigate
}) => {
  const { hasPermission } = useAuth();
  const canArchive = hasPermission('eventos.arquivamento.arquivar');

  const [archivedEvents, setArchivedEvents] = useState<EventArchiveRecordDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selected Record View Modal
  const [selectedRecord, setSelectedRecord] = useState<EventArchiveRecordDTO | null>(null);

  // Archive Current Event Modal
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveJustification, setArchiveJustification] = useState('');
  const [isSubmittingArchive, setIsSubmittingArchive] = useState(false);

  // Load Catalog
  const loadArchivedList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listArchivedEvents();
      setArchivedEvents(data);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar eventos arquivados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArchivedList();
  }, [loadArchivedList]);

  // Handle Archive Event
  const handleConfirmArchiveCurrent = async () => {
    if (!currentEventId) return;
    if (archiveJustification.trim().length < 10) {
      setError('A justificativa de arquivamento deve conter pelo menos 10 caracteres.');
      return;
    }

    setIsSubmittingArchive(true);
    setError(null);
    try {
      const res = await archiveEvent(currentEventId, archiveJustification.trim());
      setSuccessMessage(`Evento "${res.eventName}" arquivado com sucesso! Modo somente leitura ativado.`);
      setIsArchiveModalOpen(false);
      setArchiveJustification('');
      await loadArchivedList();
    } catch (err: any) {
      setError(err.message || 'Erro ao arquivar evento');
    } finally {
      setIsSubmittingArchive(false);
    }
  };

  const filteredEvents = archivedEvents.filter((item) =>
    item.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.eventId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.archivedByName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Archive className="h-6 w-6 text-orange-400" />
              Catálogo de Eventos Arquivados
            </h1>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Somente Leitura
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Repositório definitivo de eventos concluídos ou cancelados. Registros financeiros, bilheteria e borderôs congelados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentEventId && canArchive && (
            <button
              onClick={() => setIsArchiveModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow transition-all"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Arquivar Evento Atual</span>
            </button>
          )}

          <button
            onClick={loadArchivedList}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Read-Only Guarantee Banner */}
      <div className="p-4 rounded-xl border border-sky-500/20 bg-sky-950/20 flex items-center justify-between text-xs text-sky-200">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-sky-400 shrink-0" />
          <span>
            <strong>Garantia de Imutabilidade:</strong> Eventos arquivados têm política de escrita bloqueada (read-only write policy). Operações de vendas, cortesias, cancelamentos ou alterações em lotes são estritamente rejeitadas pela API.
          </span>
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

      {/* Search Filter Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome, ID ou responsável pelo arquivamento..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Archived Catalog Table */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Eventos no Repositório de Arquivo
          </h2>
          <span className="text-xs text-slate-400">
            {filteredEvents.length} registro(s) encontrado(s)
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-600" />
            Carregando repositório de eventos...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Archive className="h-8 w-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold">Nenhum evento arquivado no momento.</p>
            <p className="text-xs text-slate-500">Eventos só podem ser arquivados após terem sido FINALIZADOS ou CANCELADOS.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Evento</th>
                  <th className="py-3 px-4">Status Prévio</th>
                  <th className="py-3 px-4">Arquivado em</th>
                  <th className="py-3 px-4">Arquivado por</th>
                  <th className="py-3 px-4">Proteção</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredEvents.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {rec.eventName}
                      <div className="text-[11px] font-mono text-slate-500">
                        {rec.eventId}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold border bg-slate-800 text-slate-300 border-slate-700">
                        {rec.statusBeforeArchive}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(rec.archivedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {rec.archivedByName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400">
                        <Lock className="h-3 w-3" />
                        Somente Leitura
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-orange-400 border border-slate-700 hover:border-orange-500/40 transition-all inline-flex items-center gap-1"
                      >
                        <span>Ver Auditoria</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: View Archive Audit Record */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-orange-400">
                <Archive className="h-5 w-5" />
                <h3 className="text-base font-bold text-white">
                  Registro Histórico de Arquivamento
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="text-slate-400">Evento:</div>
                <div className="font-bold text-white text-sm">
                  {selectedRecord.eventName}
                </div>
                <div className="font-mono text-slate-500 text-[11px]">
                  ID: {selectedRecord.eventId}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <div className="text-slate-400 text-[11px]">Arquivado por:</div>
                  <div className="font-semibold text-white mt-0.5">
                    {selectedRecord.archivedByName}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <div className="text-slate-400 text-[11px]">Data / Hora:</div>
                  <div className="font-semibold text-white mt-0.5">
                    {new Date(selectedRecord.archivedAt).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-slate-300">Justificativa:</div>
                <p className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 leading-relaxed italic">
                  "{selectedRecord.justification}"
                </p>
              </div>

              {selectedRecord.closureSnapshotId && (
                <div className="text-slate-400 text-[11px] font-mono">
                  Snapshot de Encerramento: {selectedRecord.closureSnapshotId}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-750"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Archive Current Event */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-orange-400">
              <Archive className="h-6 w-6" />
              <h2 className="text-lg font-bold text-white">
                Arquivar Evento: {currentEventName}
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              O arquivamento moverá o evento para o repositório histórico definitivo (cold storage) e impedirá qualquer modificação futura em ingressos, bilheteria e taxas.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Justificativa Operacional do Arquivamento (mínimo 10 caracteres) *:
              </label>
              <textarea
                value={archiveJustification}
                onChange={(e) => setArchiveJustification(e.target.value)}
                placeholder="Ex: Borderô financeiro conciliado com a produção e comprovantes arquivados no cofre digital..."
                rows={4}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
              <div className="text-right text-[11px] text-slate-500">
                {archiveJustification.trim().length} / 10 caracteres mínimos
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsArchiveModalOpen(false)}
                disabled={isSubmittingArchive}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmArchiveCurrent}
                disabled={isSubmittingArchive || archiveJustification.trim().length < 10}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow transition-all flex items-center gap-2"
              >
                {isSubmittingArchive ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Archive className="h-3.5 w-3.5" />
                )}
                <span>Confirmar Arquivamento</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
