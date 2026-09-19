import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Zap,
  Server,
  Database,
  Layers,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { ObservabilityOverviewStats, SystemAlertRecord } from '../observability.types';

interface OverviewTabProps {
  stats: ObservabilityOverviewStats;
  alerts: SystemAlertRecord[];
  onNavigateTab: (tab: string, filter?: string) => void;
  onResolveAlert: (alertId: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  alerts,
  onNavigateTab,
  onResolveAlert,
  onRefresh,
  isLoading
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
      case 'NORMAL':
        return <Badge variant="emerald" dot>Operacional</Badge>;
      case 'DEGRADED':
      case 'WARNING':
        return <Badge variant="amber" dot>Degradado</Badge>;
      case 'DOWN':
      case 'CRITICAL':
        return <Badge variant="rose" dot>Falha Crítica</Badge>;
      default:
        return <Badge variant="slate">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-900/40 bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-slate-900/80 p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Núcleo Operacional Estável</h2>
                <Badge variant="emerald" dot>99.98% Uptime</Badge>
              </div>
              <p className="text-sm text-slate-300 mt-0.5">
                Todos os serviços críticos de bilheteria, pagamentos e conciliação estão operando dentro dos parâmetros de SLA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              isLoading={isLoading}
              className="border-slate-700 bg-slate-800/80 text-slate-200"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Atualizar Métricas
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateTab('traces')}
            >
              Rastrear Operação
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 6 Key Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Taxa de Sucesso (15m)"
          value={`${stats.successRate.toFixed(2)}%`}
          subtitle={`${stats.requestsTotal15m.toLocaleString('pt-BR')} reqs`}
          icon={<Zap className="h-4 w-4 text-emerald-400" />}
          badge="15 min"
          badgeVariant="emerald"
        />

        <StatCard
          title="Latência P95"
          value={`${stats.latencyP95}ms`}
          subtitle={`P50: ${stats.latencyP50}ms · P99: ${stats.latencyP99}ms`}
          icon={<Clock className="h-4 w-4 text-cyan-400" />}
          badge="SLA < 200ms"
          badgeVariant="cyan"
        />

        <StatCard
          title="Taxa de Erros"
          value={`${stats.errorRate.toFixed(2)}%`}
          subtitle={`${stats.unresolvedErrors} ocorrências agrupadas`}
          icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
          badge={stats.unresolvedErrors > 0 ? `${stats.unresolvedErrors} pendentes` : 'Zero'}
          badgeVariant={stats.unresolvedErrors > 0 ? 'amber' : 'emerald'}
        />

        <StatCard
          title="Filas & Workers"
          value={`${stats.pendingJobs} pend`}
          subtitle={`${stats.failedJobs} falhas no ciclo`}
          icon={<Layers className="h-4 w-4 text-purple-400" />}
          badge="6 workers"
          badgeVariant="purple"
        />

        <StatCard
          title="Alertas Ativos"
          value={stats.activeAlerts}
          subtitle={stats.activeAlerts === 0 ? 'Sem anomalias' : 'Requer atenção'}
          icon={<AlertOctagon className="h-4 w-4 text-rose-400" />}
          badge={stats.activeAlerts > 0 ? 'Atenção' : 'Normal'}
          badgeVariant={stats.activeAlerts > 0 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Auditoria de Negócio"
          value="100%"
          subtitle="Imutável com Diff"
          icon={<ShieldCheck className="h-4 w-4 text-orange-400" />}
          badge="LGPD / Hash"
          badgeVariant="orange"
        />
      </div>

      {/* Active Alerts Banner if any */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h3 className="font-semibold text-white">Alertas Operacionais em Andamento</h3>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
                {alerts.length}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('health')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              Ver todos os alertas →
            </button>
          </div>

          <div className="space-y-2">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-amber-800/40 bg-slate-900/80 p-3"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-2 w-2 rounded-full bg-amber-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-200">{alert.title}</span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                        {alert.component}
                      </span>
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400 font-medium">
                        {alert.occurrencesCount} deduplicações
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Regra: {alert.thresholdRule || 'Limite estatístico ultrapassado'} · Disparado em{' '}
                      {new Date(alert.lastTriggeredAt).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-amber-800/60 text-amber-300 hover:bg-amber-950/40"
                    onClick={() => onResolveAlert(alert.id)}
                  >
                    Reconhecer / Resolver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Component Health & Module Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Infrastructure Components */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-cyan-400" />
              <h3 className="font-semibold text-white">Componentes de Infraestrutura</h3>
            </div>
            <button
              onClick={() => onNavigateTab('health')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Diagnóstico Completo →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.componentHealth.map(c => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800/80 bg-slate-950/50 hover:border-slate-700/80 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-slate-200">{c.component}</div>
                  <div className="text-xs text-slate-400">
                    Latência: <span className="font-mono text-slate-300">{c.latencyMs ?? 0}ms</span>
                  </div>
                </div>
                <div>{getStatusBadge(c.status)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Business Modules Health */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400" />
              <h3 className="font-semibold text-white">Módulos de Negócio do Disk Interno</h3>
            </div>
            <button
              onClick={() => onNavigateTab('performance')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Métricas de Desempenho →
            </button>
          </div>

          <div className="space-y-2.5">
            {stats.modulesHealth.map(m => (
              <div
                key={m.module}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/50"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-slate-200">{m.name}</div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-400">
                    P95: <span className="font-mono text-slate-300">{m.latencyP95}ms</span>
                  </span>
                  <span className="text-slate-400">
                    Falhas: <span className="font-mono text-slate-300">{m.errorRate}%</span>
                  </span>
                  <span className="text-slate-400">
                    Fila: <span className="font-mono text-slate-300">{m.activeJobs}</span>
                  </span>
                  {getStatusBadge(m.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigateTab('audit')}
          className="group flex flex-col items-start p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-orange-500/50 hover:bg-slate-900/80 transition-all text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 mb-2 group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="font-semibold text-sm text-white">Auditoria de Negócio</div>
          <div className="text-xs text-slate-400 mt-1">
            Visualizar diff antes x depois, hashes SHA-256 e conformidade LGPD.
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('traces')}
          className="group flex flex-col items-start p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
            <Clock className="h-5 w-5" />
          </div>
          <div className="font-semibold text-sm text-white">Traces & Correlação</div>
          <div className="text-xs text-slate-400 mt-1">
            Consulte por correlationId e entenda o caminho completo da requisição.
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('errors')}
          className="group flex flex-col items-start p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-rose-500/50 hover:bg-slate-900/80 transition-all text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 mb-2 group-hover:scale-110 transition-transform">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="font-semibold text-sm text-white">Catálogo de Falhas</div>
          <div className="text-xs text-slate-400 mt-1">
            Erros agrupados por impressão digital e integrados às tarefas operacionais.
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('integrations')}
          className="group flex flex-col items-start p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-purple-500/50 hover:bg-slate-900/80 transition-all text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 mb-2 group-hover:scale-110 transition-transform">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="font-semibold text-sm text-white">Integrações Externas</div>
          <div className="text-xs text-slate-400 mt-1">
            Disponibilidade dos adquirentes PIX, bancos, Meta Ads e mensageria.
          </div>
        </button>
      </div>
    </div>
  );
};
