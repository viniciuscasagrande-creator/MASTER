import { Request, Response } from 'express';
import { VenueService } from './venue.service';
import { createVenueSchema, updateVenueSchema, listVenuesFilterSchema } from './venue.schemas';

export class VenueController {
  public static async listVenues(req: Request, res: Response): Promise<void> {
    try {
      const filters = listVenuesFilterSchema.parse(req.query);
      const user = (req as any).user;
      const context = (req as any).context;

      const result = await VenueService.listVenues(filters, user, context);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async getVenueSummary(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const context = (req as any).context;

      const summary = await VenueService.getVenueSummary(user, context);
      res.json({ success: true, summary });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getVenue(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = (req as any).user;
      const context = (req as any).context;

      const venue = await VenueService.getVenueById(id, user, context);
      res.json({ success: true, venue });
    } catch (err: any) {
      const status = err.message.includes('não foi encontrado') ? 404 : 403;
      res.status(status).json({ success: false, message: err.message });
    }
  }

  public static async createVenue(req: Request, res: Response): Promise<void> {
    try {
      const input = createVenueSchema.parse(req.body);
      const user = (req as any).user;
      const context = (req as any).context;

      const venue = await VenueService.createVenue(input, user, context);
      res.status(201).json({ success: true, venue });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async updateVenue(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const input = updateVenueSchema.parse(req.body);
      const user = (req as any).user;
      const context = (req as any).context;

      const venue = await VenueService.updateVenue(id, input, user, context);
      res.json({ success: true, venue });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async archiveVenue(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = (req as any).user;
      const context = (req as any).context;

      const venue = await VenueService.archiveVenue(id, user, context);
      res.json({ success: true, venue, message: 'Local arquivado com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
