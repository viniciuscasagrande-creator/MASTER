import { OperationCommandType } from '@shared/types/index';
import { OperationTransitionService } from '../lifecycle/operation-transition.service';
import { SessionAccessPointService } from '../access-points/session-access-point.service';
import { OperationReadinessService } from '../readiness/operation-readiness.service';

export interface CommandContext {
  operationId: string;
  sessionId: string;
  eventId: string;
  userId: string;
  userName?: string;
  targetId?: string | null;
  executionMode?: 'LOGICAL' | 'INTEGRATION';
  payload?: any;
  reason?: string | null;
}

export type CommandHandler = (ctx: CommandContext) => Promise<any>;

export class OperationCommandHandlerRegistry {
  private static handlers: Map<OperationCommandType, CommandHandler> = new Map();

  public static register(type: OperationCommandType, handler: CommandHandler): void {
    this.handlers.set(type, handler);
  }

  public static getHandler(type: OperationCommandType): CommandHandler | undefined {
    return this.handlers.get(type);
  }

  public static initialize(): void {
    this.register('OPEN_OPERATION', async (ctx) => {
      return OperationTransitionService.executeTransition({
        eventId: ctx.eventId,
        sessionId: ctx.sessionId,
        targetStatus: 'OPENING',
        userId: ctx.userId,
        userName: ctx.userName,
        override: ctx.payload?.override,
        overrideReason: ctx.payload?.overrideReason || ctx.reason || undefined,
        notes: ctx.reason || undefined
      });
    });

    this.register('START_CLOSING', async (ctx) => {
      return OperationTransitionService.executeTransition({
        eventId: ctx.eventId,
        sessionId: ctx.sessionId,
        targetStatus: 'CLOSING',
        userId: ctx.userId,
        userName: ctx.userName,
        override: ctx.payload?.override,
        overrideReason: ctx.payload?.overrideReason || ctx.reason || undefined,
        notes: ctx.reason || undefined
      });
    });

    this.register('CLOSE_OPERATION', async (ctx) => {
      return OperationTransitionService.executeTransition({
        eventId: ctx.eventId,
        sessionId: ctx.sessionId,
        targetStatus: 'CLOSED',
        userId: ctx.userId,
        userName: ctx.userName,
        override: ctx.payload?.override,
        overrideReason: ctx.payload?.overrideReason || ctx.reason || undefined,
        notes: ctx.reason || undefined
      });
    });

    this.register('OPEN_ACCESS_POINT', async (ctx) => {
      if (!ctx.targetId) throw new Error('ID do ponto de acesso é obrigatório para OPEN_ACCESS_POINT');
      return SessionAccessPointService.updateStatus(ctx.targetId, 'OPEN', ctx.executionMode || 'LOGICAL');
    });

    this.register('CLOSE_ACCESS_POINT', async (ctx) => {
      if (!ctx.targetId) throw new Error('ID do ponto de acesso é obrigatório para CLOSE_ACCESS_POINT');
      return SessionAccessPointService.updateStatus(ctx.targetId, 'CLOSED', ctx.executionMode || 'LOGICAL');
    });

    this.register('PAUSE_ACCESS_POINT', async (ctx) => {
      if (!ctx.targetId) throw new Error('ID do ponto de acesso é obrigatório para PAUSE_ACCESS_POINT');
      return SessionAccessPointService.updateStatus(ctx.targetId, 'PAUSED', ctx.executionMode || 'LOGICAL');
    });

    this.register('RESUME_ACCESS_POINT', async (ctx) => {
      if (!ctx.targetId) throw new Error('ID do ponto de acesso é obrigatório para RESUME_ACCESS_POINT');
      return SessionAccessPointService.updateStatus(ctx.targetId, 'OPEN', ctx.executionMode || 'LOGICAL');
    });

    this.register('START_CHECKIN', async (_ctx) => {
      return { success: true, message: 'Check-in operacional iniciado.' };
    });

    this.register('PAUSE_CHECKIN', async (_ctx) => {
      return { success: true, message: 'Check-in operacional pausado temporariamente.' };
    });

    this.register('RESUME_CHECKIN', async (_ctx) => {
      return { success: true, message: 'Check-in operacional retomado.' };
    });

    this.register('ACKNOWLEDGE_ALERT', async (ctx) => {
      return { success: true, alertId: ctx.targetId, acknowledgedAt: new Date().toISOString() };
    });

    this.register('OVERRIDE_BLOCKER', async (ctx) => {
      const code = ctx.targetId || ctx.payload?.code;
      if (!code) throw new Error('Código da pendência impeditiva é obrigatório');
      const reason = ctx.reason || ctx.payload?.reason;
      if (!reason || reason.trim().length < 5) throw new Error('Justificativa obrigatória para override.');

      OperationReadinessService.setOverride(ctx.operationId, code, reason, ctx.userName || ctx.userId);
      return { success: true, code, overridden: true };
    });
  }
}

// Auto-initialize default handlers
OperationCommandHandlerRegistry.initialize();
