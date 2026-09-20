import { Request, Response } from 'express';
import { VenueSectionService } from './venue-section.service';
import { z } from 'zod';

const createSectionSchema = z.object({
  name: z.string().min(2, 'Nome do setor deve ter pelo menos 2 caracteres'),
  code: z.string().min(1, 'Código do setor é obrigatório'),
  type: z.enum(['GENERAL_ADMISSION', 'SEATED', 'TABLE', 'BOX', 'VIP', 'TECHNICAL', 'ACCESS_ONLY']),
  capacity: z.number().int().nonnegative('Capacidade deve ser zero ou positiva'),
  description: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().int().optional()
});

const updateSectionSchema = createSectionSchema.partial().extend({
  active: z.boolean().optional()
});

export class VenueSectionController {
  public static async listSections(req: Request, res: Response): Promise<void> {
    try {
      const venueId = req.params.venueId as string;
      const user = (req as any).user;
      const context = (req as any).context;

      const sections = await VenueSectionService.listSections(venueId, user, context);
      res.json({ success: true, sections });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async createSection(req: Request, res: Response): Promise<void> {
    try {
      const venueId = req.params.venueId as string;
      const input = createSectionSchema.parse(req.body);
      const user = (req as any).user;
      const context = (req as any).context;

      const section = await VenueSectionService.createSection(venueId, input, user, context);
      res.status(201).json({ success: true, section });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async updateSection(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const input = updateSectionSchema.parse(req.body);
      const user = (req as any).user;
      const context = (req as any).context;

      const section = await VenueSectionService.updateSection(id, input, user, context);
      res.json({ success: true, section });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async deleteSection(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = (req as any).user;
      const context = (req as any).context;

      await VenueSectionService.deleteSection(id, user, context);
      res.json({ success: true, message: 'Setor físico removido com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
