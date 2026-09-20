import { Request, Response } from 'express';
import { VenueMapService } from './venue-map.service';
import { z } from 'zod';

const createMapSchema = z.object({
  name: z.string().min(2, 'Nome do mapa deve ter pelo menos 2 caracteres'),
  type: z.enum(['CANVAS_SEATED', 'GENERAL_AREAS', 'HYBRID', 'SVG_MAP', 'SCHEMATIC']).optional(),
  backgroundDocumentId: z.string().optional()
});

const bulkSeatsSchema = z.object({
  seatIds: z.array(z.string()).min(1, 'Pelo menos um assento deve ser selecionado'),
  updates: z.object({
    seatType: z.string().optional(),
    accessible: z.boolean().optional(),
    companionSeat: z.boolean().optional(),
    restrictedView: z.boolean().optional(),
    active: z.boolean().optional()
  })
});

export class VenueMapController {
  public static async listMaps(req: Request, res: Response): Promise<void> {
    try {
      const venueId = req.params.venueId as string;
      const maps = await VenueMapService.listMaps(venueId);
      res.json({ success: true, maps });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async getMapWithVersion(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const versionId = req.query.versionId as string | undefined;

      const result = await VenueMapService.getMapWithVersion(id, versionId);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  }

  public static async createMap(req: Request, res: Response): Promise<void> {
    try {
      const venueId = req.params.venueId as string;
      const input = createMapSchema.parse(req.body);
      const user = (req as any).user;

      const result = await VenueMapService.createMap(venueId, input, user);
      res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async saveMapLayout(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string; // versionId
      const input = req.body;
      const user = (req as any).user;

      const version = await VenueMapService.saveMapLayout(id, input, user);
      res.json({ success: true, version });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async publishMapVersion(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string; // versionId
      const user = (req as any).user;

      const published = await VenueMapService.publishMapVersion(id, user);
      res.json({ success: true, version: published, message: 'Versão do mapa ativada com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async duplicateMapVersion(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string; // versionId
      const user = (req as any).user;

      const newVersion = await VenueMapService.duplicateMapVersion(id, user);
      res.status(201).json({ success: true, version: newVersion, message: 'Versão do mapa duplicada com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async bulkUpdateSeats(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string; // versionId
      const { seatIds, updates } = bulkSeatsSchema.parse(req.body);
      const user = (req as any).user;

      const result = await VenueMapService.bulkUpdateSeats(id, seatIds, updates, user);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
