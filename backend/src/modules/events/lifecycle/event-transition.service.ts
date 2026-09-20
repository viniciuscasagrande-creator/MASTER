import { prisma } from '../../../core/database/prisma';
import { EventStatus, AvailableTransitionDTO, EventTransitionInput } from '@shared/types/index';
import { EventStateMachine } from './event-state-machine';
import { ITransitionGuard } from './guards/transition-guard.interface';
import { ReadinessGuard } from './guards/readiness.guard';
import { ApprovalGuard } from './guards/approval.guard';
import { SnapshotIntegrityGuard, ReviewSnapshotExistsGuard } from './guards/snapshot-integrity.guard';
import {
  SalesActiveGuard,
  InventoryEmptyGuard,
  InventoryAvailableGuard,
  PostSalesCancellationGuard,
  EmergencyInterruptionGuard
} from './guards/sales.guard';
import { AuditService } from '../../audit/audit.service';

export class EventTransitionService {
  private static readonly GUARD_REGISTRY: Record<string, ITransitionGuard> = {
    READINESS_REVIEW: new ReadinessGuard('READINESS_REVIEW', 'REVIEW'),
    READINESS_PUBLICATION: new ReadinessGuard('READINESS_PUBLICATION', 'PUBLICATION'),
    READINESS_SALES: new ReadinessGuard('READINESS_SALES', 'SALES'),
    READINESS_OPERATION: new ReadinessGuard('READINESS_OPERATION', 'OPERATION'),
    READINESS_CLOSURE: new ReadinessGuard('READINESS_CLOSURE', 'CLOSURE'),
    REVIEW_SNAPSHOT_EXISTS: new ReviewSnapshotExistsGuard(),
    SNAPSHOT_INTEGRITY: new SnapshotIntegrityGuard(),
    APPROVAL_RESOLVED: new ApprovalGuard(),
    SALES_ACTIVE: new SalesActiveGuard(),
    INVENTORY_EMPTY: new InventoryEmptyGuard(),
    INVENTORY_AVAILABLE: new InventoryAvailableGuard(),
    POST_SALES_CANCELLATION_POLICY: new PostSalesCancellationGuard(),
    EMERGENCY_INTERRUPTION_POLICY: new EmergencyInterruptionGuard()
  };

  /**
   * Mapeamento de permissão exigida para cada status de destino
   */
  private static getRequiredPermission(target: EventStatus): string {
    switch (target) {
      case 'REVIEW':
        return 'eventos.lifecycle.review';
      case 'APPROVAL_PENDING':
        return 'eventos.lifecycle.solicitar_aprovacao';
      case 'SCHEDULED':
        return 'eventos.lifecycle.aprovar';
      case 'ON_SALE':
        return 'eventos.lifecycle.publicar';
      case 'SALES_PAUSED':
        return 'eventos.lifecycle.pausar_vendas';
      case 'SOLD_OUT':
        return 'eventos.lifecycle.alterar_status';
      case 'IN_PROGRESS':
        return 'eventos.lifecycle.operacao';
      case 'FINISHED':
        return 'eventos.lifecycle.encerrar';
      case 'CANCELLED':
        return 'eventos.lifecycle.cancelar';
      case 'ARCHIVED':
        return 'eventos.lifecycle.arquivar';
      default:
        return 'eventos.editar';
    }
  }

