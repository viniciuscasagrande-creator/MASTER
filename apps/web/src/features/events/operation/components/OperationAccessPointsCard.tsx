import React from 'react';
import {
  DoorOpen,
  DoorClosed,
  PauseCircle,
  Play,
  CheckCircle,
  XCircle,
  Layers
} from 'lucide-react';
import { SessionAccessPointDTO } from '@shared/types/index';

interface OperationAccessPointsCardProps {
  accessPoints: SessionAccessPointDTO[];
  onToggleStatus: (accessPointId: string, targetStatus: 'OPEN' | 'CLOSED' | 'PAUSED') => Promise<void>;
  canOperate: boolean;
}

export const OperationAccessPointsCard: React.FC<OperationAccessPointsCardProps> = ({
  accessPoints,
  onToggleStatus,
  canOperate
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <DoorOpen className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-white">Portões e Pontos de Acesso</h2>
        </div>
        <span className="text-xs text-slate-400">
          {accessPoints.filter(p => p.status === 'OPEN').length} de {accessPoints.length} portões abertos
        </span>
      </div>

      {accessPoints.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          Nenhum ponto de acesso configurado para esta sessão.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {accessPoints.map((ap) => {
            const isOpen = ap.status === 'OPEN';
            const isPaused = ap.status === 'PAUSED';
            const isClosed = ap.status === 'CLOSED';

            return (
              <div
                key={ap.id}
                className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                  isOpen
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : isPaused
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-slate-800/40 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {isOpen ? (
                          <DoorOpen className="w-4 h-4 text-emerald-400" />
                        ) : isPaused ? (
                          <PauseCircle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <DoorClosed className="w-4 h-4 text-slate-400" />
                        )}
                        <h4 className="text-sm font-semibold text-white">{ap.name}</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Tipo: <span className="text-slate-300 font-medium">{ap.type}</span>
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          isOpen
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isPaused
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isOpen ? 'ABERTO' : isPaused ? 'PAUSADO' : 'FECHADO'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        {ap.executionMode === 'INTEGRATION' ? 'INTEGRAÇÃO' : 'LÓGICO'}
                      </span>
                    </div>
                  </div>

                  {/* Flow counters */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{ap.validatedCount.toLocaleString('pt-BR')} válidos</span>
                    </div>
                    {ap.rejectedCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                        <span>{ap.rejectedCount.toLocaleString('pt-BR')} rejeitados</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {canOperate && (
                  <div className="flex items-center gap-2 mt-4">
                    {!isOpen && (
                      <button
                        onClick={() => onToggleStatus(ap.id, 'OPEN')}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center justify-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Abrir</span>
                      </button>
                    )}
                    {isOpen && (
                      <button
                        onClick={() => onToggleStatus(ap.id, 'PAUSED')}
                        className="flex-1 py-1.5 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-medium transition flex items-center justify-center gap-1"
                      >
                        <PauseCircle className="w-3 h-3" />
                        <span>Pausar</span>
                      </button>
                    )}
                    {!isClosed && (
                      <button
                        onClick={() => onToggleStatus(ap.id, 'CLOSED')}
                        className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center justify-center gap-1"
                      >
                        <DoorClosed className="w-3 h-3" />
                        <span>Fechar</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
