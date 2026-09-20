import { prisma } from '../../../core/database/prisma';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';
import { AuditService } from '../../audit/audit.service';
import { VenueAccessPointDTO } from '@shared/types/index';

export class VenueAccessPointService {
  public static async listAccessPoints(venueId: string): Promise<VenueAccessPointDTO[]> {
    return prisma.venueAccessPoint.findMany({ where: { venueId } });
  }

  public static async createAccessPoint(
    venueId: string,
    input: { name: string; code: string; type: string; active?: boolean },
    user: AuthenticatedUser
  ): Promise<VenueAccessPointDTO> {
    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new Error('Local físico não encontrado.');

    const point = await prisma.venueAccessPoint.create({
      data: {
        venueId,
        name: input.name,
        code: input.code.toUpperCase(),
        type: input.type,
        active: input.active !== undefined ? input.active : true
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE_ACCESS_POINT',
      resource: `ACCESS_POINT:${point.id}`,
      producerId: venue.producerId || undefined,
      details: `Ponto de acesso '${point.name}' criado para o local '${venue.name}'.`,
      result: 'SUCCESS'
    });

    return point;
  }

  public static async updateAccessPoint(
    id: string,
    input: { name?: string; code?: string; type?: string; active?: boolean },
    user: AuthenticatedUser
  ): Promise<VenueAccessPointDTO> {
    const existing = await prisma.venueAccessPoint.findUnique({ where: { id } });
    if (!existing) throw new Error('Ponto de acesso não encontrado.');

    const updated = await prisma.venueAccessPoint.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name : existing.name,
        code: input.code !== undefined ? input.code.toUpperCase() : existing.code,
        type: input.type !== undefined ? input.type : existing.type,
        active: input.active !== undefined ? input.active : existing.active
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'UPDATE_ACCESS_POINT',
      resource: `ACCESS_POINT:${id}`,
      details: `Ponto de acesso '${updated.name}' atualizado.`,
      result: 'SUCCESS'
    });

    return updated;
  }

  public static async deleteAccessPoint(id: string, user: AuthenticatedUser): Promise<void> {
    const existing = await prisma.venueAccessPoint.findUnique({ where: { id } });
    if (!existing) throw new Error('Ponto de acesso não encontrado.');

    await prisma.venueAccessPoint.delete({ where: { id } });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'DELETE_ACCESS_POINT',
      resource: `ACCESS_POINT:${id}`,
      details: `Ponto de acesso '${existing.name}' excluído.`,
      result: 'SUCCESS'
    });
  }
}
