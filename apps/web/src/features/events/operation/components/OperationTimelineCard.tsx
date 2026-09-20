import React from 'react';
import {
  Activity,
  Terminal,
  AlertTriangle,
  Radio,
  DoorOpen,
  Info,
  Clock
} from 'lucide-react';
import { OperationTimelineEventDTO } from '@shared/types/index';

interface OperationTimelineCardProps {
  timeline: OperationTimelineEventDTO[];
}

export const OperationTimelineCard: React.FC<OperationTimelineCardProps> = ({ timeline }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'COMMAND':
        return <Terminal className="w-3.5 h-3.5 text-emerald-400" />;
      case 'INCIDENT':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case 'BROADCAST':
        return <Radio className="w-3.5 h-3.5 text-blue-400" />;
      case 'ACCESS':
        return <DoorOpen className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">Linha do Tempo Operacional</h2>
        </div>
        <span className="text-xs text-slate-400">
          {timeline.length} eventos recentes
        </span>
      </div>

      {timeline.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          Nenhum evento registrado até o momento.
        </div>
      ) : (
        <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {timeline.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-slate-800/40 border border-slate-800/80 flex items-start gap-3 hover:border-slate-700 transition"
            >
              <div className="p-1.5 rounded-md bg-slate-800 mt-0.5">
                {getCategoryIcon(item.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white truncate">
                    {item.title}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-0.5 break-words">
                  {item.description}
                </p>

                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                  <span className="font-mono">#{item.sequence}</span>
                  {item.actorName && (
                    <>
                      <span>•</span>
                      <span>Por: <strong className="text-slate-400">{item.actorName}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
