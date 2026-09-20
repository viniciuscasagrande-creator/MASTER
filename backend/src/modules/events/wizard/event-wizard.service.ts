import { prisma } from '../../../core/database/prisma';
import { EventMapper } from '../event.mapper';
import { EventCategoryService } from '../categories/event-category.service';
import { EventMediaService } from '../media/event-media.service';
import { EventResponsibilityService } from '../responsibilities/event-responsibility.service';
import { EventWizardValidationService } from './event-wizard-validation.service';
import { EventWizardStateDTO, StepValidationStatus } from './event-wizard.types';
import { EventNotFoundError } from '../errors/event.errors';
import { DomainEvents } from '../../../events/DomainEvents';

export class EventWizardService {
  public static async getOrCreateWizardState(eventId: string, userId?: string): Promise<EventWizardStateDTO> {
    let state = await prisma.eventWizardState.findUnique({
      where: { eventId }
    });

    if (!state) {
      state = await prisma.eventWizardState.create({
        data: {
          eventId,
          currentStep: 1,
          completedSteps: JSON.stringify([]),
          lastVisitedStep: 1,
          stepStatuses: JSON.stringify({}),
          updatedBy: userId || 'system'
        }
      });
    }

    let completedSteps: number[] = [];
    let stepStatuses: Record<string, StepValidationStatus> = {};

    try {
      completedSteps = typeof state.completedSteps === 'string' ? JSON.parse(state.completedSteps) : (state.completedSteps || []);
    } catch {
      completedSteps = [];
    }

    try {
      stepStatuses = typeof state.stepStatuses === 'string' ? JSON.parse(state.stepStatuses) : (state.stepStatuses || {});
    } catch {
      stepStatuses = {};
    }

    return {
      id: state.id,
      eventId: state.eventId,
      currentStep: state.currentStep || 1,
      completedSteps,
      lastVisitedStep: state.lastVisitedStep || 1,
      stepStatuses,
      updatedAt: state.updatedAt ? new Date(state.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  public static async getWizardData(eventId: string) {
    const rawEvent = await prisma.event.findUnique({ where: { id: eventId } });
    if (!rawEvent) {
      throw new EventNotFoundError(eventId);
    }

    const wizardState = await this.getOrCreateWizardState(eventId, rawEvent.updatedBy || rawEvent.createdBy);
    const categories = await EventCategoryService.getCategoriesHierarchy();
    const media = await EventMediaService.listByEvent(eventId);
    const responsibilities = await EventResponsibilityService.listByEvent(eventId);

    const validation = EventWizardValidationService.validate(rawEvent, { media, responsibilities });

    // Resolve internalResponsibleUserName if applicable
    let internalResponsibleUserName: string | null = null;
    if (rawEvent.internalResponsibleUserId) {
      const user = await prisma.user.findUnique({ where: { id: rawEvent.internalResponsibleUserId } });
      internalResponsibleUserName = user?.name || null;
    }

    // Resolve producer
    let producerName: string | undefined;
    if (rawEvent.producerId) {
      const prd = await prisma.producer.findUnique({ where: { id: rawEvent.producerId } });
      producerName = prd?.name;
    }

    // Resolve category name
    let categoryName: string | undefined;
    if (rawEvent.categoryId) {
      const cat = await prisma.eventCategory.findUnique({ where: { id: rawEvent.categoryId } });
      categoryName = cat?.name;
    }

    let subcategoryName: string | undefined;
    if (rawEvent.subcategoryId) {
      const sub = await prisma.eventCategory.findUnique({ where: { id: rawEvent.subcategoryId } });
      subcategoryName = sub?.name;
    }

    const eventDetail = {
      ...EventMapper.toDetail(rawEvent, producerName),
      subcategoryId: rawEvent.subcategoryId || null,
      subcategoryName,
      format: rawEvent.format || 'IN_PERSON',
      ageRating: rawEvent.ageRating || 'Livre',
      ageRatingDescription: rawEvent.ageRatingDescription || null,
      onlinePlatform: rawEvent.onlinePlatform || null,
      onlineUrl: rawEvent.onlineUrl || null,
      onlineInstructions: rawEvent.onlineInstructions || null,
      hasMultipleSessions: Boolean(rawEvent.hasMultipleSessions),
      currency: rawEvent.currency || 'BRL',
      locale: rawEvent.locale || 'pt-BR',
      visibility: rawEvent.visibility || 'PRIVATE',
      allowSearchIndexing: Boolean(rawEvent.allowSearchIndexing),
      publicOrganizerName: rawEvent.publicOrganizerName || null,
      operationalContact: rawEvent.operationalContact || null,
      operationalEmail: rawEvent.operationalEmail || null,
      internalResponsibleUserId: rawEvent.internalResponsibleUserId || null,
      internalResponsibleUserName,
      address: rawEvent.address || null,
      addressNumber: rawEvent.addressNumber || null,
      complement: rawEvent.complement || null,
      neighborhood: rawEvent.neighborhood || null,
      zipCode: rawEvent.zipCode || null,
      estimatedCapacity: rawEvent.estimatedCapacity || null,
      version: rawEvent.version || 1,
      wizardState,
      media,
      responsibilities
    };

    return {
      event: eventDetail,
      wizardState,
      categories,
      media,
      responsibilities,
      validation
    };
  }

  public static async updateStepState(
    eventId: string,
    data: {
      currentStep?: number;
      completedSteps?: number[];
      lastVisitedStep?: number;
      stepStatuses?: Record<string, StepValidationStatus>;
    },
    userId: string
  ): Promise<EventWizardStateDTO> {
    const rawEvent = await prisma.event.findUnique({ where: { id: eventId } });
    if (!rawEvent) {
      throw new EventNotFoundError(eventId);
    }

    const existingState = await this.getOrCreateWizardState(eventId, userId);

    const updatePayload: any = {
      updatedBy: userId,
      updatedAt: new Date()
    };

    if (data.currentStep !== undefined) updatePayload.currentStep = data.currentStep;
    if (data.lastVisitedStep !== undefined) updatePayload.lastVisitedStep = data.lastVisitedStep;
    if (data.completedSteps !== undefined) updatePayload.completedSteps = JSON.stringify(data.completedSteps);
    if (data.stepStatuses !== undefined) updatePayload.stepStatuses = JSON.stringify(data.stepStatuses);

    await prisma.eventWizardState.update({
      where: { eventId },
      data: updatePayload
    });

    const updated = await this.getOrCreateWizardState(eventId, userId);

    // Emit event bus
    await DomainEvents.dispatch({
      id: `evt_wiz_${Date.now()}`,
      type: 'EVENT_WIZARD_STEP_CHANGED' as any,
      producerId: rawEvent.producerId,
      eventId,
      resourceType: 'EVENT_WIZARD_STATE',
      resourceId: eventId,
      actorUserId: userId,
      data: {
        stepNumber: updated.currentStep,
        lastVisitedStep: updated.lastVisitedStep,
        completedSteps: updated.completedSteps
      },
      timestamp: new Date()
    });

    return updated;
  }
}
