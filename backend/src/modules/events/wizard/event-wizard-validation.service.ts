import {
  EventWizardValidationResult,
  StepValidationDetail,
  StepIssue,
  StepValidationStatus
} from './event-wizard.types';

export class EventWizardValidationService {
  public static validate(event: any, extraData: { media?: any[]; responsibilities?: any[] } = {}): EventWizardValidationResult {
    const steps: StepValidationDetail[] = [];
    const media = extraData.media || [];
    const responsibilities = extraData.responsibilities || [];

    // ==========================================
    // ETAPA 1: INFORMAÇÕES
    // ==========================================
    const step1Issues: StepIssue[] = [];
    const name = (event.name || event.title || '').trim();
    if (!name) {
      step1Issues.push({
        stepId: 'STEP_INFORMATION',
        field: 'name',
        message: 'O nome do evento é obrigatório.',
        severity: 'BLOCKING'
      });
    } else if (name.length < 3) {
      step1Issues.push({
        stepId: 'STEP_INFORMATION',
        field: 'name',
        message: 'O nome do evento deve conter no mínimo 3 caracteres.',
        severity: 'BLOCKING'
      });
    }

    if (!event.categoryId) {
      step1Issues.push({
        stepId: 'STEP_INFORMATION',
        field: 'categoryId',
        message: 'A categoria do evento é obrigatória.',
        severity: 'BLOCKING'
      });
    }

    if (!event.format) {
      step1Issues.push({
        stepId: 'STEP_INFORMATION',
        field: 'format',
        message: 'O formato do evento (Presencial, Online ou Híbrido) é obrigatório.',
        severity: 'BLOCKING'
      });
    }

    if (!event.slug) {
      step1Issues.push({
        stepId: 'STEP_INFORMATION',
        field: 'slug',
        message: 'O identificador amigável (slug) do evento é obrigatório.',
        severity: 'BLOCKING'
      });
    }

    if (!event.description || event.description.trim().length === 0) {
      step1Issues.push({
        stepId: 'STEP_INFORMATION',
        field: 'description',
        message: 'A descrição detalhada do evento é recomendada.',
        severity: 'WARNING'
      });
    }

    steps.push({
      stepId: 'STEP_INFORMATION',
      stepNumber: 1,
      title: 'Informações',
      status: this.determineStepStatus(step1Issues, !!name && !!event.categoryId && !!event.format),
      issues: step1Issues
    });

    // ==========================================
    // ETAPA 2: ORGANIZAÇÃO
    // ==========================================
    const step2Issues: StepIssue[] = [];
    if (!event.producerId) {
      step2Issues.push({
        stepId: 'STEP_ORGANIZATION',
        field: 'producerId',
        message: 'O produtor responsável é obrigatório.',
        severity: 'BLOCKING'
      });
    }

    if (!event.publicOrganizerName) {
      step2Issues.push({
        stepId: 'STEP_ORGANIZATION',
        field: 'publicOrganizerName',
        message: 'O nome público do organizador não foi definido (será exibido o nome padrão do produtor).',
        severity: 'WARNING'
      });
    }

    if (!event.internalResponsibleUserId) {
      step2Issues.push({
        stepId: 'STEP_ORGANIZATION',
        field: 'internalResponsibleUserId',
        message: 'Nenhum responsável interno principal selecionado.',
        severity: 'WARNING'
      });
    }

    steps.push({
      stepId: 'STEP_ORGANIZATION',
      stepNumber: 2,
      title: 'Organização',
      status: this.determineStepStatus(step2Issues, !!event.producerId),
      issues: step2Issues
    });

    // ==========================================
    // ETAPA 3: LOCAL
    // ==========================================
    const step3Issues: StepIssue[] = [];
    const isPhysical = event.format === 'IN_PERSON' || event.format === 'HYBRID' || !event.format;
    const isOnline = event.format === 'ONLINE' || event.format === 'HYBRID';

    if (isPhysical) {
      if (!event.venue && !event.city) {
        step3Issues.push({
          stepId: 'STEP_LOCATION',
          field: 'venue',
          message: 'Local ou Cidade/UF são obrigatórios para eventos presenciais ou híbridos.',
          severity: 'BLOCKING'
        });
      }
      if (!event.state) {
        step3Issues.push({
          stepId: 'STEP_LOCATION',
          field: 'state',
          message: 'O estado (UF) do local físico não foi informado.',
          severity: 'WARNING'
        });
      }
    }

    if (isOnline) {
      if (!event.onlinePlatform && !event.onlineUrl) {
        step3Issues.push({
          stepId: 'STEP_LOCATION',
          field: 'onlineUrl',
          message: 'Plataforma de transmissão ou link de acesso online não foram configurados.',
          severity: 'WARNING'
        });
      }
    }

    steps.push({
      stepId: 'STEP_LOCATION',
      stepNumber: 3,
      title: 'Local',
      status: this.determineStepStatus(step3Issues, isPhysical ? (!!event.venue || !!event.city) : (!!event.onlinePlatform || !!event.onlineUrl)),
      issues: step3Issues
    });

    // ==========================================
    // ETAPA 4: DATAS
    // ==========================================
    const step4Issues: StepIssue[] = [];
    if (!event.startAt) {
      step4Issues.push({
        stepId: 'STEP_DATES',
        field: 'startAt',
        message: 'A data e horário de início do evento são obrigatórios.',
        severity: 'BLOCKING'
      });
    }

    if (!event.endAt) {
      step4Issues.push({
        stepId: 'STEP_DATES',
        field: 'endAt',
        message: 'A data e horário de término do evento são obrigatórios.',
        severity: 'BLOCKING'
      });
    }

    if (event.startAt && event.endAt) {
      const start = new Date(event.startAt).getTime();
      const end = new Date(event.endAt).getTime();
      if (isNaN(start) || isNaN(end)) {
        step4Issues.push({
          stepId: 'STEP_DATES',
          field: 'startAt',
          message: 'Formato de data e horário inválido.',
          severity: 'BLOCKING'
        });
      } else if (end <= start) {
        step4Issues.push({
          stepId: 'STEP_DATES',
          field: 'endAt',
          message: 'A data de término deve ser posterior ao início do evento.',
          severity: 'BLOCKING'
        });
      }
    }

    if (!event.timezone) {
      step4Issues.push({
        stepId: 'STEP_DATES',
        field: 'timezone',
        message: 'O fuso horário de realização do evento é obrigatório.',
        severity: 'BLOCKING'
      });
    }

    steps.push({
      stepId: 'STEP_DATES',
      stepNumber: 4,
      title: 'Datas',
      status: this.determineStepStatus(step4Issues, !!event.startAt && !!event.endAt),
      issues: step4Issues
    });

    // ==========================================
    // ETAPA 5: IDENTIDADE VISUAL
    // ==========================================
    const step5Issues: StepIssue[] = [];
    const hasMainMedia = event.coverDocumentId || media.some((m: any) => m.type === 'MAIN' || m.type === 'COVER');
    const hasShareMedia = media.some((m: any) => m.type === 'SHARE');

    if (!hasMainMedia) {
      step5Issues.push({
        stepId: 'STEP_MEDIA',
        field: 'coverDocumentId',
        message: 'Imagem principal ou capa do evento ausente (obrigatória para publicação futura).',
        severity: 'WARNING'
      });
    }

    if (!hasShareMedia) {
      step5Issues.push({
        stepId: 'STEP_MEDIA',
        field: 'shareImage',
        message: 'Imagem para compartilhamento em redes sociais não informada.',
        severity: 'WARNING'
      });
    }

    steps.push({
      stepId: 'STEP_MEDIA',
      stepNumber: 5,
      title: 'Identidade visual',
      status: this.determineStepStatus(step5Issues, hasMainMedia),
      issues: step5Issues
    });

    // ==========================================
    // ETAPA 6: CONFIGURAÇÕES
    // ==========================================
    const step6Issues: StepIssue[] = [];
    if (!event.currency) {
      step6Issues.push({
        stepId: 'STEP_SETTINGS',
        field: 'currency',
        message: 'Moeda padrão do evento não configurada.',
        severity: 'BLOCKING'
      });
    }

    if (!event.locale) {
      step6Issues.push({
        stepId: 'STEP_SETTINGS',
        field: 'locale',
        message: 'Idioma principal do evento não configurado.',
        severity: 'BLOCKING'
      });
    }

    steps.push({
      stepId: 'STEP_SETTINGS',
      stepNumber: 6,
      title: 'Configurações',
      status: this.determineStepStatus(step6Issues, true),
      issues: step6Issues
    });

    // ==========================================
    // ETAPA 7: RESPONSÁVEIS
    // ==========================================
    const step7Issues: StepIssue[] = [];
    const hasPrimaryResp = !!event.internalResponsibleUserId || responsibilities.some((r: any) => r.responsibilityType === 'PRIMARY');
    if (!hasPrimaryResp) {
      step7Issues.push({
        stepId: 'STEP_RESPONSIBILITIES',
        field: 'responsibilities',
        message: 'Nenhum responsável operacional principal atribuído.',
        severity: 'WARNING'
      });
    }

    steps.push({
      stepId: 'STEP_RESPONSIBILITIES',
      stepNumber: 7,
      title: 'Responsáveis',
      status: this.determineStepStatus(step7Issues, hasPrimaryResp),
      issues: step7Issues
    });

    // ==========================================
    // ETAPA 8: REVISÃO
    // ==========================================
    let totalBlocking = 0;
    let totalWarnings = 0;

    for (const s of steps) {
      for (const issue of s.issues) {
        if (issue.severity === 'BLOCKING') totalBlocking++;
        if (issue.severity === 'WARNING') totalWarnings++;
      }
    }

    steps.push({
      stepId: 'STEP_REVIEW',
      stepNumber: 8,
      title: 'Revisão',
      status: totalBlocking > 0 ? 'ERROR' : totalWarnings > 0 ? 'WARNING' : 'COMPLETED',
      issues: []
    });

    return {
      valid: totalBlocking === 0,
      blockingIssues: totalBlocking,
      warnings: totalWarnings,
      steps
    };
  }

  private static determineStepStatus(issues: StepIssue[], hasCoreData: boolean): StepValidationStatus {
    const hasBlocking = issues.some(i => i.severity === 'BLOCKING');
    const hasWarning = issues.some(i => i.severity === 'WARNING');

    if (hasBlocking) return 'ERROR';
    if (hasWarning) return 'WARNING';
    if (hasCoreData) return 'COMPLETED';
    return 'IN_PROGRESS';
  }
}
