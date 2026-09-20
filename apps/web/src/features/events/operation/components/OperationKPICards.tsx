import React from 'react';
import {
  Ticket,
  DoorOpen,
  Users,
  AlertTriangle,
  Radio,
  Cpu
} from 'lucide-react';
import { OperationKPIs } from '@shared/types/index';

interface OperationKPICardsProps {
  kpis: OperationKPIs;
}

export const OperationKPICards: React.FC<OperationKPICardsProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Check-in & Ingressos Validados */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium uppercase tracking-wider">Check-in Real</span>
          <Ticket className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white tracking-tight">
              {kpis.attendeesCheckedIn.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-slate-500">
              / {kpis.expectedAttendees > 0 ? kpis.expectedAttendees.toLocaleString('pt-BR') : '—'}
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpis.checkInPercentage)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {kpis.checkInPercentage}% do público esperado
          </span>
        </div>
      </div>

      {/* 2. Portões & Catracas Abertas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium uppercase tracking-wider">Portões Abertos</span>
          <DoorOpen className="w-4 h-4 text-blue-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white tracking-tight">
              {kpis.openAccessPointsCount}
            </span>
            <span className="text-xs text-slate-500">
              / {kpis.totalAccessPointsCount}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {kpis.openAccessPointsCount === kpis.totalAccessPointsCount && kpis.totalAccessPointsCount > 0
              ? 'Todos os portões operando'
              : `${kpis.totalAccessPointsCount - kpis.openAccessPointsCount} portões fechados`}
          </span>
        </div>
      </div>

      {/* 3. Equipe Presente */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium uppercase tracking-wider">Equipe Presente</span>
          <Users className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white tracking-tight">
              {kpis.staffPresentCount}
            </span>
            <span className="text-xs text-slate-500">
              / {kpis.staffTotalCount > 0 ? kpis.staffTotalCount : '—'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {kpis.staffTotalCount > 0
              ? `${Math.round((kpis.staffPresentCount / kpis.staffTotalCount) * 100)}% de presença confirmada`
              : 'Nenhum turno registrado'}
          </span>
        </div>
      </div>

      {/* 4. Incidentes Ativos */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium uppercase tracking-wider">Incidentes</span>
          <AlertTriangle className={`w-4 h-4 ${kpis.criticalIncidentsCount > 0 ? 'text-red-400 animate-bounce' : 'text-amber-400'}`} />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${kpis.criticalIncidentsCount > 0 ? 'text-red-400' : kpis.activeIncidentsCount > 0 ? 'text-amber-400' : 'text-white'}`}>
              {kpis.activeIncidentsCount}
            </span>
            {kpis.criticalIncidentsCount > 0 && (
              <span className="text-xs text-red-400 font-semibold">
                ({kpis.criticalIncidentsCount} críticos)
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {kpis.activeIncidentsCount === 0 ? 'Operação sem incidentes' : 'Exigem atenção operacional'}
          </span>
        </div>
      </div>

      {/* 5. Alertas Globais */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium uppercase tracking-wider">Alertas</span>
          <Radio className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white tracking-tight">
              {kpis.activeAlertsCount}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {kpis.activeAlertsCount === 0 ? 'Nenhum alerta ativo' : 'Monitoramento contínuo'}
          </span>
        </div>
      </div>

      {/* 6. Dispositivos Online */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium uppercase tracking-wider">Dispositivos</span>
          <Cpu className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white tracking-tight">
              {kpis.devicesOnlineCount}
            </span>
            <span className="text-xs text-slate-500">
              / {kpis.devicesTotalCount}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {kpis.devicesTotalCount > 0
              ? `${kpis.devicesOnlineCount} catracas/scanners online`
              : 'Nenhum hardware alocado'}
          </span>
        </div>
      </div>
    </div>
  );
};
