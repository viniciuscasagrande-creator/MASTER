import { prisma } from '../../../core/database/prisma';
import { SearchResultItem, ParsedQuery } from '../search.types';
import { EffectiveSearchScope, ScopeFilterService } from '../scope-filter.service';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';

export class SupportSearchProvider {
  public static async search(
    query: ParsedQuery,
    scope: EffectiveSearchScope,
    _user: AuthenticatedUser
  ): Promise<SearchResultItem[]> {
    if (!scope.allowedEntities.support) {
      return [];
    }

    const allTickets = await prisma.supportTicket.findMany();
    const norm = query.normalized;
    const digits = query.extractedDigits || '';

    const matches = allTickets.filter((t: any) => {
      // Producer/Event scope isolation
      if (t.producerId && !ScopeFilterService.matchesScope(t, scope)) {
        return false;
      }

      // Support code match
      if (query.detectedType === 'SUPPORT_CODE') {
        const matchFull = t.ticketCode?.toLowerCase().includes(norm.toLowerCase());
        const matchDigits = digits && t.ticketCodeNormalized?.includes(digits);
        return matchFull || matchDigits;
      }

      const codeMatch = t.ticketCode?.toLowerCase().includes(norm) || (digits.length >= 3 && t.ticketCodeNormalized?.includes(digits));
      const custMatch = t.customerName?.toLowerCase().includes(norm);
      const subjectMatch = t.subject?.toLowerCase().includes(norm);
      const agentMatch = t.agentName?.toLowerCase().includes(norm);

      return codeMatch || custMatch || subjectMatch || agentMatch;
    });

    return matches.map((t: any) => {
      const isInProgress = t.status === 'IN_PROGRESS';
      const isOpen = t.status === 'OPEN';
      const badge = isInProgress ? 'Em Atendimento' : isOpen ? 'Aberto' : 'Resolvido';
      const badgeVariant = isInProgress ? 'warning' : isOpen ? 'danger' : 'success';

      return {
        id: t.id,
        entityType: 'SUPPORT',
        title: `Atendimento #${t.ticketCode}`,
        subtitle: `${t.customerName} • Canal: ${t.channel} • ${t.subject}`,
        status: t.status,
        badge,
        badgeVariant,
        producerId: t.producerId,
        eventId: t.eventId,
        meta: {
          ticketCode: t.ticketCode,
          customerName: t.customerName,
          channel: t.channel,
          subject: t.subject,
          agentName: t.agentName,
          status: t.status,
          createdAt: t.createdAt
        },
        actionUrl: `/sac/tickets/${t.id}`
      };
    });
  }
}
