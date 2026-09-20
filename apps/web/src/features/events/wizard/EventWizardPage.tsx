import React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useEventWizard } from './hooks/useEventWizard';
import { EventWizardLayout } from './EventWizardLayout';
import { EventInformationStep } from './steps/EventInformationStep';
import { EventOrganizationStep } from './steps/EventOrganizationStep';
import { EventLocationStep } from './steps/EventLocationStep';
import { EventDatesStep } from './steps/EventDatesStep';
import { EventMediaStep } from './steps/EventMediaStep';
import { EventSettingsStep } from './steps/EventSettingsStep';
import { EventResponsibilitiesStep } from './steps/EventResponsibilitiesStep';
import { EventReviewStep } from './steps/EventReviewStep';

interface EventWizardPageProps {
  eventId: string;
  onExit: () => void;
}

export const EventWizardPage: React.FC<EventWizardPageProps> = ({
  eventId,
  onExit
}) => {
  const {
    event,
    wizardState,
    categories,
    media,
    responsibilities,
    validation,
    currentStepNumber,
    saveStatus,
    version,
    errorMessage,
    isLoading,
    updateEventField,
    updateMultipleFields,
    goToStep,
    nextStep,
    prevStep,
    reloadFromConflict,
    discardDraft,
    manualSave
  } = useEventWizard(eventId, onExit);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
          <div className="text-sm font-semibold text-slate-300">
            Carregando configurações do evento...
          </div>
          <p className="text-xs text-slate-500 font-mono">ID: {eventId}</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center space-y-4 shadow-xl">
          <div className="inline-flex p-3 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">Evento não encontrado</h3>
          <p className="text-xs text-slate-400">
            {errorMessage || 'Não foi possível localizar o rascunho de evento solicitado ou você não possui permissão de acesso.'}
          </p>
          <button
            type="button"
            onClick={onExit}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-orange-400 hover:bg-orange-300 transition-colors cursor-pointer"
          >
            Voltar para a Central de Eventos
          </button>
        </div>
      </div>
    );
  }

  const completedSteps = wizardState?.completedSteps || [];

  return (
    <EventWizardLayout
      event={event}
      currentStep={currentStepNumber}
      completedSteps={completedSteps}
      validation={validation}
      saveStatus={saveStatus}
      version={version}
      errorMessage={errorMessage}
      categories={categories}
      onSelectStep={goToStep}
      onPrev={prevStep}
      onNext={nextStep}
      onSaveAndExit={onExit}
      onDiscard={discardDraft}
      onReloadConflict={reloadFromConflict}
      onManualSave={manualSave}
    >
      {currentStepNumber === 1 && (
        <EventInformationStep
          event={event}
          categories={categories}
          onUpdateField={updateEventField}
          onUpdateMultiple={updateMultipleFields}
        />
      )}

      {currentStepNumber === 2 && (
        <EventOrganizationStep
          event={event}
          onUpdateField={updateEventField}
        />
      )}

      {currentStepNumber === 3 && (
        <EventLocationStep
          event={event}
          onUpdateField={updateEventField}
          onUpdateMultiple={updateMultipleFields}
        />
      )}

      {currentStepNumber === 4 && (
        <EventDatesStep
          event={event}
          onUpdateField={updateEventField}
          onUpdateMultiple={updateMultipleFields}
        />
      )}

      {currentStepNumber === 5 && (
        <EventMediaStep
          event={event}
          mediaList={media}
          onUpdateField={updateEventField}
          onUpdateMultiple={updateMultipleFields}
        />
      )}

      {currentStepNumber === 6 && (
        <EventSettingsStep
          event={event}
          onUpdateField={updateEventField}
          onUpdateMultiple={updateMultipleFields}
        />
      )}

      {currentStepNumber === 7 && (
        <EventResponsibilitiesStep
          event={event}
          responsibilities={responsibilities}
          onUpdateField={updateEventField}
        />
      )}

      {currentStepNumber === 8 && (
        <EventReviewStep
          event={event}
          validation={validation}
          onGoToStep={goToStep}
          onSaveAndExit={onExit}
        />
      )}
    </EventWizardLayout>
  );
};
