import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  Calendar,
  Layers,
  DollarSign,
  Globe,
  FileText,
  Users,
  AlertCircle
} from 'lucide-react';
import {
  EventReadinessDTO,
  ReadinessStatus,
  ReadinessTarget,
  ReadinessIssueDTO
} from '@shared/types/index';
import {
  fetchEventReadiness,
  triggerReadinessEvaluation
} from '../api/readiness.api';
import { generateTasksFromReadiness } from '../api/tasks.api';
import { Badge } from '../../../shared/components/Badge';

interface EventReadinessPageProps {
  eventId: string;
  eventName?: string;
  onNavigateToTab?: (tabId: string) => void;
}

const TARGET_STEPS: Array<{ key: ReadinessTarget; label: string; desc: string }> = [
  { key: 'REVIEW', label: '1. Revisão Geral', desc: 'Dados e infraestrutura' },
  { key: 'PUBLICATION', label: '2. Publicação', desc: 'Exibição no site e app' },
  { key: 'SALES', label: '3. Abertura de Vendas', desc: 'Lotes e canais ativos' },
  { key: 'OPERATION', label: '4. Operação no Local', desc: 'Alvarás e escalas' },
  { key: 'CLOSURE', label: '5. Encerramento', desc: 'Balanço e conciliação' }
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  INFO: <Sparkles className="h-4 w-4" />,
  VENUE: <Building className="h-4 w-4" />,
  SESSIONS: <Calendar className="h-4 w-4" />,
  CAPACITY: <Layers className="h-4 w-4" />,
  INVENTORY: <Layers className="h-4 w-4" />,
  PRICING: <DollarSign className="h-4 w-4" />,
  CHANNELS: <Globe className="h-4 w-4" />,
  DOCUMENTS: <FileText className="h-4 w-4" />,
  TEAM: <Users className="h-4 w-4" />,
  COMPLIANCE: <ShieldCheck className="h-4 w-4" />
};

