import React from 'react';
import {
  Layers,
  Users,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { OperationAreaDTO } from '@shared/types/index';

interface OperationAreasCardProps {
  areas: OperationAreaDTO[];
}

export const OperationAreasCard: React.FC<OperationAreasCardProps> = ({ areas }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Áreas Operacionais</h2>
        </div>
        <span className="text-xs text-slate-400">
          {areas.length} áreas ativas
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {areas.map((area) => (
          <div
            key={area.id}
            className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                  {area.areaCode}
                </span>
                {area.openIncidentsCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {area.openIncidentsCount} {area.openIncidentsCount === 1 ? 'incidente' : 'incidentes'}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-semibold text-white mt-2">{area.name}</h4>
              {area.description && (
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                  {area.description}
                </p>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {area.staffPresentCount}/{area.staffTotalCount > 0 ? area.staffTotalCount : '—'} presentes
                </span>
              </div>
              {area.leadUserName && (
                <div className="flex items-center gap-1 text-slate-300 text-[11px]" title={`Líder: ${area.leadUserName}`}>
                  <UserCheck className="w-3 h-3 text-emerald-400" />
                  <span className="truncate max-w-[80px]">{area.leadUserName}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
