import { ITransitionGuard, GuardResult } from './transition-guard.interface';
import { prisma } from '../../../../core/database/prisma';

export class SalesActiveGuard implements ITransitionGuard {
  public readonly name = 'SALES_ACTIVE';

  async evaluate(eventId: string): Promise<GuardResult> {
    const [batches, channels, pools] = await Promise.all([
      (prisma as any).ticketBatch?.findMany?.({ where: { eventId } }) || [],
      (prisma as any).eventSalesChannel?.findMany?.({ where: { eventId, enabled: true } }) ||
      (prisma as any).salesChannelConfig?.findMany?.({ where: { eventId, enabled: true } }) || [],
      (prisma as any).inventoryPool?.findMany?.({ where: { eventId } }) || []
    ]);

    const activeOrScheduledBatches = (batches || []).filter(
      (b: any) => b.status === 'ACTIVE' || b.status === 'SCHEDULED'
    );

    if (activeOrScheduledBatches.length === 0) {
      return {
        passed: false,
        code: 'NO_ACTIVE_BATCHES',
        message: 'Nenhum lote de ingressos está com status ATIVO ou PROGRAMADO.'
      };
    }

    if ((channels || []).length === 0) {
      return {
        passed: false,
        code: 'NO_ENABLED_CHANNELS',
        message: 'Nenhum canal de vendas está habilitado para o evento.'
      };
    }

    const sessions = await prisma.eventSession.findMany({ where: { eventId } });
    const sessionIds = new Set(sessions.map((s: any) => s.id));
    const allPools = await (prisma as any).inventoryPool?.findMany?.() || [];
    const eventPools = allPools.filter((p: any) => p.eventId === eventId || sessionIds.has(p.sessionId));

    const availableInventory = eventPools.reduce((acc: number, p: any) => {
      const avail = p.available !== undefined ? p.available : Math.max(0, (p.capacity || 0) - ((p.sold || 0) + (p.reserved || 0) + (p.blocked || 0) + (p.held || 0)));
      return acc + avail;
    }, 0);

    if (availableInventory <= 0 && eventPools.length > 0) {
      return {
        passed: false,
        code: 'INVENTORY_DEPLETED',
        message: 'O inventário disponível para venda é zero.'
      };
    }

    return {
      passed: true,
      details: {
        activeBatches: activeOrScheduledBatches.length,
        enabledChannels: (channels || []).length,
        availableInventory
      }
    };
  }
}

export class InventoryEmptyGuard implements ITransitionGuard {
  public readonly name = 'INVENTORY_EMPTY';

  async evaluate(eventId: string): Promise<GuardResult> {
    const pools = await (prisma as any).inventoryPool?.findMany?.({ where: { eventId } }) || [];
    const available = pools.reduce((acc: number, p: any) => acc + (p.available || 0), 0);

    if (available === 0) {
      return { passed: true, details: { available } };
    }

    return {
      passed: false,
      code: 'INVENTORY_NOT_EMPTY',
      message: `Ainda existem ${available} ingressos disponíveis em estoque. Não é possível marcar como ESGOTADO.`,
      details: { available }
    };
  }
}

export class InventoryAvailableGuard implements ITransitionGuard {
  public readonly name = 'INVENTORY_AVAILABLE';

  async evaluate(eventId: string): Promise<GuardResult> {
    const pools = await (prisma as any).inventoryPool?.findMany?.({ where: { eventId } }) || [];
    const available = pools.reduce((acc: number, p: any) => acc + (p.available || 0), 0);

    if (available > 0) {
      return { passed: true, details: { available } };
    }

    return {
      passed: false,
      code: 'INVENTORY_ZERO',
      message: 'Não há ingressos disponíveis em estoque para reabrir as vendas.',
      details: { available }
    };
  }
}

export class PostSalesCancellationGuard implements ITransitionGuard {
  public readonly name = 'POST_SALES_CANCELLATION_POLICY';

  async evaluate(eventId: string, context?: any): Promise<GuardResult> {
    if (!context?.reason || context.reason.trim().length < 10) {
      return {
        passed: false,
        code: 'CANCELLATION_REASON_REQUIRED',
        message: 'Para cancelar um evento com vendas/publicado, é obrigatório fornecer uma justificativa detalhada (mínimo 10 caracteres).'
      };
    }

    return { passed: true };
  }
}

export class EmergencyInterruptionGuard implements ITransitionGuard {
  public readonly name = 'EMERGENCY_INTERRUPTION_POLICY';

  async evaluate(eventId: string, context?: any): Promise<GuardResult> {
    if (!context?.reason || context.reason.trim().length < 10) {
      return {
        passed: false,
        code: 'EMERGENCY_REASON_REQUIRED',
        message: 'Para interromper um evento em andamento, é obrigatório registrar justificativa operacional emergencial.'
      };
    }

    return { passed: true };
  }
}
