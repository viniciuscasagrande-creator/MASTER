import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { StepIssue } from '../../types/event.types';

interface WizardValidationAlertProps {
  issues: StepIssue[];
}

export const WizardValidationAlert: React.FC<WizardValidationAlertProps> = ({ issues }) => {
  if (!issues || issues.length === 0) return null;

  const blockingIssues = issues.filter((i) => i.severity === 'BLOCKING');
  const warnings = issues.filter((i) => i.severity === 'WARNING');

  return (
    <div className="space-y-2 mb-6">
      {blockingIssues.length > 0 && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 space-y-1.5 shadow-lg">
          <div className="flex items-center gap-2 font-bold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Itens obrigatórios pendentes nesta etapa:</span>
          </div>
          <ul className="list-disc list-inside pl-1 space-y-1 text-rose-200/90 text-[11px]">
            {blockingIssues.map((issue, idx) => (
              <li key={idx}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 space-y-1.5 shadow-lg">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Recomendações para boa publicação:</span>
          </div>
          <ul className="list-disc list-inside pl-1 space-y-1 text-amber-200/90 text-[11px]">
            {warnings.map((issue, idx) => (
              <li key={idx}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
