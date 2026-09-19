import { prisma } from '../../core/database/prisma';
import { DomainEvent } from '../../events/event.types';

export class RecipientResolverService {
  /**
   * Resolve strictly authorized recipient user IDs for a given domain event.
   * Enforces: Permission + Producer Scope + Event Scope + User Preferences (with security mandatory bypass)
   */
  public static async resolveRecipients(event: DomainEvent): Promise<string[]> {
    // 1. Fetch Notification Rule for event type
    const rule = await prisma.notificationRule.findUnique({
      where: { eventType: event.type }
    });

    const requiredPermission = rule?.requiredPerm;
    const isMandatory = rule?.isMandatory ?? false;

    // 2. Fetch all active users with their access relations and preferences
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true }
                }
              }
            }
          }
        },
        userPermissions: {
          include: { permission: true }
        },
        producerAccesses: true,
        eventAccesses: true,
        preferences: true
      }
    });

    const resolvedUserIds: string[] = [];

    for (const u of users) {
      // 2.1 Super Admin receives all alerts unless explicitly scoped
      if (u.isSuperAdmin) {
        resolvedUserIds.push(u.id);
        continue;
      }

      // 2.2 Calculate user permissions
      const permissionSet = new Set<string>();
      for (const ur of u.userRoles || []) {
        for (const rp of ur.role?.rolePermissions || []) {
          if (rp.permission?.code) permissionSet.add(rp.permission.code);
        }
      }
      for (const up of u.userPermissions || []) {
        if (up.permission?.code) {
          if (up.isGranted) permissionSet.add(up.permission.code);
          else permissionSet.delete(up.permission.code);
        }
      }

      // Check required permission if rule specifies one
      if (requiredPermission && !permissionSet.has(requiredPermission)) {
        // Exclude: user does not have required action permission
        continue;
      }

      // 2.3 Scope Validation: Producer
      const userProducerIds = u.producerAccesses?.map((pa: any) => pa.producerId) || [];
      const isGlobalScope = u.isSuperAdmin || (u.userRoles || []).some((ur: any) => ur.role?.code !== 'PRODUTOR');

      if (event.producerId && !isGlobalScope) {
        if (!userProducerIds.includes(event.producerId)) {
          // Exclude: event belongs to Producer A, but user is scoped to Producer B
          continue;
        }
      }

      // 2.4 Scope Validation: Event
      const userEventIds = u.eventAccesses?.map((ea: any) => ea.eventId) || [];
      if (event.eventId && !isGlobalScope && userEventIds.length > 0) {
        if (!userEventIds.includes(event.eventId)) {
          // Exclude: user is restricted to specific events and does not have this event
          continue;
        }
      }

      // 2.5 Preferences Validation
      if (!isMandatory) {
        const moduleName = event.resourceType?.toLowerCase() || 'general';
        const pref = (u.preferences || []).find((p: any) => p.module === moduleName && p.channel === 'IN_APP');
        if (pref && pref.isEnabled === false) {
          // Exclude: user opted out of optional alerts for this module
          continue;
        }
      }

      resolvedUserIds.push(u.id);
    }

    return resolvedUserIds;
  }
}
