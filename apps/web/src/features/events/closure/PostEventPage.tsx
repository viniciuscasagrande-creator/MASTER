import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
  Layers,
  Smartphone,
  ShieldCheck,
  Archive,
  ArrowLeft,
  RefreshCw,
  Award,
  Zap
} from 'lucide-react';
import { fetchPostEventReport } from '../api/closure.api';
import { EventOperationalReportDTO } from '@shared/types/index';

interface PostEventPageProps {
  eventId: string;
  eventName: string;
  onNavigate?: (subItemId: string) => void;
}

export const PostEventPage: React.FC<PostEventPageProps> = ({
  eventId,
  eventName,
  onNavigate
}) => {
  const [report, setReport] = useState<EventOperationalReportDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPostEventReport(eventId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar relatório pós-evento');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportJSON = () => {
    if (!report) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `relatorio-pos-evento-${eventId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-slate-400 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-orange-500" />
        <p className="text-sm font-semibold">Consolidando relatório pós-evento...</p>
        <p className="text-xs text-slate-500">Agregando dados de bilheteria, portaria, dispositivos e incidentes.</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-rose-300 space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <span>Não foi possível carregar o relatório pós-evento</span>
          </div>
          <p className="text-xs">{error || 'Dados indisponíveis.'}</p>
          <div className="pt-2 flex gap-3">
            <button
              onClick={loadReport}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => onNavigate?.('events-closure')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300"
            >
              Voltar para Encerramento
            </button>
          </div>
        </div>
      </div>
    );
  }

  const kpi = report.operationalKPIs;
  const noShowCount = Math.max(0, kpi.totalTicketsSold - kpi.totalTicketsCheckedIn);
  const noShowRate = kpi.totalTicketsSold > 0
    ? ((noShowCount / kpi.totalTicketsSold) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-100">
      {/* Top Controls & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.('events-closure')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
            title="Voltar para Encerramento"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Relatório Operacional Pós-Evento
              </h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                {report.eventStatus || 'FINALIZADO'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Consolidação definitiva de público, fluxo de portaria, tempos de pico e auditoria operacional.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar JSON</span>
          </button>

          <button
            onClick={() => onNavigate?.('events-archive')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow transition-all"
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Arquivar Evento</span>
          </button>
        </div>
      </div>

      {/* Event Header Information Card */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-white">{report.eventName}</h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            {report.venue?.name && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-orange-400" />
                {report.venue.name} {report.venue.city ? `• ${report.venue.city}/${report.venue.state}` : ''}
              </span>
            )}
            {report.period?.closedAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Fechamento em: {new Date(report.period.closedAt).toLocaleString('pt-BR')}
              </span>
            )}
            <span className="text-slate-500 font-mono text-[11px]">
              ID: {report.eventId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">Público Presente</div>
            <div className="text-xl font-bold text-white">
              {kpi.totalTicketsCheckedIn.toLocaleString('pt-BR')}
              <span className="text-xs font-normal text-slate-400 ml-1">
                / {kpi.totalTicketsSold.toLocaleString('pt-BR')} vendidos
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-sm">
            {kpi.attendancePercentage.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Card */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Taxa de Comparecimento</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {kpi.attendancePercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              No-show de {noShowCount} pessoas ({noShowRate}%)
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.min(100, kpi.attendancePercentage)}%` }}
            />
          </div>
        </div>

        {/* Capacity vs Sold */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ocupação do Local</span>
            <Layers className="h-4 w-4 text-orange-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {kpi.totalCapacity > 0
                ? `${((kpi.totalTicketsSold / kpi.totalCapacity) * 100).toFixed(1)}%`
                : '0%'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {kpi.totalTicketsSold} vendidos de {kpi.totalCapacity} vagas
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full"
              style={{
                width: `${
                  kpi.totalCapacity > 0
                    ? Math.min(100, (kpi.totalTicketsSold / kpi.totalCapacity) * 100)
                    : 0
                }%`
              }}
            />
          </div>
        </div>

        {/* Flow Peak Hour */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pico de Fluxo de Portaria</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">
              {kpi.peakCheckinHour || '—'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Máximo de {kpi.peakValidationsPerMinute} validações/min
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            Período com maior pressão em catracas
          </div>
        </div>

        {/* Incident Resolution */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Incidentes & Estabilidade</span>
            <ShieldCheck className="h-4 w-4 text-sky-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {kpi.totalIncidents}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {kpi.criticalIncidents} crítico(s) reportados
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            {kpi.conflictsResolvedCount} conflitos offline resolvidos
          </div>
        </div>
      </div>

      {/* Hardware & Operations Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 text-sky-400 border border-slate-700">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Coletores Utilizados</div>
            <div className="text-base font-bold text-white">
              {kpi.devicesUsedCount} dispositivos
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Conflitos Sincronizados</div>
            <div className="text-base font-bold text-white">
              {kpi.conflictsResolvedCount} resolvidos
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 text-purple-400 border border-slate-700">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Passagens de Turno (Handoffs)</div>
            <div className="text-base font-bold text-white">
              {kpi.totalHandoffs} registros
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Breakdown Table */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Desempenho por Sessão
          </h3>
          <span className="text-xs text-slate-400">
            {report.sessions.length} sessão(ões) registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Sessão</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Capacidade</th>
                <th className="py-3 px-4 text-right">Vendidos</th>
                <th className="py-3 px-4 text-right">Check-in Real</th>
                <th className="py-3 px-4 text-right">% Presença</th>
                <th className="py-3 px-4 text-right">Fechamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {report.sessions.map((sess) => {
                const presence = sess.sold > 0 ? ((sess.checkedIn / sess.sold) * 100).toFixed(1) : '0';
                return (
                  <tr key={sess.sessionId} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-white">
                      {sess.sessionName}
                      <div className="text-[11px] font-mono text-slate-500">
                        {sess.sessionId}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                          sess.status === 'CLOSED'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                            : sess.status === 'CANCELLED'
                            ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                            : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {sess.status === 'CLOSED' ? 'Encerrada' : sess.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{sess.capacity}</td>
                    <td className="py-3 px-4 text-right font-mono">{sess.sold}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {sess.checkedIn}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {presence}%
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {sess.closedAt ? new Date(sess.closedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incidents Breakdown */}
      {report.incidentsByType && Object.keys(report.incidentsByType).length > 0 && (
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Distribuição de Ocorrências e Incidentes
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(report.incidentsByType).map(([type, count]) => (
              <div
                key={type}
                className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between"
              >
                <span className="text-xs text-slate-300 font-medium">{type}</span>
                <span className="text-sm font-bold text-orange-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generation Audit Stamp */}
      <div className="text-right text-xs text-slate-500">
        Relatório gerado em: {new Date(report.generatedAt).toLocaleString('pt-BR')} • Sistema Disk Interno
      </div>
    </div>
  );
};
