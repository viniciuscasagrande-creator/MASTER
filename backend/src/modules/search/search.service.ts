import { prisma } from '../../core/database/prisma';
import { AuthenticatedUser } from '../../core/middleware/authenticate';
import {
  CategorizedSearchResults,
  SearchSuggestion,
  CustomerCompleteView,
  OrderCompleteView,
  SearchResultItem
} from './search.types';
import { QueryParserService } from './query-parser.service';
import { ScopeFilterService } from './scope-filter.service';
import { AntiEnumerationService } from './anti-enumeration.service';
import { DataMaskService } from './data-mask.service';
import { AuditService } from '../audit/audit.service';

import { CustomerSearchProvider } from './providers/customer.search';
import { OrderSearchProvider } from './providers/order.search';
import { TicketSearchProvider } from './providers/ticket.search';
import { EventSearchProvider } from './providers/event.search';
import { ProducerSearchProvider } from './providers/producer.search';
import { PaymentSearchProvider } from './providers/payment.search';
import { RefundSearchProvider } from './providers/refund.search';
import { SupportSearchProvider } from './providers/support.search';
import { CampaignSearchProvider } from './providers/campaign.search';
import { DocumentSearchProvider } from './providers/document.search';

export class SearchService {
  /**
   * Main unified search executing across all domains with RBAC and Scope filtering
   */
  public static async search(
    rawQuery: string,
    user: AuthenticatedUser,
    options?: {
      scopeParam?: string;
      producerIdHeader?: string;
      eventIdHeader?: string;
      ipAddress?: string;
    }
  ): Promise<CategorizedSearchResults> {
    const parsed = QueryParserService.parse(rawQuery);

    // Anti-enumeration defense for CPF
    if (parsed.detectedType === 'CPF' && parsed.extractedDigits) {
      const check = AntiEnumerationService.checkCpfQuery(user, parsed.extractedDigits, options?.ipAddress);
      if (!check.isAllowed) {
        throw new Error('ANTI_ENUMERATION_LIMIT_EXCEEDED');
      }
    }

    const scope = ScopeFilterService.deriveScope(user, options);

    // Parallel execution across all allowed domain providers
    const [
      customers,
      orders,
      tickets,
      events,
      producers,
      payments,
      refunds,
      supportTickets,
      campaigns,
      documents
    ] = await Promise.all([
      CustomerSearchProvider.search(parsed, scope, user),
      OrderSearchProvider.search(parsed, scope, user),
      TicketSearchProvider.search(parsed, scope, user),
      EventSearchProvider.search(parsed, scope, user),
      ProducerSearchProvider.search(parsed, scope, user),
      PaymentSearchProvider.search(parsed, scope, user),
      RefundSearchProvider.search(parsed, scope, user),
      SupportSearchProvider.search(parsed, scope, user),
      CampaignSearchProvider.search(parsed, scope, user),
      DocumentSearchProvider.search(parsed, scope, user)
    ]);

    const totalMatches =
      customers.length +
      orders.length +
      tickets.length +
      events.length +
      producers.length +
      payments.length +
      refunds.length +
      supportTickets.length +
      campaigns.length +
      documents.length;

    // Record recent search history (if non-empty)
    if (rawQuery && rawQuery.trim().length >= 2) {
      try {
        await prisma.searchHistory.create({
          data: {
            userId: user.id,
            query: rawQuery.trim(),
            entityType: parsed.detectedType
          }
        });
      } catch {
        // Silent catch for search history
      }
    }

    return {
      query: rawQuery,
      detectedType: parsed.detectedType,
      totalMatches,
      categories: {
        customers: { count: customers.length, items: customers },
        orders: { count: orders.length, items: orders },
        tickets: { count: tickets.length, items: tickets },
        events: { count: events.length, items: events },
        producers: { count: producers.length, items: producers },
        payments: { count: payments.length, items: payments },
        refunds: { count: refunds.length, items: refunds },
        supportTickets: { count: supportTickets.length, items: supportTickets },
        campaigns: { count: campaigns.length, items: campaigns },
        documents: { count: documents.length, items: documents }
      }
    };
  }

  /**
   * Fast autocomplete suggestions for global header / command palette
   */
  public static async getSuggestions(
    rawQuery: string,
    user: AuthenticatedUser,
    options?: {
      scopeParam?: string;
      producerIdHeader?: string;
      eventIdHeader?: string;
    }
  ): Promise<SearchSuggestion[]> {
    if (!rawQuery || rawQuery.trim().length < 2) {
      return [];
    }

    const results = await this.search(rawQuery, user, options);
    const suggestions: SearchSuggestion[] = [];

    // Prioritize Events & Producers
    for (const item of results.categories.events.items.slice(0, 3)) {
      suggestions.push({
        id: item.id,
        title: item.title,
        category: 'Evento',
        entityType: 'EVENT',
        actionUrl: item.actionUrl
      });
    }

    for (const item of results.categories.producers.items.slice(0, 2)) {
      suggestions.push({
        id: item.id,
        title: item.title,
        category: 'Produtor',
        entityType: 'PRODUCER',
        actionUrl: item.actionUrl
      });
    }

    // Orders & Tickets
    for (const item of results.categories.orders.items.slice(0, 3)) {
      suggestions.push({
        id: item.id,
        title: item.title,
        category: 'Pedido',
        entityType: 'ORDER',
        actionUrl: item.actionUrl
      });
    }

    for (const item of results.categories.tickets.items.slice(0, 2)) {
      suggestions.push({
        id: item.id,
        title: item.title,
        category: 'Ingresso',
        entityType: 'TICKET',
        actionUrl: item.actionUrl
      });
    }

    // Customers
    for (const item of results.categories.customers.items.slice(0, 2)) {
      suggestions.push({
        id: item.id,
        title: item.title,
        category: 'Cliente',
        entityType: 'CUSTOMER',
        actionUrl: item.actionUrl
      });
    }

    return suggestions.slice(0, 8);
  }

