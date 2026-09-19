import React, { useState } from 'react';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Hash,
  ArrowRight,
  GitBranch,
  Layers,
  HelpCircle,
  CheckSquare,
  ListTodo,
  ExternalLink,
  ChevronRight,
  User,
  Activity,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { OperationTraceRecord, TraceSpanRecord } from '../observability.types';
import { formatDateTime } from '../../../shared/utils/formatters';

interface TracesTabProps {
  traces: OperationTraceRecord[];
  initialCorrelationId?: string;
  onSelectTrace?: (correlationId: string) => void;
  onNavigateToTask?: (taskId: string) => void;
  onNavigateToApproval?: (approvalId: string) => void;
  onRefresh?: () => void;
}

export const TracesTab: React.FC<TracesTabProps> = ({
  traces,
  initialCorrelationId,
  onSelectTrace,
  onNavigateToTask,
  onNavigateToApproval,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState(initialCorrelationId || '');
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(
    traces.length > 0 ? traces[0].id : null
  );

  const filteredTraces = traces.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.correlationId.toLowerCase().includes(q) ||
      t.operationName.toLowerCase().includes(q) ||
      t.rootResourceId?.toLowerCase().includes(q) ||
      t.userName?.toLowerCase().includes(q)
    );
  });

  const selectedTrace = traces.find(t => t.id === selectedTraceId) || filteredTraces[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="emerald" size="sm">Concluído</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="amber" size="sm">Em Andamento</Badge>;
      case 'FAILED':
        return <Badge variant="rose" size="sm">Falhou</Badge>;
      case 'CANCELLED':
        return <Badge variant="slate" size="sm">Cancelado</Badge>;
      default:
        return <Badge variant="slate" size="sm">{status}</Badge>;
    }
  };

  const getSpanStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-rose-400" />;
      default:
        return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="h-6 w-6 text-cyan-400" />
            Rastreabilidade Operacional & Traces Unificados
          </h2>
          <p className="text-sm text-slate-400">
            Acompanhe o ciclo de vida completo de cada operação através do Correlation ID compartilhado entre todos os microsserviços.
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
            Atualizar Traces
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por Correlation ID (ex: COR-20260919-...), nome da operação ou recurso..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Grid: Left Traces List + Right Trace Details & Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Traces List */}
        <div className="lg:col-span-4 space-y-2 max-h-[800px] overflow-y-auto pr-1">
          {filteredTraces.map(trace => {
            const isSelected = selectedTrace?.id === trace.id;

            return (
              <div
                key={trace.id}
                onClick={() => {
                  setSelectedTraceId(trace.id);
                  if (onSelectTrace) onSelectTrace(trace.correlationId);
                }}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  isSelected
                    ? 'border-cyan-500/80 bg-cyan-950/20 shadow-lg shadow-cyan-950/30'
                    : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-sm text-white truncate max-w-[200px]">
                    {trace.operationName}
                  </div>
                  {getStatusBadge(trace.status)}
                </div>

                <div className="mt-2 flex items-center gap-1.5 font-mono text-xs text-cyan-400">
                  <Hash className="h-3 w-3" />
                  <span className="truncate">{trace.correlationId}</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-2">
                  <span>Duração: <strong className="text-slate-200 font-mono">{trace.durationMs ?? 0}ms</strong></span>
                  <span>{new Date(trace.startedAt).toLocaleTimeString('pt-BR')}</span>
                </div>
              </div>
            );
          })}

          {filteredTraces.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-slate-500 text-xs">
              Nenhum trace localizado com o critério informado.
            </div>
          )}
        </div>

        {/* Right: Trace Detail & Waterfall Visualizer */}
        <div className="lg:col-span-8">
          {selectedTrace ? (
            <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
              {/* Trace Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {selectedTrace.operationName}
                    </h3>
                    {getStatusBadge(selectedTrace.status)}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="font-mono text-cyan-400">{selectedTrace.correlationId}</span>
                    <span>·</span>
                    <span>Iniciado em {formatDateTime(selectedTrace.startedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase">Tempo Total</div>
                    <div className="text-lg font-bold font-mono text-cyan-400">
                      {selectedTrace.durationMs ?? 0}ms
                    </div>
                  </div>
                </div>
              </div>

              {/* Context Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block">Ator da Operação:</span>
                  <span className="font-medium text-slate-200">
                    {selectedTrace.userName || 'Sistema / Worker'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Recurso Raiz:</span>
                  <span className="font-mono text-slate-300">
                    {selectedTrace.rootResourceType ? `${selectedTrace.rootResourceType} / ${selectedTrace.rootResourceId}` : 'Geral'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Escopo:</span>
                  <span className="font-medium text-slate-300">
                    {selectedTrace.producerId ? `Produtor ${selectedTrace.producerId}` : 'Global'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Spans Conectados:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {selectedTrace.spans?.length || 0} etapas
                  </span>
                </div>
              </div>

              {/* "Por que isso aconteceu?" — Policy Explanation Card */}
              {selectedTrace.policyExplanation && (
                <div className="rounded-xl border border-purple-900/60 bg-purple-950/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex-shrink-0">
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">Por que esta decisão foi tomada?</span>
                        {selectedTrace.policyKey && (
                          <span className="rounded bg-purple-500/10 px-2 py-0.5 font-mono text-purple-300 border border-purple-500/20">
                            {selectedTrace.policyKey} (v{selectedTrace.policyVersion})
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-slate-300 leading-relaxed">
                        {selectedTrace.policyExplanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Connected Approvals or Tasks Links */}
              {(selectedTrace.approvalRequestId || selectedTrace.taskId) && (
                <div className="flex flex-wrap items-center gap-3">
                  {selectedTrace.approvalRequestId && (
                    <button
                      type="button"
                      onClick={() => onNavigateToApproval && onNavigateToApproval(selectedTrace.approvalRequestId!)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/80 bg-emerald-950/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/40 transition-colors"
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      Solicitação de Aprovação: {selectedTrace.approvalRequestId}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </button>
                  )}

                  {selectedTrace.taskId && (
                    <button
                      type="button"
                      onClick={() => onNavigateToTask && onNavigateToTask(selectedTrace.taskId!)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-800/80 bg-amber-950/20 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-950/40 transition-colors"
                    >
                      <ListTodo className="h-3.5 w-3.5" />
                      Tarefa Operacional Criada: {selectedTrace.taskId}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </button>
                  )}
                </div>
              )}

              {/* Waterfall Spans Timeline */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-cyan-400" />
                  Linha do Tempo de Execução Técnica (Spans em Cascata)
                </h4>

                <div className="relative pl-6 space-y-4 border-l-2 border-slate-800">
                  {selectedTrace.spans && selectedTrace.spans.length > 0 ? (
                    selectedTrace.spans.map((span, idx) => (
                      <div key={span.id} className="relative group">
                        {/* Timeline Node Dot */}
                        <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 border-2 border-cyan-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                        </div>

                        {/* Span Card */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition-colors group-hover:border-slate-700">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {getSpanStatusIcon(span.status)}
                              <span className="font-semibold text-sm text-slate-200">
                                {span.operation}
                              </span>
                              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-slate-700">
                                {span.serviceName}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span>Duração: <strong className="text-slate-200 font-mono">{span.durationMs ?? 0}ms</strong></span>
                              <span>{new Date(span.startedAt).toLocaleTimeString('pt-BR')}</span>
                            </div>
                          </div>

                          {span.errorMessage && (
                            <div className="mt-2 rounded-lg bg-rose-950/30 border border-rose-900/50 p-2 text-xs text-rose-300 font-mono">
                              Falha: {span.errorMessage}
                            </div>
                          )}

                          {span.metadata && Object.keys(span.metadata).length > 0 && (
                            <div className="mt-2 text-[11px] text-slate-400 font-mono bg-slate-900 p-2 rounded">
                              <span className="text-slate-500 block mb-0.5">Metadados:</span>
                              <pre className="text-slate-300 whitespace-pre-wrap">{JSON.stringify(span.metadata, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 py-4">
                      Nenhum span detalhado registrado para esta operação.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-96 items-center justify-center rounded-2xl border border-dashed border-slate-800 text-slate-500 text-sm">
              Selecione uma operação à esquerda para inspecionar os detalhes do trace.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
