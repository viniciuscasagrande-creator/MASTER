import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { SessionConflictDTO } from '@shared/types/index';

interface SessionConflictBannerProps {
  conflictData: SessionConflictDTO | null;
  onDismiss?: () => void;
}

export const SessionConflictBanner: React.FC<SessionConflictBannerProps> = ({
  conflictData,
  onDismiss
}) => {
  if (!conflictData || !conflictData.hasConflicts || conflictData.conflicts.length === 0) {
    return null;
  }

  const hasBlocking = conflictData.conflicts.some((c) => c.severity === 'BLOCKING');

  return (
    <div
      className={`rounded-2xl border p-4 transition-all animate-fadeIn ${
        hasBlocking
          ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
          : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {hasBlocking ? (
            <AlertOctagon className="h-5 w-5 text-rose-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          )}
        </div>

        <div className="flex-1 space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <span>
              {hasBlocking
                ? 'Conflitos Bloqueantes Detectados na Agenda / Local'
                : 'Alertas de Sobreposição Operacional'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/30">
              {conflictData.conflicts.length} alerta(s)
            </span>
          </div>

          <ul className="space-y-1 text-xs list-disc list-inside mt-1.5 opacity-90">
            {conflictData.conflicts.map((c, i) => (
              <li key={i}>
                <strong className="text-white">{c.message}</strong>
                {c.conflictingSessionName && (
                  <span className="text-[11px] ml-1 opacity-75">
                    (Sessão conflitante: {c.conflictingSessionName})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs opacity-60 hover:opacity-100 p-1 rounded hover:bg-white/10"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
