import { prisma } from '../../../core/database/prisma';
import { DocumentResourceType, DocumentLinkDto } from '../document.types';

export class DocumentLinkService {
  /**
   * Link a document to a business resource
   */
  public static async link(
    documentId: string,
    resourceType: DocumentResourceType,
    resourceId: string,
    producerId?: string | null,
    eventId?: string | null
  ): Promise<DocumentLinkDto> {
    // Check if link already exists
    const existing = await prisma.documentLink.findFirst({
      where: {
        documentId,
        resourceType,
        resourceId
      }
    });

    if (existing) {
      return existing;
    }

    const created = await prisma.documentLink.create({
      data: {
        documentId,
        resourceType,
        resourceId,
        producerId: producerId || null,
        eventId: eventId || null
      }
    });

    return created;
  }

  /**
   * Remove link
   */
  public static async unlink(documentId: string, linkId: string): Promise<void> {
    await prisma.documentLink.delete({
      where: { id: linkId }
    });
  }

  /**
   * List links for a document
   */
  public static async listLinks(documentId: string): Promise<DocumentLinkDto[]> {
    return prisma.documentLink.findMany({
      where: { documentId }
    });
  }

  /**
   * List documents linked to a resource
   */
  public static async getDocumentsByResource(
    resourceType: DocumentResourceType,
    resourceId: string
  ): Promise<string[]> {
    const links = await prisma.documentLink.findMany({
      where: {
        resourceType,
        resourceId
      }
    });

    return links.map((l: any) => l.documentId);
  }
}
