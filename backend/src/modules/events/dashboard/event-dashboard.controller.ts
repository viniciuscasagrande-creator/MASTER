import { Request, Response } from 'express';
import { EventDashboardService } from './event-dashboard.service';
import { DashboardViewType } from '@shared/types/index';

export class EventDashboardController {
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const { sessionId, viewType } = req.query;
      const user = (req as any).user;

      const dashboard = await EventDashboardService.getEventDashboard(eventId, {
        sessionId: sessionId ? String(sessionId) : undefined,
        viewType: viewType as DashboardViewType,
        userPermissions: user?.permissions,
        userId: user?.id
      });

      res.status(200).json(dashboard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const dashboard = await EventDashboardService.getEventDashboard(eventId);
      res.status(200).json({ alerts: dashboard.alerts });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
