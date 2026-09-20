import { prisma } from '../../../core/database/prisma';
import {
  EventTeamShiftDTO,
  CreateEventTeamShiftInput,
  ShiftConflictDTO,
  EventTeamMemberDTO
} from '@shared/types/index';

export class TeamSchedulingService {
  /**
   * Lista escalas / turnos de trabalho configurados para o evento
   */
  static async listShifts(eventId: string, teamId?: string, sessionId?: string): Promise<EventTeamShiftDTO[]> {
    const list = await prisma.eventTeamShift.findMany({
      where: {
        eventId,
        teamId: teamId ? teamId : undefined,
        sessionId: sessionId ? sessionId : undefined
      }
    });

    return list.map((s: any) => ({
      id: s.id,
      eventId: s.eventId,
      teamId: s.teamId,
      teamName: s.teamName,
      sessionId: s.sessionId,
      sessionName: s.sessionName,
      name: s.name,
      startAt: s.startAt ? new Date(s.startAt).toISOString() : new Date().toISOString(),
      endAt: s.endAt ? new Date(s.endAt).toISOString() : new Date().toISOString(),
      active: s.active,
      assignedMemberIds: s.assignedMemberIds || [],
      assignedMembers: (s.assignedMembers || []).map((m: any) => ({
        id: m.id,
        eventId: m.eventId,
        name: m.name,
        email: m.email,
        phone: m.phone,
        roleName: m.roleName,
        teamId: m.teamId,
        teamName: m.teamName,
        active: m.active,
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: m.updatedAt ? new Date(m.updatedAt).toISOString() : new Date().toISOString()
      })),
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString()
    }));
  }

  /**
   * Cria turno com verificação de sobreposição e conflito
   */
  static async createShift(eventId: string, input: CreateEventTeamShiftInput): Promise<EventTeamShiftDTO> {
    const start = new Date(input.startAt);
    const end = new Date(input.endAt);

    if (end <= start) {
      throw new Error('Horário de término deve ser posterior ao horário de início');
    }

    const created = await prisma.eventTeamShift.create({
      data: {
        eventId,
        teamId: input.teamId,
        sessionId: input.sessionId || null,
        name: input.name,
        startAt: start,
        endAt: end,
        active: input.active !== undefined ? input.active : true
      }
    });

    if (input.assignedMemberIds && input.assignedMemberIds.length > 0) {
      for (const mId of input.assignedMemberIds) {
        await prisma.eventShiftAssignment.create({
          data: {
            shiftId: created.id,
            memberId: mId
          }
        });
      }
    }

    const all = await this.listShifts(eventId);
    return all.find(s => s.id === created.id)!;
  }

  /**
   * Atribui membros a um turno e detecta conflitos de horário com outras escalas
   */
  static async assignMembersToShift(
    eventId: string,
    shiftId: string,
    memberIds: string[]
  ): Promise<{ conflicts: ShiftConflictDTO[]; assignedCount: number }> {
    const targetShift = await prisma.eventTeamShift.findUnique({ where: { id: shiftId } });
    if (!targetShift) throw new Error('Turno de trabalho não encontrado');

    const targetStart = new Date(targetShift.startAt).getTime();
    const targetEnd = new Date(targetShift.endAt).getTime();

    // 1. Busca todos os turnos do evento para verificar conflitos
    const allShifts = await prisma.eventTeamShift.findMany({ where: { eventId } });
    const otherShifts = allShifts.filter((s: any) => s.id !== shiftId);
    const teams = await prisma.eventTeam.findMany({ where: { eventId } });
    const members = await prisma.eventTeamMember.findMany({ where: { eventId } });

    const conflicts: ShiftConflictDTO[] = [];

    for (const memberId of memberIds) {
      const member = members.find((m: any) => m.id === memberId);
      const memberName = member?.name || 'Membro';

      for (const other of otherShifts) {
        const otherAssignments = await prisma.eventShiftAssignment.findMany({
          where: { shiftId: other.id, memberId }
        });

        if (otherAssignments.length > 0) {
          const otherStart = new Date(other.startAt).getTime();
          const otherEnd = new Date(other.endAt).getTime();

          // Verifica sobreposição de horário
          const hasOverlap = targetStart < otherEnd && targetEnd > otherStart;
          if (hasOverlap) {
            const targetTeam = teams.find((t: any) => t.id === targetShift.teamId);
            const otherTeam = teams.find((t: any) => t.id === other.teamId);

            conflicts.push({
              memberId,
              memberName,
              shiftA: {
                id: targetShift.id,
                name: targetShift.name,
                teamName: targetTeam?.name || 'Equipe',
                startAt: new Date(targetShift.startAt).toISOString(),
                endAt: new Date(targetShift.endAt).toISOString()
              },
              shiftB: {
                id: other.id,
                name: other.name,
                teamName: otherTeam?.name || 'Equipe',
                startAt: new Date(other.startAt).toISOString(),
                endAt: new Date(other.endAt).toISOString()
              },
              message: `Membro ${memberName} já está escalado no turno "${other.name}" (${otherTeam?.name || 'Equipe'}) durante o mesmo período.`
            });
          }
        }
      }
    }

    if (conflicts.length > 0) {
      return { conflicts, assignedCount: 0 };
    }

    // Se nenhum conflito, efetiva as atribuições
    for (const memberId of memberIds) {
      const existing = await prisma.eventShiftAssignment.findMany({
        where: { shiftId, memberId }
      });
      if (existing.length === 0) {
        await prisma.eventShiftAssignment.create({
          data: { shiftId, memberId }
        });
      }
    }

    return { conflicts: [], assignedCount: memberIds.length };
  }

  static async removeMemberFromShift(shiftId: string, memberId: string): Promise<void> {
    const assignments = await prisma.eventShiftAssignment.findMany({
      where: { shiftId }
    });
    // Limpa a atribuição específica
    const filtered = assignments.filter((a: any) => a.memberId !== memberId);
    await prisma.eventShiftAssignment.deleteMany({ where: { shiftId } });
    for (const a of filtered) {
      await prisma.eventShiftAssignment.create({ data: { shiftId: a.shiftId, memberId: a.memberId } });
    }
  }
}
