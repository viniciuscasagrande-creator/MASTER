import { prisma } from '../../../../core/database/prisma';
import { DeviceSessionDTO } from '@shared/types/index';

export class DeviceSessionService {
  /**
   * Starts a new device session linking device, operator, event, session and access point.
   */
  public static async startSession(params: {
    deviceId: string;
    eventId: string;
    sessionId: string;
    accessPointId: string;
    operatorId: string;
    operatorName: string;
  }): Promise<DeviceSessionDTO> {
    // Check if device is ACTIVE
    const device = await prisma.accessDevice.findUnique({ where: { id: params.deviceId } });
    if (!device) throw new Error('Dispositivo não cadastrado.');
    if (device.status !== 'ACTIVE') throw new Error(`Dispositivo com status inválido: ${device.status}`);

    // End any previously active session for this device
    await prisma.deviceSession.updateMany({
      where: { deviceId: params.deviceId, isActive: true },
      data: { isActive: false, endedAt: new Date() }
    });

    const session = await prisma.deviceSession.create({
      data: {
        deviceId: params.deviceId,
        eventId: params.eventId,
        sessionId: params.sessionId,
        accessPointId: params.accessPointId,
        operatorId: params.operatorId,
        operatorName: params.operatorName,
        startedAt: new Date(),
        isActive: true,
        validationsCount: 0,
        allowsCount: 0,
        deniesCount: 0
      }
    });

    // Update currentSessionId on device
    await prisma.accessDevice.update({
      where: { id: params.deviceId },
      data: { currentSessionId: params.sessionId }
    });

    return this.mapToDTO(session);
  }

  /**
   * Ends an active device session.
   */
  public static async endSession(deviceSessionId: string): Promise<DeviceSessionDTO> {
    const session = await prisma.deviceSession.findUnique({ where: { id: deviceSessionId } });
    if (!session) throw new Error('Sessão de dispositivo não encontrada.');

    const updated = await prisma.deviceSession.update({
      where: { id: deviceSessionId },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });

    return this.mapToDTO(updated);
  }

  /**
   * Gets active session for device.
   */
  public static async getActiveSession(deviceId: string): Promise<DeviceSessionDTO | null> {
    const session = await prisma.deviceSession.findFirst({
      where: { deviceId, isActive: true }
    });
    return session ? this.mapToDTO(session) : null;
  }

  /**
   * Increments validation counter on device session.
   */
  public static async recordValidation(deviceId: string, decision: 'ALLOW' | 'DENY' | 'REVIEW'): Promise<void> {
    const active = await prisma.deviceSession.findFirst({
      where: { deviceId, isActive: true }
    });
    if (!active) return;

    await prisma.deviceSession.update({
      where: { id: active.id },
      data: {
        validationsCount: (active.validationsCount || 0) + 1,
        allowsCount: decision === 'ALLOW' ? (active.allowsCount || 0) + 1 : active.allowsCount,
        deniesCount: decision !== 'ALLOW' ? (active.deniesCount || 0) + 1 : active.deniesCount
      }
    });
  }

  private static mapToDTO(s: any): DeviceSessionDTO {
    return {
      id: s.id,
      deviceId: s.deviceId,
      eventId: s.eventId,
      sessionId: s.sessionId,
      accessPointId: s.accessPointId,
      operatorId: s.operatorId,
      operatorName: s.operatorName,
      startedAt: new Date(s.startedAt).toISOString(),
      endedAt: s.endedAt ? new Date(s.endedAt).toISOString() : undefined,
      isActive: s.isActive,
      validationsCount: s.validationsCount || 0,
      allowsCount: s.allowsCount || 0,
      deniesCount: s.deniesCount || 0
    };
  }
}