export const EventReadinessPage: React.FC<EventReadinessPageProps> = ({
  eventId,
  eventName,
  onNavigateToTab
}) => {
  const [readiness, setReadiness] = useState<EventReadinessDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [syncingTasks, setSyncingTasks] = useState(false);
  const [taskSuccessMessage, setTaskSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEventReadiness(eventId);
      setReadiness(data);
    } catch (err) {
      console.error('Erro ao carregar readiness do evento:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReevaluate = async () => {
    setEvaluating(true);
    try {
      const data = await triggerReadinessEvaluation(eventId);
      setReadiness(data);
    } catch (err: any) {
      alert(err.message || 'Erro ao reavaliar prontidão');
    } finally {
      setEvaluating(false);
    }
  };

  const handleGenerateTasks = async () => {
    if (!readiness) return;
    setSyncingTasks(true);
    setTaskSuccessMessage(null);
    try {
      const res = await generateTasksFromReadiness(eventId, readiness.issues);
      setTaskSuccessMessage(`${res.count} pendência(s) sincronizada(s) com a Central de Tarefas.`);
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar tarefas');
    } finally {
      setSyncingTasks(false);
    }
  };

  if (loading && !readiness) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!readiness) return null;

  const isBlocked = readiness.status === 'BLOCKED';
  const isWarning = readiness.status === 'WARNING';
  const isReady = readiness.status === 'READY';

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Central de Preparação & Readiness Engine</h1>
            <Badge variant="info">Fase 1.2.8</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Auditoria algorítmica sobre todos os modelos de domínio. A prontidão é verificada pelo sistema antes de liberar o evento para publicação ou abertura de vendas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReevaluate}
            disabled={evaluating}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            <span>Reavaliar Prontidão</span>
          </button>
          <button
            onClick={handleGenerateTasks}
            disabled={syncingTasks || readiness.issues.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Gerar Tarefas para Pendências</span>
          </button>
        </div>
      </div>

      {taskSuccessMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{taskSuccessMessage}</span>
        </div>
      )}

      {/* Banner Principal de Score e Prontidão */}
      <div
        className={`rounded-3xl border p-6 flex flex-col md:flex-row items-center justify-between gap-6 ${
          isBlocked
            ? 'border-rose-500/30 bg-rose-500/5'
            : isWarning
            ? 'border-amber-500/30 bg-amber-500/5'
            : 'border-emerald-500/30 bg-emerald-500/5'
        }`}
      >
        <div className="flex items-center gap-5">
          {/* Círculo com Percentual */}
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-slate-800 bg-slate-950 font-bold text-2xl text-white">
            <span
              className={
                readiness.scorePercentage >= 90
                  ? 'text-emerald-400'
                  : readiness.scorePercentage >= 60
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }
            >
              {readiness.scorePercentage}%
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-bold text-white">Índice Geral de Prontidão</span>
              <Badge variant={isBlocked ? 'danger' : isWarning ? 'warning' : 'success'}>
                {isBlocked ? 'Bloqueado por Pendências' : isWarning ? 'Pronto com Advertências' : 'Totalmente Pronto'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              {isBlocked
                ? `Existem ${readiness.summary.criticalCount + readiness.summary.blockingCount} apontamento(s) impeditivo(s). O evento não pode ser publicado até a resolução destas pendências críticas.`
                : isWarning
                ? 'Todos os requisitos bloqueantes foram satisfeitos, mas existem recomendações operacionais que exigem atenção.'
                : 'Todas as 9 dimensões operacionais, comerciais e regulatórias foram homologadas com sucesso!'}
            </p>
          </div>
        </div>

        {/* Resumo Numérico */}
        <div className="flex items-center gap-3 shrink-0 text-center">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 min-w-[75px]">
            <div className="text-lg font-bold text-emerald-400">{readiness.summary.readyCount}</div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Conformes</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 min-w-[75px]">
            <div className="text-lg font-bold text-amber-400">{readiness.summary.warningCount}</div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Avisos</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 min-w-[75px]">
            <div className="text-lg font-bold text-rose-400">
              {readiness.summary.criticalCount + readiness.summary.blockingCount}
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Bloqueantes</div>
          </div>
        </div>
      </div>

      {/* Pipeline de Alvos (Targets) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Etapas do Ciclo de Vida do Evento
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {TARGET_STEPS.map(step => {
            const st = readiness.targets[step.key] || 'PENDING';
            const isReadyStep = st === 'READY';
            const isBlockedStep = st === 'BLOCKED';
            const isWarningStep = st === 'WARNING';

            return (
              <div
                key={step.key}
                className={`rounded-xl border p-3.5 space-y-2 transition-all ${
                  isBlockedStep
                    ? 'border-rose-500/30 bg-rose-500/5'
                    : isWarningStep
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : isReadyStep
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-slate-800 bg-slate-950/40 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{step.label}</span>
                  {isReadyStep ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : isBlockedStep ? (
                    <XCircle className="h-4 w-4 text-rose-400" />
                  ) : isWarningStep ? (
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-slate-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400">{step.desc}</p>
                <div className="text-[10px] font-bold">
                  {isReadyStep ? (
                    <span className="text-emerald-400">Liberado</span>
                  ) : isBlockedStep ? (
                    <span className="text-rose-400">Bloqueado</span>
                  ) : isWarningStep ? (
                    <span className="text-amber-400">Com Alertas</span>
                  ) : (
                    <span className="text-slate-500">Pendente</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dimensões Auditadas */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Conformidade por Dimensão Operacional
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {readiness.categories.map(cat => {
            const icon = CATEGORY_ICONS[cat.category] || <Sparkles className="h-4 w-4" />;
            const isCatBlocked = cat.status === 'BLOCKED';
            const isCatWarning = cat.status === 'WARNING';

            return (
              <div
                key={cat.category}
                className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      isCatBlocked
                        ? 'bg-rose-500/10 text-rose-400'
                        : isCatWarning
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {icon}
                  </div>
                  <span className="text-xs font-semibold text-slate-200 truncate">{cat.label}</span>
                </div>

                <Badge variant={isCatBlocked ? 'danger' : isCatWarning ? 'warning' : 'success'}>
                  {cat.issuesCount > 0 ? `${cat.issuesCount} pend.` : 'Ok'}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de Apontamentos & Ações Diretas */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Apontamentos Auditados ({readiness.issues.length})</h2>
            <p className="text-xs text-slate-400">Ações recomendadas e obrigatórias para desbloqueio do evento</p>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {readiness.issues.map((issue, idx) => {
            const isCrit = issue.severity === 'CRITICAL' || issue.severity === 'BLOCKING';

            return (
              <div
                key={issue.code || idx}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                      isCrit ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {isCrit ? <XCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">{issue.title}</span>
                      <Badge variant={isCrit ? 'danger' : 'warning'}>
                        {isCrit ? 'Bloqueante' : 'Advertência'}
                      </Badge>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {issue.categoryLabel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">{issue.description}</p>
                  </div>
                </div>

                {issue.actionLabel && (
                  <div className="shrink-0 self-end md:self-center">
                    <button
                      onClick={() => {
                        // Navega para a aba contextual correspondente
                        if (onNavigateToTab) {
                          if (issue.category === 'DOCUMENTS') onNavigateToTab('documents');
                          else if (issue.category === 'PRICING') onNavigateToTab('pricing');
                          else if (issue.category === 'CHANNELS') onNavigateToTab('channels');
                          else if (issue.category === 'TEAM') onNavigateToTab('team');
                          else if (issue.category === 'INVENTORY') onNavigateToTab('inventory');
                          else if (issue.category === 'VENUE') onNavigateToTab('venue');
                          else if (issue.category === 'SESSIONS') onNavigateToTab('sessions');
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                    >
                      <span>{issue.actionLabel}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {readiness.issues.length === 0 && (
            <div className="p-12 text-center text-xs text-emerald-400 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <span className="font-bold text-sm">Parabéns! Nenhum apontamento pendente.</span>
              <span className="text-slate-400">O evento atende 100% aos critérios operacionais e está pronto para o público.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
