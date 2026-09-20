import React from 'react';
import { Building2, ShieldCheck, Mail, Phone, UserCheck } from 'lucide-react';
import { EventDetailDTO } from '../../types/event.types';

interface EventOrganizationStepProps {
  event: Partial<EventDetailDTO>;
  onUpdateField: (field: string, value: any) => void;
}

export const EventOrganizationStep: React.FC<EventOrganizationStepProps> = ({
  event,
  onUpdateField
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-white">2. Organização e Contatos</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Defina as entidades responsáveis, contatos de operação e o nome de divulgação da produtora.
        </p>
      </div>

      {/* 1. Produtor Tenant */}
      <div className="rounded-xl border border-slate-750 bg-slate-800/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">Produtor Titular da Conta</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            Isolamento Multi-tenant Ativo
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-850 border border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">
              {event.producerName || 'Produtor Titular Selecionado'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              ID: {event.producerId || 'prd_default'}
            </div>
          </div>
          <span className="text-[11px] text-slate-500 italic">
            Atribuído pelo escopo de segurança
          </span>
        </div>
      </div>

      {/* 2. Nome Público do Organizador */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300">
          Nome Público do Organizador / Marca Comercial
        </label>
        <input
          type="text"
          value={event.publicOrganizerName || ''}
          onChange={(e) => onUpdateField('publicOrganizerName', e.target.value)}
          placeholder="Ex: Opus Entretenimento & Seven Produções"
          className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
        />
        <p className="text-[11px] text-slate-500">
          Nome comercial que aparecerá para o consumidor final na página do evento e no rodapé do ingresso.
        </p>
      </div>

      {/* 3. Contatos Operacionais do Evento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Telefone / WhatsApp Operacional
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={event.operationalContact || ''}
              onChange={(e) => onUpdateField('operationalContact', e.target.value)}
              placeholder="(41) 99999-0000"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            E-mail de Operações e Produção
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="email"
              value={event.operationalEmail || ''}
              onChange={(e) => onUpdateField('operationalEmail', e.target.value)}
              placeholder="producao@produtora.com.br"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 4. Ponto Focal Interno DiskIngressos */}
      <div className="rounded-xl border border-slate-800 bg-slate-850/50 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <UserCheck className="h-4 w-4 text-orange-400" />
          <span>Atendimento & Suporte Interno DiskIngressos</span>
        </div>
        <p className="text-[11px] text-slate-400">
          {event.internalResponsibleUserName
            ? `Responsável interno designado: ${event.internalResponsibleUserName}`
            : 'Nenhum analista interno exclusivo vinculado. O evento será atendido pela fila unificada de suporte operacional.'}
        </p>
      </div>
    </div>
  );
};
