import React from 'react';
import {
  Users,
  ShieldCheck,
  UserCheck,
  PhoneCall,
  Briefcase,
  DollarSign,
  Megaphone,
  Headphones
} from 'lucide-react';
import { EventDetailDTO, EventResponsibilityDTO, EventResponsibilityType } from '../../types/event.types';

interface EventResponsibilitiesStepProps {
  event: Partial<EventDetailDTO>;
  responsibilities: EventResponsibilityDTO[];
  onUpdateField: (field: string, value: any) => void;
}

const ROLES_INFO: Array<{
  type: EventResponsibilityType;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    type: 'PRIMARY',
    title: 'Responsável Principal do Evento',
    desc: 'Ponto focal para decisões gerais, assinaturas de borderô e contato com diretoria',
    icon: UserCheck,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30'
  },
  {
    type: 'OPERATIONS',
    title: 'Operações e Portaria de Campo',
    desc: 'Gerenciamento de catracas, validação de ingressos e equipe local de portaria',
    icon: ShieldCheck,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
  },
  {
    type: 'FINANCE',
    title: 'Financeiro e Conciliação',
    desc: 'Acompanhamento de repasses parciais, taxas de conveniência e fechamento contábil',
    icon: DollarSign,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  },
  {
    type: 'COMMERCIAL',
    title: 'Comercial e Patrocínios',
    desc: 'Gestão de cortesias, cotas de patrocinador e convênios corporativos',
    icon: Briefcase,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
  },
  {
    type: 'MARKETING',
    title: 'Marketing e Divulgação',
    desc: 'Alinhamento de campanhas de tráfego, pixels de conversão e peças promocionais',
    icon: Megaphone,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  },
  {
    type: 'SUPPORT',
    title: 'Atendimento e SAC Operacional',
    desc: 'Tratamento de contestações, dúvidas de compradores e suporte pré-evento',
    icon: Headphones,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  }
];

export const EventResponsibilitiesStep: React.FC<EventResponsibilitiesStepProps> = ({
  event,
  responsibilities = []
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-white">7. Responsáveis Operacionais e Equipe</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Defina a atribuição de papéis operacionais para o acompanhamento do ciclo de vida deste evento.
        </p>
      </div>

      <div className="space-y-3">
        {ROLES_INFO.map((role) => {
          const Icon = role.icon;
          const assigned = responsibilities.find((r) => r.responsibilityType === role.type);

          return (
            <div
              key={role.type}
              className="rounded-xl border border-slate-750 bg-slate-800/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg border shrink-0 ${role.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{role.title}</div>
                  <div className="text-[11px] text-slate-400 max-w-md">{role.desc}</div>
                </div>
              </div>

              <div className="w-full sm:w-auto text-right sm:text-right">
                {assigned ? (
                  <div className="text-xs">
                    <span className="font-semibold text-white block">{assigned.userName || 'Membro atribuído'}</span>
                    <span className="text-[11px] text-slate-400">{assigned.userEmail || assigned.teamName || 'Equipe interna'}</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-750">
                    {role.type === 'PRIMARY' && event.producerName
                      ? `Atribuído ao produtor (${event.producerName})`
                      : 'Fila unificada / Padrão da produtora'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
