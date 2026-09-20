import {
  EventWizardStepId,
  StepValidationStatus,
  StepIssue,
  StepValidationDetail,
  EventWizardValidationResult,
  EventWizardStateDTO,
  EventCategoryDTO,
  EventMediaDTO,
  EventResponsibilityDTO,
  EventResponsibilityType
} from '@shared/types/index';

export type {
  EventWizardStepId,
  StepValidationStatus,
  StepIssue,
  StepValidationDetail,
  EventWizardValidationResult,
  EventWizardStateDTO,
  EventCategoryDTO,
  EventMediaDTO,
  EventResponsibilityDTO,
  EventResponsibilityType
};

export const WIZARD_STEPS_CONFIG: Array<{
  id: EventWizardStepId;
  stepNumber: number;
  title: string;
  description: string;
}> = [
  { id: 'STEP_INFORMATION', stepNumber: 1, title: 'Informações', description: 'Nome, categoria, formato e classificação' },
  { id: 'STEP_ORGANIZATION', stepNumber: 2, title: 'Organização', description: 'Produtor e responsável operacional' },
  { id: 'STEP_LOCATION', stepNumber: 3, title: 'Local', description: 'Local físico, endereço ou plataforma online' },
  { id: 'STEP_DATES', stepNumber: 4, title: 'Datas', description: 'Início, término, fuso horário e sessões' },
  { id: 'STEP_MEDIA', stepNumber: 5, title: 'Identidade visual', description: 'Imagens, capas e fotos do evento' },
  { id: 'STEP_SETTINGS', stepNumber: 6, title: 'Configurações', description: 'Moeda, idioma, visibilidade e privacidade' },
  { id: 'STEP_RESPONSIBILITIES', stepNumber: 7, title: 'Responsáveis', description: 'Papéis operacionais, financeiro e suporte' },
  { id: 'STEP_REVIEW', stepNumber: 8, title: 'Revisão', description: 'Conferência geral e prontidão do rascunho' }
];
