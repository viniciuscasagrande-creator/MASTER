import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Hash,
  Eye,
  X,
  ListTodo,
  ExternalLink,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  Layers
} from 'lucide-react';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { ErrorGroupRecord, ErrorOccurrenceRecord } from '../observability.types';
import { formatDateTime } from '../../../shared/utils/formatters';
import { useAuth } from '../../../core/auth/AuthContext';

interface ErrorsTabProps {
  errorGroups: ErrorGroupRecord[];
  onResolveGroup: (groupId: string) => void;
  onNavigateToTask?: (taskId: string) => void;
  onFilterByCorrelationId?: (correlationId: string) => void;
  onRefresh?: () => void;
}

export const ErrorsTab: React.FC<ErrorsTabProps> = ({
  errorGroups,
  onResolveGroup,
  onNavigateToTask,
  onFilterByCorrelationId,
  onRefresh
}) => {
  const { hasPermission, currentUser } = useAuth();
  const canViewStackTrace =
    currentUser.roleSlug === 'admin_geral' ||
    hasPermission('observabilidade.erro.detalhe_tecnico');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [activeGroup, setActiveGroup] = useState<ErrorGroupRecord | null>(null);
  const [copiedTrace, setCopiedTrace] = useState(false);

  const filteredGroups = errorGroups.filter(g => {
    if (selectedSeverity !== 'ALL' && g.severity !== selectedSeverity) return false;
    if (selectedStatus !== 'ALL' && g.status !== selectedStatus) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        g.errorCode.toLowerCase().includes(q) ||
        g.title.toLowerCase().includes(q) ||
        g.service.toLowerCase().includes(q) ||
        g.operation.toLowerCase().includes(q) ||
        g.fingerprint.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="rose" dot>Crítico</Badge>;
      case 'HIGH':
        return <Badge variant="orange" dot>Alto</Badge>;
      case 'MEDIUM':
        return <Badge variant="amber" dot>Médio</Badge>;
      case 'LOW':
        return <Badge variant="slate">Baixo</Badge>;
      default:
        return <Badge variant="slate">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNRESOLVED':
        return <Badge variant="rose" size="sm">Não Resolvido</Badge>;
      case 'INVESTIGATING':
        return <Badge variant="amber" size="sm">Em Investigação</Badge>;
      case 'RESOLVED':
        return <Badge variant="emerald" size="sm">Resolvido</Badge>;
      case 'IGNORED':
        return <Badge variant="slate" size="sm">Ignorado</Badge>;
      default:
        return <Badge variant="slate" size="sm">{status}</Badge>;
    }
  };

  const handleCopyStackTrace = (trace: string) => {
    navigator.clipboard.writeText(trace);
    setCopiedTrace(true);
    setTimeout(() => setCopiedTrace(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-rose-400" />
            Catálogo Inteligente de Falhas & Erros
          </h2>
          <p className="text-sm text-slate-400">
            Erros agrupados por impressão digital única, separando mensagens seguras para o usuário de detalhes técnicos protegidos.
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
            Atualizar Falhas
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por código (ERR-...), serviço, mensagem ou fingerprint..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Severidade:</span>
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
            >
              <option value="ALL">Todas as Severidades</option>
              <option value="CRITICAL">Crítico</option>
              <option value="HIGH">Alto</option>
              <option value="MEDIUM">Médio</option>
              <option value="LOW">Baixo</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
            >
              <option value="ALL">Todos os Status</option>
              <option value="UNRESOLVED">Não Resolvidos</option>
              <option value="INVESTIGATING">Em Investigação</option>
              <option value="RESOLVED">Resolvidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Groups Cards Grid */}
      <div className="space-y-3">
        {filteredGroups.map(group => (
          <div
            key={group.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-all backdrop-blur-sm"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Group Title and Info */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {group.errorCode}
                  </span>
                  <h3 className="font-semibold text-white text-base">{group.title}</h3>
                  {getSeverityBadge(group.severity)}
                  {getStatusBadge(group.status)}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>
                    Serviço: <strong className="text-slate-200">{group.service}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Operação: <code className="text-cyan-400 font-mono">{group.operation}</code>
                  </span>
                  <span>·</span>
                  <span>
                    Visto pela primeira vez: {formatDateTime(group.firstSeenAt)}
                  </span>
                  <span>·</span>
                  <span>
                    Última ocorrência: {formatDateTime(group.lastSeenAt)}
                  </span>
                </div>
              </div>

              {/* Stats Counters & Actions */}
              <div className="flex flex-wrap items-center gap-4 lg:self-center">
                <div className="flex items-center gap-4 border-l border-slate-800 pl-4 text-xs">
                  <div className="text-center">
                    <div className="text-slate-500 text-[10px] uppercase">Ocorrências</div>
                    <div className="text-base font-bold font-mono text-rose-400">
                      {group.occurrencesCount}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-slate-500 text-[10px] uppercase">Eventos Afetados</div>
                    <div className="text-base font-bold font-mono text-slate-200">
                      {group.affectedEventsCount}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-slate-500 text-[10px] uppercase">Usuários</div>
                    <div className="text-base font-bold font-mono text-slate-200">
                      {group.affectedUsersCount}
                    </div>
                  </div>
                </div>

                {/* Related Task Link */}
                {group.relatedTaskId && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTask && onNavigateToTask(group.relatedTaskId!)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-800/80 bg-amber-950/20 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-950/40 transition-colors"
                    title="Ver tarefa operacional vinculada"
                  >
                    <ListTodo className="h-3.5 w-3.5" />
                    Tarefa: {group.relatedTaskId}
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveGroup(group)}
                    className="h-8 text-xs border-slate-700 bg-slate-800 text-slate-200"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Inspecionar Ocorrências
                  </Button>

                  {group.status !== 'RESOLVED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onResolveGroup(group.id)}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Resolver
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center text-slate-500">
            Nenhuma falha ativa registrada com os filtros aplicados.
          </div>
        )}
      </div>

      {/* Occurrences & Technical Inspection Modal */}
      {activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertOctagon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {activeGroup.title}
                    <span className="font-mono text-xs text-rose-400">({activeGroup.errorCode})</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Fingerprint SHA-256: {activeGroup.fingerprint}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveGroup(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Protection Notice */}
            {!canViewStackTrace && (
              <div className="mb-4 rounded-xl border border-amber-900/40 bg-amber-950/20 p-3 flex items-center gap-2 text-xs text-amber-300">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>
                  Os detalhes técnicos profundos e stack traces estão restritos à equipe de engenharia e sustentação para proteger segredos de negócio e segurança.
                </span>
              </div>
            )}

            {/* List of Occurrences */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white">
                Ocorrências Recentes ({activeGroup.occurrences?.length || 0})
              </h4>

              {activeGroup.occurrences && activeGroup.occurrences.length > 0 ? (
                activeGroup.occurrences.map(occ => (
                  <div
                    key={occ.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-400">{formatDateTime(occ.createdAt)}</span>
                        {occ.correlationId && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onFilterByCorrelationId) {
                                onFilterByCorrelationId(occ.correlationId!);
                                setActiveGroup(null);
                              }
                            }}
                            className="text-cyan-400 hover:underline flex items-center gap-0.5"
                          >
                            <Hash className="h-3 w-3" />
                            {occ.correlationId}
                          </button>
                        )}
                      </div>

                      <div className="text-slate-400">
                        Usuário: <span className="text-slate-200">{occ.userId || 'Não autenticado'}</span>
                      </div>
                    </div>

                    {/* User Safe Message */}
                    <div>
                      <div className="text-xs text-slate-500 font-semibold mb-0.5">Mensagem Segura (Exibida ao Usuário):</div>
                      <div className="text-sm text-slate-200 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        {occ.userFriendlyMessage}
                      </div>
                    </div>

                    {/* Technical Stack Trace Protection */}
                    {canViewStackTrace && occ.stackTrace && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-rose-400 font-mono font-semibold">
                            Stack Trace Técnico (Restrito):
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyStackTrace(occ.stackTrace!)}
                            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                          >
                            {copiedTrace ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            {copiedTrace ? 'Copiado!' : 'Copiar Stack Trace'}
                          </button>
                        </div>
                        <pre className="rounded-lg bg-slate-900 border border-slate-800 p-3 font-mono text-[11px] text-rose-300/90 overflow-x-auto whitespace-pre-wrap">
                          {occ.stackTrace}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 text-xs py-6">
                  Nenhuma ocorrência detalhada registrada neste grupo.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveGroup(null)}
                className="border-slate-700 text-slate-300"
              >
                Fechar
              </Button>

              {activeGroup.status !== 'RESOLVED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onResolveGroup(activeGroup.id);
                    setActiveGroup(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Marcar Grupo como Resolvido
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
