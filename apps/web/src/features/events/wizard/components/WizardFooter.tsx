import React from 'react';
import { ArrowLeft, ArrowRight, Save, Trash2, Check } from 'lucide-react';

interface WizardFooterProps {
  currentStep: number;
  totalSteps?: number;
  isSaving: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSaveAndExit: () => void;
  onDiscard: () => void;
}

export const WizardFooter: React.FC<WizardFooterProps> = ({
  currentStep,
  totalSteps = 8,
  isSaving,
  onPrev,
  onNext,
  onSaveAndExit,
  onDiscard
}) => {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="sticky bottom-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md px-6 py-4 shadow-2xl">
      {/* Left actions: Discard & Save Draft */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <button
          type="button"
          onClick={onDiscard}
          className="flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-2 rounded-xl border border-rose-500/20 transition-all cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Descartar rascunho</span>
        </button>

        <button
          type="button"
          onClick={onSaveAndExit}
          disabled={isSaving}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 px-4 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5 text-orange-400" />
          <span>Salvar e sair</span>
        </button>
      </div>

      {/* Right navigation: Back & Continue */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {!isFirstStep && (
          <button
            type="button"
            onClick={onPrev}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>
        )}

        {!isLastStep ? (
          <button
            type="button"
            onClick={onNext}
            disabled={isSaving}
            className="flex items-center gap-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-300 hover:to-amber-300 px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer hover:translate-x-0.5 active:scale-98 disabled:opacity-50"
          >
            <span>Continuar</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSaveAndExit}
            disabled={isSaving}
            className="flex items-center gap-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>Concluir e Salvar Rascunho</span>
          </button>
        )}
      </div>
    </div>
  );
};
