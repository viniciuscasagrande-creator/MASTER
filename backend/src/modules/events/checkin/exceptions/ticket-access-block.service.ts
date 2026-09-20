import { prisma } from '../../../../core/database/prisma';
import { TicketAccessBlockDTO } from '@shared/types/index';
import { AuditService } from '../../../audit/audit.service';

export class TicketAccessBlockService {
  /**
   * Blocks access for a specific ticket.
   */
  public static async blockTicket(params: {
    ticketId: string;
    ticketNumber: string;
    eventId: string;
    reason: string;
    blockedBy: string;
    blockedByName: string;
  }): Promise<TicketAccessBlockDTO> {
    // Check if already actively blocked
    const existing = await prisma.ticketAccessBlock.findFirst({
      where: { ticketId: params.ticketId, active: true }
    });
    if (existing) {
      return this.mapToDTO(existing);
    }

    const created = await prisma.ticketAccessBlock.create({
      data: {
        ticketId: params.ticketId,
        ticketNumber: params.ticketNumber,
        eventId: params.eventId,
        reason: params.reason,
        blockedBy: params.blockedBy,
        blockedByName: params.blockedByName,
        blockedAt: new Date(),
        active: true
      }
    });

    await AuditService.log({
      action: 'TICKET_ACCESS_BLOCKED',
      resource: 'ticket',
      resourceId: params.ticketId,
      userId: params.blockedBy,
      details: {
        ticketNumber: params.ticketNumber,
        reason: params.reason,
        eventId: params.eventId
      }
    });

    return this.mapToDTO(created);
  }

  /**
   * Unblocks ticket access.
   */
  public static async unblockTicket(params: {
    ticketId: string;
    unblockReason: string;
    unblockedBy: string;
  }): Promise<TicketAccessBlockDTO> {
    const block = await prisma.ticketAccessBlock.findFirst({
      where: { ticketId: params.ticketId, active: true }
    });
    if (!block) throw new Error('Nenhum bloqueio ativo encontrado para este ingresso.');

    const updated = await prisma.ticketAccessBlock.update({
      where: { id: block.id },
      data: {
        active: false,
        unblockedBy: params.unblockedBy,
        unblockedAt: new Date(),
        unblockReason: params.unblockReason
      }
    });

    await AuditService.log({
      action: 'TICKET_ACCESS_UNBLOCKED',
      resource: 'ticket',
      resourceId: params.ticketId,
      userId: params.unblockedBy,
      details: { unblockReason: params.unblockReason }
    });

    return this.mapToDTO(updated);
  }

  /**
   * Checks if ticket is currently blocked.
   */
  public static async isTicketBlocked(ticketId: string): Promise<{ blocked: boolean; reason?: string }> {
    const block = await prisma.ticketAccessBlock.findFirst({
      where: { ticketId, active: true }
    });
    if (block) {
      return { blocked: true, reason: block.reason };
    }
    return { blocked: false };
  }

  /**
   * Lists active blocks for an event.
   */
  public static async listBlocks(eventId: string): Promise<TicketAccessBlockDTO[]> {
    const blocks = await prisma.ticketAccessBlock.findMany({
      where: { eventId, active: true }
    });
    return blocks.map((b: any) => this.mapToDTO(b));
  }

  private static mapToDTO(b: any): TicketAccessBlockDTO {
    return {
      id: b.id,
      ticketId: b.ticketId,
      ticketNumber: b.ticketNumber,
      eventId: b.eventId,
      reason: b.reason,
      blockedBy: b.blockedBy,
      blockedByName: b.blockedByName,
      blockedAt: new Date(b.blockedAt).toISOString(),
      active: b.active,
      unblockedBy: b.unblockedBy,
      unblockedAt: b.unblockedAt ? new Date(b.unblockedAt).toISOString() : undefined,
      unblockReason: b.unblockReason
    };
  }
}
