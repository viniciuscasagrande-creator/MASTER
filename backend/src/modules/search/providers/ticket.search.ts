import { prisma } from '../../../core/database/prisma';
import { SearchResultItem, ParsedQuery } from '../search.types';
import { EffectiveSearchScope, ScopeFilterService } from '../scope-filter.service';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';

export class TicketSearchProvider {
  public static async search(
    query: ParsedQuery,
    scope: EffectiveSearchScope,
    _user: AuthenticatedUser
  ): Promise<SearchResultItem[]> {
    if (!scope.allowedEntities.tickets) {
      return [];
    }

    const allTickets = await prisma.ticket.findMany();
    const norm = query.normalized;
    const digits = query.extractedDigits || '';

    const matches = allTickets.filter((t: any) => {
      // Producer/Event scope isolation
      if (!ScopeFilterService.matchesScope(t, scope)) {
        return false;
      }

      // Ticket code match
      if (query.detectedType === 'TICKET_CODE') {
        const matchFull = t.ticketCode?.toLowerCase().includes(norm.toLowerCase());
        const matchDigits = digits && t.ticketCodeNormalized?.includes(digits);
        return matchFull || matchDigits;
      }

      // CPF match (tickets of this customer)
      if (query.detectedType === 'CPF' && digits) {
        return t.customerCpf?.replace(/\D/g, '').includes(digits);
      }

      // General match
      const codeMatch = t.ticketCode?.toLowerCase().includes(norm) || (digits.length >= 3 && t.ticketCodeNormalized?.includes(digits));
      const attendeeMatch = t.nominalAttendee?.toLowerCase().includes(norm) || t.customerName?.toLowerCase().includes(norm);
      const evtMatch = t.eventName?.toLowerCase().includes(norm);
      const sectorMatch = t.sectorName?.toLowerCase().includes(norm);

      return codeMatch || attendeeMatch || evtMatch || sectorMatch;
    });

    return matches.map((t: any) => {
      const isValid = t.status === 'VALID';
      const isUsed = t.status === 'USED';
      const badge = isValid ? 'Válido' : isUsed ? 'Utilizado' : 'Cancelado';
      const badgeVariant = isValid ? 'success' : isUsed ? 'info' : 'danger';

      return {
        id: t.id,
        entityType: 'TICKET',
        title: `Ingresso #${t.ticketCode}`,
        subtitle: `${t.eventName} • Setor ${t.sectorName} • ${t.nominalAttendee || t.customerName}`,
        status: t.status,
        badge,
        badgeVariant,
        producerId: t.producerId,
        eventId: t.eventId,
        eventName: t.eventName,
        meta: {
          ticketCode: t.ticketCode,
          orderId: t.orderId,
          sectorName: t.sectorName,
          price: t.price,
          nominalAttendee: t.nominalAttendee,
          checkInAt: t.checkInAt
        },
        actionUrl: `/events/tickets/${t.id}`
      };
    });
  }
}
