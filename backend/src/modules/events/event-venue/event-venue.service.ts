import { prisma } from '../../../core/database/prisma';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';
import { RequestContext } from '../../context/context.middleware';
import { AuditService } from '../../audit/audit.service';
import { EventBus } from '../../../events/event-bus';
import { EventVenueDTO, EventSectionDTO } from '@shared/types/index';

export class EventVenueService {
  public static async linkVenueToEvent(
    eventId: string,
    venueId: string,
    venueMapId?: string,
    venueMapVersionId?: string,
    user?: AuthenticatedUser,
    context?: RequestContext
  ): Promise<EventVenueDTO> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Evento não encontrado.');

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      include: { sections: true, maps: { include: { versions: true } } }
    });
    if (!venue) throw new Error('Local físico não encontrado.');

    // Snapshot configuration
    const snapshot = JSON.stringify({
      venueId: venue.id,
      venueName: venue.name,
      venueType: venue.type,
      city: venue.city,
      state: venue.state,
      capacity: venue.capacity,
      mapId: venueMapId || null,
      mapVersionId: venueMapVersionId || null,
      linkedAt: new Date().toISOString()
    });

    // Check existing linkage
    let eventVenue = await prisma.eventVenue.findUnique({
      where: { eventId_venueId: { eventId, venueId } }
    });

    if (eventVenue) {
      // Update snapshot & map
      eventVenue = await prisma.eventVenue.create({
        data: {
          id: eventVenue.id,
          eventId,
          venueId,
          venueMapId: venueMapId || eventVenue.venueMapId,
          venueMapVersionId: venueMapVersionId || eventVenue.venueMapVersionId,
          configurationSnapshot: snapshot
        }
      });
    } else {
      eventVenue = await prisma.eventVenue.create({
        data: {
          eventId,
          venueId,
          venueMapId: venueMapId || (venue.maps[0]?.id || null),
          venueMapVersionId: venueMapVersionId || (venue.maps[0]?.activeVersionId || null),
          configurationSnapshot: snapshot
        }
      });
    }

    // Auto-create EventSections for active sections of the venue
    const activeVenueSections = venue.sections.filter((s: any) => s.active);
    for (const vs of activeVenueSections) {
      const existingSection = await prisma.eventSection.findUnique({
        where: { eventId_venueSectionId: { eventId, venueSectionId: vs.id } }
      });

      if (!existingSection) {
        await prisma.eventSection.create({
          data: {
            eventId,
            venueSectionId: vs.id,
            name: vs.name,
            capacity: vs.capacity,
            technicalReservation: 0,
            enabled: true
          }
        });
      }
    }

    // Sync event's venue and location strings if not set
    await prisma.event.update({
      where: { id: eventId },
      data: {
        venue: venue.name,
        city: venue.city,
        state: venue.state
      }
    });

    if (user) {
      await AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'LINK_EVENT_VENUE',
        resource: `EVENT:${eventId}`,
        producerId: event.producerId,
        eventId,
        details: `Local físico '${venue.name}' vinculado ao evento '${event.name}'.`,
        result: 'SUCCESS'
      });
    }

    await EventBus.publish({
      id: `ev_linked_${eventId}_${venueId}_${Date.now()}`,
      type: 'EVENT_VENUE_SELECTED',
      resourceType: 'EVENT_VENUE',
      resourceId: eventVenue.id,
      actorUserId: user?.id,
      producerId: event.producerId,
      eventId,
      timestamp: new Date(),
      data: { eventId, venueId }
    });

    return prisma.eventVenue.findUnique({
      where: { id: eventVenue.id },
      include: { venue: true, mapVersion: true }
    });
  }

  public static async getEventVenues(eventId: string): Promise<EventVenueDTO[]> {
    return prisma.eventVenue.findMany({
      where: { eventId },
      include: { venue: true, mapVersion: true }
    });
  }

  public static async unlinkVenueFromEvent(
    eventId: string,
    venueId: string,
    user: AuthenticatedUser
  ): Promise<void> {
    // Check if sessions of this event are using this venue
    const linkedSessions = await prisma.eventSession.findMany({
      where: { eventId, venueId }
    });

    if (linkedSessions.length > 0) {
      throw new Error(
        `Não é possível desvincular o local. Existem ${linkedSessions.length} sessão(ões) deste evento associada(s) a ele.`
      );
    }

    const eventVenue = await prisma.eventVenue.findUnique({
      where: { eventId_venueId: { eventId, venueId } }
    });

    if (eventVenue) {
      await prisma.eventVenue.delete({ where: { id: eventVenue.id } });
    }

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'UNLINK_EVENT_VENUE',
      resource: `EVENT:${eventId}`,
      eventId,
      details: `Local físico ${venueId} desvinculado do evento ${eventId}.`,
      result: 'SUCCESS'
    });
  }

  public static async listEventSections(eventId: string): Promise<EventSectionDTO[]> {
    return prisma.eventSection.findMany({
      where: { eventId },
      include: { venueSection: true }
    });
  }

  public static async updateEventSection(
    sectionId: string,
    input: {
      name?: string;
      capacity?: number;
      technicalReservation?: number;
      enabled?: boolean;
    },
    user: AuthenticatedUser
  ): Promise<EventSectionDTO> {
    const existing = await prisma.eventSection.findUnique({
      where: { id: sectionId },
      include: { venueSection: true }
    });
    if (!existing) throw new Error('Setor do evento não encontrado.');

    if (input.capacity !== undefined) {
      const physicalCapacity = existing.venueSection.capacity;
      if (input.capacity > physicalCapacity) {
        throw new Error(
          `A capacidade do setor operacional (${input.capacity}) não pode exceder a capacidade física máxima do setor (${physicalCapacity}).`
        );
      }
    }

    const updated = await prisma.eventSection.update({
      where: { id: sectionId },
      data: {
        name: input.name !== undefined ? input.name : existing.name,
        capacity: input.capacity !== undefined ? input.capacity : existing.capacity,
        technicalReservation:
          input.technicalReservation !== undefined
            ? input.technicalReservation
            : existing.technicalReservation,
        enabled: input.enabled !== undefined ? input.enabled : existing.enabled
      },
      include: { venueSection: true }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE_EVENT_SECTION',
      resource: `EVENT_SECTION:${sectionId}`,
      eventId: existing.eventId,
      details: `Setor do evento '${updated.name}' atualizado. Capacidade: ${updated.capacity}.`,
      result: 'SUCCESS'
    });

    return updated;
  }
}
