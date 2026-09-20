import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchEventWizardData,
  patchEventDraft,
  updateWizardStep,
  discardEventDraft
} from '../../api/events.api';
import {
  EventDetailDTO,
  EventWizardStateDTO,
  EventCategoryDTO,
  EventMediaDTO,
  EventResponsibilityDTO,
  EventWizardValidationResult,
  EventWizardStepId
} from '../../types/event.types';

export type SaveStatus = 'saved' | 'saving' | 'error' | 'conflict';

export interface UseEventWizardReturn {
  eventId: string;
  event: EventDetailDTO | null;
  wizardState: EventWizardStateDTO | null;
  categories: EventCategoryDTO[];
  media: EventMediaDTO[];
  responsibilities: EventResponsibilityDTO[];
  validation: EventWizardValidationResult | null;
  currentStepNumber: number;
  currentStepId: EventWizardStepId;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  errorMessage: string | null;
  isLoading: boolean;
  version: number;
  updateEventField: (field: string, value: any) => void;
  updateMultipleFields: (fields: Record<string, any>) => void;
  goToStep: (stepNumber: number) => Promise<void>;
  nextStep: () => Promise<void>;
  prevStep: () => Promise<void>;
  reloadFromConflict: () => Promise<void>;
  discardDraft: () => Promise<boolean>;
  manualSave: () => Promise<void>;
}

const STEP_IDS: EventWizardStepId[] = [
  'STEP_INFORMATION',
  'STEP_ORGANIZATION',
  'STEP_LOCATION',
  'STEP_DATES',
  'STEP_MEDIA',
  'STEP_SETTINGS',
  'STEP_RESPONSIBILITIES',
  'STEP_REVIEW'
];

export function useEventWizard(eventId: string, onExit?: () => void): UseEventWizardReturn {
  const [event, setEvent] = useState<EventDetailDTO | null>(null);
  const [wizardState, setWizardState] = useState<EventWizardStateDTO | null>(null);
  const [categories, setCategories] = useState<EventCategoryDTO[]>([]);
  const [media, setMedia] = useState<EventMediaDTO[]>([]);
  const [responsibilities, setResponsibilities] = useState<EventResponsibilityDTO[]>([]);
  const [validation, setValidation] = useState<EventWizardValidationResult | null>(null);

  const [currentStepNumber, setCurrentStepNumber] = useState<number>(1);
  const [version, setVersion] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Debounce autosave tracking
  const pendingChangesRef = useRef<Record<string, any>>({});
  const saveTimerRef = useRef<any>(null);
  const currentVersionRef = useRef<number>(1);

  // Sync ref with state
  useEffect(() => {
    currentVersionRef.current = version;
  }, [version]);

  // Load wizard data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await fetchEventWizardData(eventId);
      setEvent(data.event);
      setWizardState(data.wizardState);
      setCategories(data.categories || []);
      setMedia(data.media || []);
      setResponsibilities(data.responsibilities || []);
      setValidation(data.validation);
      setVersion(data.event?.version || 1);
      currentVersionRef.current = data.event?.version || 1;

      if (data.wizardState?.currentStep) {
        setCurrentStepNumber(data.wizardState.currentStep);
      }
      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar configurações do evento');
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId, loadData]);

  // Commit pending changes to server
  const flushChanges = useCallback(async () => {
    const changesToSave = { ...pendingChangesRef.current };
    if (Object.keys(changesToSave).length === 0) return;

    // Clear pending changes buffer
    pendingChangesRef.current = {};
    setSaveStatus('saving');

    try {
      const result = await patchEventDraft(eventId, {
        ...changesToSave,
        version: currentVersionRef.current
      });

      setVersion(result.version);
      currentVersionRef.current = result.version;
      setEvent((prev) => (prev ? { ...prev, ...result.event, version: result.version } : null));
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      setErrorMessage(null);
    } catch (err: any) {
      if (err.status === 409) {
        setSaveStatus('conflict');
        setErrorMessage('Conflito de versão detectado. Suas alterações não puderam ser salvas porque outra sessão atualizou este evento.');
      } else {
        setSaveStatus('error');
        setErrorMessage(err.message || 'Erro ao salvar alterações no rascunho');
      }
    }
  }, [eventId]);

  // Queue autosave with 800ms debounce
  const queueAutosave = useCallback(
    (newChanges: Record<string, any>) => {
      pendingChangesRef.current = {
        ...pendingChangesRef.current,
        ...newChanges
      };
      setSaveStatus('saving');

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        flushChanges();
      }, 800);
    },
    [flushChanges]
  );

  // Update single field
  const updateEventField = useCallback(
    (field: string, value: any) => {
      setEvent((prev: any) => {
        if (!prev) return null;
        return { ...prev, [field]: value };
      });
      queueAutosave({ [field]: value });
    },
    [queueAutosave]
  );

  // Update multiple fields
  const updateMultipleFields = useCallback(
    (fields: Record<string, any>) => {
      setEvent((prev: any) => {
        if (!prev) return null;
        return { ...prev, ...fields };
      });
      queueAutosave(fields);
    },
    [queueAutosave]
  );

  // Manual save triggers immediately
  const manualSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    await flushChanges();
  }, [flushChanges]);

  // Navigate step
  const goToStep = useCallback(
    async (stepNumber: number) => {
      if (stepNumber < 1 || stepNumber > 8) return;

      // Flush any pending changes first
      await manualSave();

      setCurrentStepNumber(stepNumber);
      try {
        const completed = wizardState?.completedSteps || [];
        const newCompleted = Array.from(new Set([...completed, currentStepNumber]));

        const updated = await updateWizardStep(eventId, {
          currentStep: stepNumber,
          lastVisitedStep: stepNumber,
          completedSteps: newCompleted
        });
        setWizardState(updated);
      } catch (e) {
        console.error('Erro ao atualizar etapa no backend:', e);
      }
    },
    [currentStepNumber, eventId, manualSave, wizardState?.completedSteps]
  );

  const nextStep = useCallback(async () => {
    if (currentStepNumber < 8) {
      await goToStep(currentStepNumber + 1);
    }
  }, [currentStepNumber, goToStep]);

  const prevStep = useCallback(async () => {
    if (currentStepNumber > 1) {
      await goToStep(currentStepNumber - 1);
    }
  }, [currentStepNumber, goToStep]);

  // Reload when conflict occurs
  const reloadFromConflict = useCallback(async () => {
    pendingChangesRef.current = {};
    await loadData();
  }, [loadData]);

  // Discard draft
  const discardDraft = useCallback(async (): Promise<boolean> => {
    try {
      await discardEventDraft(eventId);
      if (onExit) onExit();
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao descartar rascunho');
      return false;
    }
  }, [eventId, onExit]);

  const currentStepId = STEP_IDS[currentStepNumber - 1] || 'STEP_INFORMATION';

  return {
    eventId,
    event,
    wizardState,
    categories,
    media,
    responsibilities,
    validation,
    currentStepNumber,
    currentStepId,
    saveStatus,
    lastSavedAt,
    errorMessage,
    isLoading,
    version,
    updateEventField,
    updateMultipleFields,
    goToStep,
    nextStep,
    prevStep,
    reloadFromConflict,
    discardDraft,
    manualSave
  };
}
