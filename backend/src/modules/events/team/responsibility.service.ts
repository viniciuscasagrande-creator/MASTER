import { prisma } from '../../../core/database/prisma';
import {
  EventResponsibilityDTO,
  CreateEventResponsibilityInput
} from '@shared/types/index';

export class ResponsibilityService {
  /**
   * Papéis operacionais formais (Responsável Técnico, Coordenador de Acesso, Chefe de Bilheteria, etc.)
   */
  static async listResponsibilities(eventId: string): Promise<EventResponsibilityDTO[]> {
    const list = await prisma.eventResponsibility.findMany({
      where: { eventId, active: true }
    });

    const members = await prisma.eventTeamMember.findMany({ where: { eventId } });
    const sessions = await prisma.eventSession.findMany({ where: { eventId } });
    const sections = await prisma.eventSection.findMany({ where: { eventId } });

    return list.map((r: any) => {
      const member = members.find((m: any) => m.id === r.memberId);
      let scopeName: string | null = null;
      if (r.scope === 'SESSION' && r.scopeId) {
        scopeName = sessions.find((s: any) => s.id === r.scopeId)?.name || null;
      } else if (r.scope === 'SECTION' && r.scopeId) {
        scopeName = sections.find((sec: any) => sec.id === r.scopeId)?.name || null;
      }

      return {
        id: r.id,
        eventId: r.eventId,
        memberId: r.memberId,
        memberName: member?.name || 'Membro Responsável',
        responsibilityType: r.responsibilityType,
        title: r.title,
        scope: r.scope,
        scopeId: r.scopeId,
        scopeName,
        notes: r.notes,
        active: r.active,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
      };
    });
  }

  static async assignResponsibility(eventId: string, input: CreateEventResponsibilityInput): Promise<EventResponsibilityDTO> {
    const member = await prisma.eventTeamMember.findUnique({ where: { id: input.memberId } });
    if (!member) throw new Error('Membro da equipe não encontrado');

    const created = await prisma.eventResponsibility.create({
      data: {
        eventId,
        memberId: input.memberId,
        responsibilityType: input.responsibilityType,
        title: input.title,
        scope: input.scope,
        scopeId: input.scopeId || null,
        notes: input.notes || null,
        active: input.active !== undefined ? input.active : true
      }
    });

    return {
      id: created.id,
      eventId: created.eventId,
      memberId: created.memberId,
      memberName: member.name,
      responsibilityType: created.responsibilityType,
      title: created.title,
      scope: created.scope,
      scopeId: created.scopeId,
      scopeName: null,
      notes: created.notes,
      active: created.active,
      createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: created.updatedAt ? new Date(created.updatedAt).toISOString() : new Date().toISOString()
    };
  }
}
