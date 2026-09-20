import { Request, Response } from 'express';
import { ComplimentaryService } from './complimentary.service';

export class ComplimentaryController {
  static async listCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await ComplimentaryService.listCategories();
      res.json(categories);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar categorias de cortesia' });
    }
  }

  static async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const category = await ComplimentaryService.createCategory(req.body);
      res.status(201).json(category);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao criar categoria de cortesia' });
    }
  }

  static async getQuotas(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const quotas = await ComplimentaryService.getQuotas(eventId);
      res.json(quotas);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao carregar cotas de cortesia' });
    }
  }

  static async setQuota(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const quota = await ComplimentaryService.setQuota(eventId, req.body);
      res.json(quota);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao salvar cota de cortesia' });
    }
  }

  static async listRequests(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const status = req.query.status as string | undefined;
      const requests = await ComplimentaryService.listRequests(eventId, status);
      res.json(requests);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar solicitações de cortesia' });
    }
  }

  static async createRequest(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const user = (req as any).user || { id: 'usr_prod_1', name: 'Produtor Responsável' };
      const request = await ComplimentaryService.createRequest(eventId, req.body, user.id, user.name);
      res.status(201).json(request);
    } catch (err: any) {
      const status = err.statusCode || (err.message && err.message.includes('excedida') ? 409 : 500);
      res.status(status).json({ error: err.message || 'Erro ao criar solicitação de cortesia' });
    }
  }

  static async addGuests(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.requestId as string;
      const guests = await ComplimentaryService.addGuests(requestId, req.body);
      res.status(201).json(guests);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao adicionar convidados' });
    }
  }

  static async approveRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.requestId as string;
      const user = (req as any).user || { id: 'usr_dir_1', name: 'Diretoria Disk Ingressos' };
      const updated = await ComplimentaryService.approveRequest(requestId, user.id, user.name);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao aprovar solicitação' });
    }
  }

  static async rejectRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.requestId as string;
      const { reason } = req.body;
      const updated = await ComplimentaryService.rejectRequest(requestId, reason || 'Não atende aos critérios');
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao rejeitar solicitação' });
    }
  }

  static async issueTickets(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.requestId as string;
      const { guestIds } = req.body || {};
      const updated = await ComplimentaryService.issueTickets(requestId, guestIds);
      res.json(updated);
    } catch (err: any) {
      const status = err.statusCode || 500;
      res.status(status).json({ error: err.message || 'Erro ao emitir ingressos de cortesia' });
    }
  }

  static async cancelRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.requestId as string;
      const { reason } = req.body;
      const updated = await ComplimentaryService.cancelRequest(requestId, reason || 'Cancelado pelo solicitante');
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao cancelar solicitação' });
    }
  }
}
