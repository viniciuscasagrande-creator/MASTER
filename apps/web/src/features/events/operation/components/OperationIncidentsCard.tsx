import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  Plus
} from 'lucide-react';

interface IncidentItem {
  id: string;
  ticketCode: string;
  severity: string;
  status: string;
  areaCode: string;
  subject: string;
  description?: string;
  createdAt: string;
}

interface OperationIncidentsCardProps {
  incidents: IncidentItem[];
  onOpenNewIncidentModal: () => void;
  canCreateIncident: boolean;
}

export const OperationIncidentsCard: React.FC<OperationIncidentsCardProps> = ({
  incidents,
  onOpenNewIncidentModal,
  canCreateIncident
}) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            CRÍTICO
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
            ALTO
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            MÉDIO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            BAIXO
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Incidentes em Aberto</h2>
          </div>
          {canCreateIncident && (
            <button
              onClick={onOpenNewIncidentModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Incidente</span>
            </button>
          )}
        </div>

        {incidents.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Nenhum incidente ativo no momento. Operação operando normalmente.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 mt-2">
            {incidents.map((inc) => (
              <div key={inc.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {inc.ticketCode}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                      {inc.areaCode}
                    </span>
                  </div>
                  {getSeverityBadge(inc.severity)}
                </div>

                <h4 className="text-xs font-semibold text-slate-100 mt-1">
                  {inc.subject}
                </h4>
                {inc.description && (
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                    {inc.description}
                  </p>
                )}

                <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(inc.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
