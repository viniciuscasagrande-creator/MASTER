import { prisma } from '../../../core/database/prisma';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';
import { RequestContext } from '../../context/context.middleware';
import { AuditService } from '../../audit/audit.service';
import { EventBus } from '../../../events/event-bus';
import {
  VenueDTO,
  VenueSummaryDTO,
  CreateVenueInput,
  UpdateVenueInput,
  ListVenuesFilter
} from '@shared/types/index';

export class VenueService {
  public static async listVenues(
    filters: ListVenuesFilter,
    user: AuthenticatedUser,
    context?: RequestContext
  ): Promise<{ venues: VenueDTO[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    let allVenues = await prisma.venue.findMany({
      include: {
        sections: true,
        maps: true,
        accessPoints: true
      }
    });

    // 1. Multi-tenant Scope filtering:
    // SuperAdmin or users with global scope can see everything.
    // Producer users see GLOBAL venues + their producer's venues.
    const activeProducerId = context?.producerId || user.scope?.producers?.[0];
    if (!user.isSuperAdmin && activeProducerId) {
      allVenues = allVenues.filter(
        v => v.scope === 'GLOBAL' || v.producerId === activeProducerId
      );
    } else if (!user.isSuperAdmin && !activeProducerId) {
      allVenues = allVenues.filter(v => v.scope === 'GLOBAL');
    }

    // 2. Status filtering (defaults to ACTIVE unless explicitly requested)
    if (filters.status) {
      allVenues = allVenues.filter(v => v.status === filters.status);
    } else {
      allVenues = allVenues.filter(v => v.status !== 'ARCHIVED');
    }

    // 3. Search query (name, code, street, city)
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      allVenues = allVenues.filter(
        v =>
          v.name.toLowerCase().includes(q) ||
          v.publicCode.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          (v.street && v.street.toLowerCase().includes(q))
      );
    }

    // 4. Exact field filters
    if (filters.city) {
      allVenues = allVenues.filter(v => v.city.toLowerCase() === filters.city!.toLowerCase());
    }
    if (filters.state) {
      allVenues = allVenues.filter(v => v.state.toLowerCase() === filters.state!.toLowerCase());
    }
    if (filters.type) {
      allVenues = allVenues.filter(v => v.type === filters.type);
    }
    if (filters.scope) {
      allVenues = allVenues.filter(v => v.scope === filters.scope);
    }

    // Sort by name ascending
    allVenues.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    const total = allVenues.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIdx = (page - 1) * limit;
    const venues = allVenues.slice(startIdx, startIdx + limit);

    return {
      venues,
      total,
      page,
      limit,
      totalPages
    };
  }

  public static async getVenueSummary(
    user: AuthenticatedUser,
    context?: RequestContext
  ): Promise<VenueSummaryDTO> {
    const listRes = await this.listVenues({ limit: 1000 }, user, context);
    const venues = listRes.venues;

    const totalVenues = venues.length;
    const activeVenues = venues.filter(v => v.status === 'ACTIVE').length;
    const venuesWithMaps = venues.filter(v => v.maps && v.maps.length > 0).length;
    const totalPhysicalCapacity = venues.reduce((acc, v) => acc + (v.capacity || 0), 0);
    const cities = new Set(venues.map(v => `${v.city}-${v.state}`)).size;

    return {
      total: totalVenues,
      active: activeVenues,
      withMaps: venuesWithMaps,
      citiesCount: cities,
      totalPhysicalCapacity
    };
  }

