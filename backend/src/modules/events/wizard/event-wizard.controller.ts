import { Request, Response } from 'express';
import { EventWizardService } from './event-wizard.service';
import { EventWizardValidationService } from './event-wizard-validation.service';
import { updateWizardStepSchema } from '../creation/event-draft.schemas';
import { EventAccessPolicy } from '../policies/event-access.policy';
import { prisma } from '../../../core/database/prisma';
import { EventMediaService } from '../media/event-media.service';
import { EventResponsibilityService } from '../responsibilities/event-responsibility.service';
import { AppError } from '../../../core/errors/AppError';
import { EventNotFoundError } from '../errors/event.errors';

export class EventWizardController {
  public static async getWizard(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const eventId = String(req.params.eventId);

      const rawEvent = await prisma.event.findUnique({ where: { id: eventId } });
      if (!rawEvent) {
        throw new EventNotFoundError(eventId);
      }

      // Check access policy
      EventAccessPolicy.verifyEventAccess(user, rawEvent);

      const wizardData = await EventWizardService.getWizardData(eventId);
      res.json({
        success: true,
        data: wizardData
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ success: false, error: err.message });
      } else {
        res.status(500).json({ success: false, error: err.message || 'Erro ao carregar dados do wizard' });
      }
    }
  }

  public static async updateStep(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const eventId = String(req.params.eventId);

      const rawEvent = await prisma.event.findUnique({ where: { id: eventId } });
      if (!rawEvent) {
        throw new EventNotFoundError(eventId);
      }

      EventAccessPolicy.verifyEventAccess(user, rawEvent);

      const parsed = updateWizardStepSchema.parse(req.body);
      const updatedState = await EventWizardService.updateStepState(eventId, parsed as any, user.id);

      res.json({
        success: true,
        data: updatedState
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ success: false, error: err.message });
      } else {
        res.status(400).json({ success: false, error: err.message || 'Erro ao atualizar etapa do wizard' });
      }
    }
  }

  public static async validateWizard(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const eventId = String(req.params.eventId);

      const rawEvent = await prisma.event.findUnique({ where: { id: eventId } });
      if (!rawEvent) {
        throw new EventNotFoundError(eventId);
      }

      EventAccessPolicy.verifyEventAccess(user, rawEvent);

      const media = await EventMediaService.listByEvent(eventId);
      const responsibilities = await EventResponsibilityService.listByEvent(eventId);

      const validation = EventWizardValidationService.validate(rawEvent, { media, responsibilities });

      res.json({
        success: true,
        data: validation
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ success: false, error: err.message });
      } else {
        res.status(500).json({ success: false, error: err.message || 'Erro ao validar wizard' });
      }
    }
  }
}
