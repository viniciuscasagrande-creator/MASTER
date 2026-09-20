import React from 'react';
import { JobProgressData } from '../jobs.types';

interface JobProgressProps {
  progress: number;
  progressData?: JobProgressData;
  showStep?: boolean;
}

export const JobProgress: React.FC<JobProgressProps> = ({
  progress,
  progressData,
  showStep = true
}) => {
  const percentage = progressData?.percentage !== undefined ? progressData.percentage : progress;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-300">
          {progressData?.currentStep || (percentage === 100 ? 'Processamento concluído' : 'Processando...')}
        </span>
        <span className="font-bold text-orange-400">{percentage}%</span>
      </div>

      {/* Progress Bar Container */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700/50">
        <div
          className={`h-full transition-all duration-300 ${
            percentage === 100
              ? 'bg-emerald-500'
              : progressData?.failedItems && progressData.failedItems > 0
              ? 'bg-amber-500'
              : 'bg-orange-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>

      {progressData && progressData.totalItems > 0 && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span>
            {progressData.processedItems.toLocaleString('pt-BR')} / {progressData.totalItems.toLocaleString('pt-BR')} itens
          </span>
          <div className="flex items-center gap-2">
            {progressData.successItems !== undefined && (
              <span className="text-emerald-400">
                ✓ {progressData.successItems.toLocaleString('pt-BR')}
              </span>
            )}
            {progressData.failedItems !== undefined && progressData.failedItems > 0 && (
              <span className="text-rose-400">
                ✖ {progressData.failedItems.toLocaleString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
