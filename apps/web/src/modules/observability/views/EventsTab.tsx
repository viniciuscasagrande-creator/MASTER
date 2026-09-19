import React, { useState } from 'react';
import {
  Radio,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Send,
  Inbox,
  ArrowRight,
  Eye,
  X,
  Hash,
  RefreshCw,
  Check,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { BusinessEventRecord, OutboxEventRecord, InboxWebhookRecord } from '../observability.types';
import { formatDateTime } from '../../../shared/utils/formatters';

interface EventsTabProps {
  businessEvents: BusinessEventRecord[];
  outboxEvents: OutboxEventRecord[];
  inboxWebhooks: InboxWebhookRecord[];
  onRefresh?: () => void;
  onFilterByCorrelationId?: (correlationId: string) => void;
}

export const EventsTab: React.FC<EventsTabProps> = ({
  businessEvents,
  outboxEvents,
  inboxWebhooks,
  onRefresh,
  onFilterByCorrelationId
}) => {
  const [subSection, setSubSection] = useState<'business' | 'outbox' | 'inbox'>('business');
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectItem, setInspectItem] = useState<{ title: string; payload: any; metadata?: any } | null>(null);

  const getConsumerStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">✓ Concluído</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-semibold">⚡ Processando</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold">⏳ Pendente</span>;
      case 'FAILED':
        return <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold">✕ Falhou</span>;
      default:
        return <span className="text-[11px] text-slate-400">{status}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PROCESSED':
      case 'COMPLETED':
        return <Badge variant="emerald" size="sm">Processado</Badge>;
      case 'PENDING':
      case 'RECEIVED':
        return <Badge variant="amber" size="sm">Na Fila</Badge>;
      case 'PROCESSING':
        return <Badge variant="cyan" size="sm">Processando</Badge>;
      case 'FAILED':
        return <Badge variant="rose" size="sm">Falha</Badge>;
      default:
        return <Badge variant="slate" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="h-6 w-6 text-purple-400" />
            Barramento de Eventos, Outbox & Webhooks
          </h2>
          <p className="text-sm text-slate-400">
            Acompanhe o tráfego do Event Bus, a garantia transacional do Outbox Pattern e a idempotência do Inbox de Webhooks.
          </p>
        </div>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="border-slate-700 bg-slate-800 text-slate-200"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Atualizar Fluxo
          </Button>
        )}
      </div>

      {/* Sub-navigation Segmented Control */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setSubSection('business')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            subSection === 'business'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Radio className="h-4 w-4" />
          Eventos de Negócio ({businessEvents.length})
        </button>

        <button
          type="button"
          onClick={() => setSubSection('outbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            subSection === 'outbox'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Send className="h-4 w-4" />
          Outbox Transacional ({outboxEvents.length})
        </button>

        <button
          type="button"
          onClick={() => setSubSection('inbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            subSection === 'inbox'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Inbox className="h-4 w-4" />
          Inbox de Webhooks ({inboxWebhooks.length})
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filtrar por tipo de evento, serviço ou correlationId..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Section 1: Business Events Stream */}
      {subSection === 'business' && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Data / Hora</th>
                  <th className="px-4 py-3">Tipo do Evento</th>
                  <th className="px-4 py-3">Correlation ID</th>
                  <th className="px-4 py-3">Serviço Emissor</th>
                  <th className="px-4 py-3">Consumidores & Status</th>
                  <th className="px-4 py-3 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {businessEvents
                  .filter(e =>
                    !searchTerm ||
                    e.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    e.sourceService.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    e.correlationId.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(evt => (
                    <tr key={evt.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400 font-mono">
                        {formatDateTime(evt.createdAt)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-white font-mono text-xs">
                          {evt.eventType}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onFilterByCorrelationId && onFilterByCorrelationId(evt.correlationId)}
                          className="font-mono text-xs text-cyan-400 hover:underline"
                        >
                          {evt.correlationId}
                        </button>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300 font-mono">
                          {evt.sourceService}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {evt.consumers && evt.consumers.length > 0 ? (
                            evt.consumers.map(c => (
                              <div
                                key={c.service}
                                className="flex items-center gap-1.5 rounded bg-slate-950/80 px-2 py-1 text-xs border border-slate-800"
                              >
                                <span className="text-slate-300 font-medium">{c.service}:</span>
                                {getConsumerStatusBadge(c.status)}
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">Sem consumidores registrados</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectItem({ title: evt.eventType, payload: evt.payload })}
                          className="h-7 text-xs border-slate-700 bg-slate-800 text-slate-300"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Inspecionar
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 2: Outbox Pattern Table */}
      {subSection === 'outbox' && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Criado Em</th>
                  <th className="px-4 py-3">Tipo do Evento</th>
                  <th className="px-4 py-3">Correlation ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tentativas</th>
                  <th className="px-4 py-3">Processado Em</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {outboxEvents
                  .filter(e =>
                    !searchTerm ||
                    e.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (e.correlationId && e.correlationId.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map(evt => (
                    <tr key={evt.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400 font-mono">
                        {formatDateTime(evt.createdAt)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-white">
                        {evt.eventType}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-cyan-400">
                        {evt.correlationId || '-'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(evt.status)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-300">
                        {evt.retryCount} retry
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400 font-mono">
                        {evt.processedAt ? formatDateTime(evt.processedAt) : '-'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectItem({ title: `Outbox: ${evt.eventType}`, payload: evt.payload })}
                          className="h-7 text-xs border-slate-700 bg-slate-800 text-slate-300"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Payload
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 3: Inbox Webhooks Table */}
      {subSection === 'inbox' && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Recebido Em</th>
                  <th className="px-4 py-3">Origem Externa</th>
                  <th className="px-4 py-3">ID Evento Externo</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Assinatura Válida</th>
                  <th className="px-4 py-3">Idempotência</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inboxWebhooks
                  .filter(e =>
                    !searchTerm ||
                    e.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    e.eventType.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(wh => (
                    <tr key={wh.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400 font-mono">
                        {formatDateTime(wh.createdAt)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                          {wh.source}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-300">
                        {wh.externalEventId}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-white">
                        {wh.eventType}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {wh.signatureValid ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            HMAC Válida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
                            Inválida
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {wh.isIdempotent ? (
                          <span className="inline-flex items-center gap-1 text-xs text-cyan-400">
                            Única (Novo)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                            Duplicada (Ignorada)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(wh.status)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectItem({ title: `Webhook ${wh.source}`, payload: wh.payload })}
                          className="h-7 text-xs border-slate-700 bg-slate-800 text-slate-300"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Payload
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payload Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Radio className="h-5 w-5 text-purple-400" />
                Payload do Evento: {inspectItem.title}
              </h3>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-purple-300 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(inspectItem.payload, null, 2)}
            </pre>

            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectItem(null)}
                className="border-slate-700 text-slate-300"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
