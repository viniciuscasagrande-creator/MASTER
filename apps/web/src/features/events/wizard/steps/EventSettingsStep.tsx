import React from 'react';
import { Globe2, Eye, Search, FileText, DollarSign } from 'lucide-react';
import { EventDetailDTO } from '../../types/event.types';

interface EventSettingsStepProps {
  event: Partial<EventDetailDTO>;
  onUpdateField: (field: string, value: any) => void;
  onUpdateMultiple: (fields: Record<string, any>) => void;
}

export const EventSettingsStep: React.FC<EventSettingsStepProps> = ({
  event,
  onUpdateField,
  onUpdateMultiple
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-white">6. Configurações Gerais e Visibilidade</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Defina moeda, idioma da página, políticas de indexação em motores de busca e privacidade.
        </p>
      </div>

      {/* 1. Visibilidade do Evento */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-300">
          Visibilidade do Evento no Portal <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'PUBLIC',
              title: 'Público',
              desc: 'Visível na vitrine da DiskIngressos, listagens e sistema de busca',
              badge: 'Recomendado'
            },
            {
              id: 'UNLISTED',
              title: 'Não Listado',
              desc: 'Acessível apenas por quem possui o link direto; oculto da vitrine',
              badge: 'Link direto'
            },
            {
              id: 'PRIVATE',
              title: 'Privado',
              desc: 'Exclusivo para convidados ou acesso restrito com senha de venda',
              badge: 'Restrito'
            }
          ].map((vis) => {
            const isSelected = (event.visibility || 'PRIVATE') === vis.id;
            return (
              <div
                key={vis.id}
                onClick={() => onUpdateField('visibility', vis.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-orange-500/10 border-orange-500 ring-1 ring-orange-500/40 text-white shadow-md'
                    : 'bg-slate-800/40 border-slate-750 hover:border-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{vis.title}</span>
                  <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {vis.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">{vis.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Moeda e Idioma */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span>Moeda de Comercialização</span>
          </label>
          <select
            value={event.currency || 'BRL'}
            onChange={(e) => onUpdateField('currency', e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors"
          >
            <option value="BRL">BRL - Real Brasileiro (R$)</option>
            <option value="USD">USD - Dólar Americano ($)</option>
            <option value="EUR">EUR - Euro (€)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Globe2 className="h-4 w-4 text-cyan-400" />
            <span>Idioma da Vitrine e Comprovantes</span>
          </label>
          <select
            value={event.locale || 'pt-BR'}
            onChange={(e) => onUpdateField('locale', e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors"
          >
            <option value="pt-BR">Português do Brasil (pt-BR)</option>
            <option value="en-US">English (en-US)</option>
            <option value="es-ES">Español (es-ES)</option>
          </select>
        </div>
      </div>

      {/* 3. Indexação em Motores de Busca */}
      <div className="rounded-xl border border-slate-750 bg-slate-800/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Indexação por Motores de Busca (Google/SEO)</div>
            <div className="text-[11px] text-slate-400">
              Permitir que mecanismos de busca indexem a página pública do evento nos resultados orgânicos.
            </div>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(event.allowSearchIndexing)}
            onChange={(e) => onUpdateField('allowSearchIndexing', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
        </label>
      </div>

      {/* 4. Descrição e Termos Específicos */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800">
        <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-orange-400" />
          <span>Descrição do Evento, Regulamento e Políticas de Meia-Entrada</span>
        </label>
        <textarea
          rows={5}
          value={event.description || ''}
          onChange={(e) => onUpdateField('description', e.target.value)}
          placeholder="Insira detalhes da atração, cronograma, orientações de estacionamento, regras de meia-entrada conforme legislação vigente e termos de cancelamento..."
          className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-3.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
};
