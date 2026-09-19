import React from 'react';
import {
  Calendar,
  Clock,
  Mail,
  Play,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldCheck
} from 'lucide-react';
import { ReportSchedule } from '@shared/types/index';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';

interface SchedulesTabProps {
  schedules: ReportSchedule[];
  onRunNow: (scheduleId: string) => Promise<void>;
  onDeleteSchedule: (scheduleId: string) => Promise<void>;
  onNavigateToBuilder: () => void;
}

export const SchedulesTab: React.FC<SchedulesTabProps> = ({
  schedules,
  onRunNow,
  onDeleteSchedule,
  onNavigateToBuilder
}) => {
  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-white">Automação de Relatórios e Agendamentos</h3>
          <p className="text-xs text-slate-400">
            Envio recorrente com re-validação dinâmica de permissões no momento do disparo
          </p>
        </div>
      </div>

      {/* Re-validation Rule Callout (Section 1.1.5.13.41) */}
      <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300">
        <ShieldCheck className="h-5 w-5 shrink-0 text-orange-400" />
        <div>
          <strong className="text-white">Re-validação Contínua de Permissão:</strong> No instante de cada execução programada, o motor reavalia o status e as permissões do criador do agendamento. Se o usuário for bloqueado, demitido ou tiver suas permissões revogadas, a entrega é bloqueada automaticamente.
        </div>
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 text-center">
          <Calendar className="h-10 w-10 text-slate-600" />
          <h3 className="mt-3 text-sm font-semibold text-slate-300">Nenhum agendamento cadastrado</h3>
          <p className="mt-1 text-xs text-slate-500">
            Você pode agendar o envio automático a partir dos seus relatórios salvos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {schedules.map((sch) => (
            <div
              key={sch.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-400">
                      {sch.frequency}
                    </span>
                    <Badge variant={sch.active ? 'success' : 'neutral'} size="sm">
                      {sch.active ? 'Ativo' : 'Pausado'}
                    </Badge>
                  </div>
                  <span className="font-mono text-xs text-slate-400">
                    Formato: <strong className="text-white">{sch.format}</strong>
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-white">{sch.reportTitle}</h3>

                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <span>
                      Horário: <strong>{sch.timeOfDay}</strong> (Horário de Brasília)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span>
                      Próximo envio: <strong>{new Date(sch.nextRunAt).toLocaleString('pt-BR')}</strong>
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail className="mt-0.5 h-4 w-4 text-purple-400" />
                    <div>
                      <span>Destinatários:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {sch.recipients.map((rec, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-slate-950 px-2 py-0.5 text-[10px] font-mono text-slate-300"
                          >
                            {rec.target}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-4">
                <div className="text-[11px] text-slate-500">
                  {sch.lastRunStatus ? (
                    <span className="flex items-center gap-1">
                      {sch.lastRunStatus === 'SUCCESS' ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-rose-400" />
                      )}
                      Último disparo: {sch.lastRunStatus} ({new Date(sch.lastRunAt || '').toLocaleDateString('pt-BR')})
                    </span>
                  ) : (
                    'Aguardando primeiro disparo'
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRunNow(sch.id)}
                    className="flex items-center gap-1 text-xs"
                    title="Executar agora re-validando permissões"
                  >
                    <Play className="h-3 w-3 text-emerald-400" />
                    Executar Agora
                  </Button>

                  <button
                    onClick={() => {
                      if (confirm('Deseja excluir este agendamento?')) {
                        onDeleteSchedule(sch.id);
                      }
                    }}
                    className="rounded-lg border border-slate-800 p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400"
                    title="Excluir agendamento"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
