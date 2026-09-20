import React from 'react';
import {
  FileText,
  Building2,
  MapPin,
  Calendar,
  Image as ImageIcon,
  Settings,
  Users,
  CheckSquare,
  AlertCircle,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { EventWizardStepId, EventWizardValidationResult } from '../types/event.types';

interface StepMeta {
  id: EventWizardStepId;
  stepNumber: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepMeta[] = [
  { id: 'STEP_INFORMATION', stepNumber: 1, title: 'Informações', subtitle: 'Nome, categoria e formato', icon: FileText },
  { id: 'STEP_ORGANIZATION', stepNumber: 2, title: 'Organização', subtitle: 'Produtor e contatos', icon: Building2 },
  { id: 'STEP_LOCATION', stepNumber: 3, title: 'Local', subtitle: 'Endereço ou plataforma', icon: MapPin },
  { id: 'STEP_DATES', stepNumber: 4, title: 'Datas', subtitle: 'Período e fuso horário', icon: Calendar },
  { id: 'STEP_MEDIA', stepNumber: 5, title: 'Identidade visual', subtitle: 'Capa, banner e fotos', icon: ImageIcon },
  { id: 'STEP_SETTINGS', stepNumber: 6, title: 'Configurações', subtitle: 'Moeda, idioma e SEO', icon: Settings },
  { id: 'STEP_RESPONSIBILITIES', stepNumber: 7, title: 'Responsáveis', subtitle: 'Papéis e atribuições', icon: Users },
  { id: 'STEP_REVIEW', stepNumber: 8, title: 'Revisão', subtitle: 'Conferência e prontidão', icon: CheckSquare }
];

interface EventWizardStepperProps {
  currentStep: number;
  completedSteps: number[];
  validation: EventWizardValidationResult | null;
  onSelectStep: (stepNumber: number) => void;
}

export const EventWizardStepper: React.FC<EventWizardStepperProps> = ({
  currentStep,
  completedSteps = [],
  validation,
  onSelectStep
}) => {
  return (
    <nav aria-label="Progresso do Cadastro do Evento" className="space-y-1.5">
      {STEPS.map((step) => {
        const isCurrent = currentStep === step.stepNumber;
        const isCompleted = completedSteps.includes(step.stepNumber);

        // Check validation status for this step
        const stepValidation = validation?.steps?.find((s: any) => s.stepId === step.id);
        const hasBlocking = stepValidation?.issues?.some((i: any) => i.severity === 'BLOCKING');
        const hasWarning = stepValidation?.issues?.some((i: any) => i.severity === 'WARNING');

        const Icon = step.icon;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelectStep(step.stepNumber)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
              isCurrent
                ? 'bg-slate-850 border-orange-500 shadow-md ring-1 ring-orange-500/40 text-white'
                : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Step number badge / icon */}
              <div
                className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-colors ${
                  isCurrent
                    ? 'bg-orange-500 text-slate-950 shadow-md'
                    : isCompleted
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                }`}
              >
                {step.stepNumber}
              </div>

              {/* Title & subtitle */}
              <div className="truncate">
                <div
                  className={`text-xs font-bold leading-tight truncate ${
                    isCurrent ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{step.subtitle}</div>
              </div>
            </div>

            {/* Status indicator on the right */}
            <div className="ml-2 shrink-0">
              {hasBlocking ? (
                <span title="Pendências obrigatórias" className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                </span>
              ) : hasWarning ? (
                <span title="Avisos importantes" className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                </span>
              ) : isCompleted ? (
                <span title="Etapa preenchida" className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </span>
              ) : (
                <Icon className={`h-4 w-4 ${isCurrent ? 'text-orange-400' : 'text-slate-600'}`} />
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
};
