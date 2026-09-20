import { prisma } from '../../../core/database/prisma';

export class ArchiveWritePolicy {
  /**
   * Asserts that an event is not archived.
   * Throws an error if any mutation attempt is made on an archived event.
   */
  public static async assertNotArchived(eventId: string): Promise<void> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return;

    if (event.status === 'ARCHIVED') {
      throw new Error('Operação bloqueada: Este evento está arquivado e opera em modo estritamente somente leitura.');
    }
  }

  /**
   * Checks if an event is archived.
   */
  public static async isArchived(eventId: string): Promise<boolean> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    return event?.status === 'ARCHIVED';
  }
}
