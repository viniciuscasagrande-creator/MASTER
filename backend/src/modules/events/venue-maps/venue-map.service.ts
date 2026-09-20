import { prisma } from '../../../core/database/prisma';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';
import { AuditService } from '../../audit/audit.service';
import { EventBus } from '../../../events/event-bus';
import { DomainEvent } from '../../../events/event.types';
import {
  VenueMapDTO,
  VenueMapVersionDTO,
  VenueMapElementDTO,
  VenueRowDTO,
  VenueSeatDTO
} from '@shared/types/index';

export interface SaveMapLayoutInput {
  elements?: Array<{
    id?: string;
    type: string;
    linkedSectionId?: string;
    coordinates?: string;
    label?: string;
    metadata?: string;
    sortOrder?: number;
  }>;
  rows?: Array<{
    id?: string;
    sectionId: string;
    code: string;
    name: string;
    sortOrder?: number;
  }>;
  seats?: Array<{
    id?: string;
    rowId?: string;
    sectionId: string;
    code: string;
    label: string;
    x?: number;
    y?: number;
    seatType?: string;
    accessible?: boolean;
    companionSeat?: boolean;
    restrictedView?: boolean;
    active?: boolean;
  }>;
  totalCapacity?: number;
}

export class VenueMapService {
  public static async listMaps(venueId: string): Promise<VenueMapDTO[]> {
    return prisma.venueMap.findMany({
      where: { venueId },
      include: { versions: true }
    });
  }

  public static async getMapWithVersion(
    mapId: string,
    versionId?: string
  ): Promise<{ map: VenueMapDTO; activeVersion?: VenueMapVersionDTO }> {
    const map = await prisma.venueMap.findUnique({
      where: { id: mapId },
      include: { versions: true }
    });

    if (!map) throw new Error('Mapa do local não encontrado.');

    const targetVersionId = versionId || map.activeVersionId || (map.versions && map.versions[0]?.id);

    let activeVersion: VenueMapVersionDTO | undefined;
    if (targetVersionId) {
      activeVersion = await prisma.venueMapVersion.findUnique({
        where: { id: targetVersionId },
        include: {
          elements: true,
          rows: { include: { seats: true } },
          seats: true
        }
      });
    }

    return { map, activeVersion };
  }

  public static async createMap(
    venueId: string,
    input: { name: string; type?: string; backgroundDocumentId?: string },
    user: AuthenticatedUser
  ): Promise<{ map: VenueMapDTO; version: VenueMapVersionDTO }> {
    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new Error('Local físico não encontrado.');

    // 1. Create Map
    const map = await prisma.venueMap.create({
      data: {
        venueId,
        name: input.name,
        type: input.type || 'CANVAS_SEATED',
        backgroundDocumentId: input.backgroundDocumentId || null,
        status: 'ACTIVE'
      }
    });

    // 2. Create Initial Version
    const version = await prisma.venueMapVersion.create({
      data: {
        mapId: map.id,
        versionNumber: 1,
        name: 'Versão 1 - Inicial',
        status: 'DRAFT',
        totalCapacity: 0,
        version: 1
      }
    });

    // Update map activeVersionId to this version
    await prisma.venueMap.update({
      where: { id: map.id },
      data: { activeVersionId: version.id }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'CREATE_VENUE_MAP',
      resource: `VENUE_MAP:${map.id}`,
      producerId: venue.producerId || undefined,
      details: `Mapa '${map.name}' e versão inicial criados para o local '${venue.name}'.`,
      result: 'SUCCESS'
    });

    return { map, version };
  }

