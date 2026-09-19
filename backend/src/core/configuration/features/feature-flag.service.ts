import { prisma } from '../../database/prisma';
import { AppError } from '../../errors/AppError';
import { AuthenticatedUser } from '../../middleware/authenticate';
import { DomainEvents } from '../../../events/DomainEvents';
import { ConfigurationRepository } from '../configuration.repository';

export class FeatureFlagService {
  /**
   * Deterministic hash from string into 0-99 range for percentage rollout
   */
  private static hashToPercent(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 100);
  }

  /**
   * Evaluates if a feature flag is enabled for a given context
   */
  public static async isEnabled(
    key: string,
    context?: {
      user?: any;
      producerId?: string | null;
      eventId?: string | null;
    }
  ): Promise<boolean> {
    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) return false;

    // If flag is globally disabled
    if (!flag.isEnabled) return false;

    // Check Kill Switch state: if kill switch is triggered, the operation is suspended
    if (flag.isKillSwitch) {
      return flag.isEnabled; // isEnabled true means Kill Switch is active / emergency blocking
    }

    const roles: string[] = flag.allowedRoles ? JSON.parse(flag.allowedRoles) : [];
    const producers: string[] = flag.allowedProducers ? JSON.parse(flag.allowedProducers) : [];
    const events: string[] = flag.allowedEvents ? JSON.parse(flag.allowedEvents) : [];

    // Check Producer Whitelist
    if (producers.length > 0) {
      if (!context?.producerId || !producers.includes(context.producerId)) {
        return false;
      }
    }

    // Check Event Whitelist
    if (events.length > 0) {
      if (!context?.eventId || !events.includes(context.eventId)) {
        return false;
      }
    }

    // Check Role Whitelist
    if (roles.length > 0 && context?.user) {
      const userRoles: string[] = context.user.roles || [context.user.role];
      const hasRole = roles.some(r => userRoles.includes(r));
      if (!hasRole) return false;
    }

    // Check Rollout Percentage (0-100)
    if (flag.rolloutPercentage < 100) {
      if (flag.rolloutPercentage <= 0) return false;
      const targetId = context?.user?.id || context?.producerId || 'anonymous';
      const bucket = this.hashToPercent(`${key}:${targetId}`);
      if (bucket >= flag.rolloutPercentage) return false;
    }

    return true;
  }

  /**
   * Triggers an emergency Kill Switch
   */
  public static async triggerKillSwitch(key: string, reason: string, user: AuthenticatedUser): Promise<any> {
    if (!reason || !reason.trim()) {
      throw new AppError('O motivo do acionamento do Kill Switch é obrigatório.', 400);
    }

    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) throw new AppError(`Kill Switch "${key}" não encontrado.`, 404);

    const updated = await prisma.featureFlag.update({
      where: { key },
      data: {
        isEnabled: true, // Active kill switch
        killSwitchTriggeredAt: new Date(),
        killSwitchTriggeredBy: user.id,
        killSwitchReason: reason
      }
    });

    await ConfigurationRepository.logAudit(
      'KILL_SWITCH',
      updated.id,
      key,
      'KILL_SWITCH_TRIGGER',
      'GLOBAL',
      null,
      null,
      { isEnabled: flag.isEnabled },
      { isEnabled: true, killSwitchReason: reason },
      reason,
      user.id,
      user.name
    );

    DomainEvents.dispatch('KILL_SWITCH_TRIGGERED', {
      resourceType: 'KILL_SWITCH',
      resourceId: updated.id,
      actorUserId: user.id,
      data: {
        key,
        name: updated.name,
        reason,
        triggeredAt: new Date().toISOString()
      }
    });

    return updated;
  }

  /**
   * Resets / deactivates an emergency Kill Switch
   */
  public static async resetKillSwitch(key: string, reason: string, user: AuthenticatedUser): Promise<any> {
    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) throw new AppError(`Kill Switch "${key}" não encontrado.`, 404);

    const updated = await prisma.featureFlag.update({
      where: { key },
      data: {
        isEnabled: false, // Reset kill switch
        killSwitchTriggeredAt: null,
        killSwitchTriggeredBy: null,
        killSwitchReason: null
      }
    });

    await ConfigurationRepository.logAudit(
      'KILL_SWITCH',
      updated.id,
      key,
      'KILL_SWITCH_RESET',
      'GLOBAL',
      null,
      null,
      { isEnabled: flag.isEnabled },
      { isEnabled: false },
      reason,
      user.id,
      user.name
    );

    DomainEvents.dispatch('KILL_SWITCH_RESET', {
      resourceType: 'KILL_SWITCH',
      resourceId: updated.id,
      actorUserId: user.id,
      data: {
        key,
        name: updated.name,
        reason
      }
    });

    return updated;
  }

  public static async listFlags(): Promise<any[]> {
    return prisma.featureFlag.findMany();
  }

  public static async upsertFlag(data: any): Promise<any> {
    const existing = await prisma.featureFlag.findUnique({ where: { key: data.key } });
    if (existing) {
      return prisma.featureFlag.update({
        where: { key: data.key },
        data: {
          ...data,
          allowedRoles: Array.isArray(data.allowedRoles) ? JSON.stringify(data.allowedRoles) : data.allowedRoles,
          allowedProducers: Array.isArray(data.allowedProducers) ? JSON.stringify(data.allowedProducers) : data.allowedProducers,
          allowedEvents: Array.isArray(data.allowedEvents) ? JSON.stringify(data.allowedEvents) : data.allowedEvents
        }
      });
    } else {
      return prisma.featureFlag.create({
        data: {
          ...data,
          allowedRoles: Array.isArray(data.allowedRoles) ? JSON.stringify(data.allowedRoles) : data.allowedRoles,
          allowedProducers: Array.isArray(data.allowedProducers) ? JSON.stringify(data.allowedProducers) : data.allowedProducers,
          allowedEvents: Array.isArray(data.allowedEvents) ? JSON.stringify(data.allowedEvents) : data.allowedEvents
        }
      });
    }
  }
}
