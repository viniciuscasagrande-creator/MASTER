import { prisma } from '../../../../core/database/prisma';
import { AuthenticatedUser } from '../../../../core/middleware/authenticate';
import { AuditService } from '../../../audit/audit.service';
import {
  SessionCapacityReservationDTO,
  SessionReservationType
} from '@shared/types/index';

export class SessionCapacityService {
  /**
   * Validates that SessionSection capacity does not exceed EventSection capacity.
   */
  public static async validateSectionCapacity(
    eventSectionId: string,
    proposedCapacity: number
  ): Promise<void> {
    const eventSection = await prisma.eventSection.findUnique({
      where: { id: eventSectionId },
      include: { venueSection: true }
    });

    if (!eventSection) throw new Error('Setor operacional do evento não encontrado.');

    if (proposedCapacity > eventSection.capacity) {
      throw new Error(
        `A capacidade da sessão para o setor "${eventSection.name}" (${proposedCapacity}) não pode ser maior que a capacidade configurada no evento (${eventSection.capacity}).`
      );
    }
  }

  /**
   * Adds technical capacity reservation for a session or specific session section.
   */
  public static async addReservation(
    sessionId: string,
    input: {
      sectionId?: string;
      type: SessionReservationType;
      quantity: number;
      reason?: string;
    },
    user: AuthenticatedUser
  ): Promise<SessionCapacityReservationDTO> {
    const session = await prisma.eventSession.findUnique({
      where: { id: sessionId },
      include: { sessionSections: true, reservations: true }
    });

    if (!session) throw new Error('Sessão não encontrada.');

    // Calculate current reserved capacity
    const currentReserved = session.reservedCapacity || 0;
    const newReserved = currentReserved + input.quantity;

    if (newReserved > session.capacity) {
      throw new Error(
        `Não é possível reservar ${input.quantity} lugares. A reserva total (${newReserved}) excederia a capacidade total da sessão (${session.capacity}).`
      );
    }

    // If sectionId is specified, check section reserved capacity
    if (input.sectionId) {
      const section = session.sessionSections?.find((s: any) => s.id === input.sectionId);
      if (!section) throw new Error('Setor da sessão não encontrado.');

      const secReserved = (section.reservedCapacity || 0) + input.quantity;
      if (secReserved > section.capacity) {
        throw new Error(
          `A reserva (${secReserved}) excede a capacidade do setor "${input.sectionId}" (${section.capacity}).`
        );
      }

      await prisma.sessionSection.update({
        where: { id: input.sectionId },
        data: { reservedCapacity: secReserved }
      });
    }

    // Create reservation
    const reservation = await prisma.sessionCapacityReservation.create({
      data: {
        sessionId,
        sectionId: input.sectionId || null,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason || null
      }
    });

    // Update session reservedCapacity
    await prisma.eventSession.update({
      where: { id: sessionId },
      data: { reservedCapacity: newReserved }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'ADD_SESSION_RESERVATION',
      resource: `SESSION_RESERVATION:${reservation.id}`,
      eventId: session.eventId,
      details: `Reserva técnica de ${input.quantity} lugares adicionada na sessão '${session.publicCode}' (${input.type}). Motivo: ${input.reason || 'N/A'}.`,
      result: 'SUCCESS'
    });

    return reservation;
  }

  /**
   * Removes technical reservation and restores reserved capacity.
   */
  public static async removeReservation(
    reservationId: string,
    user: AuthenticatedUser
  ): Promise<void> {
    const reservation = await prisma.sessionCapacityReservation.findUnique({
      where: { id: reservationId }
    });

    if (!reservation) throw new Error('Reserva técnica não encontrada.');

    const session = await prisma.eventSession.findUnique({
      where: { id: reservation.sessionId }
    });

    if (session) {
      const newReserved = Math.max((session.reservedCapacity || 0) - reservation.quantity, 0);
      await prisma.eventSession.update({
        where: { id: session.id },
        data: { reservedCapacity: newReserved }
      });

      if (reservation.sectionId) {
        const section = await prisma.sessionSection.findUnique({
          where: { id: reservation.sectionId }
        });
        if (section) {
          const secReserved = Math.max((section.reservedCapacity || 0) - reservation.quantity, 0);
          await prisma.sessionSection.update({
            where: { id: section.id },
            data: { reservedCapacity: secReserved }
          });
        }
      }

      await AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'REMOVE_SESSION_RESERVATION',
        resource: `SESSION_RESERVATION:${reservationId}`,
        eventId: session.eventId,
        details: `Reserva técnica de ${reservation.quantity} lugares removida da sessão '${session.publicCode}'.`,
        result: 'SUCCESS'
      });
    }

    await prisma.sessionCapacityReservation.delete({ where: { id: reservationId } });
  }
}
