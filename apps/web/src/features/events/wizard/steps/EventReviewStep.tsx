import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  MapPin,
  Globe,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { EventDetailDTO, EventWizardValidationResult } from '../../types/event.types';
import { formatDateTime, formatNumber } from '../../../../shared/utils/formatters';

interface EventReviewStepProps {
  event: Partial<EventDetailDTO>;
  validation: EventWizardValidationResult | null;
  onGoToStep: (stepNumber: number) => void;
  onSaveAndExit: () => void;
}

export const EventReviewStep: React.FC<EventReviewStepProps> = ({
  event,
  validation,
  onGoToStep,
  onSaveAndExit
}) => {
  const isReady = validation?.valid ?? false;
  const blockingCount = validation?.blockingIssues ?? 0;
  const warningCount = validation?.warnings ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-white">8. Revisão Geral e Prontidão do Rascunho</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Confira o resumo de todos os dados configurados e a análise de conformidade para publicação.
        </p>
      </div>

      {/* Banner de Status de Prontidão */}
      {isReady ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-sm font-bold text-emerald-300">
              Rascunho Completo e Apto para Publicação!
            </div>
            <p className="text-xs text-emerald-200/80">
              Todas as informações obrigatórias foram validadas com sucesso. Você pode salvar e manter em rascunho para cadastrar setores e lotes na próxima etapa.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-sm font-bold text-amber-300">
              Rascunho Salvo com {blockingCount} {blockingCount === 1 ? 'Pendência Bloqueante' : 'Pendências Bloqueantes'}
            </div>
            <p className="text-xs text-amber-200/80">
              O evento pode ser mantido em <strong>Rascunho</strong> com segurança na Central de Eventos. Para que seja publicado ou liberado para vendas no futuro, resolva as pendências listadas abaixo.
            </p>
          </div>
        </div>
      )}

      {/* Diagnóstico das Etapas do Wizard */}
      <div className="rounded-xl border border-slate-750 bg-slate-800/40 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-750 pb-3">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Checklist de Conformidade das 8 Etapas
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {warningCount} avisos • {blockingCount} bloqueios
          </span>
        </div>

        <div className="space-y-2">
          {validation?.steps?.map((step: any) => {
            const hasBlocking = step.issues.some((i: any) => i.severity === 'BLOCKING');
            const hasWarning = step.issues.some((i: any) => i.severity === 'WARNING');
            const isOk = !hasBlocking && !hasWarning;

            return (
              <div
                key={step.stepId}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-850 border border-slate-750 text-xs"
              >
                <div className="flex items-center gap-3">
                  {hasBlocking ? (
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  ) : hasWarning ? (
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-white">Etapa {step.stepNumber}: {step.title}</span>
                    {step.issues.length > 0 && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {step.issues.map((i: any) => i.message).join(' • ')}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onGoToStep(step.stepNumber)}
                  className="text-[11px] font-semibold text-orange-400 hover:text-orange-300 px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors shrink-0 ml-3 cursor-pointer"
                >
                  Revisar
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumo Consolidado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bloco 1: Identificação e Formato */}
        <div className="rounded-xl border border-slate-750 bg-slate-800/30 p-4 space-y-2 text-xs">
          <div className="font-bold text-slate-200 border-b border-slate-750 pb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span>Identificação e Formato</span>
          </div>
          <div className="text-slate-400 space-y-1">
            <div><strong className="text-slate-300">Código Público:</strong> <span className="font-mono text-orange-400">{event.publicCode}</span></div>
            <div><strong className="text-slate-300">Título:</strong> {event.name || 'Não informado'}</div>
            <div><strong className="text-slate-300">Slug:</strong> <span className="font-mono">{event.slug || 'Não gerado'}</span></div>
            <div><strong className="text-slate-300">Formato:</strong> {event.format === 'ONLINE' ? 'Online' : event.format === 'HYBRID' ? 'Híbrido' : 'Presencial'}</div>
            <div><strong className="text-slate-300">Classificação:</strong> {event.ageRating || 'Livre'}</div>
          </div>
        </div>

        {/* Bloco 2: Local e Datas */}
        <div className="rounded-xl border border-slate-750 bg-slate-800/30 p-4 space-y-2 text-xs">
          <div className="font-bold text-slate-200 border-b border-slate-750 pb-1.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-cyan-400" />
            <span>Local e Datas</span>
          </div>
          <div className="text-slate-400 space-y-1">
            <div><strong className="text-slate-300">Início:</strong> {event.startAt ? formatDateTime(event.startAt) : 'Não informado'}</div>
            <div><strong className="text-slate-300">Término:</strong> {event.endAt ? formatDateTime(event.endAt) : 'Não informado'}</div>
            <div><strong className="text-slate-300">Fuso:</strong> {event.timezone || 'America/Sao_Paulo'}</div>
            <div><strong className="text-slate-300">Espaço/Venue:</strong> {event.venue || 'A definir'}</div>
            <div><strong className="text-slate-300">Cidade/UF:</strong> {event.city ? `${event.city}/${event.state || ''}` : 'A definir'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
