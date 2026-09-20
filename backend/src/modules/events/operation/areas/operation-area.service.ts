import { prisma } from '../../../../core/database/prisma';
import { OperationAreaDTO } from '@shared/types/index';

export const STANDARD_OPERATION_AREAS = [
  { areaCode: 'ACESSOS', name: 'Controle de Acessos', description: 'Operação de catracas, portões e triagem física de público.' },
  { areaCode: 'CHECKIN', name: 'Validação & Check-in', description: 'Leitura de ingressos, pulseiras e validação de credenciais.' },
  { areaCode: 'BILHETERIA', name: 'Bilheteria & Atendimento', description: 'Vendas presenciais, retirada de cortesias e resolução de ingressos.' },
  { areaCode: 'SEGURANCA', name: 'Segurança & Prevenção', description: 'Vigilância patrimonial, contenção e brigada de emergência.' },
  { areaCode: 'SUPORTE', name: 'Suporte & War Room', description: 'Monitoramento técnico, suporte a dispositivos e central de comando.' },
  { areaCode: 'PRODUCAO', name: 'Produção Geral', description: 'Coordenação artística, logística de camarim e infraestrutura de palco.' },
  { areaCode: 'ATENDIMENTO', name: 'SAC & Ouvidoria', description: 'Achados e perdidos, atendimento a PCD e dúvidas de clientes.' },
  { areaCode: 'CREDENCIAMENTO', name: 'Credenciamento & Imprensa', description: 'Emissão de credenciais de imprensa, convidados VIP e staff.' }
];

export class OperationAreaService {
  public static async ensureDefaultAreas(eventId: string, sessionId?: string): Promise<void> {
    const existing = await prisma.eventOperationArea.findMany({ where: { eventId } });
    if (existing.length === 0) {
      for (const std of STANDARD_OPERATION_AREAS) {
        await prisma.eventOperationArea.create({
          data: {
            eventId,
            sessionId: sessionId || null,
            areaCode: std.areaCode,
            name: std.name,
            description: std.description,
            active: true
          }
        });
      }
    }
  }

  public static async listAreas(eventId: string, sessionId?: string, operationId?: string): Promise<OperationAreaDTO[]> {
    await this.ensureDefaultAreas(eventId, sessionId);
    const areas = await prisma.eventOperationArea.findMany({ where: { eventId, active: true } });

    // Shifts to calculate staff present
    const shifts = operationId
      ? await prisma.operationShift.findMany({ where: { operationId } })
      : [];

    // Incidents to calculate open incidents per area
    const incidents = await prisma.supportTicket.findMany({
      where: { eventId, type: 'INCIDENT', status: 'OPEN' }
    });

    return areas.map((a: any) => {
      const areaShifts = shifts.filter((s: any) => s.areaId === a.id || s.areaCode === a.areaCode);
      const staffPresent = areaShifts.filter((s: any) => s.status === 'PRESENT').length;
      const staffTotal = areaShifts.length;
      const openIncidents = incidents.filter((i: any) => i.areaCode === a.areaCode).length;

      return {
        id: a.id,
        eventId: a.eventId,
        sessionId: a.sessionId,
        areaCode: a.areaCode,
        name: a.name,
        description: a.description || undefined,
        leadUserId: a.leadUserId || null,
        leadUserName: a.leadUserName || null,
        active: a.active,
        staffPresentCount: staffPresent,
        staffTotalCount: staffTotal,
        openIncidentsCount: openIncidents
      };
    });
  }

  public static async updateAreaLead(areaId: string, leadUserId: string, leadUserName: string): Promise<any> {
    return prisma.eventOperationArea.update({
      where: { id: areaId },
      data: { leadUserId, leadUserName }
    });
  }
}
