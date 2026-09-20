import { prisma } from '../../../core/database/prisma';
import { NotFoundError, ValidationError } from '../../../core/errors/AppError';
import { OrderDTO, OrderItemDTO, OrderBuyerSnapshotDTO, OrderStatus, OrderTimelineEventDTO } from '@shared/types/index';
import { OrderStateMachine } from './order-state-machine';
import { CommercialDataVisibilityPolicy } from '../policies/commercial-data-visibility.policy';
import { AuditService } from '../../audit/audit.service';

export interface CreateOrderInput {
  producerId: string;
  eventId?: string;
  eventName?: string;
  salesChannelId?: string;
  salesChannelName?: string;
  initialStatus?: OrderStatus;
  buyer: {
    customerId?: string;
    name: string;
    document: string;
    email: string;
    phone: string;
  };
  items: Array<{
    eventId: string;
    sessionId?: string;
    sessionName?: string;
    eventSectionId?: string;
    sectionName?: string;
    eventTicketTypeId: string;
    ticketTypeName: string;
    ticketBatchId?: string;
    batchName?: string;
    quantity: number;
    unitBaseAmount: number;
    unitDiscountAmount?: number;
    unitFeeAmount?: number;
    priceSnapshotId?: string;
  }>;
  expiresInMinutes?: number;
}

export interface TransitionOrderInput {
  orderId: string;
  targetStatus: OrderStatus;
  actor: {
    name?: string;
    type: 'USER' | 'SYSTEM' | 'GATEWAY' | 'SUPERVISOR';
    userId?: string;
  };
  reason?: string;
  expectedVersion?: number;
}

export class OrderService {
  /**
   * Generates formatted order public code (e.g. PED-2026-984123)
   */
  public static generateOrderCode(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `PED-${year}-${random}`;
  }

