import { DomainEvent } from '../../events/event.types';

export interface FormattedNotification {
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'ACTION_REQUIRED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  module: string;
  title: string;
  description: string;
  actionUrl?: string;
  groupKey?: string;
}

export class NotificationTemplateService {
  public static format(event: DomainEvent): FormattedNotification {
    switch (event.type) {
      // Financeiro
      case 'FINANCE_TRANSFER_CREATED':
        return {
          type: 'ACTION_REQUIRED',
          priority: 'HIGH',
          module: 'FINANCE',
          title: 'Transferência aguardando aprovação',
          description: `Transferência de R$ ${Number(event.data?.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} solicitada para o evento.`,
          actionUrl: `/finance/transfers/${event.resourceId}`,
          groupKey: event.producerId ? `transfer:${event.producerId}` : undefined
        };

      case 'FINANCE_TRANSFER_APPROVED':
        return {
          type: 'SUCCESS',
          priority: 'NORMAL',
          module: 'FINANCE',
          title: 'Transferência aprovada com sucesso',
          description: `Transferência #${event.resourceId} no valor de R$ ${event.data?.amount} foi aprovada.`,
          actionUrl: `/finance/transfers/${event.resourceId}`
        };

      case 'FINANCE_CONCILIATION_DIVERGENCE':
        return {
          type: 'WARNING',
          priority: 'HIGH',
          module: 'FINANCE',
          title: 'Divergência na conciliação bancária',
          description: `Divergência de R$ ${event.data?.difference} identificada no lote ${event.resourceId}.`,
          actionUrl: `/finance/reconciliation`
        };

      // Eventos
      case 'EVENT_CREATED':
        return {
          type: 'INFO',
          priority: 'NORMAL',
          module: 'EVENTS',
          title: 'Novo evento cadastrado',
          description: `O evento '${event.data?.title}' foi registrado no sistema.`,
          actionUrl: `/events/${event.resourceId}`
        };

      case 'EVENT_BATCH_NEAR_EXHAUSTION':
        return {
          type: 'WARNING',
          priority: 'NORMAL',
          module: 'EVENTS',
          title: 'Lote de ingressos próximo do esgotamento',
          description: `Restam menos de 10% dos ingressos do lote ${event.data?.batchName}.`,
          actionUrl: `/events/${event.eventId}/lots`
        };

      // SAC & Estorno
      case 'SAC_SLA_WARNING':
        return {
          type: 'WARNING',
          priority: 'HIGH',
          module: 'SAC',
          title: 'Ticket SAC próximo do limite de SLA',
          description: `Atendimento #${event.resourceId} atinge o SLA em menos de 15 minutos.`,
          actionUrl: `/sac/tickets/${event.resourceId}`
        };

      case 'REFUND_REQUESTED':
        return {
          type: 'ACTION_REQUIRED',
          priority: 'HIGH',
          module: 'REFUNDS',
          title: 'Estorno aguardando aprovação',
          description: `Solicitação de estorno de R$ ${event.data?.amount} para o pedido #${event.data?.orderNumber}.`,
          actionUrl: `/refunds/approvals/${event.resourceId}`
        };

      // Marketing
      case 'MARKETING_PIXEL_FAILED':
        return {
          type: 'WARNING',
          priority: 'HIGH',
          module: 'MARKETING',
          title: 'Falha detectada no pixel de conversão',
          description: `O pixel ${event.data?.platform} parou de enviar eventos de compra.`,
          actionUrl: `/marketing/pixels`
        };

      // Segurança
      case 'SECURITY_BRUTE_FORCE':
        return {
          type: 'CRITICAL',
          priority: 'CRITICAL',
          module: 'SECURITY',
          title: 'Tentativa de acesso bloqueada (Força Bruta)',
          description: `IP ${event.data?.ipAddress} foi temporariamente bloqueado após múltiplas falhas de autenticação.`,
          actionUrl: `/admin/security`
        };

      case 'SECURITY_CONTEXT_TAMPERING':
        return {
          type: 'CRITICAL',
          priority: 'CRITICAL',
          module: 'SECURITY',
          title: 'Violação de Escopo de Contexto Detectada',
          description: `Tentativa não autorizada de acessar recurso fora do escopo do produtor.`,
          actionUrl: `/admin/security`
        };

      // Vendas Agrupadas
      case 'ORDER_PAID':
        return {
          type: 'SUCCESS',
          priority: 'LOW',
          module: 'EVENTS',
          title: 'Nova venda confirmada',
          description: `Pedido #${event.resourceId} aprovado no valor de R$ ${event.data?.amount}.`,
          groupKey: event.eventId ? `sales:${event.eventId}` : `sales:${event.producerId}`,
          actionUrl: `/events/${event.eventId}`
        };

      default:
        return {
          type: 'INFO',
          priority: 'NORMAL',
          module: 'GENERAL',
          title: event.type.replace(/_/g, ' '),
          description: typeof event.data === 'string' ? event.data : JSON.stringify(event.data || {}),
          actionUrl: undefined
        };
    }
  }
}
