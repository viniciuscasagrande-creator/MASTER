import { Request, Response } from 'express';
import {
  AnalyticsService,
  ReportService,
  ExportService,
  ReportSchedulerService,
  SnapshotService,
  DashboardService,
  WidgetRegistry
} from '../../analytics';
import { MetricDomain } from '@shared/types/index';

export class AnalyticsController {
  private analyticsService: AnalyticsService;
  private reportService: ReportService;
  private exportService: ExportService;
  private schedulerService: ReportSchedulerService;
  private snapshotService: SnapshotService;
  private dashboardService: DashboardService;
  private widgetRegistry: WidgetRegistry;

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.reportService = new ReportService(this.analyticsService);
    this.exportService = new ExportService();
    this.schedulerService = new ReportSchedulerService(this.reportService, this.exportService);
    this.snapshotService = new SnapshotService(this.reportService);
    this.dashboardService = new DashboardService(this.analyticsService);
    this.widgetRegistry = WidgetRegistry.getInstance();
  }

  // --- ANALYTICS ENGINE & QUERY ---
  public executeQuery = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const result = await this.analyticsService.executeQuery(req.body, currentUser);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      if (err.message?.includes('Acesso negado') || err.message?.includes('Permissão insuficiente') || err.message?.includes('Escopo')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public getMetricsCatalog = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const metrics = this.analyticsService.getMetricsCatalog(currentUser);
      return res.json({ success: true, data: metrics });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getMetricDetails = async (req: Request, res: Response) => {
    try {
      const code = String(req.params.code);
      const metric = this.analyticsService.getMetricDetails(code);
      if (!metric) {
        return res.status(404).json({ success: false, error: 'Métrica não encontrada' });
      }
      return res.json({ success: true, data: metric });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public explainMetric = async (req: Request, res: Response) => {
    try {
      const code = String(req.params.code);
      const explanation = this.analyticsService.explainMetric(code);
      return res.json({ success: true, data: explanation });
    } catch (err: any) {
      return res.status(404).json({ success: false, error: err.message });
    }
  };

  public getDimensionsCatalog = async (_req: Request, res: Response) => {
    try {
      const dimensions = this.analyticsService.getDimensionsCatalog();
      return res.json({ success: true, data: dimensions });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public invalidateCache = async (req: Request, res: Response) => {
    try {
      const { eventType } = req.body;
      const invalidatedCount = this.analyticsService.invalidateCache(eventType || 'UNKNOWN_EVENT');
      return res.json({ success: true, data: { invalidatedCount } });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getCacheStats = async (_req: Request, res: Response) => {
    try {
      const stats = this.analyticsService.getCacheStats();
      return res.json({ success: true, data: stats });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  // --- SAVED REPORTS ---
  public listReports = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const reports = await this.reportService.listReports(currentUser);
      return res.json({ success: true, data: reports });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getReportById = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const id = String(req.params.id);
      const report = await this.reportService.getReportById(id, currentUser);
      if (!report) {
        return res.status(404).json({ success: false, error: 'Relatório não encontrado' });
      }
      return res.json({ success: true, data: report });
    } catch (err: any) {
      if (err.message?.includes('Acesso negado')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public createReport = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const report = await this.reportService.createReport(req.body, currentUser);
      return res.status(201).json({ success: true, data: report });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public updateReport = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const id = String(req.params.id);
      const updated = await this.reportService.updateReport(id, req.body, currentUser);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      if (err.message?.includes('permissão') || err.message?.includes('Apenas o criador')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public deleteReport = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const id = String(req.params.id);
      await this.reportService.deleteReport(id, currentUser);
      return res.json({ success: true, message: 'Relatório excluído com sucesso' });
    } catch (err: any) {
      if (err.message?.includes('permissão') || err.message?.includes('Apenas o criador')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public duplicateReport = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const id = String(req.params.id);
      const duplicated = await this.reportService.duplicateReport(id, currentUser);
      return res.status(201).json({ success: true, data: duplicated });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public shareReport = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const id = String(req.params.id);
      const updated = await this.reportService.shareReport(
        id,
        {
          visibility: req.body.visibility,
          sharedWithUserIds: req.body.sharedWithUserIds,
          sharedWithRoleCodes: req.body.sharedWithRoleCodes
        },
        currentUser
      );
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      if (err.message?.includes('permissão')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public executeReport = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const id = String(req.params.id);
      const result = await this.reportService.executeReport(
        id,
        currentUser,
        req.body.overrides
      );
      return res.json({ success: true, data: result });
    } catch (err: any) {
      if (err.message?.includes('Acesso negado') || err.message?.includes('Permissão')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  // --- EXPORTS ---
  public requestExport = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const job = await this.exportService.requestExport(req.body, currentUser);
      return res.status(201).json({ success: true, data: job });
    } catch (err: any) {
      if (err.message?.includes('Acesso negado') || err.message?.includes('Permissão')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public listExports = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const jobs = await this.exportService.listExports(currentUser);
      return res.json({ success: true, data: jobs });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getExportById = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const job = await this.exportService.getExportById(id);
      if (!job) {
        return res.status(404).json({ success: false, error: 'Trabalho de exportação não encontrado' });
      }
      return res.json({ success: true, data: job });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public downloadExport = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const file = await this.exportService.downloadExport(id);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      return res.send(file.buffer);
    } catch (err: any) {
      if (err.message?.includes('expirado')) {
        return res.status(410).json({ success: false, error: err.message });
      }
      return res.status(404).json({ success: false, error: err.message });
    }
  };

  // --- SCHEDULES ---
  public listSchedules = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const schedules = await this.schedulerService.listSchedules(currentUser);
      return res.json({ success: true, data: schedules });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public createSchedule = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const schedule = await this.schedulerService.createSchedule(req.body, currentUser);
      return res.status(201).json({ success: true, data: schedule });
    } catch (err: any) {
      if (err.message?.includes('permissão') || err.message?.includes('Acesso negado')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public updateSchedule = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const id = String(req.params.id);
      const updated = await this.schedulerService.updateSchedule(id, req.body, currentUser);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      if (err.message?.includes('Apenas o criador')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public deleteSchedule = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const id = String(req.params.id);
      await this.schedulerService.deleteSchedule(id, currentUser);
      return res.json({ success: true, message: 'Agendamento removido' });
    } catch (err: any) {
      if (err.message?.includes('Apenas o criador')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public runScheduleNow = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const job = await this.schedulerService.executeSchedule(id);
      return res.json({ success: true, data: job });
    } catch (err: any) {
      if (err.message?.includes('Permissão revogada') || err.message?.includes('bloqueado')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  // --- SNAPSHOTS ---
  public createSnapshot = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const reportId = String(req.params.reportId);
      const snapshot = await this.snapshotService.createSnapshot(
        {
          reportId,
          title: req.body.title,
          snapshotDate: req.body.snapshotDate,
          notes: req.body.notes
        },
        currentUser
      );
      return res.status(201).json({ success: true, data: snapshot });
    } catch (err: any) {
      if (err.message?.includes('Acesso negado') || err.message?.includes('permissão')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public listSnapshots = async (req: Request, res: Response) => {
    try {
      const reportId = req.params.reportId ? String(req.params.reportId) : undefined;
      const snapshots = await this.snapshotService.listSnapshots(reportId);
      return res.json({ success: true, data: snapshots });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getSnapshotById = async (req: Request, res: Response) => {
    try {
      const snapshotId = String(req.params.snapshotId);
      const snapshot = await this.snapshotService.getSnapshot(snapshotId);
      if (!snapshot) {
        return res.status(404).json({ success: false, error: 'Snapshot não encontrado' });
      }
      return res.json({ success: true, data: snapshot });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  // --- DASHBOARDS & WIDGETS ---
  public getExecutiveDashboard = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const period = req.query.period ? JSON.parse(req.query.period as string) : { type: 'THIS_MONTH' };
      const dashboard = await this.dashboardService.getExecutiveDashboard(period, currentUser);
      return res.json({ success: true, data: dashboard });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public getProducerDashboard = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const producerId = String(req.params.producerId);
      const eventId = req.query.eventId as string;
      const period = req.query.period ? JSON.parse(req.query.period as string) : { type: 'THIS_MONTH' };
      const dashboard = await this.dashboardService.getProducerDashboard(producerId, eventId, period, currentUser);
      return res.json({ success: true, data: dashboard });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public getDomainDashboard = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const domainStr = String(req.params.domain).toUpperCase() as MetricDomain;
      const period = req.query.period ? JSON.parse(req.query.period as string) : { type: 'THIS_MONTH' };
      const producerId = req.query.producerId as string;
      const eventId = req.query.eventId as string;
      const dashboard = await this.dashboardService.getDomainDashboard(
        domainStr,
        period,
        currentUser,
        { producerId, eventId }
      );
      return res.json({ success: true, data: dashboard });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public getAllWidgets = async (_req: Request, res: Response) => {
    try {
      const widgets = this.widgetRegistry.getAllWidgets();
      return res.json({ success: true, data: widgets });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  // --- GOALS (REALIZADO X META) ---
  public listGoals = async (req: Request, res: Response) => {
    try {
      const { producerId, eventId, period, metricCode } = req.query;
      const goals = await this.dashboardService.listGoals({
        producerId: producerId as string,
        eventId: eventId as string,
        period: period as string,
        metricCode: metricCode as string
      });
      return res.json({ success: true, data: goals });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public createGoal = async (req: Request, res: Response) => {
    try {
      const goal = await this.dashboardService.createGoal(req.body);
      return res.status(201).json({ success: true, data: goal });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public updateGoalProgress = async (req: Request, res: Response) => {
    try {
      const { currentValue, projectionValue } = req.body;
      const id = String(req.params.id);
      const updated = await this.dashboardService.updateGoalProgress(
        id,
        currentValue,
        projectionValue
      );
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };

  public deleteGoal = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      await this.dashboardService.deleteGoal(id);
      return res.json({ success: true, message: 'Meta removida com sucesso' });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  };
}