  /**
   * Creates a new commercial order with immutable pricing snapshots and audit timeline
   */
  public static async createOrder(input: CreateOrderInput): Promise<OrderDTO> {
    if (!input.items || input.items.length === 0) {
      throw new ValidationError('O pedido deve conter ao menos um item.');
    }
    if (!input.buyer || !input.buyer.name || !input.buyer.document) {
      throw new ValidationError('Os dados do comprador são obrigatórios.');
    }

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const publicCode = this.generateOrderCode();
    const initialStatus = input.initialStatus || 'PENDING';

    let subtotalAmount = 0;
    let discountAmount = 0;
    let feeAmount = 0;
    let totalTicketsCount = 0;

    const orderItems: OrderItemDTO[] = input.items.map(item => {
      const quantity = Math.max(1, item.quantity);
      const unitBase = Math.max(0, item.unitBaseAmount);
      const unitDisc = Math.max(0, item.unitDiscountAmount || 0);
      const unitFee = Math.max(0, item.unitFeeAmount || 0);
      const unitFinal = Math.max(0, unitBase - unitDisc + unitFee);

      const itemSubtotal = unitBase * quantity;
      const itemDiscount = unitDisc * quantity;
      const itemFee = unitFee * quantity;
      const itemTotal = unitFinal * quantity;

      subtotalAmount += itemSubtotal;
      discountAmount += itemDiscount;
      feeAmount += itemFee;
      totalTicketsCount += quantity;

      return {
        id: `oit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        orderId,
        eventId: item.eventId,
        sessionId: item.sessionId,
        sessionName: item.sessionName,
        eventSectionId: item.eventSectionId,
        sectionName: item.sectionName,
        eventTicketTypeId: item.eventTicketTypeId,
        ticketTypeName: item.ticketTypeName,
        ticketBatchId: item.ticketBatchId,
        batchName: item.batchName,
        quantity,
        unitBaseAmount: unitBase,
        unitDiscountAmount: unitDisc,
        unitFeeAmount: unitFee,
        unitFinalAmount: unitFinal,
        subtotalAmount: itemSubtotal,
        discountAmount: itemDiscount,
        feeAmount: itemFee,
        totalAmount: itemTotal,
        priceSnapshotId: item.priceSnapshotId || `snap_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
    });

    const totalAmount = Math.max(0, subtotalAmount - discountAmount + feeAmount);

    const buyerSnapshot: OrderBuyerSnapshotDTO = {
      id: `obs_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      orderId,
      customerId: input.buyer.customerId,
      name: input.buyer.name,
      document: input.buyer.document,
      documentMasked: CommercialDataVisibilityPolicy.maskDocument(input.buyer.document) || '***',
      email: input.buyer.email,
      emailMasked: CommercialDataVisibilityPolicy.maskEmail(input.buyer.email) || '***@***',
      phone: input.buyer.phone,
      phoneMasked: CommercialDataVisibilityPolicy.maskPhone(input.buyer.phone),
      createdAt: new Date().toISOString()
    };

    const initialTimelineEvent: OrderTimelineEventDTO = {
      id: `ote_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      orderId,
      eventType: 'ORDER_CREATED',
      description: `Pedido criado com status inicial ${initialStatus}.`,
      actorName: 'Sistema Comercial',
      actorType: 'SYSTEM',
      metadata: {
        publicCode,
        totalAmount,
        totalTicketsCount
      },
      createdAt: new Date().toISOString()
    };

    const now = new Date();
    const expiresAt = input.expiresInMinutes
      ? new Date(now.getTime() + input.expiresInMinutes * 60 * 1000).toISOString()
      : undefined;

    const confirmedAt = initialStatus === 'CONFIRMED' ? now.toISOString() : undefined;

    // Create Order in storage
    const createdOrder = await prisma.order.create({
      data: {
        id: orderId,
        publicCode,
        orderNumber: publicCode,
        producerId: input.producerId,
        eventId: input.eventId || input.items[0]?.eventId,
        eventName: input.eventName,
        status: initialStatus,
        currency: 'BRL',
        subtotalAmount,
        discountAmount,
        feeAmount,
        totalAmount,
        salesChannelId: input.salesChannelId || 'sc_online',
        salesChannelName: input.salesChannelName || 'Site Oficial Disk Ingressos',
        buyerCustomerId: input.buyer.customerId,
        itemsCount: orderItems.length,
        totalTicketsCount,
        version: 1,
        expiresAt,
        confirmedAt,
        createdAt: now,
        updatedAt: now
      }
    });

    // Save items, buyer snapshot, timeline
    await prisma.orderItem.createMany({ data: orderItems });
    await prisma.orderBuyerSnapshot.create({ data: buyerSnapshot });
    await prisma.orderTimelineEvent.create({ data: initialTimelineEvent });

    await AuditService.log({
      userId: input.buyer.customerId,
      userName: input.buyer.name,
      action: 'COMMERCIAL_ORDER_CREATED',
      resource: `ORDER:${orderId}`,
      producerId: input.producerId,
      eventId: input.eventId,
      details: {
        orderId,
        publicCode,
        totalAmount,
        ticketsCount: totalTicketsCount,
        status: initialStatus
      },
      result: 'SUCCESS'
    });

    return {
      ...createdOrder,
      items: orderItems,
      buyerSnapshot,
      timeline: [initialTimelineEvent]
    };
  }

  /**
   * Transitions an order status with concurrency guard and immutable timeline append
   */
  public static async transitionStatus(input: TransitionOrderInput): Promise<OrderDTO> {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true, buyerSnapshot: true, timeline: true }
    });

    if (!order) {
      throw new NotFoundError(`Pedido com ID '${input.orderId}' não foi encontrado.`);
    }

    // Optimistic Concurrency Control Check
    if (input.expectedVersion !== undefined && order.version !== input.expectedVersion) {
      throw new ValidationError(
        `Conflito de concorrência: o pedido foi alterado por outro processo (versão esperada: ${input.expectedVersion}, versão atual: ${order.version}). Atualize a página e tente novamente.`
      );
    }

    // State machine check
    OrderStateMachine.validateTransition(order.status as OrderStatus, input.targetStatus);

    const now = new Date();
    const updates: Record<string, any> = {
      status: input.targetStatus,
      version: (order.version || 1) + 1,
      updatedAt: now
    };

    if (input.targetStatus === 'CONFIRMED') {
      updates.confirmedAt = now.toISOString();
    } else if (input.targetStatus === 'CANCELLED') {
      updates.cancelledAt = now.toISOString();
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: updates
    });

    // Timeline record
    const timelineEvent: OrderTimelineEventDTO = {
      id: `ote_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      orderId: order.id,
      eventType: `ORDER_${input.targetStatus}`,
      description: input.reason || `Status alterado de ${order.status} para ${input.targetStatus}.`,
      actorName: input.actor.name || 'Operador',
      actorType: input.actor.type,
      metadata: {
        previousStatus: order.status,
        newStatus: input.targetStatus,
        version: updates.version
      },
      createdAt: now.toISOString()
    };

    await prisma.orderTimelineEvent.create({ data: timelineEvent });

    await AuditService.log({
      userId: input.actor.userId,
      userName: input.actor.name,
      action: `COMMERCIAL_ORDER_STATUS_${input.targetStatus}`,
      resource: `ORDER:${order.id}`,
      producerId: order.producerId,
      eventId: order.eventId,
      details: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: input.targetStatus,
        reason: input.reason
      },
      result: 'SUCCESS'
    });

    const refreshedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true, buyerSnapshot: true, timeline: true }
    });

    return refreshedOrder;
  }
}