  public static async saveMapLayout(
    versionId: string,
    input: SaveMapLayoutInput,
    user: AuthenticatedUser
  ): Promise<VenueMapVersionDTO> {
    const version = await prisma.venueMapVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new Error('Versão do mapa não encontrada.');

    // Remove old elements and seats if replacement provided
    if (input.elements) {
      await prisma.venueMapElement.deleteMany({ where: { mapVersionId: versionId } });
      for (const el of input.elements) {
        await prisma.venueMapElement.create({
          data: {
            mapVersionId: versionId,
            type: el.type,
            linkedSectionId: el.linkedSectionId || null,
            coordinates: el.coordinates || '{}',
            label: el.label || null,
            metadata: el.metadata || null,
            sortOrder: el.sortOrder || 0
          }
        });
      }
    }

    if (input.rows) {
      await prisma.venueRow.deleteMany({ where: { mapVersionId: versionId } });
      for (const row of input.rows) {
        await prisma.venueRow.create({
          data: {
            id: row.id,
            mapVersionId: versionId,
            sectionId: row.sectionId,
            code: row.code,
            name: row.name,
            sortOrder: row.sortOrder || 0
          }
        });
      }
    }

    if (input.seats) {
      await prisma.venueSeat.deleteMany({ where: { mapVersionId: versionId } });
      for (const st of input.seats) {
        await prisma.venueSeat.create({
          data: {
            id: st.id,
            mapVersionId: versionId,
            rowId: st.rowId || null,
            sectionId: st.sectionId,
            code: st.code,
            label: st.label,
            x: st.x || null,
            y: st.y || null,
            seatType: st.seatType || 'STANDARD',
            accessible: st.accessible || false,
            companionSeat: st.companionSeat || false,
            restrictedView: st.restrictedView || false,
            active: st.active !== undefined ? st.active : true
          }
        });
      }
    }

    // Recalculate capacity
    const totalSeats = await prisma.venueSeat.count({
      where: { mapVersionId: versionId, active: true }
    });

    const updated = await prisma.venueMapVersion.update({
      where: { id: versionId },
      data: {
        totalCapacity: input.totalCapacity !== undefined ? input.totalCapacity : totalSeats
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'SAVE_MAP_LAYOUT',
      resource: `MAP_VERSION:${versionId}`,
      details: `Layout do mapa salvo na versão ${version.versionNumber}. Total de assentos/capacidade: ${updated.totalCapacity}.`,
      result: 'SUCCESS'
    });

    return prisma.venueMapVersion.findUnique({
      where: { id: versionId },
      include: {
        elements: true,
        rows: { include: { seats: true } },
        seats: true
      }
    });
  }

  public static async publishMapVersion(
    versionId: string,
    user: AuthenticatedUser
  ): Promise<VenueMapVersionDTO> {
    const version = await prisma.venueMapVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new Error('Versão do mapa não encontrada.');

    // Archive previously active versions of this map
    const mapVersions = await prisma.venueMapVersion.findMany({
      where: { mapId: version.mapId }
    });

    for (const v of mapVersions) {
      if (v.id !== versionId && v.status === 'ACTIVE') {
        await prisma.venueMapVersion.update({
          where: { id: v.id },
          data: { status: 'ARCHIVED' }
        });
      }
    }

    // Set this version as ACTIVE
    const published = await prisma.venueMapVersion.update({
      where: { id: versionId },
      data: { status: 'ACTIVE' }
    });

    // Update parent map's activeVersionId
    await prisma.venueMap.update({
      where: { id: version.mapId },
      data: { activeVersionId: versionId }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'PUBLISH_MAP_VERSION',
      resource: `MAP_VERSION:${versionId}`,
      details: `Versão ${version.versionNumber} do mapa publicada como ATIVA.`,
      result: 'SUCCESS'
    });

    return published;
  }

  public static async duplicateMapVersion(
    versionId: string,
    user: AuthenticatedUser
  ): Promise<VenueMapVersionDTO> {
    const source = await prisma.venueMapVersion.findUnique({
      where: { id: versionId },
      include: {
        elements: true,
        rows: { include: { seats: true } },
        seats: true
      }
    });

    if (!source) throw new Error('Versão de origem não encontrada.');

    const mapVersions = await prisma.venueMapVersion.findMany({
      where: { mapId: source.mapId }
    });
    const nextNumber = Math.max(...mapVersions.map(v => v.versionNumber), 0) + 1;

    // 1. Create new version record
    const newVersion = await prisma.venueMapVersion.create({
      data: {
        mapId: source.mapId,
        versionNumber: nextNumber,
        name: `Versão ${nextNumber} (Cópia da V${source.versionNumber})`,
        status: 'DRAFT',
        totalCapacity: source.totalCapacity
      }
    });

    // 2. Clone elements
    if (source.elements && source.elements.length > 0) {
      for (const el of source.elements) {
        await prisma.venueMapElement.create({
          data: {
            mapVersionId: newVersion.id,
            type: el.type,
            linkedSectionId: el.linkedSectionId,
            coordinates: el.coordinates,
            label: el.label,
            metadata: el.metadata,
            sortOrder: el.sortOrder
          }
        });
      }
    }

    // 3. Clone rows and seats
    const rowIdMap = new Map<string, string>();
    if (source.rows && source.rows.length > 0) {
      for (const r of source.rows) {
        const newRow = await prisma.venueRow.create({
          data: {
            mapVersionId: newVersion.id,
            sectionId: r.sectionId,
            code: r.code,
            name: r.name,
            sortOrder: r.sortOrder
          }
        });
        rowIdMap.set(r.id, newRow.id);
      }
    }

    if (source.seats && source.seats.length > 0) {
      for (const s of source.seats) {
        const mappedRowId = s.rowId ? rowIdMap.get(s.rowId) || null : null;
        await prisma.venueSeat.create({
          data: {
            mapVersionId: newVersion.id,
            rowId: mappedRowId,
            sectionId: s.sectionId,
            code: s.code,
            label: s.label,
            x: s.x,
            y: s.y,
            seatType: s.seatType,
            accessible: s.accessible,
            companionSeat: s.companionSeat,
            restrictedView: s.restrictedView,
            active: s.active
          }
        });
      }
    }

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'DUPLICATE_MAP_VERSION',
      resource: `MAP_VERSION:${newVersion.id}`,
      details: `Versão ${source.versionNumber} duplicada com sucesso para Versão ${nextNumber}.`,
      result: 'SUCCESS'
    });

    return prisma.venueMapVersion.findUnique({
      where: { id: newVersion.id },
      include: {
        elements: true,
        rows: { include: { seats: true } },
        seats: true
      }
    });
  }

  public static async bulkUpdateSeats(
    versionId: string,
    seatIds: string[],
    updates: {
      seatType?: string;
      accessible?: boolean;
      companionSeat?: boolean;
      restrictedView?: boolean;
      active?: boolean;
    },
    user: AuthenticatedUser
  ): Promise<{ updatedCount: number }> {
    const res = await prisma.venueSeat.updateMany({
      where: {
        mapVersionId: versionId,
        id: { in: seatIds }
      },
      data: updates
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'BULK_UPDATE_SEATS',
      resource: `MAP_VERSION:${versionId}`,
      details: `${res.count} assentos atualizados em lote na versão ${versionId}.`,
      result: 'SUCCESS'
    });

    return { updatedCount: res.count };
  }
}
