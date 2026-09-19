export type DomainEventType =
  // Financeiro
  | 'FINANCE_TRANSFER_CREATED'
  | 'FINANCE_TRANSFER_APPROVED'
  | 'FINANCE_TRANSFER_REJECTED'
  | 'FINANCE_PAYOUT_SCHEDULED'
  | 'FINANCE_PAYOUT_FAILED'
  | 'FINANCE_CONCILIATION_DIVERGENCE'
  // Eventos & Operações
  | 'EVENT_CREATED'
  | 'EVENT_PUBLISHED'
  | 'EVENT_BATCH_NEAR_EXHAUSTION'
  | 'EVENT_CAPACITY_LIMIT_APPROACHING'
  | 'EVENT_CHECKIN_STARTED'
  | 'EVENT_CHECKIN_PEAK'
  // Atendimento SAC & Estorno
  | 'SAC_TICKET_CREATED'
  | 'SAC_SLA_WARNING'
  | 'SAC_SLA_BREACHED'
  | 'REFUND_REQUESTED'
  | 'REFUND_APPROVED'
  | 'CHARGEBACK_RECEIVED'
  // Comercial
  | 'COMMERCIAL_GOAL_REACHED'
  | 'COMMERCIAL_NEW_PRODUCER'
  // Suporte de Campo
  | 'SUPPORT_INCIDENT_OPENED'
  | 'SUPPORT_INCIDENT_CRITICAL'
  // Marketing & Remarketing
  | 'MARKETING_CAMPAIGN_BUDGET_REACHED'
  | 'MARKETING_PIXEL_FAILED'
  | 'REMARKETING_CART_ABANDONED'
  // Segurança
  | 'SECURITY_BRUTE_FORCE'
  | 'SECURITY_CONTEXT_TAMPERING'
  | 'SECURITY_STEP_UP_REAUTH'
  | 'SECURITY_UNAUTHORIZED_ACCESS'
  // Vendas & Pedidos
  | 'ORDER_PAID';

export interface DomainEvent<T = any> {
  id: string; // Unique event ID for Idempotency
  type: DomainEventType;
  producerId?: string;
  eventId?: string;
  resourceType: string;
  resourceId: string;
  actorUserId?: string;
  data: T;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export type DomainEventHandler = (event: DomainEvent) => Promise<void> | void;
