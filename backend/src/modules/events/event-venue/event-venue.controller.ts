import { Request, Response } from 'express';
import { EventVenueService } from './event-venue.service';
import { z } from 'zod';

const linkVenueSchema = z.object({
  venueId: z.string().min(1, 'ID do local é obrigatório'),
  venueMapId: z.string().optional(),
  venueMapVersionId: z.string().optional()
});

const updateSectionSchema = z.object({
  name: z.string().optional(),
  capacity: z.number().int().nonnegative().optional(),
  technicalReservation: z.number().int().nonnegative().optional(),
  enabled: z.boolean().optional()
});

export class EventVenueController {
  public static async linkVenue(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const { venueId, venueMapId, venueMapVersionId } = linkVenueSchema.parse(req.body);
      const user = (req as any).user;
      const context = (req as any).context;

      const eventVenue = await EventVenueService.linkVenueToEvent(
        eventId,
        venueId,
        venueMapId,
        venueMapVersionId,
        user,
        context
      );
      res.status(201).json({ success: true, eventVenue });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async getEventVenues(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const venues = await EventVenueService.getEventVenues(eventId);
      res.json({ success: true, venues });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async unlinkVenue(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const venueId = req.params.venueId as string;
      const user = (req as any).user;

      await EventVenueService.unlinkVenueFromEvent(eventId, venueId, user);
      res.json({ success: true, message: 'Local desvinculado com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async listEventSections(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const sections = await EventVenueService.listEventSections(eventId);
      res.json({ success: true, sections });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async updateEventSection(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const input = updateSectionSchema.parse(req.body);
      const user = (req as any).user;

      const section = await EventVenueService.updateEventSection(id, input, user);
      res.json({ success: true, section });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
