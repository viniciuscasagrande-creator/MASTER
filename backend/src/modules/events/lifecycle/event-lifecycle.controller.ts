import { Request, Response } from 'express';
import { EventTransitionService } from './event-transition.service';
import { EventReviewService } from '../review/event-review.service';
import { EventPublicationService } from '../publication/event-publication.service';
import { prisma } from '../../../core/database/prisma';

export class EventLifecycleController {
  /**
   * Consulta as transições de status disponíveis para o evento atual
   */
  static async getTransitions(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const userPermissions = (req as any).user?.permissions || [];

      const result = await EventTransitionService.getAvailableTransitions(eventId, userPermissions);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Executa a transição de status do evento
   */
  static async requestTransition(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const { targetStatus, reason, notes } = req.body;
      const user = (req as any).user || { id: 'usr_admin', name: 'Administrador' };

      const result = await EventTransitionService.requestTransition(
        eventId,
        { targetStatus, reason, notes },
        user
      );

      res.status(200).json({
        message: `Evento transicionado para ${targetStatus} com sucesso.`,
        data: result
      });
    } catch (error: any) {
      const status = error.code === 'TRANSITION_BLOCKED' ? 422 : 400;
      res.status(status).json({
        error: error.message,
        code: error.code || 'TRANSITION_FAILED',
        details: error.details || []
      });
    }
  }

  /**
   * Obtém o snapshot de revisão mais recente
   */
  static async getLatestSnapshot(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const snapshot = await EventReviewService.getLatestSnapshot(eventId);
      res.status(200).json({ snapshot });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Congela um novo snapshot imutável de revisão
   */
  static async createSnapshot(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const user = (req as any).user || { id: 'usr_admin', name: 'Administrador' };

      const snapshot = await EventReviewService.createSnapshot(eventId, user);
      res.status(201).json({
        message: 'Snapshot de revisão congelado com sucesso.',
        snapshot
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Valida a integridade do snapshot de revisão contra a configuração em tempo real
   */
  static async verifySnapshotIntegrity(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const result = await EventReviewService.validateSnapshotIntegrity(eventId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Publica imediatamente o evento abrindo vendas
   */
  static async publishImmediate(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const user = (req as any).user || { id: 'usr_admin', name: 'Administrador' };
      const { mode, scheduledAt, timezone, openSalesImmediately } = req.body;

      const result = await EventPublicationService.publishEventImmediate(
        eventId,
        { mode: mode || 'IMMEDIATE', scheduledAt, timezone, openSalesImmediately },
        user
      );

      res.status(200).json({
        message: 'Evento publicado com sucesso! Vendas abertas.',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Agenda a publicação futura do evento
   */
  static async schedulePublication(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const user = (req as any).user || { id: 'usr_admin', name: 'Administrador' };
      const { scheduledAt, timezone } = req.body;

      const schedule = await EventPublicationService.schedulePublication(
        eventId,
        { mode: 'SCHEDULED', scheduledAt, timezone },
        user
      );

      res.status(201).json({
        message: 'Publicação agendada com sucesso.',
        schedule
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Lista o histórico de agendamentos de publicação
   */
  static async listSchedules(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const schedules = await EventPublicationService.getSchedules(eventId);
      res.status(200).json({ schedules });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Pausa vendas temporariamente
   */
  static async pauseSales(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const user = (req as any).user || { id: 'usr_admin', name: 'Administrador' };
      const { reason } = req.body;

      const result = await EventPublicationService.pauseSales(eventId, { reason }, user);
      res.status(200).json({
        message: 'Vendas pausadas com sucesso.',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Retoma vendas
   */
  static async resumeSales(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const user = (req as any).user || { id: 'usr_admin', name: 'Administrador' };

      const result = await EventPublicationService.resumeSales(eventId, user);
      res.status(200).json({
        message: 'Vendas retomadas com sucesso.',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Gera token de preview assinado
   */
  static async generatePreviewToken(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const user = (req as any).user || { id: 'usr_admin', name: 'Administrador' };

      const tokenData = EventPublicationService.generatePreviewToken(eventId, user);
      res.status(200).json(tokenData);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Obtém os dados completos do evento para renderização do preview público
   */
  static async getPreviewData(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'Token de preview é obrigatório.' });
        return;
      }

      const verification = EventPublicationService.verifyPreviewToken(token);
      if (!verification.valid || !verification.eventId) {
        res.status(401).json({ error: verification.error || 'Token inválido ou expirado.' });
        return;
      }

      const event = await prisma.event.findUnique({ where: { id: verification.eventId } });
      if (!event) {
        res.status(404).json({ error: 'Evento não encontrado.' });
        return;
      }

      const [sessions, sections, ticketTypes, batches] = await Promise.all([
        prisma.eventSession.findMany({ where: { eventId: event.id } }),
        prisma.eventSection.findMany({ where: { eventId: event.id, active: true } }),
        (prisma as any).ticketType?.findMany?.({ where: { eventId: event.id, active: true } }) || [],
        (prisma as any).ticketBatch?.findMany?.({ where: { eventId: event.id } }) || []
      ]);

      res.status(200).json({
        event,
        sessions,
        sections,
        ticketTypes,
        batches
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
