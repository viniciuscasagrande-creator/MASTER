import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../core/database/prisma';
import { AuditService } from '../audit/audit.service';

export class ContextController {
  public static async getContext(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const context = req.context!;

      // 1. Fetch active producer & event details if selected
      const activeProducer = context.producerId
        ? await prisma.producer.findUnique({ where: { id: context.producerId } })
        : null;

      const activeEvent = context.eventId
        ? await prisma.event.findUnique({ where: { id: context.eventId } })
        : null;

      // 2. Fetch available producers according to user scope
      let availableProducers = [];
      if (user.isSuperAdmin || user.scope.isGlobal) {
        availableProducers = await prisma.producer.findMany();
      } else {
        availableProducers = await prisma.producer.findMany({
          where: { id: { in: user.scope.producers } }
        });
      }

      // 3. Fetch available events according to user scope and active producer filter
      let availableEvents = [];
      const eventWhereClause: any = {};

      if (context.producerId) {
        eventWhereClause.producerId = context.producerId;
      }

      if (!user.isSuperAdmin && !user.scope.isGlobal) {
        if (user.scope.events.length > 0) {
          eventWhereClause.id = { in: user.scope.events };
        } else if (user.scope.producers.length > 0 && !context.producerId) {
          eventWhereClause.producerId = { in: user.scope.producers };
        }
      }

      availableEvents = await prisma.event.findMany({
        where: eventWhereClause
      });

      // 4. Determine default dashboard by primary role
      let defaultDashboard = 'overview';
      if (user.roles.includes('FINANCEIRO')) defaultDashboard = 'finance';
      else if (user.roles.includes('MARKETING')) defaultDashboard = 'marketing';
      else if (user.roles.includes('ATENDIMENTO_SAC')) defaultDashboard = 'sac';
      else if (user.roles.includes('ESTORNO')) defaultDashboard = 'refunds';
      else if (user.roles.includes('CONTABILIDADE')) defaultDashboard = 'accounting';
      else if (user.roles.includes('COMERCIAL')) defaultDashboard = 'commercial';
      else if (user.roles.includes('SUPORTE_EVENTOS')) defaultDashboard = 'event-support';
      else if (user.roles.includes('REMARKETING')) defaultDashboard = 'remarketing';
      else if (user.roles.includes('PRODUTOR')) defaultDashboard = 'events';

      res.status(200).json({
        context: {
          producer: activeProducer,
          event: activeEvent,
          isGlobalScope: user.isSuperAdmin || user.scope.isGlobal,
          isLockedToSingleProducer: !user.isSuperAdmin && !user.scope.isGlobal && user.scope.producers.length === 1,
          isLockedToSingleEvent: !user.isSuperAdmin && !user.scope.isGlobal && user.scope.events.length === 1,
          defaultDashboard
        },
        availableProducers,
        availableEvents
      });
    } catch (err) {
      next(err);
    }
  }

  public static async setProducer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { producerId } = req.params;
      const user = req.user!;

      // Scope validation
      if (!user.isSuperAdmin && !user.scope.isGlobal) {
        if (!user.scope.producers.includes(String(producerId))) {
          res.status(403).json({
            error: '403 — Você não possui autorização para operar este produtor.',
            code: 'CONTEXT_ACCESS_DENIED'
          });
          return;
        }
      }

      const producer = await prisma.producer.findUnique({ where: { id: String(producerId) } });
      if (!producer) {
        res.status(404).json({ error: 'Produtor não encontrado.' });
        return;
      }

      await AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'CHANGE_PRODUCER_CONTEXT',
        resource: 'CONTEXT',
        producerId: producer.id,
        details: `Usuário selecionou o produtor ativo: '${producer.name}'.`,
        result: 'SUCCESS'
      });

      res.status(200).json({
        success: true,
        message: `Contexto alterado para o produtor ${producer.name}.`,
        producer
      });
    } catch (err) {
      next(err);
    }
  }

  public static async setEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const user = req.user!;

      const event = await prisma.event.findUnique({ where: { id: String(eventId) } });
      if (!event) {
        res.status(404).json({ error: 'Evento não encontrado.' });
        return;
      }

      // Scope validation
      if (!user.isSuperAdmin && !user.scope.isGlobal) {
        const isEventAllowed = user.scope.events.length === 0 || user.scope.events.includes(event.id);
        const isProducerAllowed = user.scope.producers.includes(event.producerId);

        if (!isEventAllowed || !isProducerAllowed) {
          res.status(403).json({
            error: '403 — Você não possui autorização para acessar este evento.',
            code: 'CONTEXT_ACCESS_DENIED'
          });
          return;
        }
      }

      const producer = await prisma.producer.findUnique({ where: { id: event.producerId } });

      await AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'CHANGE_EVENT_CONTEXT',
        resource: 'CONTEXT',
        eventId: event.id,
        producerId: event.producerId,
        details: `Usuário selecionou o evento ativo: '${event.title}'.`,
        result: 'SUCCESS'
      });

      res.status(200).json({
        success: true,
        message: `Contexto alterado para o evento ${event.title}.`,
        event,
        producer
      });
    } catch (err) {
      next(err);
    }
  }

  public static async clearEvent(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Filtro de evento limpo. Exibindo todos os eventos permitidos.'
    });
  }

  public static async clearProducer(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Filtro de produtor limpo. Exibindo todos os produtores permitidos.'
    });
  }
}
