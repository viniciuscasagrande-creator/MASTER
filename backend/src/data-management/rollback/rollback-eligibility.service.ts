import { RollbackEligibility } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';

export class RollbackEligibilityService {
  /**
   * Assesses if an import request can be physically rolled back or if downstream dependencies require compensation
   */
  public static async checkEligibility(importRequestId: string): Promise<RollbackEligibility> {
    const imp = await prisma.importRequestModel.findUnique({ where: { id: importRequestId } });
    if (!imp) {
      return {
        importId: importRequestId,
        eligible: false,
        reason: `Lote de importação "${importRequestId}" não encontrado.`,
        blockingDependencies: []
      };
    }

    if (imp.status === 'ROLLED_BACK') {
      return {
        importId: importRequestId,
        eligible: false,
        reason: 'Lote de importação já se encontra desfeito (ROLLED_BACK).',
        blockingDependencies: []
      };
    }

    if (imp.status !== 'COMPLETED' && imp.status !== 'PARTIAL') {
      return {
        importId: importRequestId,
        eligible: false,
        reason: `Status atual "${imp.status}" não permite operação de reversão/rollback.`,
        blockingDependencies: []
      };
    }

    const blockingDependencies: { relation: string; count: number }[] = [];

    // 1. Check Orders linked to these imported records
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { customerId: { contains: importRequestId } },
          { id: { contains: importRequestId } }
        ]
      }
    });
    if (orders.length > 0) {
      blockingDependencies.push({ relation: 'Pedidos de Venda', count: orders.length });
    }

    // 2. Check Financial Transactions
    const txs = await prisma.financialTransaction.findMany({
      where: {
        description: { contains: importRequestId }
      }
    });
    if (txs.length > 0) {
      blockingDependencies.push({ relation: 'Lançamentos Financeiros', count: txs.length });
    }

    // 3. Check Tickets issued
    const tickets = await prisma.ticket.findMany({
      where: {
        orderId: { contains: importRequestId }
      }
    });
    if (tickets.length > 0) {
      blockingDependencies.push({ relation: 'Ingressos Emitidos', count: tickets.length });
    }

    const totalBlocked = blockingDependencies.reduce((acc, curr) => acc + curr.count, 0);

    if (totalBlocked > 0) {
      return {
        importId: importRequestId,
        eligible: false,
        reason: `Rollback físico bloqueado: foram identificados ${totalBlocked} registros dependentes movimentados.`,
        blockingDependencies,
        compensatingActionRecommended: 'AÇÃO COMPENSATÓRIA: Inativação lógica e cancelamento reverso sem deleção física.'
      };
    }

    return {
      importId: importRequestId,
      eligible: true,
      reason: 'Nenhuma dependência relacional posterior detectada. Rollback físico autorizado.',
      blockingDependencies: []
    };
  }
}
