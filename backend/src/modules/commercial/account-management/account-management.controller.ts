import { Request, Response } from 'express';
import { AccountQueryService } from './account-query.service';
import { AccountTimelineService } from './account-timeline.service';
import { RenewalQueryService } from './renewals/renewal-query.service';
import { RenewalOrchestratorService } from './renewals/renewal-orchestrator.service';
import { CommercialMovementService } from './movements/commercial-movement.service';
import { CommercialChangeImpactService } from './movements/change-impact.service';
import { AccountCommercialAlertsProvider } from './alerts/account-commercial-alerts.provider';

export class AccountManagementController {
  // 1. Contas & Carteira
  public static async listAccounts(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string,
        responsibleId: req.query.responsibleId as string,
        commercialStatus: req.query.commercialStatus as any,
        onlyWithExpiringContracts: req.query.onlyWithExpiringContracts === 'true'
      };
      const result = await AccountQueryService.listAccounts(filters, (req as any).user);
      res.json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao listar contas comerciais.' });
    }
  }

  public static async getAccountDetails(req: Request, res: Response): Promise<void> {
    try {
      const result = await AccountQueryService.getAccountDetails(req.params.producerId as string, (req as any).user);
      res.json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao carregar detalhes da conta comercial.' });
    }
  }

  public static async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const result = await AccountQueryService.getMetrics((req as any).user);
      res.json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao calcular métricas de gestão de contas.' });
    }
  }

  public static async getAccountTimeline(req: Request, res: Response): Promise<void> {
    try {
      const result = await AccountTimelineService.getAccountTimeline(req.params.producerId as string);
      res.json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao obter linha do tempo comercial.' });
    }
  }

  public static async getAccountAlerts(req: Request, res: Response): Promise<void> {
    try {
      const producerId = req.params.producerId as string | undefined;
      const result = producerId
        ? await AccountCommercialAlertsProvider.getAlertsForProducer(producerId)
        : await AccountCommercialAlertsProvider.getAllAlerts();
      res.json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao carregar alertas comerciais.' });
    }
  }

  // 2. Central de Renovações
  public static async listRenewals(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        producerId: req.query.producerId as string,
        status: req.query.status as any,
        renewalType: req.query.renewalType as any,
        responsibleId: req.query.responsibleId as string,
        onlyPlanningWindow: req.query.onlyPlanningWindow === 'true',
        onlyOverdue: req.query.onlyOverdue === 'true'
      };
      const result = await RenewalQueryService.listRenewals(filters, (req as any).user);
      res.json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao listar central de renovações.' });
    }
  }

  public static async getRenewalById(req: Request, res: Response): Promise<void> {
    try {
      const result = await RenewalQueryService.getRenewalById(req.params.id as string);
      if (!result) {
        res.status(404).json({ error: 'Renovação não encontrada.' });
        return;
      }
      res.json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao buscar renovação.' });
    }
  }

  public static async startRenewalNegotiation(req: Request, res: Response): Promise<void> {
    try {
      const result = await RenewalOrchestratorService.startRenewalNegotiation(req.body, (req as any).user);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao iniciar ciclo de renovação.' });
    }
  }

  public static async updateRenewalStatus(req: Request, res: Response): Promise<void> {
    try {
      const result = await RenewalOrchestratorService.updateRenewalStatus(req.params.id as string, req.body, (req as any).user);
      res.json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao atualizar status de renovação.' });
    }
  }

  public static async decideRenewal(req: Request, res: Response): Promise<void> {
    try {
      const result = await RenewalOrchestratorService.decideRenewal(req.params.id as string, req.body, (req as any).user);
      res.json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao registrar decisão de renovação.' });
    }
  }

  // 3. Movimentações Comerciais (Expansão, Upgrade, Downgrade, Novos Serviços)
  public static async listMovements(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        producerId: req.query.producerId as string,
        movementType: req.query.movementType as any,
        status: req.query.status as any,
        ownerId: req.query.ownerId as string
      };
      const result = await CommercialMovementService.listMovements(filters, (req as any).user);
      res.json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao listar movimentações comerciais.' });
    }
  }

  public static async createMovement(req: Request, res: Response): Promise<void> {
    try {
      const result = await CommercialMovementService.createMovement(req.body, (req as any).user);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao criar oportunidade de movimentação.' });
    }
  }

  // 4. Comparador de Impacto Comercial (Simulação Consultiva)
  public static async simulateChangeImpact(req: Request, res: Response): Promise<void> {
    try {
      const result = await CommercialChangeImpactService.simulateChangeImpact(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao simular impacto comercial.' });
    }
  }
}
