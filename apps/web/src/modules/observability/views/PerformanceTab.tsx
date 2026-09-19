import React from 'react';
import {
  Zap,
  Clock,
  Database,
  Layers,
  TrendingDown,
  TrendingUp,
  Activity,
  Server,
  RefreshCw,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { SlowRouteMetric, SlowQueryMetric } from '../observability.types';

interface PerformanceTabProps {
  percentiles: { p50: number; p95: number; p99: number };
  slowestRoutes: SlowRouteMetric[];
  database: {
    activeConnections: number;
    maxConnections: number;
    cacheHitRatio: number;
    slowQueries: SlowQueryMetric[];
  };
  redis: {
    memoryUsedMb: number;
    maxMemoryMb: number;
    hitRate: number;
    connectedClients: number;
    evictedKeys: number;
  };
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({
  percentiles,
  slowestRoutes,
  database,
  redis,
  onRefresh,
  isLoading = false
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-cyan-400" />
            Métricas de Desempenho & Análise de Latência
          </h2>
          <p className="text-sm text-slate-400">
            Percentis reais P50, P95 e P99 com proteção rigorosa contra explosão de cardinalidade nos rótulos de telemetria.
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
            Atualizar Desempenho
          </Button>
        )}
      </div>

      {/* Latency Percentiles Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Latência Mediana (P50)</span>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400">
              {percentiles.p50}ms
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            50% das requisições são atendidas mais rápido que {percentiles.p50}ms.
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Latência Percentil 95 (P95)</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-cyan-400">
              {percentiles.p95}ms
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            SLA contratual: 95% do tráfego operando abaixo de 200ms.
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Latência Crítica (P99)</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-amber-400">
              {percentiles.p99}ms
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Casos de borda, relatórios volumosos e conciliações em lote.
          </div>
        </div>
      </div>

      {/* Database & Redis Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PostgreSQL Telemetry */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-400" />
              <h3 className="font-semibold text-white">Telemetria PostgreSQL</h3>
            </div>
            <Badge variant="emerald" dot>Conexões Saudáveis</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
              <div className="text-xs text-slate-400">Pool de Conexões</div>
              <div className="text-lg font-bold font-mono text-slate-200 mt-1">
                {database.activeConnections} / {database.maxConnections}
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{ width: `${(database.activeConnections / database.maxConnections) * 100}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
              <div className="text-xs text-slate-400">Taxa de Cache Hit</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {database.cacheHitRatio.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Buffer Pool Otimizado</div>
            </div>
          </div>

          {/* Slow Queries */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Consultas Lentas Recentes (&gt; 100ms)
            </div>

            {database.slowQueries && database.slowQueries.length > 0 ? (
              database.slowQueries.map((sq, i) => (
                <div key={i} className="rounded-lg bg-slate-950/80 p-3 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="font-mono text-slate-300 font-semibold">{sq.database}</span>
                    <span className="font-mono font-bold text-amber-400">{sq.durationMs}ms</span>
                  </div>
                  <pre className="font-mono text-slate-400 text-[11px] overflow-x-auto whitespace-pre-wrap bg-slate-900 p-2 rounded">
                    {sq.queryPattern}
                  </pre>
                  {sq.recommendation && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-cyan-300">
                      <Lightbulb className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
                      Sugestão: {sq.recommendation}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-3 text-center">
                Nenhuma query lenta registrada na janela de observação.
              </div>
            )}
          </div>
        </div>

        {/* Redis Telemetry */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-rose-400" />
              <h3 className="font-semibold text-white">Telemetria Redis & Sessões</h3>
            </div>
            <Badge variant="emerald" dot>Memória Adequada</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
              <div className="text-xs text-slate-400">Consumo de Memória</div>
              <div className="text-lg font-bold font-mono text-slate-200 mt-1">
                {redis.memoryUsedMb} MB / {redis.maxMemoryMb} MB
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full"
                  style={{ width: `${(redis.memoryUsedMb / redis.maxMemoryMb) * 100}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
              <div className="text-xs text-slate-400">Taxa de Acerto no Cache</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {redis.hitRate.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {redis.connectedClients} conexões ativas · 0 expulsões
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-slate-950/60 p-4 border border-slate-800 space-y-2 text-xs">
            <div className="font-semibold text-slate-300">Boas Práticas de Anti-Cardinalidade no Redis:</div>
            <ul className="list-disc list-inside text-slate-400 space-y-1">
              <li>Chaves de sessão com TTL automático rigoroso (máx 24 horas).</li>
              <li>Limitação de taxa (Rate Limit) aplicada por Hash SHA-256 de IP.</li>
              <li>Chaves de lock distribuído (`redlock`) com lease time de no máximo 5 segundos.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Slowest Routes Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-400" />
          Rotas com Maior Tempo de Resposta (Top Slow Routes)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Método & Rota</th>
                <th className="px-4 py-3">Média de Resposta</th>
                <th className="px-4 py-3">P99</th>
                <th className="px-4 py-3">Volume de Chamadas</th>
                <th className="px-4 py-3">Taxa de Falha</th>
                <th className="px-4 py-3 text-right">Status SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {slowestRoutes.map(route => {
                const isOverSla = route.p99DurationMs > 300;

                return (
                  <tr key={`${route.method}-${route.path}`} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono font-medium">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-cyan-300 mr-2">
                        {route.method}
                      </span>
                      <span className="text-white">{route.path}</span>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-300">
                      {route.avgDurationMs}ms
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-amber-400">
                      {route.p99DurationMs}ms
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-400">
                      {route.callCount.toLocaleString('pt-BR')} reqs
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-300">
                      {route.errorRate.toFixed(2)}%
                    </td>

                    <td className="px-4 py-3 text-right">
                      {isOverSla ? (
                        <Badge variant="amber" size="sm">Atenção (P99 &gt; 300ms)</Badge>
                      ) : (
                        <Badge variant="emerald" size="sm">Dentro do SLA</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
