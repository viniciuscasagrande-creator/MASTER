import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { EventWizardValidationResult } from '../../types/event.types';

interface WizardProgressCardProps {
  validation: EventWizardValidationResult | null;
  completedStepsCount: number;
  totalSteps?: number;
  readinessScore?: number;
}

export const WizardProgressCard: React.FC<WizardProgressCardProps> = ({
  validation,
  completedStepsCount,
  totalSteps = 8,
  readinessScore = 0
}) => {
  const blockingCount = validation?.blockingIssues ?? 0;
  const warningCount = validation?.warnings ?? 0;
  const isReady = validation?.valid ?? false;

  // Calculate score if not provided
  const score = readinessScore > 0
    ? readinessScore
    : Math.max(10, Math.min(100, Math.round((completedStepsCount / totalSteps) * 80) + (isReady ? 20 : 0) - (blockingCount * 10)));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Prontidão do Rascunho
          </span>
        </div>
        <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
          {score}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isReady
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : score >= 50
                ? 'bg-gradient-to-r from-orange-500 to-amber-400'
                : 'bg-gradient-to-r from-slate-600 to-slate-500'
            }`}
            style={{ width: `${Math.max(5, score)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>{completedStepsCount} de {totalSteps} etapas visitadas</span>
          <span className="font-medium text-slate-300">
            {isReady ? 'Pronto para Publicação' : 'Em Configuração'}
          </span>
        </div>
      </div>

      {/* Issues Breakdown */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2 rounded-xl bg-slate-800/40 p-2.5 border border-slate-800">
          <AlertCircle className={`h-4 w-4 shrink-0 ${blockingCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          <div>
            <div className={`text-xs font-bold ${blockingCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {blockingCount}
            </div>
            <div className="text-[10px] text-slate-500">Bloqueios</div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-800/40 p-2.5 border border-slate-800">
          <AlertTriangle className={`h-4 w-4 shrink-0 ${warningCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          <div>
            <div className={`text-xs font-bold ${warningCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {warningCount}
            </div>
            <div className="text-[10px] text-slate-500">Avisos</div>
          </div>
        </div>
      </div>

      {/* Ready Badge */}
      {isReady ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>Configuração completa! Todas as regras mínimas atendidas.</span>
        </div>
      ) : (
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span>O rascunho é salvo automaticamente a cada alteração.</span>
        </div>
      )}
    </div>
  );
};
