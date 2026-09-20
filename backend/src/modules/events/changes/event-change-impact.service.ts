import crypto from 'crypto';
import { prisma } from '../../../core/database/prisma';
import { EventChangeImpactDTO, EventChangeType } from '@shared/types/index';

export class EventChangeImpactService {
  /**
   * Executa a análise de impacto estrutural, financeiro e operacional de uma solicitação de alteração
   */
  static async evaluateImpact(
    eventId: string,
    changeType: EventChangeType,
    resourceType: string,
    resourceId: string,
    payload: { field: string; before: any; after: any },
    sessionId?: string | null,
    requestId: string = `req_${Date.now()}`
  ): Promise<EventChangeImpactDTO> {
    const [
      allOrders,
      allTickets,
      teamMembers,
      sections,
      pools
    ] = await Promise.all([
      (prisma as any).order?.findMany?.({ where: { eventId } }) || (prisma as any).orders?.filter((o: any) => o.eventId === eventId) || [],
      (prisma as any).ticket?.findMany?.({ where: { eventId } }) || (prisma as any).tickets?.filter((t: any) => t.eventId === eventId) || [],
      (prisma as any).eventTeamMemberRecord?.findMany?.({ where: { eventId } }) || [],
      prisma.eventSection.findMany({ where: { eventId } }),
      (prisma as any).inventoryPool?.findMany?.({ where: { eventId } }) || []
    ]);

    // Filtra ordens e tickets com base no escopo da alteração
    let filteredOrders = allOrders;
    let filteredTickets = allTickets;

    if (sessionId) {
      filteredOrders = allOrders.filter((o: any) => o.sessionId === sessionId || !o.sessionId);
      filteredTickets = allTickets.filter((t: any) => t.sessionId === sessionId);
    }

    if (changeType === 'SECTION_CAPACITY') {
      const section = sections.find((s: any) => s.id === resourceId);
      if (section) {
        filteredTickets = filteredTickets.filter((t: any) =>
          t.sectorName?.toLowerCase() === section.name?.toLowerCase() || t.sectionId === section.id
        );
        const orderIdsWithTicket = new Set(filteredTickets.map((t: any) => t.orderId).filter(Boolean));
        if (orderIdsWithTicket.size > 0) {
          filteredOrders = filteredOrders.filter((o: any) => orderIdsWithTicket.has(o.id));
        }
      }
    }

    const affectedOrders = filteredOrders.length;
    const affectedTickets = filteredTickets.length;
    const affectedFinancialReais = filteredOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || o.grossAmount || 0), 0);
    const financialAmountInCents = Math.round(affectedFinancialReais * 100);

    const uniqueCustomers = new Set<string>();
    for (const o of filteredOrders) {
      const key = o.customerId || o.customerCpf || o.customerEmail || o.customerName;
      if (key) uniqueCustomers.add(key);
    }
    for (const t of filteredTickets) {
      const key = t.customerCpf || t.customerEmail || t.nominalAttendee || t.customerName;
      if (key) uniqueCustomers.add(key);
    }
    const affectedCustomers = uniqueCustomers.size;

    const checkedInTickets = filteredTickets.filter(
      (t: any) => t.status === 'USED' || Boolean(t.usedAt)
    ).length;

    const affectedTeamMembers = teamMembers.length;

    // Verificação de DÉFICIT de capacidade (Bloqueador Crítico)
    const blockers: string[] = [];
    const warnings: string[] = [];

    let affectedInventory = {
      poolId: undefined as string | undefined,
      sectionName: undefined as string | undefined,
      capacityBefore: 0,
      capacityAfter: 0,
      difference: 0,
      committed: 0,
      deficit: 0,
      isDeficit: false
    };

    if (changeType === 'SECTION_CAPACITY') {
      const newCapacity = Number(payload.after);
      const section = sections.find((s: any) => s.id === resourceId);
      const oldCapacity = section ? section.capacity : Number(payload.before || 0);

      const committedTickets = filteredTickets.filter(
        (t: any) => t.status === 'VALID' || t.status === 'USED' || t.status === 'RESERVED'
      ).length;

      const pool = pools.find((p: any) => p.sectionId === resourceId);
      const reservedInPool = pool ? (pool.reserved || 0) + (pool.sold || 0) : 0;
      const totalCommitted = Math.max(committedTickets, reservedInPool);
      const diff = newCapacity - oldCapacity;

      if (newCapacity < totalCommitted) {
        const deficitCount = totalCommitted - newCapacity;
        affectedInventory = {
          poolId: pool?.id,
          sectionName: section?.name || 'Setor',
          capacityBefore: oldCapacity,
          capacityAfter: newCapacity,
          difference: diff,
          committed: totalCommitted,
          deficit: deficitCount,
          isDeficit: true
        };
        blockers.push(
          `A capacidade proposta (${newCapacity}) é inferior aos ingressos já emitidos/reservados (${totalCommitted}). Déficit de ${deficitCount} lugares.`
        );
      } else {
        affectedInventory = {
          poolId: pool?.id,
          sectionName: section?.name || 'Setor',
          capacityBefore: oldCapacity,
          capacityAfter: newCapacity,
          difference: diff,
          committed: totalCommitted,
          deficit: 0,
          isDeficit: false
        };
      }
    }

    if (changeType === 'EVENT_DATE' || changeType === 'SESSION_DATE') {
      if (affectedTickets > 0) {
        warnings.push(
          `Alteração de data afetará ${affectedTickets} ingressos emitidos e ${affectedCustomers} compradores. Será obrigatório disparar comunicado e abrir prazo de cancelamento/reembolso.`
        );
      }
    }

    if (changeType === 'EVENT_VENUE') {
      warnings.push(
        'Alteração do local físico requer reavaliação de alvarás, brigada e layout operacional.'
      );
    }

    // Calcula Hash de integridade dos dados impactados (para detecção de STALE)
    const impactStateData = {
      eventId,
      sessionId: sessionId || null,
      ordersCount: affectedOrders,
      ticketsCount: affectedTickets,
      financialTotal: financialAmountInCents,
      ticketIdsSample: filteredTickets.slice(0, 10).map((t: any) => t.id)
    };
    const snapshotHash = crypto.createHash('sha256').update(JSON.stringify(impactStateData)).digest('hex');

    return {
      requestId,
      calculatedAt: new Date().toISOString(),
      dataVersion: '1.0',
      snapshotHash,
      isStale: false,
      affectedCustomers,
      affectedOrders,
      affectedTickets,
      financialAmount: financialAmountInCents,
      checkedInTickets,
      affectedInventory,
      affectedTeamMembers,
      affectedAccessPoints: 0,
      warnings,
      blockers,
      requiresApproval: changeType !== 'SECTION_CAPACITY' || affectedInventory.isDeficit,
      recommendedApprovers: ['Gerente de Operações', 'Diretoria Comercial']
    };
  }

  /**
   * Verifica se a análise de impacto existente ficou obsoleta devido a novas vendas ou movimentações
   */
  static async checkIsStale(
    eventId: string,
    existingImpact: EventChangeImpactDTO,
    sessionId?: string | null,
    scope?: { changeType?: EventChangeType; resourceType?: string; resourceId?: string }
  ): Promise<{ isStale: boolean; currentHash: string }> {
    const [allOrders, allTickets, sections] = await Promise.all([
      (prisma as any).order?.findMany?.({ where: { eventId } }) || (prisma as any).orders?.filter((o: any) => o.eventId === eventId) || [],
      (prisma as any).ticket?.findMany?.({ where: { eventId } }) || (prisma as any).tickets?.filter((t: any) => t.eventId === eventId) || [],
      prisma.eventSection.findMany({ where: { eventId } })
    ]);

    let filteredOrders = allOrders;
    let filteredTickets = allTickets;

    if (sessionId) {
      filteredOrders = allOrders.filter((o: any) => o.sessionId === sessionId || !o.sessionId);
      filteredTickets = allTickets.filter((t: any) => t.sessionId === sessionId);
    }

    if (scope?.changeType === 'SECTION_CAPACITY' && scope?.resourceId) {
      const section = sections.find((s: any) => s.id === scope.resourceId);
      if (section) {
        filteredTickets = filteredTickets.filter((t: any) =>
          t.sectorName?.toLowerCase() === section.name?.toLowerCase() || t.sectionId === section.id
        );
        const orderIdsWithTicket = new Set(filteredTickets.map((t: any) => t.orderId).filter(Boolean));
        if (orderIdsWithTicket.size > 0) {
          filteredOrders = filteredOrders.filter((o: any) => orderIdsWithTicket.has(o.id));
        }
      }
    }

    const currentFinancialReais = filteredOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || o.grossAmount || 0), 0);
    const financialAmountInCents = Math.round(currentFinancialReais * 100);

    const currentState = {
      eventId,
      sessionId: sessionId || null,
      ordersCount: filteredOrders.length,
      ticketsCount: filteredTickets.length,
      financialTotal: financialAmountInCents,
      ticketIdsSample: filteredTickets.slice(0, 10).map((t: any) => t.id)
    };

    const currentHash = crypto.createHash('sha256').update(JSON.stringify(currentState)).digest('hex');
    const isStale = currentHash !== existingImpact.snapshotHash;

    return { isStale, currentHash };
  }
}
