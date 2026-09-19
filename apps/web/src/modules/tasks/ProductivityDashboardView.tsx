import React from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PieChart,
  BarChart3,
  Layers,
  Activity
} from 'lucide-react';
import { StatCard } from '../../shared/components/StatCard';
import { TaskSummaryData } from './tasks.types';

interface ProductivityDashboardViewProps {
  summary: TaskSummaryData | null;
  isLoading: boolean;
}

export const ProductivityDashboardView: React.FC<ProductivityDashboardViewProps> = ({
  summary,
  isLoading
}) => {
  if (isLoading || !summary) {
    return <div className="p-12 text-center text-slate-400">Carregando métricas de produtividade...</div>;
  }

  const completed = summary.byStatus?.COMPLETED || 0;
  const inProgress = summary.byStatus?.IN_PROGRESS || 0;
  const waiting = summary.byStatus?.WAITING || 0;
  const open = summary.byStatus?.OPEN || 0;

  const totalClosed = completed + (summary.byStatus?.CANCELLED || 0);
  const slaAdherenceRate = summary.total > 0 ? Math.round(((summary.total - summary.overdue) / summary.total) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Tarefas"
          value={summary.total.toString()}
          icon={<Layers className="h-5 w-5 text-amber-400" />}
          subtitle="Registradas no ecossistema"
        />
        <StatCard
          title="Taxa de Cumprimento SLA"
          value={`${slaAdherenceRate}%`}
          icon={<Clock className="h-5 w-5 text-emerald-400" />}
          subtitle={`${summary.overdue} tarefas em estouro de prazo`}
        />
        <StatCard
          title="Concluídas Hoje"
          value={summary.completedToday.toString()}
          icon={<CheckCircle2 className="h-5 w-5 text-blue-400" />}
          subtitle="Finalizadas nas últimas 24h"
        />
        <StatCard
          title="Atenção Imediata"
          value={summary.urgent.toString()}
          icon={<AlertTriangle className="h-5 w-5 text-rose-400" />}
          subtitle="Alta ou Crítica não concluídas"
        />
      </div>

      {/* Breakdown Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By Module */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="h-4 w-4 text-amber-400" /> Tarefas por Módulo
            </h3>
          </div>

          <div className="space-y-3">
            {Object.entries(summary.byModule || {}).map(([mod, count]) => {
              const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
              return (
                <div key={mod} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{mod}</span>
                    <span className="text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Priority */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-rose-400" /> Tarefas por Prioridade
            </h3>
          </div>

          <div className="space-y-3">
            {[
              { key: 'CRITICAL', label: 'Crítica', color: 'bg-rose-500' },
              { key: 'HIGH', label: 'Alta', color: 'bg-orange-500' },
              { key: 'NORMAL', label: 'Normal', color: 'bg-blue-500' },
              { key: 'LOW', label: 'Baixa', color: 'bg-slate-500' }
            ].map(({ key, label, color }) => {
              const count = summary.byPriority?.[key] || 0;
              const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{label}</span>
                    <span className="text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Status */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" /> Status Operacional
            </h3>
          </div>

          <div className="space-y-3">
            {[
              { key: 'IN_PROGRESS', label: 'Em Andamento', color: 'bg-amber-400' },
              { key: 'OPEN', label: 'Abertas / Não Atribuídas', color: 'bg-blue-400' },
              { key: 'WAITING', label: 'Em Espera / Pausadas', color: 'bg-orange-400' },
              { key: 'COMPLETED', label: 'Concluídas', color: 'bg-emerald-400' }
            ].map(({ key, label, color }) => {
              const count = summary.byStatus?.[key] || 0;
              const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{label}</span>
                    <span className="text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
