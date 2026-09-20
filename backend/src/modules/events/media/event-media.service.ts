import { prisma } from '../../../core/database/prisma';
import { EventMediaDTO } from '../wizard/event-wizard.types';

export class EventMediaService {
  public static async listByEvent(eventId: string): Promise<EventMediaDTO[]> {
    const records = await prisma.eventMedia.findMany({
      where: { eventId }
    });

    return records.map((r: any) => ({
      id: r.id,
      eventId: r.eventId,
      documentId: r.documentId,
      type: r.type,
      sortOrder: r.sortOrder || 0,
      caption: r.caption || null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
    }));
  }

  public static async addMedia(
    eventId: string,
    data: { documentId: string; type: 'MAIN' | 'COVER' | 'SHARE' | 'GALLERY'; caption?: string; sortOrder?: number }
  ): Promise<EventMediaDTO> {
    const record = await prisma.eventMedia.create({
      data: {
        eventId,
        documentId: data.documentId,
        type: data.type,
        caption: data.caption || null,
        sortOrder: data.sortOrder || 0
      }
    });

    // If main or cover image, update event's coverDocumentId
    if (data.type === 'MAIN' || data.type === 'COVER') {
      await prisma.event.update({
        where: { id: eventId },
        data: { coverDocumentId: data.documentId }
      });
    }

    return {
      id: record.id,
      eventId: record.eventId,
      documentId: record.documentId,
      type: record.type,
      sortOrder: record.sortOrder,
      caption: record.caption,
      createdAt: new Date().toISOString()
    };
  }

  public static async removeMedia(eventId: string, mediaId: string): Promise<boolean> {
    await prisma.eventMedia.delete({
      where: { id: mediaId }
    });
    return true;
  }
}
