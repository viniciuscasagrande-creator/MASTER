import { prisma } from '../../../../core/database/prisma';
import { AccountCommercialAlertDTO } from '../../../../../../shared/types';
import { RenewalPolicy } from '../renewals/renewal-policy';

export class AccountCommercialAlertsProvider {
  /**
   * Coleta e computa alertas factuais e auditáveis para uma conta ou para a carteira geral
   */
  public static async getAlertsForProducer(producerId: string): Promise<AccountCommercialAlertDTO[]> {
    const producer = await prisma.producer.findUnique({
      where: { id: producerId }
    });

    if (!producer) return [];

    const alerts: AccountCommercialAlertDTO[] = [];
    const now = new Date();

    // 1. Contratos ativos deste produtor
    const contracts = await prisma.commercialContract.findMany({
      where: {
        producerId,
        status: { in: ['ACTIVE', 'SIGNED'] }
      }
    });

    for (const contract of contracts) {
      if (!contract.effectiveUntil) continue;

      const expiresAt = new Date(contract.effectiveUntil);
      const days = RenewalPolicy.getDaysUntilExpiration(expiresAt);

      // Busca se já existe renovação em andamento
      const activeRenewals = await prisma.contractRenewal.findMany({
        where: {
          contractId: contract.id,
          status: { in: ['PLANNED', 'IN_PROGRESS', 'PROPOSAL', 'AWAITING_DECISION'] }
        }
      });

      // Alerta 1: Contrato expirado e não renovado (CRITICAL)
      if (days < 0) {
        alerts.push({
          id: `alert_overdue_${contract.id}`,
          code: 'CONTRACT_OVERDUE',
          severity: 'CRITICAL',
          title: `Contrato ${contract.publicCode} Vencido`,
          description: `O contrato expirou em ${expiresAt.toLocaleDateString('pt-BR')} (${Math.abs(days)} dias atrás) e requer regularização comercial imediata.`,
          producerId,
          producerName: producer.name,
          contractId: contract.id,
          actionUrl: `/comercial/gestao-contas?tab=renovacoes&contractId=${contract.id}`,
          createdAt: now.toISOString()
        });
      }
      // Alerta 2: Contrato expirando em menos de 30 dias sem renovação em andamento (WARNING)
      else if (days <= 30 && activeRenewals.length === 0) {
        alerts.push({
          id: `alert_expiring_${contract.id}`,
          code: 'RENEWAL_WINDOW_CRITICAL',
          severity: 'WARNING',
          title: `Contrato ${contract.publicCode} Vence em ${days} Dias`,
          description: `Vencimento em ${expiresAt.toLocaleDateString('pt-BR')}. Nenhuma negociação de renovação foi iniciada até o momento.`,
          producerId,
          producerName: producer.name,
          contractId: contract.id,
          actionUrl: `/comercial/gestao-contas?tab=renovacoes&contractId=${contract.id}`,
          createdAt: now.toISOString()
        });
      }
      // Alerta 3: Contrato em janela de planejamento (INFO)
      else if (days <= 90 && activeRenewals.length === 0) {
        alerts.push({
          id: `alert_planning_${contract.id}`,
          code: 'RENEWAL_PLANNING_WINDOW',
          severity: 'INFO',
          title: `Janela de Planejamento de Renovação Aberta`,
          description: `O contrato ${contract.publicCode} vence em ${days} dias (${expiresAt.toLocaleDateString('pt-BR')}). Inicie o contato com o produtor.`,
          producerId,
          producerName: producer.name,
          contractId: contract.id,
          actionUrl: `/comercial/gestao-contas?tab=renovacoes&contractId=${contract.id}`,
          createdAt: now.toISOString()
        });
      }
    }

    // 2. Alerta de falta de executivo de contas atribuído
    const assignment = await (prisma as any).commercialPortfolioAssignment?.findFirst({
      where: { producerId, active: true }
    });

    if (!assignment && contracts.length > 0) {
      alerts.push({
        id: `alert_unassigned_${producerId}`,
        code: 'PRODUCER_UNASSIGNED_PORTFOLIO',
        severity: 'WARNING',
        title: 'Produtor Sem Executivo Responsável',
        description: 'A conta possui contratos ativos mas não está atribuída a nenhum executivo de contas na carteira comercial.',
        producerId,
        producerName: producer.name,
        contractId: null,
        actionUrl: `/comercial/gestao-contas?producerId=${producerId}`,
        createdAt: now.toISOString()
      });
    }

    return alerts;
  }

  /**
   * Coleta alertas factuais consolidados de todas as contas para a visão executiva
   */
  public static async getAllAlerts(): Promise<AccountCommercialAlertDTO[]> {
    const producers = await prisma.producer.findMany({
      where: { status: 'ACTIVE' }
    });

    const all: AccountCommercialAlertDTO[] = [];
    for (const p of producers) {
      const pAlerts = await this.getAlertsForProducer(p.id);
      all.push(...pAlerts);
    }

    // Ordena por severidade (CRITICAL primeiro, depois WARNING, depois INFO)
    const severityWeight: Record<string, number> = { CRITICAL: 3, WARNING: 2, INFO: 1 };
    all.sort((a, b) => (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0));

    return all;
  }
}