  /**
   * Visão Completa do Cliente (Resumo, Pedidos, Ingressos, Pagamentos, Atendimentos, Estornos)
   */
  public static async getCustomerCompleteView(
    customerId: string,
    user: AuthenticatedUser,
    options?: { ipAddress?: string }
  ): Promise<CustomerCompleteView | null> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return null;
    }

    const scope = ScopeFilterService.deriveScope(user);

    // If user is producer, customer must have at least one order for this producer
    let orders = await prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!scope.isGlobal && scope.forcedProducerId) {
      orders = orders.filter((o: any) => ScopeFilterService.matchesScope(o, scope));
      if (orders.length === 0) {
        // Customer not associated with this producer
        return null;
      }
    }

    const orderIds = orders.map((o: any) => o.id);

    // Related tickets, payments, supportTickets, refunds
    let tickets = await prisma.ticket.findMany({
      where: { orderId: { in: orderIds } }
    });
    let payments = await prisma.payment.findMany({
      where: { orderId: { in: orderIds } }
    });
    let supportTickets = await prisma.supportTicket.findMany({
      where: { customerId: customer.id }
    });
    let refunds = await prisma.refund.findMany({
      where: { customerId: customer.id }
    });

    if (!scope.isGlobal && scope.forcedProducerId) {
      tickets = tickets.filter((t: any) => ScopeFilterService.matchesScope(t, scope));
      payments = payments.filter((p: any) => ScopeFilterService.matchesScope(p, scope));
      supportTickets = supportTickets.filter((s: any) => ScopeFilterService.matchesScope(s, scope));
      refunds = refunds.filter((r: any) => ScopeFilterService.matchesScope(r, scope));
    }

    const allowFullDoc = DataMaskService.canViewFullDocument(user);
    const maskedCustomer = DataMaskService.maskCustomerData(customer, user);

    // Audit full document view if unmasked
    if (allowFullDoc) {
      AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'CUSTOMER_FULL_DATA_VIEWED',
        resource: 'CUSTOMER',
        details: `Usuário ${user.name} visualizou dados protegidos completos (CPF) do cliente ${customer.name}.`,
        ipAddress: options?.ipAddress || '127.0.0.1',
        result: 'SUCCESS'
      });
    }

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);
    const uniqueEvents = new Set(orders.map((o: any) => o.eventId)).size;

    return {
      customer: maskedCustomer,
      summary: {
        totalOrders,
        totalSpent,
        totalTickets: tickets.length,
        totalEvents: uniqueEvents,
        lastOrder: orders[0] || null
      },
      orders,
      tickets,
      payments,
      supportTickets,
      refunds
    };
  }

  /**
   * Visão do Pedido (Dados do Pedido, Resumo Financeiro, Ingressos, Pagamentos, Atendimentos, Estorno)
   */
  public static async getOrderCompleteView(
    orderIdOrNumber: string,
    user: AuthenticatedUser
  ): Promise<OrderCompleteView | null> {
    const cleanDigits = orderIdOrNumber.replace(/\D/g, '');

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderIdOrNumber },
          { orderNumber: orderIdOrNumber },
          { orderNumberNormalized: cleanDigits }
        ]
      },
      include: {
        customer: true,
        tickets: true,
        payments: true,
        refunds: true,
        supportTickets: true
      }
    });

    if (!order) {
      return null;
    }

    const scope = ScopeFilterService.deriveScope(user);

    // Check scope access
    if (!ScopeFilterService.matchesScope(order, scope)) {
      return null;
    }

    const allowFullDoc = DataMaskService.canViewFullDocument(user);

    const hasPerm = (code: string) => {
      if (user.isSuperAdmin) return true;
      return user.permissions?.includes(code) || false;
    };

    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        producerId: order.producerId,
        producerName: order.producerName,
        eventId: order.eventId,
        eventName: order.eventName,
        customerId: order.customerId,
        customerName: order.customerName,
        customerCpf: DataMaskService.maskCpf(order.customerCpf, allowFullDoc),
        itemsCount: order.itemsCount,
        grossAmount: order.grossAmount,
        serviceFee: order.serviceFee,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt
      },
      financialSummary: {
        grossAmount: order.grossAmount,
        serviceFee: order.serviceFee,
        totalAmount: order.totalAmount,
        netAmount: order.grossAmount - (order.serviceFee || 0)
      },
      tickets: order.tickets || [],
      payments: order.payments || [],
      supportTickets: order.supportTickets || [],
      refunds: order.refunds || [],
      permissions: {
        canResendTicket: hasPerm('sac.voucher.reenviar') || hasPerm('eventos.checkin.operar') || user.isSuperAdmin,
        canOpenSupport: hasPerm('sac.ticket.criar') || user.isSuperAdmin,
        canRequestRefund: hasPerm('estorno.solicitacao.criar') || user.isSuperAdmin,
        canApproveRefund: hasPerm('estorno.solicitacao.aprovar') || user.isSuperAdmin,
        canViewFullCpf: allowFullDoc
      }
    };
  }

  /**
   * Get user recent searches
   */
  public static async getRecentSearches(userId: string): Promise<any[]> {
    return prisma.searchHistory.findMany({
      where: { userId },
      take: 8
    });
  }
}
