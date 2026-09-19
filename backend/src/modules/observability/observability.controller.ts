import { Request, Response } from 'express';
import { AuditService } from '../../observability/audit/audit.service';
import { TracingService } from '../../observability/tracing/tracing.service';
import { ErrorService } from '../../observability/errors/error.service';
import { MetricsService } from '../../observability/metrics/metrics.service';
import { HealthService } from '../../observability/health/health.service';
import { prisma } from '../../core/database/prisma';

export class ObservabilityController {
  private auditService: AuditService;
  private tracingService: TracingService;
  private errorService: ErrorService;
  private metricsService: MetricsService;
  private healthService: HealthService;

  constructor() {
    this.auditService = new AuditService();
    this.tracingService = new TracingService();
    this.errorService = new ErrorService();
    this.metricsService = new MetricsService();
    this.healthService = new HealthService();
  }

  // --- AUDITORIA ---
  public getAuditLogs = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const { correlationId, requestId, module, action, resourceType, resourceId, userId, producerId, eventId, result, startDate, endDate, search, limit, offset } = req.query;

      const filters: any = {
        correlationId: correlationId as string,
        requestId: requestId as string,
        module: module as string,
        action: action as string,
        resourceType: resourceType as string,
        resourceId: resourceId as string,
        userId: userId as string,
        producerId: producerId as string,
        eventId: eventId as string,
        result: result as any,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined
      };

      const data = await this.auditService.getAuditLogs(filters, currentUser);
      return res.json({ success: true, data });
    } catch (err: any) {
      if (err.message?.includes('Acesso negado')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getAuditById = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const { id } = req.params;
      const data = await this.auditService.getAuditById(id as string, currentUser);
      if (!data) {
        return res.status(404).json({ success: false, error: 'Registro de auditoria não encontrado.' });
      }
      return res.json({ success: true, data });
    } catch (err: any) {
      if (err.message?.includes('Acesso negado')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getAuditByResource = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const { resourceType, resourceId } = req.params;
      const data = await this.auditService.getAuditByResource(resourceType as string, resourceId as string, currentUser);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getAuditByUser = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const { userId } = req.params;
      const data = await this.auditService.getAuditByUser(userId as string, currentUser);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public exportAudit = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const { format = 'JSON', ...filters } = req.body;

      const result = await this.auditService.exportAudit(
        { format, ...filters },
        currentUser
      );

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      return res.send(result.content);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  // --- RASTREABILIDADE / TRACES ---
  public getTraces = async (req: Request, res: Response) => {
    try {
      const { status, producerId, eventId, userId, search, limit } = req.query;
      const data = await this.tracingService.listTraces({
        status: status as any,
        producerId: producerId as string,
        eventId: eventId as string,
        userId: userId as string,
        search: search as string,
        limit: limit ? Number(limit) : undefined
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getTraceByCorrelationId = async (req: Request, res: Response) => {
    try {
      const { correlationId } = req.params;
      const data = await this.tracingService.getTraceByCorrelationId(correlationId as string);
      if (!data) {
        return res.status(404).json({ success: false, error: 'Trace não encontrado para o correlationId informado.' });
      }
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getTimelineByResource = async (req: Request, res: Response) => {
    try {
      const { resourceType, resourceId } = req.params;
      const data = await this.tracingService.getTimelineByResource(resourceType as string, resourceId as string);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  // --- OBSERVABILIDADE / HEALTH / ERROS / PERFORMANCE ---
  public getOverview = async (req: Request, res: Response) => {
    try {
      const data = this.metricsService.getOverviewStats();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getHealth = async (req: Request, res: Response) => {
    try {
      const { eventId } = req.query;
      if (eventId) {
        const data = await this.healthService.getEventHealth(eventId as string);
        return res.json({ success: true, data });
      }
      const data = await this.healthService.getSystemHealth();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getBusinessEvents = async (req: Request, res: Response) => {
    try {
      const { eventType, correlationId, sourceService, limit } = req.query;
      const where: any = {};
      if (eventType) where.eventType = eventType;
      if (correlationId) where.correlationId = correlationId;
      if (sourceService) where.sourceService = sourceService;

      const data = await prisma.businessEvent.findMany({
        where,
        take: limit ? Number(limit) : 50
      });

      const parsed = data.map((d: any) => ({
        ...d,
        payload: typeof d.payload === 'string' ? JSON.parse(d.payload) : d.payload,
        consumers: typeof d.consumers === 'string' ? JSON.parse(d.consumers) : d.consumers
      }));

      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getOutboxEvents = async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const where: any = {};
      if (status) where.status = status;

      const data = await prisma.eventOutbox.findMany({ where });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getInboxWebhooks = async (req: Request, res: Response) => {
    try {
      const { status, source } = req.query;
      const where: any = {};
      if (status) where.status = status;
      if (source) where.source = source;

      const data = await prisma.integrationInbox.findMany({ where });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getErrors = async (req: Request, res: Response) => {
    try {
      const { severity, service, status, search } = req.query;
      const data = await this.errorService.getErrorGroups({
        severity: severity as any,
        service: service as string,
        status: status as string,
        search: search as string
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getErrorById = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const { id } = req.params;
      const data = await this.errorService.getErrorGroupById(id as string, currentUser);
      if (!data) {
        return res.status(404).json({ success: false, error: 'Grupo de erros não encontrado.' });
      }
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public resolveErrorGroup = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = await this.errorService.resolveErrorGroup(id as string);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getPerformance = async (req: Request, res: Response) => {
    try {
      const percentiles = this.metricsService.calculatePercentiles();
      const slowestRoutes = this.metricsService.getSlowestRoutes();
      const database = this.metricsService.getDatabaseMetrics();
      const redis = this.metricsService.getRedisMetrics();

      return res.json({
        success: true,
        data: {
          percentiles,
          slowestRoutes,
          database,
          redis
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getQueues = async (req: Request, res: Response) => {
    try {
      const data = this.metricsService.getQueueMetrics();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getWorkers = async (req: Request, res: Response) => {
    try {
      const data = this.metricsService.getQueueMetrics().workers;
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getIntegrations = async (req: Request, res: Response) => {
    try {
      const data = this.metricsService.getIntegrationsMetrics();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public getAlerts = async (req: Request, res: Response) => {
    try {
      const data = await this.healthService.getActiveAlerts();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  public resolveAlert = async (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const { id } = req.params;
      const data = await this.healthService.resolveAlert(id as string, currentUser?.name || 'Operador');
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };
}
