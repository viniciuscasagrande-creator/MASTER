import React from 'react';
import { Target, Plus, TrendingUp, Calendar, Trash2, CheckCircle2 } from 'lucide-react';
import { AnalyticsGoal } from '@shared/types/index';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';

interface GoalsTabProps {
  goals: AnalyticsGoal[];
  onOpenCreateGoal: () => void;
  onUpdateGoalProgress: (id: string, currentValue: number, projectionValue?: number) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({
  goals,
  onOpenCreateGoal,
  onUpdateGoalProgress,
  onDeleteGoal
}) => {
  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-white">Metas Operacionais e Comerciais (Realizado x Meta)</h3>
          <p className="text-xs text-slate-400">
            Acompanhe o atingimento de metas com projeções em tempo real
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCreateGoal}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4" />
          Cadastrar Nova Meta
        </Button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 text-center">
          <Target className="h-10 w-10 text-slate-600" />
          <h3 className="mt-3 text-sm font-semibold text-slate-300">Nenhuma meta cadastrada</h3>
          <p className="mt-1 text-xs text-slate-500">
            Defina metas de faturamento, vendas de ingressos ou ROAS para acompanhar o desempenho.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {goals.map((goal) => {
            const isCompleted = goal.progressPercent >= 100;
            const isCurrency = goal.unit === 'BRL';

            const formatVal = (val: number) => {
              if (isCurrency) {
                return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
              }
              return val.toLocaleString('pt-BR');
            };

            return (
              <div
                key={goal.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg transition hover:border-slate-700"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                          {goal.period}
                        </span>
                        <Badge variant={isCompleted ? 'success' : 'primary'} size="sm">
                          {isCompleted ? 'Atingida' : 'Em Andamento'}
                        </Badge>
                      </div>
                      <h3 className="mt-2 text-base font-bold text-white">{goal.name}</h3>
                    </div>

                    <span className="font-mono text-2xl font-black text-orange-400">
                      {goal.progressPercent.toFixed(1)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-2">
                    <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : goal.progressPercent >= 75
                            ? 'bg-gradient-to-r from-orange-500 to-emerald-400'
                            : 'bg-gradient-to-r from-orange-500 to-amber-400'
                        }`}
                        style={{ width: `${Math.min(100, goal.progressPercent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Realizado: <strong className="text-white">{formatVal(goal.currentValue)}</strong></span>
                      <span>Meta: <strong className="text-slate-200">{formatVal(goal.targetValue)}</strong></span>
                    </div>
                  </div>

                  {goal.projectionValue && (
                    <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950 p-2.5 text-xs text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                        Projeção de Fechamento:
                      </span>
                      <span className="font-mono font-bold text-cyan-400">
                        {formatVal(goal.projectionValue)} ({(
                          (goal.projectionValue / goal.targetValue) *
                          100
                        ).toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                  <span className="text-[10px] font-mono text-slate-500">{goal.metricCode}</span>

                  <button
                    onClick={() => {
                      if (confirm(`Deseja excluir a meta "${goal.name}"?`)) {
                        onDeleteGoal(goal.id);
                      }
                    }}
                    className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 transition"
                    title="Excluir meta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
