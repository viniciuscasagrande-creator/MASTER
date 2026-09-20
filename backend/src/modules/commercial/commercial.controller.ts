import { Request, Response, NextFunction } from 'express';
import { CommercialDashboardService } from './dashboard/commercial-dashboard.service';
import { CommercialPerformanceService } from './performance/commercial-performance.service';
import { OrderQueryService } from './orders/order-query.service';
import { OrderService } from './orders/order.service';
import { OrderStatus } from '@shared/types/index';

export class CommercialController {
  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { producerId, eventId, sessionId, startDate, endDate } = req.query;

      const dashboard = await CommercialDashboardService.getDashboard(
        user,
        {
          producerId: producerId as string,
          eventId: eventId as string,
          sessionId: sessionId as string,
          startDate: startDate as string,
          endDate: endDate as string
        },
        req.ip
      );

      res.status(200).json(dashboard);
    } catch (err) {
      next(err);
    }
  }

  public static async getPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { producerId, eventId, sessionId, startDate, endDate } = req.query;

      const performance = await CommercialPerformanceService.getPerformance(
        user,
        {
          producerId: producerId as string,
          eventId: eventId as string,
          sessionId: sessionId as string,
          startDate: startDate as string,
          endDate: endDate as string
        },
        req.ip
      );

      res.status(200).json(performance);
    } catch (err) {
      next(err);
    }
  }

  public static async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { search, producerId, eventId, sessionId, status, salesChannelId, startDate, endDate, page, pageSize } = req.query;

      const result = await OrderQueryService.listOrders(
        user,
        {
          search: search as string,
          producerId: producerId as string,
          eventId: eventId as string,
          sessionId: sessionId as string,
          status: status as (OrderStatus | 'ALL'),
          salesChannelId: salesChannelId as string,
          startDate: startDate as string,
          endDate: endDate as string,
          page: page ? Number(page) : undefined,
          pageSize: pageSize ? Number(pageSize) : undefined
        },
        req.ip
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;

      const order = await OrderQueryService.getOrderById(user, String(id), req.ip);
      res.status(200).json(order);
    } catch (err) {
      next(err);
    }
  }

  public static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const body = req.body;

      const producerId: string = typeof body.producerId === 'string'
        ? body.producerId
        : (user.scope?.producers?.[0] || 'prd_100');

      const order = await OrderService.createOrder({
        producerId,
        eventId: body.eventId,
        eventName: body.eventName,
        salesChannelId: body.salesChannelId,
        salesChannelName: body.salesChannelName,
        initialStatus: body.initialStatus || 'PENDING',
        buyer: body.buyer,
        items: body.items,
        expiresInMinutes: body.expiresInMinutes
      });

      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  }

  public static async transitionOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { targetStatus, reason, expectedVersion } = req.body;

      const updated = await OrderService.transitionStatus({
        orderId: String(id),
        targetStatus,
        actor: {
          name: user.name,
          type: 'USER',
          userId: user.id
        },
        reason,
        expectedVersion
      });

      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }

  public static async exportOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { search, producerId, eventId, status, startDate, endDate } = req.query;

      const result = await OrderQueryService.listOrders(
        user,
        {
          search: search as string,
          producerId: producerId as string,
          eventId: eventId as string,
          status: status as (OrderStatus | 'ALL'),
          startDate: startDate as string,
          endDate: endDate as string,
          page: 1,
          pageSize: 5000
        },
        req.ip
      );

      const headers = ['Código', 'Data', 'Status', 'Comprador', 'Documento', 'Canal', 'Itens', 'Total (R$)'];
      const rows = result.orders.map(o => [
        o.publicCode,
        new Date(o.createdAt).toLocaleString('pt-BR'),
        o.status,
        o.buyerSnapshot?.name || '—',
        o.buyerSnapshot?.documentMasked || o.buyerSnapshot?.document || '—',
        o.salesChannelName || 'Online',
        o.totalTicketsCount || o.itemsCount || 1,
        o.totalAmount.toFixed(2)
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.map((cell: any) => `"${cell}"`).join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=pedidos_export_${Date.now()}.csv`);
      res.status(200).send('\uFEFF' + csvContent);
    } catch (err) {
      next(err);
    }
  }

  public static async exportSales(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { producerId, eventId, sessionId, startDate, endDate } = req.query;

      const performance = await CommercialPerformanceService.getPerformance(
        user,
        {
          producerId: producerId as string,
          eventId: eventId as string,
          sessionId: sessionId as string,
          startDate: startDate as string,
          endDate: endDate as string
        },
        req.ip
      );

      const headers = ['Tipo', 'Identificador', 'Nome', 'Ingressos Vendidos', 'Capacidade', 'Ocupação (%)', 'Volume Bruto (R$)'];
      const rows: any[] = [];

      for (const e of performance.events) {
        rows.push(['EVENTO', e.eventId, e.eventName, e.ticketsSold, e.capacity, `${e.occupancyPercentage}%`, e.grossSales !== null ? e.grossSales.toFixed(2) : 'SIGILOSO']);
      }
      for (const s of performance.sessions) {
        rows.push(['SESSAO', s.sessionId, s.sessionName, s.ticketsSold, s.capacity, `${s.occupancyPercentage}%`, s.grossSales !== null ? s.grossSales.toFixed(2) : 'SIGILOSO']);
      }
      for (const sec of performance.sections) {
        rows.push(['SETOR', sec.sectionId, sec.sectionName, sec.sold, sec.capacity, `${sec.occupancyPercentage}%`, sec.grossSales !== null ? sec.grossSales.toFixed(2) : 'SIGILOSO']);
      }
      for (const b of performance.batches) {
        rows.push(['LOTE', b.batchId, b.batchName, b.sold, b.capacity, '—', b.grossSales !== null ? b.grossSales.toFixed(2) : 'SIGILOSO']);
      }

      const csvContent = [headers.join(','), ...rows.map(r => r.map((cell: any) => `"${cell}"`).join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=vendas_performance_export_${Date.now()}.csv`);
      res.status(200).send('\uFEFF' + csvContent);
    } catch (err) {
      next(err);
    }
  }
}
