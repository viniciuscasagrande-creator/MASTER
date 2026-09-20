import { Request, Response } from 'express';
import { SalesChannelService } from './sales-channel.service';

export class SalesChannelController {
  static async listAvailableChannels(req: Request, res: Response): Promise<void> {
    try {
      const channels = await SalesChannelService.listAvailableChannels();
      res.json(channels);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar canais disponíveis' });
    }
  }

  static async getEventChannels(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const channels = await SalesChannelService.getEventChannels(eventId);
      res.json(channels);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao carregar canais do evento' });
    }
  }

  static async configureChannel(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const updated = await SalesChannelService.configureChannel(eventId, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao configurar canal do evento' });
    }
  }

  static async toggleChannel(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const salesChannelId = req.params.salesChannelId as string;
      const { enabled } = req.body;
      const updated = await SalesChannelService.toggleChannel(eventId, salesChannelId, Boolean(enabled));
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao alterar status do canal' });
    }
  }

  static async setChannelAllocation(req: Request, res: Response): Promise<void> {
    try {
      const eventId = req.params.eventId as string;
      const eventSalesChannelId = req.params.eventSalesChannelId as string;
      const allocation = await SalesChannelService.setChannelAllocation(eventId, eventSalesChannelId, req.body);
      res.json(allocation);
    } catch (err: any) {
      const status = err.message && err.message.includes('não pode exceder') ? 400 : 500;
      res.status(status).json({ error: err.message || 'Erro ao alocar estoque para o canal' });
    }
  }

  static async listSalesPoints(req: Request, res: Response): Promise<void> {
    try {
      const venueId = req.query.venueId as string | undefined;
      const points = await SalesChannelService.listSalesPoints(venueId);
      res.json(points);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar pontos de venda' });
    }
  }

  static async createSalesPoint(req: Request, res: Response): Promise<void> {
    try {
      const point = await SalesChannelService.createSalesPoint(req.body);
      res.status(201).json(point);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao criar ponto de venda' });
    }
  }

  static async listSalesPartners(req: Request, res: Response): Promise<void> {
    try {
      const partners = await SalesChannelService.listSalesPartners();
      res.json(partners);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar parceiros' });
    }
  }

  static async createSalesPartner(req: Request, res: Response): Promise<void> {
    try {
      const partner = await SalesChannelService.createSalesPartner(req.body);
      res.status(201).json(partner);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao cadastrar parceiro' });
    }
  }
}
