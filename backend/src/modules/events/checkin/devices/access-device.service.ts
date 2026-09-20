import { prisma } from '../../../../core/database/prisma';
import { AccessDeviceDTO, AccessDeviceType, AccessDeviceStatus } from '@shared/types/index';
import { AuditService } from '../../../audit/audit.service';
import crypto from 'crypto';

export class AccessDeviceService {
  /**
   * Registers a new device for access control.
   */
  public static async registerDevice(data: {
    eventId: string;
    name: string;
    deviceCode?: string;
    type: AccessDeviceType;
    allowedAccessPointIds?: string[];
    allowedSessionIds?: string[];
    registeredBy: string;
  }): Promise<AccessDeviceDTO> {
    const deviceCode = data.deviceCode || `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const rawApiKey = `dev_sec_${crypto.randomBytes(16).toString('hex')}`;
    const apiKeyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

    const created = await prisma.accessDevice.create({
      data: {
        eventId: data.eventId,
        name: data.name,
        deviceCode,
        type: data.type,
        status: 'ACTIVE',
        apiKeyHash,
        batteryLevel: 100,
        appVersion: '1.0.0',
        allowedAccessPointIds: JSON.stringify(data.allowedAccessPointIds || []),
        allowedSessionIds: JSON.stringify(data.allowedSessionIds || []),
        registeredBy: data.registeredBy,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await AuditService.log({
      action: 'ACCESS_DEVICE_REGISTERED',
      resource: 'access_device',
      resourceId: created.id,
      userId: data.registeredBy,
      details: {
        eventId: data.eventId,
        name: data.name,
        deviceCode,
        type: data.type
      }
    });

    return this.mapToDTO(created, rawApiKey);
  }

  /**
   * Lists devices associated with an event.
   */
  public static async listDevices(eventId: string): Promise<AccessDeviceDTO[]> {
    const devices = await prisma.accessDevice.findMany({
      where: { eventId }
    });
    return devices.map((d: any) => this.mapToDTO(d));
  }

  /**
   * Finds device by ID.
   */
  public static async getDeviceById(id: string): Promise<AccessDeviceDTO | null> {
    const device = await prisma.accessDevice.findUnique({
      where: { id }
    });
    return device ? this.mapToDTO(device) : null;
  }

  /**
   * Authorizes or activates a device.
   */
  public static async authorizeDevice(deviceId: string, authorizedBy: string): Promise<AccessDeviceDTO> {
    const device = await prisma.accessDevice.findUnique({ where: { id: deviceId } });
    if (!device) throw new Error('Dispositivo não encontrado.');

    const updated = await prisma.accessDevice.update({
      where: { id: deviceId },
      data: {
        status: 'ACTIVE',
        revokedAt: null,
        revokedReason: null
      }
    });

    await AuditService.log({
      action: 'ACCESS_DEVICE_AUTHORIZED',
      resource: 'access_device',
      resourceId: deviceId,
      userId: authorizedBy,
      details: { deviceCode: device.deviceCode }
    });

    return this.mapToDTO(updated);
  }

  /**
   * Immediately revokes a device (stolen, compromised, damaged).
   */
  public static async revokeDevice(deviceId: string, reason: string, revokedBy: string): Promise<AccessDeviceDTO> {
    const device = await prisma.accessDevice.findUnique({ where: { id: deviceId } });
    if (!device) throw new Error('Dispositivo não encontrado.');

    const updated = await prisma.accessDevice.update({
      where: { id: deviceId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedReason: reason
      }
    });

    // Close any active device sessions
    await prisma.deviceSession.updateMany({
      where: { deviceId, isActive: true },
      data: { isActive: false, endedAt: new Date() }
    });

    await AuditService.log({
      action: 'ACCESS_DEVICE_REVOKED',
      resource: 'access_device',
      resourceId: deviceId,
      userId: revokedBy,
      details: { reason, deviceCode: device.deviceCode }
    });

    return this.mapToDTO(updated);
  }

  /**
   * Heartbeat from device reporting battery and app version.
   */
  public static async recordHeartbeat(deviceId: string, batteryLevel?: number, appVersion?: string): Promise<AccessDeviceDTO> {
    const device = await prisma.accessDevice.findUnique({ where: { id: deviceId } });
    if (!device) throw new Error('Dispositivo não encontrado.');

    const updated = await prisma.accessDevice.update({
      where: { id: deviceId },
      data: {
        batteryLevel: batteryLevel !== undefined ? batteryLevel : device.batteryLevel,
        appVersion: appVersion || device.appVersion,
        lastHeartbeatAt: new Date()
      }
    });

    return this.mapToDTO(updated);
  }

  private static mapToDTO(device: any, rawApiKey?: string): AccessDeviceDTO {
    return {
      id: device.id,
      eventId: device.eventId,
      name: device.name,
      deviceCode: device.deviceCode,
      type: device.type,
      status: device.status,
      apiKeyMasked: rawApiKey ? `${rawApiKey.substring(0, 10)}...` : undefined,
      batteryLevel: device.batteryLevel,
      appVersion: device.appVersion,
      allowedAccessPointIds: typeof device.allowedAccessPointIds === 'string'
        ? JSON.parse(device.allowedAccessPointIds || '[]')
        : (device.allowedAccessPointIds || []),
      allowedSessionIds: typeof device.allowedSessionIds === 'string'
        ? JSON.parse(device.allowedSessionIds || '[]')
        : (device.allowedSessionIds || []),
      currentSessionId: device.currentSessionId,
      lastHeartbeatAt: device.lastHeartbeatAt ? new Date(device.lastHeartbeatAt).toISOString() : undefined,
      lastSyncAt: device.lastSyncAt ? new Date(device.lastSyncAt).toISOString() : undefined,
      registeredBy: device.registeredBy,
      revokedAt: device.revokedAt ? new Date(device.revokedAt).toISOString() : undefined,
      revokedReason: device.revokedReason,
      createdAt: new Date(device.createdAt).toISOString(),
      updatedAt: new Date(device.updatedAt).toISOString()
    };
  }
}
