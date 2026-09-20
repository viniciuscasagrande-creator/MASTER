import { prisma } from '../../../../core/database/prisma';
import { OperationShiftDTO, OperationShiftStatus } from '@shared/types/index';

export class OperationShiftService {
  public static async syncShiftsFromEventTeam(eventId: string, operationId: string): Promise<void> {
    const teamMembers = await prisma.eventTeamMember.findMany({ where: { eventId } });
    const existingShifts = await prisma.operationShift.findMany({ where: { operationId } });
    const areas = await prisma.eventOperationArea.findMany({ where: { eventId } });

    for (const member of teamMembers) {
      const alreadyHasShift = existingShifts.some((s: any) => s.memberId === member.id);
      if (!alreadyHasShift) {
        // Map member role to an area if possible, default to PRODUCAO or SUPORTE
        const mappedArea = areas.find((a: any) =>
          (member.role && member.role.toLowerCase().includes(a.areaCode.toLowerCase())) ||
          (member.role && member.role.toLowerCase().includes(a.name.toLowerCase()))
        ) || areas[0] || { id: 'default-area', areaCode: 'PRODUCAO' };

        const now = new Date();
        const endsAt = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8h shift

        await prisma.operationShift.create({
          data: {
            operationId,
            memberId: member.id,
            memberName: member.name || member.userName || 'Membro de Equipe',
            areaId: mappedArea.id,
            areaCode: mappedArea.areaCode,
            startsAt: now,
            endsAt,
            role: member.role || 'Operador',
            status: 'SCHEDULED'
          }
        });
      }
    }
  }

  public static async listShifts(operationId: string, eventId?: string): Promise<OperationShiftDTO[]> {
    if (eventId) {
      await this.syncShiftsFromEventTeam(eventId, operationId);
    }
    const shifts = await prisma.operationShift.findMany({ where: { operationId } });
    const now = new Date();

    return shifts.map((s: any) => {
      let status: OperationShiftStatus = s.status as OperationShiftStatus;
      // If still SCHEDULED and time passed startsAt by 15 mins, auto-evaluate as LATE
      if (status === 'SCHEDULED' && now.getTime() > new Date(s.startsAt).getTime() + 15 * 60 * 1000) {
        status = 'LATE';
      }

      return {
        id: s.id,
        operationId: s.operationId,
        memberId: s.memberId,
        memberName: s.memberName,
        areaId: s.areaId,
        areaCode: s.areaCode,
        startsAt: new Date(s.startsAt).toISOString(),
        endsAt: new Date(s.endsAt).toISOString(),
        role: s.role,
        status,
        checkInAt: s.checkInAt ? new Date(s.checkInAt).toISOString() : null,
        checkOutAt: s.checkOutAt ? new Date(s.checkOutAt).toISOString() : null,
        notes: s.notes || null
      };
    });
  }

  public static async checkInMember(shiftId: string, notes?: string): Promise<any> {
    const shift = await prisma.operationShift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new Error('Turno de escala não encontrado');

    return prisma.operationShift.update({
      where: { id: shiftId },
      data: {
        status: 'PRESENT',
        checkInAt: new Date(),
        notes: notes || shift.notes
      }
    });
  }

  public static async checkOutMember(shiftId: string, notes?: string): Promise<any> {
    const shift = await prisma.operationShift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new Error('Turno de escala não encontrado');

    return prisma.operationShift.update({
      where: { id: shiftId },
      data: {
        status: 'FINISHED',
        checkOutAt: new Date(),
        notes: notes || shift.notes
      }
    });
  }
}
