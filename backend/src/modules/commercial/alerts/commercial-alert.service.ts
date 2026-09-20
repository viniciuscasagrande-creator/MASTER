import { CommercialAlertDTO } from '@shared/types/index';
import { prisma } from '../../../core/database/prisma';
import { AuthenticatedUserContext } from '../policies/commercial-scope.policy';

export class CommercialAlertService {
  /**
   * Evaluates operational conditions across events, batches, and orders to generate actionable commercial alerts
   */
  public static async evaluateAlerts(
    user: AuthenticatedUserContext,
    producerId?: string,
    eventId?: string
  ): Promise<CommercialAlertDTO[]> {
    const alerts: CommercialAlertDTO[] = [];
    const now = new Date();

    // 1. Fetch batches
    const batches = await prisma.ticketBatch.findMany();
    const filteredBatches = batches.filter((b: any) => {
      if (eventId && b.eventId !== eventId) return false;
      return true;
    });

    for (const batch of filteredBatches) {
      if (batch.status === 'ACTIVE' && batch.totalQuantityLimit > 0) {
        const soldPct = (batch.soldCount / batch.totalQuantityLimit) * 100;
        if (soldPct >= 95) {
          alerts.push({
            id: `alt_batch_critical_${batch.id}`,
            code: 'BATCH_NEAR_EXHAUSTION',
            severity: 'CRITICAL',
            title: `Lote '${batch.name}' prestes a esgotar`,
            description: `O lote atingiu ${soldPct.toFixed(1)}% de ocupação (${batch.soldCount}/${batch.totalQuantityLimit} ingressos). Providencie a ativação do próximo lote.`,
            targetType: 'BATCH',
            targetId: batch.id,
            createdAt: now.toISOString()
          });
        } else if (soldPct >= 80) {
          alerts.push({
            id: `alt_batch_warning_${batch.id}`,
            code: 'BATCH_HIGH_DEMAND',
            severity: 'WARNING',
            title: `Alta demanda no lote '${batch.name}'`,
            description: `Mais de 80% dos ingressos foram vendidos (${batch.soldCount}/${batch.totalQuantityLimit}).`,
            targetType: 'BATCH',
            targetId: batch.id,
            createdAt: now.toISOString()
          });
        }
      }
    }

    // 2. Fetch orders in PROCESSING exceeding 15 minutes SLA
    const orders = await prisma.order.findMany();
    const processingOrders = orders.filter((o: any) => {
      if (producerId && o.producerId !== producerId) return false;
      if (eventId && o.eventId !== eventId) return false;
      if (o.status !== 'PROCESSING') return false;
      const orderAgeMinutes = (now.getTime() - new Date(o.createdAt).getTime()) / (1000 * 60);
      return orderAgeMinutes > 15;
    });

    if (processingOrders.length > 0) {
      alerts.push({
        id: `alt_processing_sla_${now.getTime()}`,
        code: 'ORDER_PROCESSING_SLA_BREACH',
        severity: 'HIGH',
        title: `${processingOrders.length} pedido(s) em processamento além do SLA`,
        description: `Existem pedidos retidos em processamento há mais de 15 minutos aguardando confirmação do gateway de pagamento.`,
        targetType: 'ORDER',
        targetId: processingOrders[0]?.id || '',
        createdAt: now.toISOString()
      });
    }

    // 3. High event occupancy
    const events = await prisma.event.findMany();
    const filteredEvents = events.filter((e: any) => {
      if (producerId && e.producerId !== producerId) return false;
      if (eventId && e.id !== eventId) return false;
      return true;
    });

    for (const evt of filteredEvents) {
      if (evt.capacity > 0) {
        const occPct = (evt.soldTickets / evt.capacity) * 100;
        if (occPct >= 90) {
          alerts.push({
            id: `alt_evt_occ_${evt.id}`,
            code: 'EVENT_HIGH_OCCUPANCY',
            severity: 'INFO',
            title: `Evento '${evt.name || evt.title}' com ${occPct.toFixed(1)}% de ocupação`,
            description: `Capacidade quase atingida (${evt.soldTickets} de ${evt.capacity} ingressos vendidos).`,
            targetType: 'EVENT',
            targetId: evt.id,
            createdAt: now.toISOString()
          });
        }
      }
    }

    return alerts;
  }
}
