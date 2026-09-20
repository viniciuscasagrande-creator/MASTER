import { prisma } from '../../../core/database/prisma';
import {
  EventTeamDTO,
  CreateEventTeamInput,
  EventTeamMemberDTO,
  CreateEventTeamMemberInput
} from '@shared/types/index';

export class EventTeamService {
  /**
   * Equipes funcionais do evento (ex: Bilheteria, Controle de Acesso, Produção, Segurança)
   */
  static async listTeams(eventId: string): Promise<EventTeamDTO[]> {
    const list = await prisma.eventTeam.findMany({
      where: { eventId }
    });

    return list.map((t: any) => ({
      id: t.id,
      eventId: t.eventId,
      name: t.name,
      description: t.description,
      leaderMemberId: t.leaderMemberId,
      leaderName: t.leaderName,
      memberCount: t.memberCount || 0,
      active: t.active,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString()
    }));
  }

  static async createTeam(eventId: string, input: CreateEventTeamInput): Promise<EventTeamDTO> {
    const created = await prisma.eventTeam.create({
      data: {
        eventId,
        name: input.name,
        description: input.description || null,
        leaderMemberId: input.leaderMemberId || null,
        active: input.active !== undefined ? input.active : true
      }
    });

    return {
      id: created.id,
      eventId: created.eventId,
      name: created.name,
      description: created.description,
      leaderMemberId: created.leaderMemberId,
      leaderName: null,
      memberCount: 0,
      active: created.active,
      createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: created.updatedAt ? new Date(created.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  /**
   * Membros operacionais de equipe
   * IMPORTANTE: Papel operacional NÃO concede permissões no sistema (desacoplado de RBAC)
   */
  static async listMembers(eventId: string, teamId?: string): Promise<EventTeamMemberDTO[]> {
    const list = await prisma.eventTeamMember.findMany({
      where: {
        eventId,
        teamId: teamId ? teamId : undefined
      }
    });

    return list.map((m: any) => ({
      id: m.id,
      eventId: m.eventId,
      userId: m.userId,
      externalPersonId: m.externalPersonId,
      name: m.name,
      email: m.email,
      phone: m.phone,
      roleName: m.roleName,
      teamId: m.teamId,
      teamName: m.teamName,
      active: m.active,
      emergencyContact: m.emergencyContact,
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: m.updatedAt ? new Date(m.updatedAt).toISOString() : new Date().toISOString()
    }));
  }

  static async addMember(eventId: string, input: CreateEventTeamMemberInput): Promise<EventTeamMemberDTO> {
    const created = await prisma.eventTeamMember.create({
      data: {
        eventId,
        userId: input.userId || null,
        externalPersonId: input.externalPersonId || null,
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        roleName: input.roleName,
        teamId: input.teamId || null,
        emergencyContact: input.emergencyContact || null,
        active: input.active !== undefined ? input.active : true
      }
    });

    const team = input.teamId ? await prisma.eventTeam.findUnique({ where: { id: input.teamId } }) : null;

    return {
      id: created.id,
      eventId: created.eventId,
      userId: created.userId,
      externalPersonId: created.externalPersonId,
      name: created.name,
      email: created.email,
      phone: created.phone,
      roleName: created.roleName,
      teamId: created.teamId,
      teamName: team?.name || null,
      active: created.active,
      emergencyContact: created.emergencyContact,
      createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: created.updatedAt ? new Date(created.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  static async updateMember(memberId: string, input: Partial<CreateEventTeamMemberInput>): Promise<EventTeamMemberDTO> {
    const updated = await prisma.eventTeamMember.update({
      where: { id: memberId },
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        roleName: input.roleName,
        teamId: input.teamId,
        emergencyContact: input.emergencyContact,
        active: input.active
      }
    });

    const team = updated.teamId ? await prisma.eventTeam.findUnique({ where: { id: updated.teamId } }) : null;

    return {
      id: updated.id,
      eventId: updated.eventId,
      userId: updated.userId,
      externalPersonId: updated.externalPersonId,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      roleName: updated.roleName,
      teamId: updated.teamId,
      teamName: team?.name || null,
      active: updated.active,
      emergencyContact: updated.emergencyContact,
      createdAt: updated.createdAt ? new Date(updated.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : new Date().toISOString()
    };
  }
}