  public static async getVenueById(
    id: string,
    user: AuthenticatedUser,
    context?: RequestContext
  ): Promise<VenueDTO> {
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        sections: true,
        maps: {
          include: { versions: true }
        },
        accessPoints: true,
        eventVenues: true
      }
    });

    if (!venue) {
      throw new Error(`Local com ID "${id}" não foi encontrado.`);
    }

    // Validate access
    const activeProducerId = context?.producerId || user.scope?.producers?.[0];
    if (!user.isSuperAdmin && venue.scope === 'PRODUCER' && venue.producerId !== activeProducerId) {
      throw new Error('Acesso negado a este local físico.');
    }

    return venue;
  }

  public static async createVenue(
    input: CreateVenueInput,
    user: AuthenticatedUser,
    context?: RequestContext
  ): Promise<VenueDTO> {
    const year = new Date().getFullYear();
    const count = (await prisma.venue.count()) + 1;
    const publicCode = `VEN-${year}-${String(count).padStart(6, '0')}`;

    let scope = input.scope || 'GLOBAL';
    let producerId = input.producerId;

    if (!user.isSuperAdmin) {
      scope = 'PRODUCER';
      producerId = context?.producerId || user.scope?.producers?.[0];
      if (!producerId) {
        throw new Error('Produtor é obrigatório para cadastrar um local sob este perfil.');
      }
    }

    const venue = await prisma.venue.create({
      data: {
        publicCode,
        name: input.name,
        type: input.type,
        scope,
        producerId: producerId || null,
        status: 'ACTIVE',
        postalCode: input.postalCode || null,
        street: input.street || null,
        number: input.number || null,
        complement: input.complement || null,
        district: input.district || null,
        city: input.city,
        state: input.state.toUpperCase(),
        country: input.country || 'BR',
        capacity: input.capacity,
        phone: input.phone || null,
        email: input.email || null,
        documentUrl: input.documentUrl || null,
        version: 1
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE_VENUE',
      resource: `VENUE:${venue.id}`,
      producerId: venue.producerId || undefined,
      details: `Local físico '${venue.name}' (${venue.publicCode}) criado com sucesso. Capacidade: ${venue.capacity}.`,
      result: 'SUCCESS'
    });

    await EventBus.publish({
      id: `venue_created_${venue.id}_${Date.now()}`,
      type: 'VENUE_CREATED',
      resourceType: 'VENUE',
      resourceId: venue.id,
      actorUserId: user.id,
      producerId: venue.producerId || undefined,
      timestamp: new Date(),
      data: { venueId: venue.id, name: venue.name, publicCode: venue.publicCode }
    });

    return venue;
  }

  public static async updateVenue(
    id: string,
    input: UpdateVenueInput,
    user: AuthenticatedUser,
    context?: RequestContext
  ): Promise<VenueDTO> {
    const existing = await this.getVenueById(id, user, context);

    const updated = await prisma.venue.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name : existing.name,
        type: input.type !== undefined ? input.type : existing.type,
        postalCode: input.postalCode !== undefined ? input.postalCode : existing.postalCode,
        street: input.street !== undefined ? input.street : existing.street,
        number: input.number !== undefined ? input.number : existing.number,
        complement: input.complement !== undefined ? input.complement : existing.complement,
        district: input.district !== undefined ? input.district : existing.district,
        city: input.city !== undefined ? input.city : existing.city,
        state: input.state !== undefined ? input.state.toUpperCase() : existing.state,
        country: input.country !== undefined ? input.country : existing.country,
        capacity: input.capacity !== undefined ? input.capacity : existing.capacity,
        phone: input.phone !== undefined ? input.phone : existing.phone,
        email: input.email !== undefined ? input.email : existing.email,
        documentUrl: input.documentUrl !== undefined ? input.documentUrl : existing.documentUrl
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE_VENUE',
      resource: `VENUE:${id}`,
      producerId: updated.producerId || undefined,
      details: `Local físico '${updated.name}' (${updated.publicCode}) atualizado.`,
      result: 'SUCCESS'
    });

    await EventBus.publish({
      id: `venue_updated_${updated.id}_${Date.now()}`,
      type: 'VENUE_UPDATED',
      resourceType: 'VENUE',
      resourceId: updated.id,
      actorUserId: user.id,
      producerId: updated.producerId || undefined,
      timestamp: new Date(),
      data: { venueId: updated.id, name: updated.name }
    });

    return updated;
  }

  public static async archiveVenue(
    id: string,
    user: AuthenticatedUser,
    context?: RequestContext
  ): Promise<VenueDTO> {
    const existing = await this.getVenueById(id, user, context);

    // Check if venue has active events or upcoming sessions
    const linkedSessions = await prisma.eventSession.findMany({
      where: {
        venueId: id,
        status: { in: ['SCHEDULED', 'OPEN', 'IN_PROGRESS'] }
      }
    });

    if (linkedSessions.length > 0) {
      throw new Error(
        `Não é possível arquivar o local "${existing.name}". Existem ${linkedSessions.length} sessão(ões) ativa(s) ou agendada(s) vinculadas.`
      );
    }

    const archived = await prisma.venue.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'ARCHIVE_VENUE',
      resource: `VENUE:${id}`,
      producerId: archived.producerId || undefined,
      details: `Local físico '${archived.name}' (${archived.publicCode}) arquivado.`,
      result: 'SUCCESS'
    });

    await EventBus.publish({
      id: `venue_archived_${archived.id}_${Date.now()}`,
      type: 'VENUE_ARCHIVED',
      resourceType: 'VENUE',
      resourceId: archived.id,
      actorUserId: user.id,
      producerId: archived.producerId || undefined,
      timestamp: new Date(),
      data: { venueId: archived.id }
    });

    return archived;
  }
}
