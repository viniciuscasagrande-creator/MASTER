import { AuthenticatedUser } from '../../../core/middleware/authenticate';

import { prisma } from '../../../core/database/prisma';
import { EventAccessPolicy } from '../policies/event-access.policy';
import { EventMapper } from '../event.mapper';
import { EventDetailDTO } from '../event.types';
import { EventNotFoundError } from '../errors/event.errors';

export class GetEventQuery {
  public static async execute(user: AuthenticatedUser, eventIdOrCode: string): Promise<EventDetailDTO> {
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { id: eventIdOrCode },
          { publicCode: eventIdOrCode }
        ]
      }
    });

    if (!event) {
      throw new EventNotFoundError(`Evento "${eventIdOrCode}" não encontrado.`);
    }

    // Enforce authorization scope
    EventAccessPolicy.verifyEventAccess(user, event);

    let producerName: string | undefined;
    if (event.producerId && prisma.producer?.findUnique) {
      const producer = await prisma.producer.findUnique({ where: { id: event.producerId } });
      if (producer) producerName = producer.name;
    }

    return EventMapper.toDetail(event, producerName);
  }
}
