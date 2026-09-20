import React, { useState } from 'react';
import {
  ScheduleFrequency,
  MisfirePolicy,
  JobQueue,
  JobPriority,
  JobModule,
  JobRegistryEntry
} from '../jobs.types';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Clock, Calendar, Shield, AlertCircle } from 'lucide-react';

interface NewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  registeredJobs: JobRegistryEntry[];
  onSave: (data: {
    name: string;
    description?: string;
    jobType: string;
    module: JobModule;
    queue: JobQueue;
    priority: JobPriority;
    frequency: ScheduleFrequency;
    cronExpression?: string;
    timeOfDay?: string;
    timezone: string;
    misfirePolicy: MisfirePolicy;
    payload?: any;
  }) => void | Promise<void>;
}

export const NewScheduleModal: React.FC<NewScheduleModalProps> = ({
  isOpen,
  onClose,
  registeredJobs,
  onSave
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [jobType, setJobType] = useState(registeredJobs[0]?.type || 'FINANCE_RECONCILIATION');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('DAILY');
  const [timeOfDay, setTimeOfDay] = useState('02:00');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [cronExpression, setCronExpression] = useState('0 2 * * *');
  const [misfirePolicy, setMisfirePolicy] = useState<MisfirePolicy>('EXECUTE_IMMEDIATELY');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedJobEntry = registeredJobs.find(j => j.type === jobType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name,
        description,
        jobType,
        module: selectedJobEntry?.module || 'FINANCEIRO',
        queue: selectedJobEntry?.queue || 'finance',
        priority: selectedJobEntry?.defaultPriority || 'HIGH',
        frequency,
        timeOfDay: frequency !== 'HOURLY' && frequency !== 'CRON' ? timeOfDay : undefined,
        cronExpression: frequency === 'CRON' ? cronExpression : undefined,
        timezone,
        misfirePolicy,
        payload: { automated: true, createdVia: 'ProcessingCenterUI' }
      });
      onClose();
    } catch {
      // error handled by caller toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Agendamento Operacional"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
            Nome da Rotina Agendada *
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Conciliação Diária de Recebíveis"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
            Descrição / Justificativa Operacional
          </label>
          <textarea
            rows={2}
            placeholder="Finalidade da execução periódica..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Tipo de Job Aprovado *
            </label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
            >
              {registeredJobs.map((j) => (
                <option key={j.type} value={j.type}>
                  {j.name} ({j.module})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Frequência de Execução *
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as ScheduleFrequency)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="HOURLY">A cada hora</option>
              <option value="DAILY">Diariamente</option>
              <option value="WEEKLY">Semanalmente</option>
              <option value="MONTHLY">Mensalmente</option>
              <option value="CRON">Avançado (Cron)</option>
              <option value="ONCE">Executar uma vez (+10 min)</option>
            </select>
          </div>
        </div>

        {frequency !== 'HOURLY' && frequency !== 'CRON' && frequency !== 'ONCE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Horário de Disparo (24h)
              </label>
              <input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Fuso Horário Oficial
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="America/Sao_Paulo">Brasília (America/Sao_Paulo)</option>
                <option value="America/Manaus">Manaus (America/Manaus)</option>
                <option value="America/Fortaleza">Fortaleza (America/Fortaleza)</option>
                <option value="UTC">UTC Universal</option>
              </select>
            </div>
          </div>
        )}

        {frequency === 'CRON' && (
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Expressão Cron (5 campos) *
            </label>
            <input
              type="text"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              placeholder="0 2 * * *"
              className="w-full font-mono rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Formato: minuto hora dia_do_mês mês dia_da_semana
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
            Política de Misfire (Se o sistema estiver indisponível no horário previsto)
          </label>
          <select
            value={misfirePolicy}
            onChange={(e) => setMisfirePolicy(e.target.value as MisfirePolicy)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="EXECUTE_IMMEDIATELY">Executar Imediatamente ao restaurar o sistema</option>
            <option value="SKIP_MISSED">Ignorar Execução Perdida e aguardar próxima data</option>
            <option value="RESCHEDULE">Reagendar Próxima Execução</option>
          </select>
        </div>

        <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 text-xs text-orange-200 flex items-start gap-2">
          <Shield className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
          <span>
            <strong>Garantia de Segurança:</strong> As rotinas agendadas utilizam Lock Distribuído para garantir disparo único no cluster e re-validam dinamicamente as permissões do seu usuário a cada execução.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Criar Agendamento
          </Button>
        </div>
      </form>
    </Modal>
  );
};