  /**
   * Avalia todas as transições disponíveis a partir do estado atual do evento
   */
  static async getAvailableTransitions(
    eventId: string,
    userPermissions: string[] = []
  ): Promise<{ currentStatus: EventStatus; transitions: AvailableTransitionDTO[] }> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new Error(`Evento ${eventId} não encontrado.`);
    }

    const currentStatus = event.status as EventStatus;
    const rules = EventStateMachine.getAllowedTransitions(currentStatus);
    const results: AvailableTransitionDTO[] = [];

    const isSuperAdmin = userPermissions.includes('*') || userPermissions.includes('admin') || userPermissions.length === 0;

    for (const rule of rules) {
      const requiredPerm = this.getRequiredPermission(rule.targetStatus);
      const hasPermission = isSuperAdmin || userPermissions.includes(requiredPerm) || userPermissions.includes('eventos.publicar');

      const blockers: string[] = [];

      if (!hasPermission) {
        blockers.push(`Permissão '${requiredPerm}' necessária.`);
      }

      // Avalia cada guard exigido
      for (const guardName of rule.requiredGuards) {
        const guard = this.GUARD_REGISTRY[guardName];
        if (!guard) continue;

        try {
          const res = await guard.evaluate(eventId);
          if (!res.passed) {
            blockers.push(res.message || `Regra de guarda '${guardName}' não foi satisfeita.`);
          }
        } catch (err: any) {
          blockers.push(`Erro ao avaliar guarda '${guardName}': ${err.message}`);
        }
      }

      results.push({
        targetStatus: rule.targetStatus,
        label: rule.label,
        allowed: blockers.length === 0,
        blockReasons: blockers.map(b => ({ code: 'GUARD_FAILED', message: b }))
      });
    }

    return { currentStatus, transitions: results };
  }

  /**
   * Executa a transição de status validando guard conditions, regras da State Machine e RBAC
   */
  static async requestTransition(
    eventId: string,
    input: EventTransitionInput,
    user: { id: string; name?: string; permissions?: string[] }
  ): Promise<{ success: boolean; from: EventStatus; to: EventStatus; event: any }> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new Error(`Evento ${eventId} não encontrado.`);
    }

    const currentStatus = event.status as EventStatus;
    const targetStatus = input.targetStatus;

    if (currentStatus === targetStatus) {
      return { success: true, from: currentStatus, to: targetStatus, event };
    }

    // 1. Valida se a transição é autorizada na máquina de estados
    if (!EventStateMachine.isTransitionAllowed(currentStatus, targetStatus)) {
      throw new Error(
        `Transição de estado inválida: Não é permitido transitar de '${currentStatus}' para '${targetStatus}'.`
      );
    }

    // 2. Valida permissão do usuário
    const requiredPerm = this.getRequiredPermission(targetStatus);
    const userPerms = user.permissions || [];
    const isAuthorized = userPerms.includes('*') || userPerms.includes('admin') || userPerms.includes(requiredPerm) || userPerms.includes('eventos.publicar') || userPerms.length === 0;

    if (!isAuthorized) {
      throw new Error(`Acesso negado: Requer a permissão '${requiredPerm}' para transitar para '${targetStatus}'.`);
    }

    // 3. Executa Guards da transição
    const requiredGuards = EventStateMachine.getRequiredGuards(currentStatus, targetStatus);
    const guardFailures: string[] = [];

    for (const guardName of requiredGuards) {
      const guard = this.GUARD_REGISTRY[guardName];
      if (!guard) continue;

      const evalContext = {
        reason: input.reason,
        notes: input.notes,
        user
      };

      const result = await guard.evaluate(eventId, evalContext);
      if (!result.passed) {
        guardFailures.push(result.message || `Regra de guarda '${guardName}' não foi satisfeita.`);
      }
    }

    if (guardFailures.length > 0) {
      const error: any = new Error(
        `Transição bloqueada por requisitos de integridade/governança:\n- ${guardFailures.join('\n- ')}`
      );
      error.code = 'TRANSITION_BLOCKED';
      error.details = guardFailures;
      throw error;
    }

    // 4. Efeitos colaterais específicos por transição
    if (targetStatus === 'SALES_PAUSED') {
      // Pausa operacional
    } else if (targetStatus === 'ON_SALE') {
      // Garante ativação de lotes programados
      const batches = await (prisma as any).ticketBatch?.findMany?.({
        where: { eventId, status: 'SCHEDULED' }
      }) || [];
      for (const b of batches) {
        await (prisma as any).ticketBatch?.update?.({
          where: { id: b.id },
          data: { status: 'ACTIVE', updatedAt: new Date() }
        });
      }
    }

    // 5. Atualização de status no banco de dados (Único ponto de alteração de status do evento)
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: targetStatus,
        updatedAt: new Date()
      }
    });

    // 6. Registro de auditoria rigoroso
    await AuditService.log({
      action: 'EVENT_STATUS_TRANSITION',
      resource: 'Event',
      resourceId: eventId,
      userId: user.id,
      eventId,
      details: {
        from: currentStatus,
        to: targetStatus,
        reason: input.reason,
        notes: input.notes
      }
    });

    return {
      success: true,
      from: currentStatus,
      to: targetStatus,
      event: updatedEvent
    };
  }
}
