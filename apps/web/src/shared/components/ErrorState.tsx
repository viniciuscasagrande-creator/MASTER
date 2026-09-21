import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  errorCode?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Ocorreu um erro ao carregar esta seção',
  message = 'Não foi possível completar a requisição. Verifique sua conexão ou tente novamente.',
  errorCode,
  onRetry,
  className
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center sm:text-left sm:flex sm:items-start sm:gap-4 shadow-xs',
        className
      )}
    >
      <div className="mx-auto sm:mx-0 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 border border-rose-200 mb-3 sm:mb-0">
        <AlertTriangle className="h-5 w-5" />
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {errorCode && (
            <span className="font-mono text-[10px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
              {errorCode}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-600">{message}</p>

        {onRetry && (
          <div className="mt-4">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar Novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
