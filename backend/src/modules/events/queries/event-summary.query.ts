import { AuthenticatedUser } from '../../../core/middleware/authenticate';

import { prisma } from '../../../core/database/prisma';
import { EventAccessPolicy } from '../policies/event-access.policy';
import { EventSummaryDTO } from '../event.types';

export class EventSummaryQuery {
  public static async execute(user: AuthenticatedUser, requestedProducerId?: string): Promise<EventSummaryDTO> {
    const scopeWhere = EventAccessPolicy.buildScopeWhere(user, requestedProducerId);
    const now = new Date();

    // Fetch all events matching the user's scope
    const events = await prisma.event.findMany({
      where: scopeWhere
    });

    const total = events.length;
    let onSale = 0;
    let upcoming = 0;
    let configuring = 0;
    let inProgress = 0;
    let draft = 0;

    for (const e of events) {
      if (e.status === 'ON_SALE') onSale++;
      if (e.status === 'CONFIGURING') configuring++;
      if (e.status === 'IN_PROGRESS') inProgress++;
      if (e.status === 'DRAFT') draft++;

      const eventStart = e.startAt ? new Date(e.startAt) : null;
      if (eventStart && eventStart.getTime() >= now.getTime() && e.status !== 'CANCELLED' && e.status !== 'ARCHIVED') {
        upcoming++;
      }
    }

    return {
      total,
      onSale,
      upcoming,
      configuring,
      inProgress,
      draft
    };
  }
}
