import React, { useState } from 'react';
import { ArrowLeft, Save, Sparkles, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { EventDetailDTO, EventWizardValidationResult, EventCategoryDTO } from '../types/event.types';
import { WizardSaveStatus } from './components/WizardSaveStatus';
import { WizardProgressCard } from './components/WizardProgressCard';
import { WizardValidationAlert } from './components/WizardValidationAlert';
import { EventPreviewCard } from './components/EventPreviewCard';
import { WizardFooter } from './components/WizardFooter';
import { EventWizardStepper } from './EventWizardStepper';
import { SaveStatus } from './hooks/useEventWizard';

interface EventWizardLayoutProps {
  event: Partial<EventDetailDTO> | null;
  currentStep: number;
  completedSteps: number[];
  validation: EventWizardValidationResult | null;
  saveStatus: SaveStatus;
  version: number;
  errorMessage?: string | null;
  categories: EventCategoryDTO[];
  onSelectStep: (stepNumber: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSaveAndExit: () => void;
  onDiscard: () => void;
  onReloadConflict?: () => void;
  onManualSave?: () => void;
  children: React.ReactNode;
}

export const EventWizardLayout: React.FC<EventWizardLayoutProps> = ({
  event,
  currentStep,
  completedSteps,
  validation,
  saveStatus,
  version,
  errorMessage,
  categories = [],
  onSelectStep,
  onPrev,
  onNext,
  onSaveAndExit,
  onDiscard,
  onReloadConflict,
  onManualSave,
  children
}) => {
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const currentStepValidation = validation?.steps?.find((s: any) => s.stepNumber === currentStep);
  const issues = currentStepValidation?.issues || [];

  // Category name resolver
  const selectedCategory = categories.find((c: any) => c.id === event?.categoryId);
  const selectedSubcategory = selectedCategory?.subcategories?.find((s: any) => s.id === event?.subcategoryId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 animate-fadeIn">
      {/* 1. Header do Wizard */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-3.5 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onSaveAndExit}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-750 px-3 py-1.5 rounded-xl border border-slate-700/80 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Central de Eventos</span>
          </button>

          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{event?.name || 'Novo Evento em Rascunho'}</span>
            </h1>
            <div className="text-[11px] text-slate-400">
              Wizard Inteligente • Etapa {currentStep} de 8
            </div>
          </div>
        </div>

        {/* Status de Salvamento e Ações do Header */}
        <div className="flex items-center gap-4">
          <WizardSaveStatus
            status={saveStatus}
            version={version}
            publicCode={event?.publicCode || 'EVT-2026-XXXXXX'}
            errorMessage={errorMessage}
            onReloadConflict={onReloadConflict}
            onRetrySave={onManualSave}
          />

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? 'Ocultar pré-visualização' : 'Exibir pré-visualização'}
            className="hidden lg:flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-850 px-2.5 py-1.5 rounded-lg border border-slate-750 transition-colors cursor-pointer"
          >
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span className="text-[11px]">{showPreview ? 'Ocultar Card' : 'Ver Card'}</span>
          </button>
        </div>
      </header>

      {/* 2. Corpo do Wizard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Stepper e Indicador de Progresso (3 cols) */}
          <aside className="lg:col-span-3 space-y-5">
            <EventWizardStepper
              currentStep={currentStep}
              completedSteps={completedSteps}
              validation={validation}
              onSelectStep={onSelectStep}
            />

            <WizardProgressCard
              validation={validation}
              completedStepsCount={completedSteps.length}
              readinessScore={event?.readinessScore}
            />
          </aside>

          {/* Coluna Central: Conteúdo da Etapa Ativa (6 ou 9 cols) */}
          <section className={`space-y-6 ${showPreview ? 'lg:col-span-6' : 'lg:col-span-9'}`}>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
              <WizardValidationAlert issues={issues} />
              {children}
            </div>
          </section>

          {/* Coluna Direita: Live Preview Card (3 cols) */}
          {showPreview && (
            <aside className="lg:col-span-3 space-y-5">
              <EventPreviewCard
                event={event}
                categoryName={selectedCategory?.name}
                subcategoryName={selectedSubcategory?.name}
              />
            </aside>
          )}
        </div>
      </main>

      {/* 3. Rodapé Fixo de Navegação */}
      <WizardFooter
        currentStep={currentStep}
        totalSteps={8}
        isSaving={saveStatus === 'saving'}
        onPrev={onPrev}
        onNext={onNext}
        onSaveAndExit={onSaveAndExit}
        onDiscard={() => setIsDiscardModalOpen(true)}
      />

      {/* 4. Modal de Confirmação de Descarte */}
      {isDiscardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Descartar este rascunho?</h4>
                <p className="text-xs text-slate-400">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              O evento com código <strong className="font-mono text-white">{event?.publicCode}</strong> será marcado como descartado e arquivado com segurança na trilha de auditoria.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDiscardModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDiscardModalOpen(false);
                  onDiscard();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Sim, descartar rascunho</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
