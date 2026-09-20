import { AuthenticatedUser } from '../../../core/middleware/authenticate';

import { prisma } from '../../../core/database/prisma';
import { EventAccessPolicy } from '../policies/event-access.policy';
import { EventMapper } from '../event.mapper';
import { ListEventsFilter, ListEventsQueryResult } from '../event.types';

export class ListEventsQuery {
  public static async execute(user: AuthenticatedUser, filters: ListEventsFilter): Promise<ListEventsQueryResult> {
    const scopeWhere = EventAccessPolicy.buildScopeWhere(user, filters.producerId);
    const andClauses: any[] = [scopeWhere];

    // Status filter
    if (filters.status && filters.status !== 'ALL') {
      andClauses.push({ status: filters.status });
    }

    // City filter
    if (filters.city) {
      andClauses.push({ city: { contains: filters.city, mode: 'insensitive' } });
    }

    // State filter
    if (filters.state) {
      andClauses.push({ state: filters.state });
    }

    // Date / Period filter
    const now = new Date();
    if (filters.period) {
      switch (filters.period) {
        case 'today': {
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          andClauses.push({ startAt: { gte: startOfDay, lte: endOfDay } });
          break;
        }
        case 'next7days': {
          const end7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          andClauses.push({ startAt: { gte: now, lte: end7 } });
          break;
        }
        case 'next30days': {
          const end30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          andClauses.push({ startAt: { gte: now, lte: end30 } });
          break;
        }
        case 'thisMonth': {
          const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          andClauses.push({ startAt: { gte: startMonth, lte: endMonth } });
          break;
        }
        case 'upcoming': {
          andClauses.push({ startAt: { gte: now } });
          break;
        }
        case 'past': {
          andClauses.push({ startAt: { lt: now } });
          break;
        }
        case 'custom': {
          if (filters.from && filters.to) {
            andClauses.push({ startAt: { gte: new Date(filters.from), lte: new Date(filters.to) } });
          } else if (filters.from) {
            andClauses.push({ startAt: { gte: new Date(filters.from) } });
          } else if (filters.to) {
            andClauses.push({ startAt: { lte: new Date(filters.to) } });
          }
          break;
        }
      }
    } else if (filters.from || filters.to) {
      const dateClause: any = {};
      if (filters.from) dateClause.gte = new Date(filters.from);
      if (filters.to) dateClause.lte = new Date(filters.to);
      andClauses.push({ startAt: dateClause });
    }

    // Textual Search filter (name, publicCode, city, venue)
    if (filters.search && filters.search.trim()) {
      const query = filters.search.trim();
      andClauses.push({
        name: { contains: query, mode: 'insensitive' }
      });
    }

    const where = { AND: andClauses };

    // Sorting
    let orderBy: any = { startAt: 'asc' };
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'date_desc':
          orderBy = { startAt: 'desc' };
          break;
        case 'name_asc':
          orderBy = { name: 'asc' };
          break;
        case 'name_desc':
          orderBy = { name: 'desc' };
          break;
        case 'created_recent':
          orderBy = { createdAt: 'desc' };
          break;
        case 'updated_recent':
          orderBy = { updatedAt: 'desc' };
          break;
        case 'date_asc':
        default:
          orderBy = { startAt: 'asc' };
          break;
      }
    }

    const limit = Math.min(100, Math.max(1, filters.limit || 25));
    const skip = filters.cursor ? parseInt(filters.cursor, 10) || 0 : 0;

    const [total, events] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: limit
      })
    ]);

    // Fetch producer names for friendly DTOs if possible
    const producerMap: Record<string, string> = {};
    const producerIds = Array.from(new Set(events.map(e => e.producerId)));
    if (producerIds.length > 0 && prisma.producer?.findMany) {
      const producers = await prisma.producer.findMany({
        where: { id: { in: producerIds } }
      });
      producers.forEach(p => {
        producerMap[p.id] = p.name;
      });
    }

    const items = events.map(e => EventMapper.toListItem(e, producerMap[e.producerId]));
    const hasMore = skip + limit < total;
    const nextCursor = hasMore ? String(skip + limit) : undefined;

    return {
      items,
      total,
      hasMore,
      nextCursor
    };
  }
}
