import { prisma } from '../../../core/database/prisma';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';
import { RequestContext } from '../../context/context.middleware';
import { AuditService } from '../../audit/audit.service';
import { EventBus } from '../../../events/event-bus';
import { VenueSectionDTO, CreateVenueSectionInput } from '@shared/types/index';

export class VenueSectionService {
  public static async listSections(
    venueId: string,
    user: AuthenticatedUser,
    context?: RequestContext
  ): Promise<VenueSectionDTO[]> {
    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new Error('Local físico não encontrado.');

    return prisma.venueSection.findMany({
      where: { venueId }
    });
  }

  public static async createSection(
    venueId: string,
    input: CreateVenueSectionInput,
    user: AuthenticatedUser,
    context?: RequestContext
  ): Promise<VenueSectionDTO> {
    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new Error('Local físico não encontrado.');

    const section = await prisma.venueSection.create({
      data: {
        venueId,
        name: input.name,
        code: input.code ? input.code.toUpperCase() : input.name.substring(0, 4).toUpperCase(),
        type: input.type,
        capacity: input.capacity,
        description: input.description || null,
        color: input.color || null,
        sortOrder: input.sortOrder || 0,
        active: true
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE_VENUE_SECTION',
      resource: `VENUE_SECTION:${section.id}`,
      producerId: venue.producerId || undefined,
      details: `Setor físico '${section.name}' (${section.code}) criado no local '${venue.name}'. Capacidade: ${section.capacity}.`,
      result: 'SUCCESS'
    });

    await EventBus.publish({
      id: `vsec_created_${section.id}_${Date.now()}`,
      type: 'VENUE_SECTION_CREATED',
      resourceType: 'VENUE_SECTION',
      resourceId: section.id,
      actorUserId: user.id,
      producerId: venue.producerId || undefined,
      timestamp: new Date(),
      data: { sectionId: section.id, venueId, name: section.name }
    });

    return section;
  }

  public static async updateSection(
    sectionId: string,
    input: Partial<CreateVenueSectionInput> & { active?: boolean },
    user: AuthenticatedUser,
    context?: RequestContext
  ): Promise<VenueSectionDTO> {
    const existing = await prisma.venueSection.findUnique({ where: { id: sectionId } });
    if (!existing) throw new Error('Setor físico não encontrado.');

    const updated = await prisma.venueSection.update({
      where: { id: sectionId },
      data: {
        name: input.name !== undefined ? input.name : existing.name,
        code: input.code !== undefined ? input.code.toUpperCase() : existing.code,
        type: input.type !== undefined ? input.type : existing.type,
        capacity: input.capacity !== undefined ? input.capacity : existing.capacity,
        description: input.description !== undefined ? input.description : existing.description,
        color: input.color !== undefined ? input.color : existing.color,
        sortOrder: input.sortOrder !== undefined ? input.sortOrder : existing.sortOrder,
        active: input.active !== undefined ? input.active : existing.active
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE_VENUE_SECTION',
      resource: `VENUE_SECTION:${sectionId}`,
      details: `Setor físico '${updated.name}' atualizado.`,
      result: 'SUCCESS'
    });

    return updated;
  }

  public static async deleteSection(
    sectionId: string,
    user: AuthenticatedUser,
    context?: RequestContext
  ): Promise<void> {
    const existing = await prisma.venueSection.findUnique({ where: { id: sectionId } });
    if (!existing) throw new Error('Setor físico não encontrado.');

    // Check if referenced by active event sections
    const eventSections = await prisma.eventSection.findMany({
      where: { venueSectionId: sectionId }
    });

    if (eventSections.length > 0) {
      throw new Error(
        `Não é possível excluir o setor físico "${existing.name}". Ele está configurado em ${eventSections.length} evento(s).`
      );
    }

    await prisma.venueSection.delete({ where: { id: sectionId } });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'DELETE_VENUE_SECTION',
      resource: `VENUE_SECTION:${sectionId}`,
      details: `Setor físico '${existing.name}' excluído.`,
      result: 'SUCCESS'
    });
  }
}
