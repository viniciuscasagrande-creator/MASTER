import { Request, Response } from 'express';
import { TicketTypeService } from './ticket-type.service';
import { CreateEventTicketTypeSchema, UpdateEventTicketTypeSchema } from './ticket-type.schemas';

export class TicketTypeController {
  static async listCatalog(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as string | undefined;
      const catalog = await TicketTypeService.listCatalog(category);
      res.json(catalog);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar catálogo de ingressos' });
    }
  }

  static async listEventTicketTypes(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const list = await TicketTypeService.listEventTicketTypes(eventId);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar tipos de ingresso do evento' });
    }
  }

  static async getEventTicketType(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const item = await TicketTypeService.getEventTicketType(id);
      if (!item) {
        res.status(404).json({ error: 'Tipo de ingresso não encontrado' });
        return;
      }
      res.json(item);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao buscar tipo de ingresso' });
    }
  }

  static async createEventTicketType(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const parsed = CreateEventTicketTypeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Dados inválidos', details: parsed.error.format() });
        return;
      }

      const created = await TicketTypeService.createEventTicketType(eventId, parsed.data);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao criar tipo de ingresso' });
    }
  }

  static async updateEventTicketType(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const parsed = UpdateEventTicketTypeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Dados inválidos', details: parsed.error.format() });
        return;
      }

      const updated = await TicketTypeService.updateEventTicketType(id, parsed.data);
      res.json(updated);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao atualizar tipo de ingresso' });
    }
  }

  static async deleteEventTicketType(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await TicketTypeService.deleteEventTicketType(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao excluir tipo de ingresso' });
    }
  }
}
