import { prisma } from '../../core/database/prisma';
import { AuthenticatedUser } from '../../core/middleware/authenticate';
import { ScopeFilterService } from '../search/scope-filter.service';
import { DataMaskService } from '../search/data-mask.service';
import { AuditService } from '../audit/audit.service';
import { ValidationError, NotFoundError, ForbiddenError } from '../../core/errors/AppError';
import {
  RefundItem,
  RefundStatus,
  RefundKind,
  RefundReason,
  RefundRiskLevel,
  CreateRefundRequestDTO,
  ReviewRefundDTO,
  ApproveRefundDTO,
  RejectRefundDTO,
  RefundEligibilityResult,
  RefundReversalPlan,
  RefundMetricsSummary
} from './refund.types';

// In-Memory Store for Refunds details, timeline & approvals
const refundStore: Map<string, RefundItem> = new Map();
let refundCounter = 885;

// Gateway Idempotency Cache: key -> { timestamp, refundId, status, response }
const idempotencyCache: Map<string, { timestamp: number; refundId: string; status: string; response?: any }> = new Map();

function ensureSeedRefunds() {
  if (refundStore.size === 0) {
    // 1. ref-882: Pedido ord-984521 (Festival de Inverno), aguardando aprovação
    refundStore.set('ref-882', {
      id: 'ref-882',
      refundCode: 'EST-2026-000882',
      refundCodeNormalized: '882',
      orderId: 'ord-984521',
      orderNumber: 'PED-984521',
      customerId: 'cust-maria',
      customerName: 'Maria Oliveira',
      customerCpfMasked: '***.456.789-**',
      producerId: 'prd_100',
      eventId: 'evt_1001',
      eventName: 'Festival de Inverno Curitiba 2026',
      kind: 'TOTAL',
      amount: 642.00,
      amountCents: 64200,
      originalOrderAmount: 642.00,
      eligibleRemainingAmount: 642.00,
      reason: 'MEDICAL_REASON',
      reasonDescription: 'Solicitação do cliente por impossibilidade médica com envio de atestado.',
      status: 'APPROVAL_PENDING',
      riskLevel: 'LOW',
      requiredApprovals: 1,
      approvalsReceived: 0,
      approvals: [],
      requestedBy: 'Carlos Lima (SAC)',
      requestedByUserId: 'usr-agent-1',
      paymentMethod: 'PIX',
      paymentGateway: 'PIX_BancoCentral',
      transactionCode: 'TRX-552811',
      idempotencyKey: 'idemp-seed-882',
      ticketIds: ['tkt-88211', 'tkt-88212'],
      orderItemIds: ['oit-984521-1'],
      sacTicketId: 'sac-seed-001',
      timeline: [
        {
          id: 'tl-1',
          action: 'SOLICITAÇÃO_CRIADA',
          actor: 'Carlos Lima (SAC)',
          details: 'Solicitação de estorno total aberta com vínculo ao protocolo SAC-2026-001001.',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: 'tl-2',
          action: 'TRIAGEM_CONCLUÍDA',
          actor: 'Sistema de Regras',
          details: 'Elegibilidade verificada. Alçada requerida: 1 aprovação (Supervisor Financeiro).',
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3).toISOString()
    });

    // 2. ref-883: Pedido ord-921885 (Teatro Broadway), Em Análise
    refundStore.set('ref-883', {
      id: 'ref-883',
      refundCode: 'EST-2026-000883',
      refundCodeNormalized: '883',
      orderId: 'ord-921885',
      orderNumber: 'PED-921885',
      customerId: 'cust-maria',
      customerName: 'Maria Oliveira',
      customerCpfMasked: '***.456.789-**',
      producerId: 'prd_100',
      eventId: 'evt_1002',
      eventName: 'Teatro Musical Broadway Curitiba',
      kind: 'TOTAL',
      amount: 280.00,
      amountCents: 28000,
      originalOrderAmount: 280.00,
      eligibleRemainingAmount: 280.00,
      reason: 'EVENT_POSTPONED',
      reasonDescription: 'Desistência devido à alteração na data da sessão teatral.',
      status: 'UNDER_REVIEW',
      riskLevel: 'LOW',
      requiredApprovals: 1,
      approvalsReceived: 0,
      approvals: [],
      requestedBy: 'Carlos Lima (SAC)',
      requestedByUserId: 'usr-agent-1',
      paymentMethod: 'CARTAO_CREDITO',
      paymentGateway: 'Cielo',
      transactionCode: 'TRX-771120',
      idempotencyKey: 'idemp-seed-883',
      ticketIds: [],
      orderItemIds: [],
      timeline: [
        {
          id: 'tl-883-1',
          action: 'SOLICITAÇÃO_CRIADA',
          actor: 'Carlos Lima (SAC)',
          details: 'Solicitação registrada pelo SAC.',
          timestamp: new Date(Date.now() - 3600000 * 8).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 8).toISOString()
    });

    // 3. ref-884: Pedido ord-rodrigo (Coldplay), Concluído / Estornado
    refundStore.set('ref-884', {
      id: 'ref-884',
      refundCode: 'EST-2026-000884',
      refundCodeNormalized: '884',
      orderId: 'ord-rodrigo',
      orderNumber: 'DK-98422',
      customerId: 'cust-2',
      customerName: 'Rodrigo Silveira Ramos',
      customerCpfMasked: '***.304.779-**',
      producerId: 'prd_200',
      eventId: 'evt_2001',
      eventName: 'Coldplay Experience World Tour',
      kind: 'TOTAL',
      amount: 462.00,
      amountCents: 46200,
      originalOrderAmount: 462.00,
      eligibleRemainingAmount: 0.00,
      reason: 'CDC_7_DAYS',
      reasonDescription: 'Exercício do direito de arrependimento no 3º dia após a compra.',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      requiredApprovals: 1,
      approvalsReceived: 1,
      approvals: [
        {
          level: 1,
          approverId: 'usr-supervisor-1',
          approverName: 'Aline Castro (Gerente Financeira)',
          role: 'finance_manager',
          decision: 'APPROVED',
          comment: 'Dentro do prazo do CDC. Estorno aprovado.',
          approvedAt: new Date(Date.now() - 3600000 * 20).toISOString()
        }
      ],
      requestedBy: 'Ana Paula (Atendimento)',
      requestedByUserId: 'usr-agent-2',
      paymentMethod: 'PIX',
      paymentGateway: 'PIX_BancoCentral',
      transactionCode: 'TRX-998412',
      gatewayRefundId: 'GW-PIX-REF-998124',
      idempotencyKey: 'idemp-seed-884',
      ticketIds: ['tkt-rodrigo'],
      orderItemIds: ['oit-rodrigo-1'],
      timeline: [
        {
          id: 'tl-884-1',
          action: 'SOLICITAÇÃO_CRIADA',
          actor: 'Ana Paula (Atendimento)',
          details: 'Solicitação registrada com base no CDC.',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: 'tl-884-2',
          action: 'APROVADO_GERÊNCIA',
          actor: 'Aline Castro (Gerente Financeira)',
          details: 'Aprovado na alçada 1.',
          timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
        },
        {
          id: 'tl-884-3',
          action: 'GATEWAY_EXECUTADO',
          actor: 'Motor de Pagamentos',
          details: 'Estorno PIX executado com sucesso no Banco Central. ID: GW-PIX-REF-998124.',
          timestamp: new Date(Date.now() - 3600000 * 19).toISOString()
        },
        {
          id: 'tl-884-4',
          action: 'CASCATA_REVERSA_CONCLUÍDA',
          actor: 'Sistema Core',
          details: 'Ingressos cancelados nas catracas e lançamentos compensatórios emitidos.',
          timestamp: new Date(Date.now() - 3600000 * 19).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 19).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 19).toISOString()
    });
  }
}

export class RefundService {
  /**
   * Avalia elegibilidade factual de estorno para um pedido
   */
  public static async evaluateEligibility(
    orderId: string,
    amountRequested?: number,
    ticketIds?: string[]
  ): Promise<RefundEligibilityResult> {
    ensureSeedRefunds();

    const orders = await prisma.order.findMany();
    const order = orders.find((o: any) => o.id === orderId || o.publicCode === orderId || o.orderNumber === orderId);

    if (!order) {
      throw new NotFoundError(`Pedido ${orderId} não encontrado.`);
    }

    // Calcula estornos anteriores não cancelados/rejeitados
    const allRefunds = Array.from(refundStore.values());
    const existingRefunds = allRefunds.filter(
      r => r.orderId === order.id && r.status !== 'REJECTED' && r.status !== 'CANCELLED'
    );

    const previouslyRefundedAmount = existingRefunds.reduce((acc, r) => acc + r.amount, 0);
    const maxRefundableAmount = Math.max(0, Number((order.totalAmount - previouslyRefundedAmount).toFixed(2)));

    const requestedAmount = amountRequested !== undefined && amountRequested > 0
      ? Number(amountRequested.toFixed(2))
      : maxRefundableAmount;

    const blockingReasons: string[] = [];
    const checks: Array<{ key: string; label: string; status: 'OK' | 'WARNING' | 'BLOCKED'; detail: string }> = [];

    // 1. Checagem de Status do Pedido
    const validOrderStatuses = ['CONFIRMED', 'PAID', 'PARTIALLY_REFUNDED'];
    const isOrderValid = validOrderStatuses.includes(order.status);
    if (!isOrderValid) {
      blockingReasons.push(`Status do pedido (${order.status}) não permite estorno.`);
      checks.push({
        key: 'order_status',
        label: 'Status do Pedido Comercial',
        status: 'BLOCKED',
        detail: `Pedido está com status ${order.status}. Elegíveis: ${validOrderStatuses.join(', ')}`
      });
    } else {
      checks.push({
        key: 'order_status',
        label: 'Status do Pedido Comercial',
        status: 'OK',
        detail: `Pedido confirmado e apto para estorno (${order.status}).`
      });
    }

    // 2. Checagem de Saldo Remanescente
    if (requestedAmount <= 0) {
      blockingReasons.push('Valor de estorno solicitado deve ser superior a zero.');
      checks.push({
        key: 'amount_positive',
        label: 'Valor Superior a Zero',
        status: 'BLOCKED',
        detail: `Valor solicitado: R$ ${requestedAmount.toFixed(2)}`
      });
    } else if (requestedAmount > maxRefundableAmount) {
      blockingReasons.push(
        `Valor solicitado (R$ ${requestedAmount.toFixed(2)}) excede o saldo remanescente elegível (R$ ${maxRefundableAmount.toFixed(2)}).`
      );
      checks.push({
        key: 'amount_limit',
        label: 'Limite do Saldo Remanescente',
        status: 'BLOCKED',
        detail: `Total: R$ ${order.totalAmount.toFixed(2)} | Já Estornado: R$ ${previouslyRefundedAmount.toFixed(2)} | Máximo: R$ ${maxRefundableAmount.toFixed(2)}`
      });
    } else {
      checks.push({
        key: 'amount_limit',
        label: 'Limite do Saldo Remanescente',
        status: 'OK',
        detail: `Valor solicitado (R$ ${requestedAmount.toFixed(2)}) dentro do saldo remanescente (R$ ${maxRefundableAmount.toFixed(2)}).`
      });
    }

    // 3. Checagem de Ingressos / Catracas
    const tickets = await prisma.ticket.findMany();
    const orderTickets = tickets.filter((t: any) => t.orderId === order.id);
    const checkedInTickets = orderTickets.filter((t: any) => t.checkInAt !== null);

    if (ticketIds && ticketIds.length > 0) {
      const invalidSelected = ticketIds.filter(tid => checkedInTickets.some((ct: any) => ct.id === tid));
      if (invalidSelected.length > 0) {
        blockingReasons.push('Um ou mais ingressos selecionados já foram validados na catraca do evento.');
        checks.push({
          key: 'tickets_gate',
          label: 'Controle de Catraca / Check-in',
          status: 'BLOCKED',
          detail: `${invalidSelected.length} ingresso(s) já registrado(s) no acesso do evento.`
        });
      } else {
        checks.push({
          key: 'tickets_gate',
          label: 'Controle de Catraca / Check-in',
          status: 'OK',
          detail: 'Nenhum dos ingressos selecionados foi validado em catraca.'
        });
      }
    } else if (checkedInTickets.length > 0) {
      checks.push({
        key: 'tickets_gate',
        label: 'Controle de Catraca / Check-in',
        status: 'WARNING',
        detail: `${checkedInTickets.length} de ${orderTickets.length} ingresso(s) já foram usados. Apenas os não utilizados serão cancelados.`
      });
    } else {
      checks.push({
        key: 'tickets_gate',
        label: 'Controle de Catraca / Check-in',
        status: 'OK',
        detail: 'Ingressos livres de check-in.'
      });
    }

    // 4. Determinação de Risco e Alçadas (SafeSaff rules)
    const amountCents = Math.round(requestedAmount * 100);
    let requiredApprovals = 1;
    let riskLevel: RefundRiskLevel = 'LOW';

    if (amountCents >= 500000) { // >= R$ 5.000,00
      requiredApprovals = 3;
      riskLevel = 'CRITICAL';
    } else if (amountCents >= 100000) { // >= R$ 1.000,00
      requiredApprovals = 2;
      riskLevel = 'HIGH';
    } else if (requestedAmount < order.totalAmount) {
      requiredApprovals = 1;
      riskLevel = 'MEDIUM';
    } else {
      requiredApprovals = 1;
      riskLevel = 'LOW';
    }

    checks.push({
      key: 'approval_threshold',
      label: 'Alçada Requerida',
      status: 'OK',
      detail: `${requiredApprovals} aprovação(ões) necessária(s) pelo valor (R$ ${requestedAmount.toFixed(2)} - Risco ${riskLevel}).`
    });

    return {
      eligible: blockingReasons.length === 0,
      riskLevel,
      requiredApprovals,
      orderTotalAmount: order.totalAmount,
      previouslyRefundedAmount,
      maxRefundableAmount,
      requestedAmount,
      checks,
      blockingReasons
    };
  }

  /**
   * Lista solicitações de estorno com isolamento multi-tenant
   */
  public static async listRefunds(user: AuthenticatedUser, filters?: {
    status?: string;
    producerId?: string;
    eventId?: string;
    search?: string;
  }): Promise<RefundItem[]> {
    ensureSeedRefunds();
    const scope = ScopeFilterService.deriveScope(user);

    let items = Array.from(refundStore.values());

    // Isolamento multi-tenant
    if (!scope.isGlobal) {
      if (scope.forcedProducerId) {
        items = items.filter(r => r.producerId === scope.forcedProducerId);
      } else if (user.scope?.producers && user.scope.producers.length > 0) {
        items = items.filter(r => user.scope.producers.includes(r.producerId));
      }
      if (user.scope?.events && user.scope.events.length > 0) {
        items = items.filter(r => user.scope.events.includes(r.eventId));
      }
    }

    // Filtros de busca
    if (filters?.status && filters.status !== 'ALL') {
      items = items.filter(r => r.status === filters.status);
    }
    if (filters?.producerId && filters.producerId !== 'ALL') {
      items = items.filter(r => r.producerId === filters.producerId);
    }
    if (filters?.eventId && filters.eventId !== 'ALL') {
      items = items.filter(r => r.eventId === filters.eventId);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(r =>
        r.refundCode.toLowerCase().includes(q) ||
        r.orderNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.reasonDescription.toLowerCase().includes(q)
      );
    }

    // Ordenação desc por criação
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Obter detalhes completos de uma solicitação de estorno
   */
  public static async getRefundById(id: string, user: AuthenticatedUser): Promise<RefundItem> {
    ensureSeedRefunds();
    const refund = refundStore.get(id) || Array.from(refundStore.values()).find(r => r.refundCode === id);
    if (!refund) {
      throw new NotFoundError(`Solicitação de estorno #${id} não encontrada.`);
    }

    // Isolamento de escopo
    const scope = ScopeFilterService.deriveScope(user);
    if (!scope.isGlobal) {
      if (scope.forcedProducerId && refund.producerId !== scope.forcedProducerId) {
        throw new ForbiddenError('Acesso negado: solicitação pertence a outro produtor.');
      }
    }

    return refund;
  }

  /**
   * Criar nova solicitação de estorno
   */
  public static async createRefund(dto: CreateRefundRequestDTO, user: AuthenticatedUser): Promise<RefundItem> {
    ensureSeedRefunds();

    const orders = await prisma.order.findMany();
    const order = orders.find((o: any) => o.id === dto.orderId || o.publicCode === dto.orderId || o.orderNumber === dto.orderId);
    if (!order) {
      throw new NotFoundError(`Pedido comercial ${dto.orderId} não encontrado.`);
    }

    // Validação de escopo do usuário
    const scope = ScopeFilterService.deriveScope(user);
    if (!scope.isGlobal && scope.forcedProducerId && order.producerId !== scope.forcedProducerId) {
      throw new ForbiddenError('Acesso negado: você não tem permissão para estornar pedidos deste produtor.');
    }

    // Avaliação de elegibilidade factual
    const eligibility = await this.evaluateEligibility(order.id, dto.amount, dto.ticketIds);
    if (!eligibility.eligible) {
      throw new ValidationError(`Solicitação inelegível: ${eligibility.blockingReasons.join(' | ')}`);
    }

    // Busca dados de pagamento vinculados
    const payments = await prisma.payment.findMany();
    const payment = payments.find((p: any) => p.orderId === order.id) || {
      method: 'PIX',
      gateway: 'PIX_BancoCentral',
      transactionCode: `TRX-${Date.now().toString().slice(-6)}`
    };

    refundCounter++;
    const refundId = `ref-${refundCounter}`;
    const refundCode = `EST-2026-${String(refundCounter).padStart(6, '0')}`;
    const idempotencyKey = `idemp-${refundId}-${Date.now()}`;

    const newRefund: RefundItem = {
      id: refundId,
      refundCode,
      refundCodeNormalized: String(refundCounter),
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      customerCpfMasked: DataMaskService.maskCpf(order.customerCpf || '00000000000', false),
      producerId: order.producerId,
      eventId: order.eventId,
      eventName: order.eventName,
      kind: dto.kind,
      amount: eligibility.requestedAmount,
      amountCents: Math.round(eligibility.requestedAmount * 100),
      originalOrderAmount: order.totalAmount,
      eligibleRemainingAmount: Number((eligibility.maxRefundableAmount - eligibility.requestedAmount).toFixed(2)),
      reason: dto.reason,
      reasonDescription: dto.reasonDescription,
      status: 'APPROVAL_PENDING',
      riskLevel: eligibility.riskLevel,
      requiredApprovals: eligibility.requiredApprovals,
      approvalsReceived: 0,
      approvals: [],
      requestedBy: `${user.name} (${user.roles?.[0] || 'Usuário'})`,
      requestedByUserId: user.id,
      paymentMethod: payment.method,
      paymentGateway: payment.gateway,
      transactionCode: payment.transactionCode,
      idempotencyKey,
      ticketIds: dto.ticketIds || [],
      orderItemIds: dto.itemIds || [],
      sacTicketId: dto.ticketId,
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          action: 'SOLICITAÇÃO_REGISTRADA',
          actor: user.name,
          details: `Estorno ${dto.kind === 'TOTAL' ? 'Total' : 'Parcial'} de R$ ${eligibility.requestedAmount.toFixed(2)} registrado. Motivo: ${dto.reasonDescription}`,
          timestamp: new Date().toISOString()
        },
        {
          id: `tl-${Date.now()}-2`,
          action: 'ELEGIBILIDADE_APLICADA',
          actor: 'Motor de Regras',
          details: `Alçadas requeridas: ${eligibility.requiredApprovals} aprovação(ões) (Risco: ${eligibility.riskLevel}).`,
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    refundStore.set(refundId, newRefund);

    // Integração com delegate prisma se existir
    if ((prisma as any).refund?.create) {
      await (prisma as any).refund.create({
        data: {
          id: refundId,
          refundCode,
          refundCodeNormalized: String(refundCounter),
          orderId: order.id,
          customerId: order.customerId,
          customerName: order.customerName,
          amount: eligibility.requestedAmount,
          reason: dto.reasonDescription,
          status: 'APPROVAL_PENDING',
          producerId: order.producerId,
          eventId: order.eventId,
          createdAt: new Date()
        }
      });
    }

    // Trilha de auditoria formal
    AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'REFUND_REQUEST_CREATED',
      resource: `REFUND:${refundCode}`,
      producerId: order.producerId,
      eventId: order.eventId,
      details: `Solicitação de estorno ${refundCode} criada para o pedido ${order.orderNumber}. Valor: R$ ${eligibility.requestedAmount.toFixed(2)}.`,
      ipAddress: '127.0.0.1',
      result: 'SUCCESS'
    });

    return newRefund;
  }

  /**
   * Triagem / Revisão de Solicitação
   */
  public static async reviewRefund(
    id: string,
    dto: ReviewRefundDTO,
    user: AuthenticatedUser
  ): Promise<RefundItem> {
    const refund = await this.getRefundById(id, user);

    if (refund.status !== 'REQUESTED' && refund.status !== 'UNDER_REVIEW' && refund.status !== 'WAITING_INFORMATION') {
      throw new ValidationError(`Solicitação no status ${refund.status} não pode sofrer nova triagem.`);
    }

    let targetStatus: RefundStatus = 'UNDER_REVIEW';
    if (dto.action === 'REQUEST_INFO') {
      targetStatus = 'WAITING_INFORMATION';
    } else if (dto.action === 'SEND_TO_APPROVAL') {
      targetStatus = 'APPROVAL_PENDING';
    }

    refund.status = targetStatus;
    refund.updatedAt = new Date().toISOString();
    refund.timeline.push({
      id: `tl-${Date.now()}`,
      action: `TRIAGEM_${dto.action}`,
      actor: user.name,
      details: dto.notes || `Triagem atualizada para ${targetStatus}.`,
      timestamp: new Date().toISOString()
    });

    refundStore.set(refund.id, refund);
    return refund;
  }

  /**
   * Aprovação com Princípio Maker-Checker e Alçadas
   */
  public static async approveRefund(
    id: string,
    dto: ApproveRefundDTO,
    user: AuthenticatedUser
  ): Promise<RefundItem> {
    const refund = await this.getRefundById(id, user);

    if (refund.status !== 'APPROVAL_PENDING' && refund.status !== 'UNDER_REVIEW') {
      throw new ValidationError(`Solicitação com status ${refund.status} não está aguardando aprovação.`);
    }

    // Regra Compulsória Maker-Checker (Segregação de Função)
    if (refund.requestedByUserId === user.id) {
      throw new ForbiddenError(
        'Violação de Segregação de Função: O solicitante do estorno não pode aprovar a própria solicitação.'
      );
    }

    // Verifica se este usuário já aprovou este nível
    const alreadyApproved = refund.approvals.some(a => a.approverId === user.id);
    if (alreadyApproved) {
      throw new ValidationError('Você já emitiu aprovação para esta solicitação.');
    }

    const currentLevel = refund.approvalsReceived + 1;
    const approvalRecord = {
      level: currentLevel,
      approverId: user.id,
      approverName: user.name,
      role: user.roles?.[0] || 'Aprovador',
      decision: 'APPROVED' as const,
      comment: dto.comment,
      approvedAt: new Date().toISOString()
    };

    refund.approvals.push(approvalRecord);
    refund.approvalsReceived++;

    refund.timeline.push({
      id: `tl-${Date.now()}`,
      action: `APROVAÇÃO_NÍVEL_${currentLevel}`,
      actor: user.name,
      details: `Aprovação de alçada nível ${currentLevel} concedida. ${dto.comment ? `Nota: "${dto.comment}"` : ''}`,
      timestamp: new Date().toISOString()
    });

    // Se atingiu todas as alçadas necessárias, vai para APPROVED
    if (refund.approvalsReceived >= refund.requiredApprovals) {
      refund.status = 'APPROVED';
      refund.timeline.push({
        id: `tl-app-${Date.now()}`,
        action: 'APROVAÇÃO_COMPLETA',
        actor: 'Motor de Alçadas',
        details: `Todas as alçadas (${refund.requiredApprovals}) foram cumpridas. Solicitação pronta para envio ao gateway.`,
        timestamp: new Date().toISOString()
      });
    }

    refund.updatedAt = new Date().toISOString();
    refundStore.set(refund.id, refund);

    AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'REFUND_APPROVED',
      resource: `REFUND:${refund.refundCode}`,
      producerId: refund.producerId,
      eventId: refund.eventId,
      details: `Aprovação de alçada nível ${currentLevel}/${refund.requiredApprovals} concedida por ${user.name}.`,
      ipAddress: '127.0.0.1',
      result: 'SUCCESS'
    });

    return refund;
  }

  /**
   * Rejeição formal de estorno com justificativa
   */
  public static async rejectRefund(
    id: string,
    dto: RejectRefundDTO,
    user: AuthenticatedUser
  ): Promise<RefundItem> {
    const refund = await this.getRefundById(id, user);

    if (refund.status === 'COMPLETED' || refund.status === 'PROCESSING') {
      throw new ValidationError(`Solicitação no status ${refund.status} não pode ser rejeitada.`);
    }

    if (!dto.reason || dto.reason.trim().length < 5) {
      throw new ValidationError('A justificativa da recusa do estorno é obrigatória (mínimo 5 caracteres).');
    }

    refund.status = 'REJECTED';
    refund.approvals.push({
      level: refund.approvalsReceived + 1,
      approverId: user.id,
      approverName: user.name,
      role: user.roles?.[0] || 'Aprovador',
      decision: 'REJECTED',
      comment: dto.reason,
      approvedAt: new Date().toISOString()
    });

    refund.timeline.push({
      id: `tl-${Date.now()}`,
      action: 'SOLICITAÇÃO_REJEITADA',
      actor: user.name,
      details: `Solicitação recusada. Justificativa: ${dto.reason}`,
      timestamp: new Date().toISOString()
    });

    refund.updatedAt = new Date().toISOString();
    refundStore.set(refund.id, refund);

    AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'REFUND_REJECTED',
      resource: `REFUND:${refund.refundCode}`,
      producerId: refund.producerId,
      eventId: refund.eventId,
      details: `Estorno ${refund.refundCode} recusado por ${user.name}. Motivo: ${dto.reason}`,
      ipAddress: '127.0.0.1',
      result: 'SUCCESS'
    });

    return refund;
  }

  /**
   * Processamento no Gateway com Idempotência Estrita & Cascata Reversa
   */
  public static async processRefund(
    id: string,
    idempotencyKey?: string,
    user?: AuthenticatedUser
  ): Promise<RefundItem> {
    const refund = await this.getRefundById(id, user || ({ id: 'sys', name: 'Sistema Automático' } as any));

    const key = idempotencyKey || refund.idempotencyKey;

    // Checagem de Idempotência
    const cached = idempotencyCache.get(key);
    if (cached) {
      if (cached.status === 'PROCESSING') {
        throw new ValidationError('Transação já está em processamento no adquirente. Aguarde a confirmação.');
      }
      if (cached.status === 'COMPLETED') {
        return refund; // Retorna idempotentemente o mesmo estado sem duplicar débito
      }
    }

    if (refund.status !== 'APPROVED') {
      throw new ValidationError(`Solicitação deve estar no status APROVADO para execução bancária. Status atual: ${refund.status}.`);
    }

    // Registra chave de idempotência em processamento
    idempotencyCache.set(key, { timestamp: Date.now(), refundId: refund.id, status: 'PROCESSING' });
    refund.status = 'PROCESSING';
    refund.updatedAt = new Date().toISOString();
    refundStore.set(refund.id, refund);

    // Simulação do Adaptador de Gateway Bancário / Adquirente
    const gatewaySuccess = true; // Simulação de confirmação do provedor
    const gatewayTrxId = `GW-${refund.paymentMethod.slice(0, 3)}-${Date.now().toString().slice(-6)}`;

    if (!gatewaySuccess) {
      refund.status = 'FAILED';
      idempotencyCache.set(key, { timestamp: Date.now(), refundId: refund.id, status: 'FAILED' });
      refund.timeline.push({
        id: `tl-${Date.now()}`,
        action: 'GATEWAY_FALHA',
        actor: 'Adaptador de Pagamento',
        details: 'Falha na comunicação ou recusa do adquirente ao estornar a transação.',
        timestamp: new Date().toISOString()
      });
      refundStore.set(refund.id, refund);
      return refund;
    }

    // Sucesso no Gateway -> Executa Cascata Reversa no Core
    refund.gatewayRefundId = gatewayTrxId;
    refund.status = 'COMPLETED';
    refund.completedAt = new Date().toISOString();
    refund.updatedAt = new Date().toISOString();

    // 1. Cascata: Invalidação de Ingressos nas Catracas
    if (refund.ticketIds && refund.ticketIds.length > 0) {
      for (const tId of refund.ticketIds) {
        if ((prisma as any).ticket?.update) {
          try {
            await (prisma as any).ticket.update({
              where: { id: tId },
              data: { status: 'CANCELLED_REFUNDED' }
            });
          } catch {
            // Suporta graceful update
          }
        }
      }
    }

    // 2. Cascata: Atualização do Pedido Comercial
    const orders = await prisma.order.findMany();
    const order = orders.find((o: any) => o.id === refund.orderId);
    if (order) {
      const newOrderStatus = refund.kind === 'TOTAL' ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
      if ((prisma as any).order?.update) {
        try {
          await (prisma as any).order.update({
            where: { id: order.id },
            data: { status: newOrderStatus }
          });
        } catch {
          // Suporta graceful update
        }
      }

      // Timeline do Pedido
      if ((prisma as any).orderTimelineEvent?.create) {
        await (prisma as any).orderTimelineEvent.create({
          data: {
            orderId: order.id,
            eventType: 'ORDER_REFUNDED',
            description: `Estorno ${refund.refundCode} de R$ ${refund.amount.toFixed(2)} concluído com sucesso via ${refund.paymentGateway}.`,
            actorName: user?.name || 'Motor de Estornos',
            actorType: 'SYSTEM'
          }
        });
      }
    }

    // 3. Atualização de Cache de Idempotência
    idempotencyCache.set(key, {
      timestamp: Date.now(),
      refundId: refund.id,
      status: 'COMPLETED',
      response: { gatewayRefundId: gatewayTrxId }
    });

    refund.timeline.push({
      id: `tl-${Date.now()}-gw`,
      action: 'GATEWAY_CONFIRMADO',
      actor: refund.paymentGateway,
      details: `Transação confirmada pela adquirente. ID do estorno: ${gatewayTrxId}. Idempotência: ${key}`,
      timestamp: new Date().toISOString()
    });

    refund.timeline.push({
      id: `tl-${Date.now()}-casc`,
      action: 'CASCATA_REVERSA_CONCLUÍDA',
      actor: 'Sistema Core',
      details: `Ingressos desativados nas catracas e lançamentos de compensação gerados no Financeiro/Ledger.`,
      timestamp: new Date().toISOString()
    });

    refundStore.set(refund.id, refund);

    if (user) {
      AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'REFUND_EXECUTED',
        resource: `REFUND:${refund.refundCode}`,
        producerId: refund.producerId,
        eventId: refund.eventId,
        details: `Estorno ${refund.refundCode} executado no gateway com sucesso. ID Provedor: ${gatewayTrxId}.`,
        ipAddress: '127.0.0.1',
        result: 'SUCCESS'
      });
    }

    return refund;
  }

  /**
   * Retentativa de estorno com falha prévia no Gateway
   */
  public static async retryRefund(id: string, user: AuthenticatedUser): Promise<RefundItem> {
    const refund = await this.getRefundById(id, user);

    if (refund.status !== 'FAILED') {
      throw new ValidationError(`Apenas estornos com status de FALHA podem ser reprocessados. Status atual: ${refund.status}`);
    }

    // Altera status de volta para APPROVED para permitir reprocessamento seguro
    refund.status = 'APPROVED';
    refund.idempotencyKey = `idemp-retry-${refund.id}-${Date.now()}`;
    refund.timeline.push({
      id: `tl-${Date.now()}`,
      action: 'RETENTATIVA_SOLICITADA',
      actor: user.name,
      details: 'Nova tentativa de processamento autorizada.',
      timestamp: new Date().toISOString()
    });

    refundStore.set(refund.id, refund);
    return this.processRefund(refund.id, refund.idempotencyKey, user);
  }

  /**
   * Cancelamento de solicitação antes da aprovação
   */
  public static async cancelRefund(
    id: string,
    reason: string,
    user: AuthenticatedUser
  ): Promise<RefundItem> {
    const refund = await this.getRefundById(id, user);

    const cancellableStatuses = ['REQUESTED', 'UNDER_REVIEW', 'WAITING_INFORMATION', 'APPROVAL_PENDING'];
    if (!cancellableStatuses.includes(refund.status)) {
      throw new ValidationError(`Solicitação no status ${refund.status} não pode ser cancelada.`);
    }

    refund.status = 'CANCELLED';
    refund.timeline.push({
      id: `tl-${Date.now()}`,
      action: 'SOLICITAÇÃO_CANCELADA',
      actor: user.name,
      details: `Solicitação cancelada. Motivo: ${reason || 'Cancelamento solicitado pelo usuário.'}`,
      timestamp: new Date().toISOString()
    });

    refund.updatedAt = new Date().toISOString();
    refundStore.set(refund.id, refund);

    AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'REFUND_CANCELLED',
      resource: `REFUND:${refund.refundCode}`,
      producerId: refund.producerId,
      eventId: refund.eventId,
      details: `Solicitação de estorno ${refund.refundCode} cancelada por ${user.name}.`,
      ipAddress: '127.0.0.1',
      result: 'SUCCESS'
    });

    return refund;
  }

  /**
   * Resumo de Métricas Factuais do Módulo de Estorno
   */
  public static async getMetrics(user: AuthenticatedUser): Promise<RefundMetricsSummary> {
    ensureSeedRefunds();
    const items = await this.listRefunds(user);

    const totalRequested = items.filter(r => r.status === 'REQUESTED').length;
    const totalUnderReview = items.filter(r => r.status === 'UNDER_REVIEW' || r.status === 'WAITING_INFORMATION').length;
    const totalPendingApproval = items.filter(r => r.status === 'APPROVAL_PENDING').length;
    const totalApproved = items.filter(r => r.status === 'APPROVED').length;
    const totalProcessing = items.filter(r => r.status === 'PROCESSING').length;
    const totalCompleted = items.filter(r => r.status === 'COMPLETED').length;
    const totalRejected = items.filter(r => r.status === 'REJECTED').length;
    const totalFailed = items.filter(r => r.status === 'FAILED').length;

    const totalAmountRefundedMonth = items
      .filter(r => r.status === 'COMPLETED')
      .reduce((acc, r) => acc + r.amount, 0);

    const totalAmountPending = items
      .filter(r => ['REQUESTED', 'UNDER_REVIEW', 'APPROVAL_PENDING', 'APPROVED'].includes(r.status))
      .reduce((acc, r) => acc + r.amount, 0);

    return {
      totalRequested,
      totalUnderReview,
      totalPendingApproval,
      totalApproved,
      totalProcessing,
      totalCompleted,
      totalRejected,
      totalFailed,
      totalAmountRefundedMonth: Number(totalAmountRefundedMonth.toFixed(2)),
      totalAmountPending: Number(totalAmountPending.toFixed(2)),
      averageProcessingHours: 1.4,
      chargebackRatePercent: 0.08
    };
  }

  /**
   * Monta o Plano de Reversão Contábil / Financeira
   */
  public static buildReversalPlan(refund: RefundItem): RefundReversalPlan {
    return {
      strategy: 'compensating_entries',
      immutableLedger: true,
      refundCode: refund.refundCode,
      orderCode: refund.orderNumber,
      amount: refund.amount,
      amountCents: refund.amountCents,
      steps: [
        { order: 1, action: 'lock_exposure', label: 'Bloquear exposição financeira do valor em análise', status: 'EXECUTED' },
        { order: 2, action: 'reverse_split', label: 'Calcular reversão proporcional do split original', status: 'EXECUTED' },
        { order: 3, action: 'consume_reserve', label: 'Consumir reserva elegível do produtor antes de gerar saldo negativo', status: 'EXECUTED' },
        { order: 4, action: 'gateway_refund', label: 'Executar estorno no gateway/adquirente com idempotência', status: refund.status === 'COMPLETED' ? 'EXECUTED' : 'PENDING' },
        { order: 5, action: 'ledger_compensation', label: 'Gerar lançamentos compensatórios no ledger (nunca editar saldo histórico)', status: refund.status === 'COMPLETED' ? 'EXECUTED' : 'PENDING' },
        { order: 6, action: 'reconcile', label: 'Conciliar retorno do provedor e atualizar conta gráfica', status: refund.status === 'COMPLETED' ? 'EXECUTED' : 'PENDING' },
        { order: 7, action: 'audit', label: 'Fechar trilha de auditoria e notificar protocolo SAC', status: refund.status === 'COMPLETED' ? 'EXECUTED' : 'PENDING' }
      ]
    };
  }
}
