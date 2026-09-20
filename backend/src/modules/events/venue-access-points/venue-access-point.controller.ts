import { Request, Response } from 'express';
import { VenueAccessPointService } from './venue-access-point.service';
import { z } from 'zod';

const accessPointSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  code: z.string().min(1, 'Código é obrigatório'),
  type: z.enum(['MAIN_ENTRANCE', 'GATE', 'VIP_GATE', 'CREDENTIALS', 'STAFF', 'EMERGENCY_EXIT']),
  active: z.boolean().optional()
});

export class VenueAccessPointController {
  public static async listAccessPoints(req: Request, res: Response): Promise<void> {
    try {
      const venueId = req.params.venueId as string;
      const points = await VenueAccessPointService.listAccessPoints(venueId);
      res.json({ success: true, accessPoints: points });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async createAccessPoint(req: Request, res: Response): Promise<void> {
    try {
      const venueId = req.params.venueId as string;
      const input = accessPointSchema.parse(req.body);
      const user = (req as any).user;

      const point = await VenueAccessPointService.createAccessPoint(venueId, input, user);
      res.status(201).json({ success: true, accessPoint: point });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async updateAccessPoint(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const input = accessPointSchema.partial().parse(req.body);
      const user = (req as any).user;

      const point = await VenueAccessPointService.updateAccessPoint(id, input, user);
      res.json({ success: true, accessPoint: point });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async deleteAccessPoint(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = (req as any).user;

      await VenueAccessPointService.deleteAccessPoint(id, user);
      res.json({ success: true, message: 'Ponto de acesso excluído com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
