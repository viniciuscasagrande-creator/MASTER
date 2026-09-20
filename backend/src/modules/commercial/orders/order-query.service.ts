import { prisma } from '../../../core/database/prisma';
import { NotFoundError } from '../../../core/errors/AppError';
import { OrderDTO, OrderStatus } from '@shared/types/index';
import { AuthenticatedUserContext, CommercialScopePolicy } from '../policies/commercial-scope.policy';
import { CommercialDataVisibilityPolicy } from '../policies/commercial-data-visibility.policy';

export interface OrderQueryFilters {
  search?: string;
  producerId?: string;
  eventId?: string;
  sessionId?: string;
  status?: OrderStatus | 'ALL';
  salesChannelId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedOrdersResult {
  orders: OrderDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class OrderQueryService {
  /**
   * Lists orders with multi-tenant scope isolation, search, filtering, and data sanitization
   */
  public static async listOrders(
    user: AuthenticatedUserContext,
    filters: OrderQueryFilters,
    ipAddress?: string
  ): Promise<PaginatedOrdersResult> {
    // 1. Resolve user scope
    const scopeFilters = CommercialScopePolicy.resolveScopeFilters(
      user,
      filters.producerId,
      filters.eventId
    );

    // 2. Fetch candidate orders from database
    const allOrders = await prisma.order.findMany({
      include: {
        buyerSnapshot: true,
        items: true,
        timeline: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Filter orders in memory
    let filtered = allOrders.filter((order: any) => {
      // Scope - Producer
      if (scopeFilters.producerIds && scopeFilters.producerIds.length > 0) {
        if (!scopeFilters.producerIds.includes(order.producerId)) {
          return false;
        }
      }

      // Scope - Event
      if (scopeFilters.eventIds && scopeFilters.eventIds.length > 0) {
        if (order.eventId && !scopeFilters.eventIds.includes(order.eventId)) {
          return false;
        }
      }

      // Explicit event filter
      if (filters.eventId && order.eventId !== filters.eventId) {
        return false;
      }

      // Session filter
      if (filters.sessionId) {
        const hasSession = order.items?.some((item: any) => item.sessionId === filters.sessionId);
        if (!hasSession) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'ALL') {
        if (order.status !== filters.status) return false;
      }

      // Sales Channel filter
      if (filters.salesChannelId && order.salesChannelId !== filters.salesChannelId) {
        return false;
      }

      // Date range filter
      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        const orderDate = new Date(order.createdAt).getTime();
        if (orderDate < start) return false;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate).getTime();
        const orderDate = new Date(order.createdAt).getTime();
        if (orderDate > end) return false;
      }

      // Full-text search
      if (filters.search && filters.search.trim() !== '') {
        const term = filters.search.toLowerCase().trim();
        const codeMatch = order.publicCode?.toLowerCase().includes(term) || order.orderNumber?.toLowerCase().includes(term);
        const buyer = order.buyerSnapshot;
        const buyerNameMatch = buyer?.name?.toLowerCase().includes(term);
        const buyerDocMatch = buyer?.document?.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
        const buyerEmailMatch = buyer?.email?.toLowerCase().includes(term);
        const buyerPhoneMatch = buyer?.phone?.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
        const eventNameMatch = order.eventName?.toLowerCase().includes(term);

        if (!codeMatch && !buyerNameMatch && !buyerDocMatch && !buyerEmailMatch && !buyerPhoneMatch && !eventNameMatch) {
          return false;
        }
      }

      return true;
    });

    const total = filtered.length;
    const page = Math.max(1, Number(filters.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 20));
    const totalPages = Math.ceil(total / pageSize) || 1;

    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    // 4. Apply visibility policies (financial values and LGPD data masking)
    const sanitizedOrders = paginated.map((order: any) =>
      CommercialDataVisibilityPolicy.sanitizeOrder(user, order)
    );

    return {
      orders: sanitizedOrders,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  /**
   * Retrieves single order by ID or publicCode with scope enforcement and data masking
   */
  public static async getOrderById(
    user: AuthenticatedUserContext,
    idOrCode: string,
    ipAddress?: string
  ): Promise<OrderDTO> {
    const order = await prisma.order.findUnique({
      where: { id: idOrCode, publicCode: idOrCode },
      include: {
        items: true,
        buyerSnapshot: true,
        timeline: true
      }
    });

    if (!order) {
      throw new NotFoundError(`Pedido com identificador '${idOrCode}' não foi encontrado.`);
    }

    // Enforce multi-tenant producer / event scope
    await CommercialScopePolicy.enforceOrderAccess(user, order, ipAddress);

    // Apply visibility policies
    return CommercialDataVisibilityPolicy.sanitizeOrder(user, order);
  }
}
