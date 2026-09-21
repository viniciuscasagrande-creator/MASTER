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

  // ===========================================================================
  // FASE 1.3.3 — CENTRAL DE PRODUTORES & VISÃO COMERCIAL DO PRODUTOR
  // ===========================================================================

  public static async listProducers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { search, segmentId, classification, ownerId, commercialStatus, page, pageSize } = req.query;

      const result = await (await import('./producers/commercial-producer-query.service')).CommercialProducerQueryService.listProducers(
        {
          search: search as string,
          segmentId: segmentId as string,
          classification: classification as string,
          ownerId: ownerId as string,
          commercialStatus: commercialStatus as string,
          page: page ? Number(page) : undefined,
          pageSize: pageSize ? Number(pageSize) : undefined
        },
        user
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getProducerSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;

      const summary = await (await import('./producers/commercial-producer-query.service')).CommercialProducerQueryService.getProducerCommercialSummary(
        String(id),
        user
      );

      res.status(200).json(summary);
    } catch (err) {
      next(err);
    }
  }

  public static async getCommercialAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const account = await (await import('./producers/commercial-account.service')).CommercialAccountService.getCommercialAccount(String(id));
      res.status(200).json(account);
    } catch (err) {
      next(err);
    }
  }

  public static async updateCommercialAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const account = await (await import('./producers/commercial-account.service')).CommercialAccountService.updateCommercialAccount(
        String(id),
        req.body,
        user
      );
      res.status(200).json(account);
    } catch (err) {
      next(err);
    }
  }

  public static async listContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const contacts = await (await import('./producers/commercial-account.service')).CommercialAccountService.listContacts(String(id));
      res.status(200).json(contacts);
    } catch (err) {
      next(err);
    }
  }

  public static async addContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const contact = await (await import('./producers/commercial-account.service')).CommercialAccountService.addContact(
        String(id),
        req.body,
        user
      );
      res.status(201).json(contact);
    } catch (err) {
      next(err);
    }
  }

  public static async updateContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { contactId } = req.params;
      const contact = await (await import('./producers/commercial-account.service')).CommercialAccountService.updateContact(
        String(contactId),
        req.body,
        user
      );
      res.status(200).json(contact);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { contactId } = req.params;
      await (await import('./producers/commercial-account.service')).CommercialAccountService.deleteContact(String(contactId), user);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  // ===========================================================================
  // CARTEIRA COMERCIAL
  // ===========================================================================

  public static async getMyPortfolioSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const summary = await (await import('./portfolio/portfolio.service')).PortfolioService.getMyPortfolioSummary(user.id, user.name);
      res.status(200).json(summary);
    } catch (err) {
      next(err);
    }
  }

  public static async getMyPortfolioProducers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const list = await (await import('./portfolio/portfolio.service')).PortfolioService.getPortfolioByOwner(user.id);
      res.status(200).json(list);
    } catch (err) {
      next(err);
    }
  }

  public static async assignProducerToPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const assignment = await (await import('./portfolio/portfolio.service')).PortfolioService.assignProducerToPortfolio(
        req.body,
        user
      );
      res.status(201).json(assignment);
    } catch (err) {
      next(err);
    }
  }

  public static async removeProducerFromPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      await (await import('./portfolio/portfolio.service')).PortfolioService.removeProducerFromPortfolio(String(id), user);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  // ===========================================================================
  // PROSPECÇÕES / LEADS
  // ===========================================================================

  public static async listLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { search, status, ownerId } = req.query;
      const leads = await (await import('./leads/commercial-lead.service')).CommercialLeadService.listLeads(
        {
          search: search as string,
          status: status as string,
          ownerId: ownerId as string
        },
        user
      );
      res.status(200).json(leads);
    } catch (err) {
      next(err);
    }
  }

  public static async getLeadById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const lead = await (await import('./leads/commercial-lead.service')).CommercialLeadService.getLeadById(String(id), user);
      res.status(200).json(lead);
    } catch (err) {
      next(err);
    }
  }

  public static async createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const lead = await (await import('./leads/commercial-lead.service')).CommercialLeadService.createLead(req.body, user);
      res.status(201).json(lead);
    } catch (err) {
      next(err);
    }
  }

  public static async updateLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const lead = await (await import('./leads/commercial-lead.service')).CommercialLeadService.updateLead(String(id), req.body, user);
      res.status(200).json(lead);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      await (await import('./leads/commercial-lead.service')).CommercialLeadService.deleteLead(String(id), user);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  public static async convertLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const result = await (await import('./leads/lead-conversion.service')).LeadConversionService.convertLeadToProducer(String(id), user);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ===========================================================================
  // ATIVIDADES COMERCIAIS
  // ===========================================================================

  public static async listActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { producerId, leadId, opportunityId } = req.query;
      const activities = await (await import('./activities/commercial-activity.service')).CommercialActivityService.listActivities(
        {
          producerId: producerId as string,
          leadId: leadId as string,
          opportunityId: opportunityId as string
        },
        user
      );
      res.status(200).json(activities);
    } catch (err) {
      next(err);
    }
  }

  public static async registerActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const activity = await (await import('./activities/commercial-activity.service')).CommercialActivityService.registerActivity(
        req.body,
        user
      );
      res.status(201).json(activity);
    } catch (err) {
      next(err);
    }
  }

  // ===========================================================================
  // FASE 1.3.4 — PIPELINE, ESTÁGIOS & MOTIVOS DE ENCERRAMENTO
  // ===========================================================================

  public static async listPipelines(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pipelines = await (await import('./pipeline/commercial-pipeline.service')).CommercialPipelineService.listPipelines();
      res.status(200).json(pipelines);
    } catch (err) {
      next(err);
    }
  }

  public static async getDefaultPipeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pipeline = await (await import('./pipeline/commercial-pipeline.service')).CommercialPipelineService.getDefaultPipeline();
      res.status(200).json(pipeline);
    } catch (err) {
      next(err);
    }
  }

  public static async listStages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const stages = await (await import('./pipeline/commercial-pipeline.service')).CommercialPipelineService.listStages(String(id));
      res.status(200).json(stages);
    } catch (err) {
      next(err);
    }
  }

  public static async listCloseReasons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reasons = await (await import('./pipeline/commercial-pipeline.service')).CommercialPipelineService.listCloseReasons();
      res.status(200).json(reasons);
    } catch (err) {
      next(err);
    }
  }

  // ===========================================================================
  // OPORTUNIDADES & NEGOCIAÇÕES
  // ===========================================================================

  public static async listOpportunities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { pipelineId, stageId, producerId, leadId, ownerId, status, search } = req.query;
      const opportunities = await (await import('./opportunities/opportunity-query.service')).OpportunityQueryService.listOpportunities(
        {
          pipelineId: pipelineId as string,
          stageId: stageId as string,
          producerId: producerId as string,
          leadId: leadId as string,
          ownerId: ownerId as string,
          status: status as string,
          search: search as string
        },
        user
      );
      res.status(200).json(opportunities);
    } catch (err) {
      next(err);
    }
  }

  public static async getOpportunityMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { pipelineId } = req.query;
      const metrics = await (await import('./opportunities/metrics/opportunity-metrics.service')).OpportunityMetricsService.getOpportunityMetrics(
        pipelineId as string,
        user
      );
      res.status(200).json(metrics);
    } catch (err) {
      next(err);
    }
  }

  public static async getOpportunityById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const details = await (await import('./opportunities/opportunity-query.service')).OpportunityQueryService.getOpportunityById(
        String(id),
        user
      );
      res.status(200).json(details);
    } catch (err) {
      next(err);
    }
  }

  public static async createOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const opp = await (await import('./opportunities/opportunity.service')).OpportunityService.createOpportunity(
        req.body,
        user
      );
      res.status(201).json(opp);
    } catch (err) {
      next(err);
    }
  }

  public static async updateOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const opp = await (await import('./opportunities/opportunity.service')).OpportunityService.updateOpportunity(
        String(id),
        req.body,
        user
      );
      res.status(200).json(opp);
    } catch (err) {
      next(err);
    }
  }

  public static async transitionOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { targetStageId, expectedVersion, reason, closeReasonId, closeNotes } = req.body;

      const opp = await (await import('./opportunities/transition/opportunity-transition.service')).OpportunityTransitionService.transitionStage(
        {
          opportunityId: String(id),
          targetStageId,
          expectedVersion: Number(expectedVersion),
          reason,
          closeReasonId,
          closeNotes
        },
        user
      );

      res.status(200).json(opp);
    } catch (err) {
      next(err);
    }
  }

  public static async winOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { expectedVersion, notes } = req.body;

      const opp = await (await import('./opportunities/closing/opportunity-closing.service')).OpportunityClosingService.winOpportunity(
        {
          opportunityId: String(id),
          expectedVersion: expectedVersion !== undefined ? Number(expectedVersion) : undefined,
          notes
        },
        user
      );

      res.status(200).json(opp);
    } catch (err) {
      next(err);
    }
  }

  public static async closeOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { closeReasonId, closeNotes, expectedVersion } = req.body;

      const opp = await (await import('./opportunities/closing/opportunity-closing.service')).OpportunityClosingService.closeOpportunity(
        {
          opportunityId: String(id),
          closeReasonId,
          closeNotes,
          expectedVersion: expectedVersion !== undefined ? Number(expectedVersion) : undefined
        },
        user
      );

      res.status(200).json(opp);
    } catch (err) {
      next(err);
    }
  }

  // ===========================================================================
  // FASE 1.3.5 — CATÁLOGO DE OFERTAS & PROPOSTAS COMERCIAIS
  // ===========================================================================

  public static async listOfferingCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await (await import('./proposals/offerings/commercial-offering.service')).CommercialOfferingService.listCategories();
      res.status(200).json(categories);
    } catch (err) {
      next(err);
    }
  }

  public static async listOfferings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.query;
      const offerings = await (await import('./proposals/offerings/commercial-offering.service')).CommercialOfferingService.listOfferings(categoryId as string);
      res.status(200).json(offerings);
    } catch (err) {
      next(err);
    }
  }

  public static async createOffering(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const offering = await (await import('./proposals/offerings/commercial-offering.service')).CommercialOfferingService.createOffering(req.body);
      res.status(201).json(offering);
    } catch (err) {
      next(err);
    }
  }

  public static async updateOffering(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const offering = await (await import('./proposals/offerings/commercial-offering.service')).CommercialOfferingService.updateOffering(String(id), req.body);
      res.status(200).json(offering);
    } catch (err) {
      next(err);
    }
  }

  public static async listProposals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { status, producerId, opportunityId, ownerId, search, page, limit, pendingApproval } = req.query;
      const result = await (await import('./proposals/proposal-query.service')).ProposalQueryService.listProposals(
        {
          status: status as string,
          producerId: producerId as string,
          opportunityId: opportunityId as string,
          ownerId: ownerId as string,
          search: search as string,
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 20,
          pendingApproval: pendingApproval === 'true'
        },
        user
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getProposalMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const metrics = await (await import('./proposals/proposal-query.service')).ProposalQueryService.getProposalMetrics(user);
      res.status(200).json(metrics);
    } catch (err) {
      next(err);
    }
  }

  public static async getProposalById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as any;
      const { id } = req.params;
      const proposal = await (await import('./proposals/proposal.service')).ProposalService.getProposalById(String(id));

      // Escopo de produtor
      const isProducerUser = user.role === 'PRODUTOR' || (user.roles && user.roles.includes('PRODUTOR'));
      if (isProducerUser && user.producerId && proposal.producerId !== user.producerId) {
        res.status(403).json({ error: 'Acesso negado: a proposta pertence a outro produtor.' });
        return;
      }

      // Oculta notas internas para quem não possui alçada de condições
      const hasSensitive = user.isSuperAdmin || (user.permissions && user.permissions.includes('comercial.propostas.condicoes.visualizar'));
      if (!hasSensitive) {
        proposal.internalNotes = null;
      }

      res.status(200).json(proposal);
    } catch (err) {
      next(err);
    }
  }

  public static async createProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const proposal = await (await import('./proposals/proposal.service')).ProposalService.createProposal(req.body, user);
      res.status(201).json(proposal);
    } catch (err) {
      next(err);
    }
  }

  public static async updateProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const proposal = await (await import('./proposals/proposal.service')).ProposalService.updateDraftProposal(String(id), req.body, user);
      res.status(200).json(proposal);
    } catch (err: any) {
      if (err.statusCode === 409) {
        res.status(409).json({ error: err.message, code: 'CONCURRENCY_CONFLICT' });
        return;
      }
      next(err);
    }
  }

  public static async cancelProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { reason } = req.body;
      await (await import('./proposals/proposal.service')).ProposalService.cancelProposal(String(id), reason || 'Cancelado pelo usuário', user);
      res.status(200).json({ message: 'Proposta comercial cancelada com sucesso.' });
    } catch (err) {
      next(err);
    }
  }

  public static async createProposalVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const version = await (await import('./proposals/versions/proposal-version.service')).ProposalVersionService.createNewVersion(String(id), req.body, user);
      res.status(201).json(version);
    } catch (err: any) {
      if (err.statusCode === 409) {
        res.status(409).json({ error: err.message, code: 'CONCURRENCY_CONFLICT' });
        return;
      }
      next(err);
    }
  }

  public static async getProposalDiff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { base, target } = req.query;
      const diff = await (await import('./proposals/versions/proposal-diff.service')).ProposalDiffService.compareVersions(
        String(id),
        Number(base || 1),
        Number(target || 2)
      );
      res.status(200).json(diff);
    } catch (err) {
      next(err);
    }
  }

  public static async submitProposalApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id, versionNumber } = req.params;
      const { justification, expectedVersion } = req.body;
      const result = await (await import('./proposals/approvals/proposal-approval.adapter')).ProposalApprovalAdapter.submitForApproval(
        String(id),
        Number(versionNumber),
        justification,
        user,
        expectedVersion !== undefined ? Number(expectedVersion) : undefined
      );
      res.status(200).json(result);
    } catch (err: any) {
      if (err.statusCode === 409) {
        res.status(409).json({ error: err.message, code: 'CONCURRENCY_CONFLICT' });
        return;
      }
      next(err);
    }
  }

  public static async processProposalDecision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id, versionNumber } = req.params;
      const { decision, reason, expectedVersion } = req.body;
      const result = await (await import('./proposals/approvals/proposal-approval.adapter')).ProposalApprovalAdapter.processDecision(
        String(id),
        Number(versionNumber),
        decision,
        reason,
        user,
        expectedVersion !== undefined ? Number(expectedVersion) : undefined
      );
      res.status(200).json(result);
    } catch (err: any) {
      if (err.statusCode === 409) {
        res.status(409).json({ error: err.message, code: 'CONCURRENCY_CONFLICT' });
        return;
      }
      next(err);
    }
  }

  public static async generateProposalDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id, versionNumber } = req.params;
      const result = await (await import('./proposals/documents/proposal-document.service')).ProposalDocumentService.generateDocument(
        String(id),
        Number(versionNumber),
        user
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async sendProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id, versionNumber } = req.params;
      const delivery = await (await import('./proposals/delivery/proposal-delivery.service')).ProposalDeliveryService.sendProposal(
        String(id),
        Number(versionNumber),
        req.body,
        user
      );
      res.status(200).json(delivery);
    } catch (err: any) {
      if (err.statusCode === 409) {
        res.status(409).json({ error: err.message, code: 'CONCURRENCY_CONFLICT' });
        return;
      }
      next(err);
    }
  }

  public static async registerProposalAcceptance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id, versionNumber } = req.params;
      const acceptance = await (await import('./proposals/acceptance/proposal-acceptance.service')).ProposalAcceptanceService.registerAcceptance(
        String(id),
        Number(versionNumber),
        req.body,
        user
      );
      res.status(200).json(acceptance);
    } catch (err: any) {
      if (err.statusCode === 409) {
        res.status(409).json({ error: err.message, code: 'CONCURRENCY_CONFLICT' });
        return;
      }
      next(err);
    }
  }

  public static async declineProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { id, versionNumber } = req.params;
      const result = await (await import('./proposals/acceptance/proposal-acceptance.service')).ProposalAcceptanceService.declineProposal(
        String(id),
        Number(versionNumber),
        req.body,
        user
      );
      res.status(200).json(result);
    } catch (err: any) {
      if (err.statusCode === 409) {
        res.status(409).json({ error: err.message, code: 'CONCURRENCY_CONFLICT' });
        return;
      }
      next(err);
    }
  }

  public static async getEventAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const agreement = await (await import('./agreements/event-agreement.service')).EventAgreementService.getAgreement(String(eventId));
      res.status(200).json(agreement);
    } catch (err) {
      next(err);
    }
  }

  public static async saveEventAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const user = req.user!;
      const result = await (await import('./agreements/event-agreement.service')).EventAgreementService.saveAgreement(
        String(eventId),
        req.body,
        user
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getEventAdvances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const advances = await (await import('./agreements/event-agreement.service')).EventAgreementService.listAdvances(String(eventId));
      res.status(200).json(advances);
    } catch (err) {
      next(err);
    }
  }

  public static async createEventAdvance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const user = req.user!;
      const { requestedCents, notes } = req.body;
      const advance = await (await import('./agreements/event-agreement.service')).EventAgreementService.requestAdvance(
        String(eventId),
        Number(requestedCents),
        user,
        notes
      );
      res.status(201).json(advance);
    } catch (err) {
      next(err);
    }
  }

  public static async reconcileOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;
      const result = await (await import('./agreements/event-agreement.service')).EventAgreementService.reconcileOrder(String(id), user);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async reissueTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user!;
      const { reason } = req.body;
      const result = await (await import('./agreements/event-agreement.service')).EventAgreementService.reissueTicket(String(id), reason, user);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async listSalesChannels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json([
        { id: 'chan-1', code: 'SITE', name: 'Site Oficial DiskIngressos', commissionRatePercent: 10.0, status: 'active' },
        { id: 'chan-2', code: 'BOX_OFFICE', name: 'Bilheteria Física', commissionRatePercent: 5.0, status: 'active' },
        { id: 'chan-3', code: 'PDV', name: 'PDVs Parceiros', commissionRatePercent: 7.5, status: 'active' },
        { id: 'chan-4', code: 'DISK', name: 'Portal Produtor (Emissão Direta)', commissionRatePercent: 0.0, status: 'active' }
      ]);
    } catch (err) {
      next(err);
    }
  }
}
