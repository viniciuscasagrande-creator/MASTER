import { prisma } from '../../core/database/prisma';
import { CreateEventInput, UpdateEventInput } from './event.types';

export class EventRepository {
  public static async findById(id: string): Promise<any | null> {
    return prisma.event.findUnique({ where: { id } });
  }

  public static async findByPublicCode(publicCode: string): Promise<any | null> {
    return prisma.event.findUnique({ where: { publicCode } });
  }

  public static async create(input: CreateEventInput, creatorUserId: string): Promise<any> {
    const year = new Date().getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    const publicCode = `EVT-${year}-${rand}`;

    const name = input.name || input.title || 'Novo Evento';
    const slug = input.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return prisma.event.create({
      data: {
        publicCode,
        producerId: input.producerId,
        name,
        title: name,
        slug,
        description: input.description || null,
        categoryId: input.categoryId || null,
        startAt: input.startAt ? new Date(input.startAt) : null,
        endAt: input.endAt ? new Date(input.endAt) : null,
        timezone: input.timezone || 'America/Sao_Paulo',
        venue: input.venue || null,
        city: input.city || null,
        state: input.state || null,
        country: input.country || 'BR',
        capacity: input.capacity || null,
        soldTickets: 0,
        status: 'DRAFT',
        coverDocumentId: input.coverDocumentId || null,
        createdBy: creatorUserId
      }
    });
  }

  public static async update(id: string, input: UpdateEventInput, updaterUserId: string): Promise<any> {
    const data: any = {
      updatedBy: updaterUserId
    };

    if (input.name !== undefined) {
      data.name = input.name;
      data.title = input.name;
    }
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.description !== undefined) data.description = input.description;
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.startAt !== undefined) data.startAt = input.startAt ? new Date(input.startAt) : null;
    if (input.endAt !== undefined) data.endAt = input.endAt ? new Date(input.endAt) : null;
    if (input.timezone !== undefined) data.timezone = input.timezone;
    if (input.venue !== undefined) data.venue = input.venue;
    if (input.city !== undefined) data.city = input.city;
    if (input.state !== undefined) data.state = input.state;
    if (input.capacity !== undefined) data.capacity = input.capacity;
    if (input.status !== undefined) data.status = input.status;
    if (input.coverDocumentId !== undefined) data.coverDocumentId = input.coverDocumentId;

    return prisma.event.update({
      where: { id },
      data
    });
  }
}
