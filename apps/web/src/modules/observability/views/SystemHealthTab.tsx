import React, { useState } from 'react';
import {
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Server,
  Database,
  Layers,
  Radio,
  RefreshCw,
  Calendar,
  Ticket,
  Users,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { ComponentHealthRecord, LiveEventHealthItem, SystemAlertRecord } from '../observability.types';
import { formatDateTime } from '../../../shared/utils/formatters';

interface SystemHealthTabProps {
  components: ComponentHealthRecord[];
  liveEvents: LiveEventHealthItem[];
  alerts: SystemAlertRecord[];
  onRefresh?: () => void;
  onResolveAlert: (alertId: string) => void;
  isLoading?: boolean;
}

export const SystemHealthTab: React.FC<SystemHealthTabProps> = ({
  components,
  liveEvents,
  alerts,
  onRefresh,
  onResolveAlert,
  isLoading = false
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    liveEvents.length > 0 ? liveEvents[0].eventId : ''
  );

  const selectedEvent = liveEvents.find(e => e.eventId === selectedEventId) || liveEvents[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
      case 'NORMAL':
        return <Badge variant="emerald" dot>Operacional</Badge>;
      case 'DEGRADED':
      case 'ALERT':
        return <Badge variant="amber" dot>Alerta / Degradação</Badge>;
      case 'DOWN':
      case 'CRITICAL':
        return <Badge variant="rose" dot>Falha Crítica</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-emerald-400" />
            Saúde Global do Sistema & Operação ao Vivo de Eventos
          </h2>
          <p className="text-sm text-slate-400">
            Diagnóstico de infraestrutura em tempo real com deduplicação de alertas e telemetria dedicada para eventos em andamento (check-in de portaria e bilheteria).
          </p>
        </div>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            isLoading={isLoading}
            className="border-slate-700 bg-slate-800 text-slate-200"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Executar Health Check
          </Button>
        )}
      </div>

      {/* Live Event Operation Health Inspector */}
      {selectedEvent && (
        <div className="rounded-2xl border border-indigo-900/40 bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-slate-900/80 p-6 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{selectedEvent.eventName}</h3>
                  {getStatusBadge(selectedEvent.status)}
                </div>
                <div className="text-xs text-slate-300">
                  Produtor: <strong className="text-white">{selectedEvent.producerName}</strong> · Telemetria de Portaria ao Vivo
                </div>
              </div>
            </div>

            {/* Event Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Trocar Evento:</span>
              <select
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {liveEvents.map(ev => (
                  <option key={ev.eventId} value={ev.eventId}>
                    {ev.eventName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-time Metrics for Live Event */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Público Presente</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                {selectedEvent.attendeesCheckedIn.toLocaleString('pt-BR')}
              </div>
              <div className="text-[10px] text-slate-400">
                de {selectedEvent.totalCapacity.toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Fluxo Check-in</div>
              <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                {selectedEvent.checkinsPerMinute} /min
              </div>
              <div className="text-[10px] text-slate-400">Portaria veloz</div>
            </div>

            <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Latência da Catraca</div>
              <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
                {selectedEvent.avgGateLatencyMs}ms
              </div>
              <div className="text-[10px] text-slate-400">SLA &lt; 50ms</div>
            </div>

            <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Catracas Offline</div>
              <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                {selectedEvent.offlineGatesCount}
              </div>
              <div className="text-[10px] text-slate-400">Sincronia local</div>
            </div>

            <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Vendas ao Vivo</div>
              <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">
                {selectedEvent.salesPerMinute} /min
              </div>
              <div className="text-[10px] text-slate-400">Bilheteria online</div>
            </div>

            <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Incidentes Abertos</div>
              <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                {selectedEvent.openIncidentsCount}
              </div>
              <div className="text-[10px] text-slate-400">SAC / Suporte</div>
            </div>
          </div>
        </div>
      )}

      {/* Global Component Health Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-white">Serviços e Nós de Infraestrutura</h3>
          </div>
          <span className="text-xs text-slate-400">
            {components.filter(c => c.status === 'OPERATIONAL').length} de {components.length} operando normalmente
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {components.map(comp => (
            <div
              key={comp.id}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{comp.component}</span>
                {getStatusBadge(comp.status)}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Latência:</span>
                <span className="font-mono text-slate-200 font-semibold">{comp.latencyMs ?? 0}ms</span>
              </div>

              {comp.message && (
                <div className="text-xs text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                  {comp.message}
                </div>
              )}

              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                Checado em: {formatDateTime(comp.checkedAt)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Alerts and Deduplication Management */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold text-white">Alertas do Sistema & Deduplicação de Ocorrências</h3>
          </div>
          <Badge variant="amber">{alerts.length} Ativos</Badge>
        </div>

        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map(al => (
              <div
                key={al.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-800/40 bg-slate-950/70"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{al.title}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                      {al.alertCode}
                    </span>
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400 font-semibold">
                      {al.occurrencesCount} deduplicações
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Componente: <strong className="text-slate-300">{al.component}</strong> · Regra: {al.thresholdRule || 'Padrão'} · Primeiro disparo: {formatDateTime(al.firstTriggeredAt)}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResolveAlert(al.id)}
                  className="border-amber-700/60 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 text-xs self-end sm:self-center"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Resolver Alerta
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-6 text-xs">
            Nenhum alerta em aberto no momento. O sistema está plenamente estabilizado.
          </div>
        )}
      </div>
    </div>
  );
};
