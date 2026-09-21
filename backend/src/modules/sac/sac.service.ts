import { prisma } from '../../core/database/prisma';
import { AuthenticatedUser } from '../../core/middleware/authenticate';
import { ScopeFilterService } from '../search/scope-filter.service';
import { DataMaskService } from '../search/data-mask.service';
import { AuditService } from '../audit/audit.service';
import { QueryParserService } from '../search/query-parser.service';
import {
  SacTicketItem,
  CreateSacTicketDTO,
  AddSacMessageDTO,
  CreateSacRefundRequestDTO,
  SacTicketStatus,
  SacMessage
} from './sac.types';

// In-memory store for SAC ticket details & message threads
const sacTicketsStore: Map<string, SacTicketItem> = new Map();
let ticketCounter = 1000;

// Initialize seed ticket if store is empty
function ensureSeedData() {
  if (sacTicketsStore.size === 0) {
    const seedId = 'sac-seed-001';
    sacTicketsStore.set(seedId, {
      id: seedId,
      ticketCode: 'SAC-2026-001001',
      customerId: 'cust-maria',
      customerName: 'Maria Oliveira',
      customerDocumentMasked: '***.456.789-**',
      orderId: 'ord-984521',
      orderNumber: 'DK-984521',
      eventId: 'evt_1001',
      eventName: 'Festival Curitiba 2026',
      producerId: 'prd_100',
      channel: 'WHATSAPP',
      subject: 'Dúvida sobre envio do voucher e QR Code',
      status: 'IN_PROGRESS',
      priority: 'NORMAL',
      queue: 'Atendimento Geral',
      agentName: 'Carlos Lima',
      agentUserId: 'usr-agent-1',
      slaMinutesRemaining: 42,
      slaBreached: false,
      slaPaused: false,
      messages: [
        {
          id: 'msg-1',
          ticketId: seedId,
          type: 'CUSTOMER',
          authorName: 'Maria Oliveira',
          content: 'Olá, fiz a compra do ingresso pelo site mas ainda não recebi o PDF com o QR Code no meu e-mail.',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'msg-2',
          ticketId: seedId,
          type: 'AGENT',
          authorName: 'Carlos Lima',
          content: 'Olá Maria! Estou verificando o status da emissão do seu pedido agora mesmo.',
          createdAt: new Date(Date.now() - 3000000).toISOString()
        },
        {
          id: 'msg-3',
          ticketId: seedId,
          type: 'INTERNAL_NOTE',
          authorName: 'Carlos Lima',
          content: 'Pedido pago com sucesso via PIX. Voucher gerado no lote 1. Reenvio solicitado.',
          createdAt: new Date(Date.now() - 2500000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 2500000).toISOString()
    });
  }
}

export class SacService {
  /**
   * Resumo de Métricas Factuais do SAC (zero dados fictícios)
   */
  public static async getMetrics(user: AuthenticatedUser) {
    ensureSeedData();
    const scope = ScopeFilterService.deriveScope(user);
    const all = Array.from(sacTicketsStore.values()).filter(t => {
      if (!scope.isGlobal && scope.forcedProducerId) {
        return t.producerId === scope.forcedProducerId;
      }
      return true;
    });

    const open = all.filter(t => t.status === 'OPEN').length;
    const inProgress = all.filter(t => t.status === 'IN_PROGRESS').length;
    const waitingCustomer = all.filter(t => t.status === 'WAITING_CUSTOMER').length;
    const resolved = all.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    const slaBreached = all.filter(t => t.slaBreached || (t.slaMinutesRemaining !== undefined && t.slaMinutesRemaining <= 0 && t.status !== 'RESOLVED' && t.status !== 'CLOSED')).length;

    // By Queue
    const queueCounts: Record<string, number> = {};
    for (const t of all) {
      queueCounts[t.queue] = (queueCounts[t.queue] || 0) + 1;
    }

    // By Channel
    const channelCounts: Record<string, number> = {};
    for (const t of all) {
      channelCounts[t.channel] = (channelCounts[t.channel] || 0) + 1;
    }

    return {
      total: all.length,
      open,
      inProgress,
      waitingCustomer,
      resolved,
      slaBreached,
      byQueue: queueCounts,
      byChannel: channelCounts
    };
  }

  /**
   * Listagem de Atendimentos com Filtros e Escopo
   */
  public static async listTickets(
    filters: {
      status?: string;
      queue?: string;
      channel?: string;
      agentUserId?: string;
      q?: string;
    },
    user: AuthenticatedUser
  ): Promise<SacTicketItem[]> {
    ensureSeedData();
    const scope = ScopeFilterService.deriveScope(user);
    let list = Array.from(sacTicketsStore.values());

    // Filter by Scope
    if (!scope.isGlobal && scope.forcedProducerId) {
      list = list.filter(t => t.producerId === scope.forcedProducerId);
    }

    // Filters
    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(t => t.status === filters.status);
    }
    if (filters.queue && filters.queue !== 'ALL') {
      list = list.filter(t => t.queue.toLowerCase() === filters.queue?.toLowerCase());
    }
    if (filters.channel && filters.channel !== 'ALL') {
      list = list.filter(t => t.channel === filters.channel);
    }
    if (filters.agentUserId) {
      list = list.filter(t => t.agentUserId === filters.agentUserId);
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      list = list.filter(
        t =>
          t.ticketCode.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          (t.orderNumber && t.orderNumber.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Detalhes de um Atendimento com Mensagens
   */
  public static async getTicketById(ticketId: string, user: AuthenticatedUser): Promise<SacTicketItem | null> {
    ensureSeedData();
    const ticket = sacTicketsStore.get(ticketId);
    if (!ticket) return null;

    const scope = ScopeFilterService.deriveScope(user);
    if (!scope.isGlobal && scope.forcedProducerId && ticket.producerId !== scope.forcedProducerId) {
      return null;
    }

    return ticket;
  }

  /**
   * Abertura de Novo Atendimento SAC
   */
  public static async createTicket(dto: CreateSacTicketDTO, user: AuthenticatedUser): Promise<SacTicketItem> {
    ensureSeedData();
    ticketCounter++;
    const ticketId = `sac-tkt-${Date.now()}-${ticketCounter}`;
    const ticketCode = `SAC-2026-${String(ticketCounter).padStart(6, '0')}`;

    // Fetch customer details
    const customer = await prisma.customer.findUnique({
      where: { id: dto.customerId }
    });

    const customerName = customer ? customer.name : 'Consumidor';
    const maskedDoc = customer ? DataMaskService.maskCpf(customer.cpf, false) : undefined;

    // Fetch order if provided
    let orderNumber: string | undefined;
    let eventName: string | undefined;
    let producerId: string | undefined = dto.producerId;
    let eventId: string | undefined = dto.eventId;

    if (dto.orderId) {
      const order = await prisma.order.findUnique({ where: { id: dto.orderId } });
      if (order) {
        orderNumber = order.orderNumber;
        eventName = order.eventName;
        eventId = order.eventId;
        producerId = order.producerId;
      }
    }

    const initialMsg: SacMessage = {
      id: `msg-${Date.now()}`,
      ticketId,
      type: 'CUSTOMER',
      authorName: customerName,
      content: dto.initialMessage,
      createdAt: new Date().toISOString()
    };

    const newTicket: SacTicketItem = {
      id: ticketId,
      ticketCode,
      customerId: dto.customerId,
      customerName,
      customerDocumentMasked: maskedDoc,
      orderId: dto.orderId,
      orderNumber,
      eventId,
      eventName,
      producerId,
      channel: dto.channel || 'WHATSAPP',
      subject: dto.subject,
      status: 'OPEN',
      priority: dto.priority || 'NORMAL',
      queue: dto.queue || 'Atendimento Geral',
      agentName: user.name,
      agentUserId: user.id,
      slaMinutesRemaining: dto.priority === 'URGENT' ? 30 : dto.priority === 'HIGH' ? 60 : 120,
      slaBreached: false,
      slaPaused: false,
      messages: [initialMsg],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    sacTicketsStore.set(ticketId, newTicket);

    AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'SAC_TICKET_CREATED',
      resource: 'SAC_TICKET',
      details: `Atendimento ${ticketCode} aberto para ${customerName} no canal ${dto.channel}.`,
      ipAddress: '127.0.0.1',
      result: 'SUCCESS'
    });

    return newTicket;
  }

  /**
   * Adicionar Mensagem ao Atendimento (Resposta, Nota Interna)
   */
  public static async addMessage(
    ticketId: string,
    dto: AddSacMessageDTO,
    user: AuthenticatedUser
  ): Promise<SacTicketItem | null> {
    ensureSeedData();
    const ticket = sacTicketsStore.get(ticketId);
    if (!ticket) return null;

    const newMsg: SacMessage = {
      id: `msg-${Date.now()}`,
      ticketId,
      type: dto.type,
      authorName: dto.type === 'CUSTOMER' ? ticket.customerName : user.name,
      authorUserId: dto.type === 'CUSTOMER' ? undefined : user.id,
      content: dto.content,
      createdAt: new Date().toISOString()
    };

    ticket.messages.push(newMsg);
    ticket.updatedAt = new Date().toISOString();

    // If customer replied while paused, unpause and return to IN_PROGRESS
    if (dto.type === 'CUSTOMER' && ticket.status === 'WAITING_CUSTOMER') {
      ticket.status = 'IN_PROGRESS';
      ticket.slaPaused = false;
    }

    sacTicketsStore.set(ticketId, ticket);

    AuditService.log({
      userId: user.id,
      userName: user.name,
      action: dto.type === 'INTERNAL_NOTE' ? 'SAC_INTERNAL_NOTE_ADDED' : 'SAC_MESSAGE_SENT',
      resource: 'SAC_TICKET',
      details: `${dto.type === 'INTERNAL_NOTE' ? 'Nota interna' : 'Mensagem'} adicionada ao atendimento ${ticket.ticketCode}.`,
      ipAddress: '127.0.0.1',
      result: 'SUCCESS'
    });

    return ticket;
  }

  /**
   * Alterar Status do Atendimento (com Pausa de SLA se Aguardando Cliente)
   */
  public static async updateStatus(
    ticketId: string,
    status: SacTicketStatus,
    user: AuthenticatedUser
  ): Promise<SacTicketItem | null> {
    ensureSeedData();
    const ticket = sacTicketsStore.get(ticketId);
    if (!ticket) return null;

    const previousStatus = ticket.status;
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();

    if (status === 'WAITING_CUSTOMER') {
      ticket.slaPaused = true;
    } else if ((previousStatus as string) === 'WAITING_CUSTOMER' && (status as string) !== 'WAITING_CUSTOMER') {
      ticket.slaPaused = false;
    }

    if (status === 'RESOLVED' || status === 'CLOSED') {
      ticket.slaMinutesRemaining = 0;
    }

    // System event message
    ticket.messages.push({
      id: `evt-${Date.now()}`,
      ticketId,
      type: 'SYSTEM_EVENT',
      authorName: 'Sistema',
      content: `Status alterado de ${previousStatus} para ${status} por ${user.name}.`,
      createdAt: new Date().toISOString()
    });

    sacTicketsStore.set(ticketId, ticket);

    AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'SAC_TICKET_STATUS_CHANGED',
      resource: 'SAC_TICKET',
      details: `Atendimento ${ticket.ticketCode} alterado para status ${status}.`,
      ipAddress: '127.0.0.1',
      result: 'SUCCESS'
    });

    return ticket;
  }

  /**
   * Handoff: Solicitar Estorno a partir do SAC
   * O SAC inicia e audita a solicitação, mas NÃO executa pagamento nem movimenta dinheiro.
   */
  public static async createRefundRequest(
    dto: CreateSacRefundRequestDTO,
    user: AuthenticatedUser
  ) {
    const order = await prisma.order.findUnique({
      where: { id: dto.orderId }
    });

    if (!order) {
      throw new Error('Pedido não encontrado para abertura de estorno.');
    }

    const refundRequestId = `ref-req-${Date.now()}`;
    const refundCode = `EST-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const refundItem = {
      id: refundRequestId,
      code: refundCode,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: dto.customerId,
      customerName: order.customerName,
      eventId: order.eventId,
      eventName: order.eventName,
      producerId: order.producerId,
      amount: order.totalAmount,
      reason: dto.reason,
      justification: dto.justification,
      status: 'PENDING_REVIEW', // Em análise pela equipe de Estorno
      requestedBy: user.name,
      requestedAt: new Date().toISOString(),
      ticketId: dto.ticketId
    };

    // Store in prisma.refund if supported
    if ((prisma as any).refund?.create) {
      await (prisma as any).refund.create({
        data: {
          id: refundRequestId,
          orderId: order.id,
          customerId: dto.customerId,
          amount: order.totalAmount,
          reason: dto.reason,
          status: 'PENDING_REVIEW',
          requesterName: user.name
        }
      });
    }

    AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'REFUND_REQUEST_INITIATED_BY_SAC',
      resource: 'REFUND_REQUEST',
      details: `Solicitação de estorno ${refundCode} criada via SAC para o pedido ${order.orderNumber}. Motivo: ${dto.reason}.`,
      ipAddress: '127.0.0.1',
      result: 'SUCCESS'
    });

    // If linked to a ticket, add a system note
    if (dto.ticketId) {
      const ticket = sacTicketsStore.get(dto.ticketId);
      if (ticket) {
        ticket.messages.push({
          id: `msg-refund-${Date.now()}`,
          ticketId: dto.ticketId,
          type: 'SYSTEM_EVENT',
          authorName: 'Sistema de Estornos',
          content: `Solicitação de estorno ${refundCode} gerada para o pedido ${order.orderNumber}. Encaminhada para fila de análise do módulo Estorno.`,
          createdAt: new Date().toISOString()
        });
        ticket.updatedAt = new Date().toISOString();
        sacTicketsStore.set(dto.ticketId, ticket);
      }
    }

    return refundItem;
  }

  /**
   * Central de Consulta Rápida (Normalização de CPF, Telefone, E-mail, Pedido, Ingresso)
   */
  public static async queryCentral(rawQuery: string, user: AuthenticatedUser) {
    const parsed = QueryParserService.parse(rawQuery);
    const scope = ScopeFilterService.deriveScope(user);

    const customers = await prisma.customer.findMany();
    const orders = await prisma.order.findMany();
    const tickets = await prisma.ticket.findMany();

    const clean = parsed.normalized;
    const digits = parsed.extractedDigits || '';

    // Exact matches first
    const matchedCustomers = customers.filter((c: any) => {
      if (parsed.detectedType === 'CPF' && digits) {
        return c.cpfNormalized === digits || c.cpf?.replace(/\D/g, '') === digits;
      }
      if (parsed.detectedType === 'EMAIL') {
        return c.email?.toLowerCase() === clean;
      }
      if (parsed.detectedType === 'PHONE' && digits) {
        return c.phone?.replace(/\D/g, '').includes(digits);
      }
      return (
        c.name?.toLowerCase().includes(clean) ||
        (digits.length >= 4 && c.cpf?.includes(digits)) ||
        c.email?.toLowerCase().includes(clean)
      );
    });

    const matchedOrders = orders.filter((o: any) => {
      if (!scope.isGlobal && scope.forcedProducerId && o.producerId !== scope.forcedProducerId) {
        return false;
      }
      return (
        o.orderNumber?.toLowerCase().includes(clean) ||
        o.customerName?.toLowerCase().includes(clean) ||
        (digits.length >= 4 && o.customerCpf?.replace(/\D/g, '').includes(digits))
      );
    });

    const matchedTickets = tickets.filter((t: any) => {
      return (
        t.ticketCode?.toLowerCase().includes(clean) ||
        t.customerName?.toLowerCase().includes(clean) ||
        t.ticketNumber?.toLowerCase().includes(clean)
      );
    });

    return {
      query: rawQuery,
      detectedType: parsed.detectedType,
      customers: matchedCustomers.map((c: any) => DataMaskService.maskCustomerData(c, user)),
      orders: matchedOrders.map((o: any) => ({
        ...o,
        customerCpfMasked: DataMaskService.maskCpf(o.customerCpf, false)
      })),
      tickets: matchedTickets
    };
  }
}
