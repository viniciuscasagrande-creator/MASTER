import React from 'react';
import { JobSchedule, ScheduleFrequency } from '../jobs.types';
import { QueueBadge } from '../components/QueueBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Button } from '../../../shared/components/Button';
import { Calendar, Play, Power, Trash2, Clock, Globe } from 'lucide-react';

interface SchedulesTabProps {
  schedules: JobSchedule[];
  onOpenNewSchedule: () => void;
  onRunNow: (schedule: JobSchedule) => void;
  onToggleActive: (schedule: JobSchedule) => void;
  onDelete: (schedule: JobSchedule) => void;
}

export const SchedulesTab: React.FC<SchedulesTabProps> = ({
  schedules,
  onOpenNewSchedule,
  onRunNow,
  onToggleActive,
  onDelete
}) => {
  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return iso;
    }
  };

  const getFrequencyLabel = (freq: ScheduleFrequency) => {
    switch (freq) {
      case 'HOURLY': return 'A cada hora';
      case 'DAILY': return 'Diariamente';
      case 'WEEKLY': return 'Semanalmente';
      case 'MONTHLY': return 'Mensalmente';
      case 'CRON': return 'Avançado (Cron)';
      case 'ONCE': return 'Execução Única';
      default: return freq;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-400" />
            Rotinas Agendadas & Tarefas Periódicas
          </h3>
          <p className="text-xs text-slate-400">
            Execuções programadas protegidas por Distributed Lock e re-validação dinâmica de permissões.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={onOpenNewSchedule}>
          <Calendar className="mr-1.5 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
          <Calendar className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <p className="font-semibold text-white">Nenhum agendamento configurado</p>
          <p className="text-xs text-slate-500 mt-1">Clique em "Novo Agendamento" para programar rotinas operacionais periódicas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map(sch => (
            <div
              key={sch.id}
              className={`rounded-xl border p-4 space-y-3 transition ${
                sch.active
                  ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  : 'border-slate-800/40 bg-slate-950/40 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{sch.name}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                      sch.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {sch.active ? 'Ativo' : 'Desativado'}
                    </span>
                  </div>
                  {sch.description && (
                    <p className="text-xs text-slate-400 mt-0.5">{sch.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <QueueBadge queue={sch.queue} />
                  <PriorityBadge priority={sch.priority} />
                </div>
              </div>

              <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">Frequência</div>
                  <div className="font-semibold text-white flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-orange-400" />
                    <span>{getFrequencyLabel(sch.frequency)} {sch.timeOfDay ? `às ${sch.timeOfDay}` : ''}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-500">Fuso Horário</div>
                  <div className="font-semibold text-slate-300 flex items-center gap-1.5 mt-0.5">
                    <Globe className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{sch.timezone}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-500">Próxima Execução</div>
                  <div className="font-mono text-purple-300 font-semibold mt-0.5">
                    {formatDateTime(sch.nextRunAt)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-500">Misfire Policy</div>
                  <div className="text-slate-300 text-[11px] mt-0.5 font-mono">
                    {sch.misfirePolicy}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[11px] text-slate-500">
                  Criado por {sch.creatorUserName}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRunNow(sch)}
                    title="Disparar execução agora"
                  >
                    <Play className="mr-1 h-3.5 w-3.5 text-orange-400" />
                    Executar Agora
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleActive(sch)}
                    title={sch.active ? 'Desativar rotina' : 'Ativar rotina'}
                  >
                    <Power className={`h-3.5 w-3.5 ${sch.active ? 'text-amber-400' : 'text-emerald-400'}`} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(sch)}
                    title="Excluir agendamento"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
