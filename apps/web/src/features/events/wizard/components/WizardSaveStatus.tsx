import React from 'react';
import { CheckCircle2, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { SaveStatus } from '../hooks/useEventWizard';

interface WizardSaveStatusProps {
  status: SaveStatus;
  version: number;
  publicCode: string;
  errorMessage?: string | null;
  onReloadConflict?: () => void;
  onRetrySave?: () => void;
}

export const WizardSaveStatus: React.FC<WizardSaveStatusProps> = ({
  status,
  version,
  publicCode,
  errorMessage,
  onReloadConflict,
  onRetrySave
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Immutable Public Code Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono text-xs text-slate-300 font-semibold shadow-inner">
        <span className="text-slate-500 font-normal">CÓDIGO:</span>
        <span className="text-orange-400">{publicCode}</span>
      </div>

      {/* Version Tag */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/40 border border-slate-700/40 text-[11px] font-mono text-slate-400">
        <span>v{version}</span>
      </div>

      {/* Dynamic Save Indicator */}
      <div className="flex items-center gap-2">
        {status === 'saved' && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Todas as alterações salvas</span>
          </div>
        )}

        {status === 'saving' && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Salvando alterações...</span>
          </div>
        )}

        {status === 'conflict' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/30">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Conflito de versão (409)</span>
            </div>
            {onReloadConflict && (
              <button
                type="button"
                onClick={onReloadConflict}
                className="flex items-center gap-1 text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-950/60 hover:bg-rose-900/60 px-2.5 py-1 rounded-lg border border-rose-500/50 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                Recarregar alterações
              </button>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2">
            <div
              title={errorMessage || undefined}
              className="flex items-center gap-1.5 text-xs text-rose-400 font-medium bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/30"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="max-w-xs truncate">{errorMessage || 'Erro ao salvar rascunho'}</span>
            </div>
            {onRetrySave && (
              <button
                type="button"
                onClick={onRetrySave}
                className="text-xs font-semibold text-orange-400 hover:text-orange-300 underline cursor-pointer"
              >
                Tentar novamente
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
