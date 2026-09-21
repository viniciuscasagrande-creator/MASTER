export type SacTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type SacTicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type SacTicketChannel = 'WHATSAPP' | 'EMAIL' | 'CHAT' | 'PHONE' | 'INTERNAL';
export type SacMessageType = 'CUSTOMER' | 'AGENT' | 'INTERNAL_NOTE' | 'SYSTEM_EVENT';

export interface SacMessage {
  id: string;
  ticketId: string;
  type: SacMessageType;
  authorName: string;
  authorUserId?: string;
  content: string;
  createdAt: string;
}

export interface SacTicketItem {
  id: string;
  ticketCode: string; // e.g. "SAC-2026-001842"
  customerId: string;
  customerName: string;
  customerDocumentMasked?: string;
  orderId?: string;
  orderNumber?: string;
  eventId?: string;
  eventName?: string;
  producerId?: string;
  channel: SacTicketChannel;
  subject: string;
  status: SacTicketStatus;
  priority: SacTicketPriority;
  queue: string;
  agentName?: string;
  agentUserId?: string;
  slaMinutesRemaining?: number;
  slaBreached?: boolean;
  slaPaused?: boolean;
  incidentId?: string;
  messages: SacMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSacTicketDTO {
  customerId: string;
  orderId?: string;
  eventId?: string;
  producerId?: string;
  channel: SacTicketChannel;
  subject: string;
  priority?: SacTicketPriority;
  queue?: string;
  initialMessage: string;
}

export interface AddSacMessageDTO {
  type: SacMessageType;
  content: string;
}

export interface CreateSacRefundRequestDTO {
  orderId: string;
  customerId: string;
  ticketId?: string;
  reason: 'ARREPENDIMENTO_7D' | 'DUPLICIDADE' | 'EVENTO_CANCELADO' | 'DIVERGENCIA_COBRANCA' | 'OUTRO';
  type: 'TOTAL' | 'PARCIAL';
  items?: string[];
  justification: string;
}
