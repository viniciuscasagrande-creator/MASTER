import { prisma } from '../../../core/database/prisma';
import { EventChangeRequestDTO } from '@shared/types/index';
import { EventChangeImpactService } from './event-change-impact.service';
import { EventReviewService } from '../review/event-review.service';
import { AuditService } from '../../audit/audit.service';

export class EventChangeExecutionService {
  /**
   * Executa atomicamente a alteração aprovada aplicando-a ao modelo de domínio correspondente
   */
  static async executeChange(
    changeRequest: any,
    user: { id: string; name?: string }
  ): Promise<{ success: boolean; executedAt: string }> {
    // 1. Valida se a análise de impacto ficou obsoleta
    let impact: any = null;
    if (changeRequest.impactJson) {
      impact = typeof changeRequest.impactJson === 'string' ? JSON.parse(changeRequest.impactJson) : changeRequest.impactJson;
    }

    if (impact && (impact.snapshotHash || impact.impactHash)) {
      const staleCheck = await EventChangeImpactService.checkIsStale(
        changeRequest.eventId,
        impact,
        changeRequest.sessionId,
        { changeType: changeRequest.changeType, resourceType: changeRequest.resourceType, resourceId: changeRequest.resourceId }
      );

      if (staleCheck.isStale) {
        throw new Error(
          'EXECUÇÃO BLOQUEADA: A análise de impacto está desatualizada (novas vendas/reservas ocorreram desde a última análise). É obrigatório recalcular o impacto.'
        );
      }
    }

    // 2. Extrai o payload da mudança
    const payload = typeof changeRequest.payloadJson === 'string'
      ? JSON.parse(changeRequest.payloadJson)
      : changeRequest.payloadJson;

    const { changeType, resourceId, eventId } = changeRequest;

    // 3. Aplica no modelo de domínio respectivo
    switch (changeType) {
      case 'SECTION_CAPACITY': {
        const newCap = Number(payload.after);
        await prisma.eventSection.update({
          where: { id: resourceId },
          data: { capacity: newCap }
        });
        // Atualiza pool de inventário se existir
        const pool = await (prisma as any).inventoryPool?.findFirst?.({
          where: { sectionId: resourceId }
        });
        if (pool) {
          await (prisma as any).inventoryPool.update({
            where: { id: pool.id },
            data: { totalCapacity: newCap, available: Math.max(0, newCap - (pool.sold || 0) - (pool.reserved || 0)) }
          });
        }
        break;
      }

      case 'SECTION_NAME': {
        await prisma.eventSection.update({
          where: { id: resourceId },
          data: { name: String(payload.after) }
        });
        break;
      }

      case 'SESSION_DATE': {
        await prisma.eventSession.update({
          where: { id: resourceId },
          data: { sessionDate: new Date(payload.after) }
        });
        break;
      }

      case 'SESSION_STATUS': {
        await prisma.eventSession.update({
          where: { id: resourceId },
          data: { status: String(payload.after) }
        });
        break;
      }

      case 'BATCH_PRICE': {
        await (prisma as any).ticketBatch?.update?.({
          where: { id: resourceId },
          data: { price: Number(payload.after), updatedAt: new Date() }
        });
        break;
      }

      case 'BATCH_QUANTITY': {
        await (prisma as any).ticketBatch?.update?.({
          where: { id: resourceId },
          data: { totalQuantity: Number(payload.after), updatedAt: new Date() }
        });
        break;
      }

      case 'CHANNEL_STATUS': {
        await (prisma as any).salesChannelConfig?.update?.({
          where: { id: resourceId },
          data: { enabled: Boolean(payload.after) }
        });
        break;
      }

      case 'EVENT_INFO': {
        const updateData: any = {};
        updateData[payload.field] = payload.after;
        await prisma.event.update({
          where: { id: eventId },
          data: updateData
        });
        break;
      }

      default:
        // Caso genérico ou customizado
        break;
    }

    // 4. Se a alteração invalida a revisão, marca snapshot de revisão como inválido
    if (changeRequest.classification === 'REVIEW_INVALIDATING' || changeRequest.classification === 'PUBLICATION_CRITICAL') {
      await EventReviewService.invalidateSnapshot(
        eventId,
        `Alteração ${changeRequest.publicCode} (${changeType}) foi executada, exigindo nova revisão técnica.`
      );
    }

    const executedAt = new Date().toISOString();

    // 5. Atualiza registro de alteração
    await (prisma as any).eventChangeRequest.update({
      where: { id: changeRequest.id },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
        executedBy: user.id
      }
    });

    // 6. Auditoria imutável
    await AuditService.log({
      action: 'EVENT_CHANGE_REQUEST_EXECUTED',
      resource: 'EventChangeRequest',
      resourceId: changeRequest.id,
      userId: user.id,
      eventId,
      details: {
        publicCode: changeRequest.publicCode,
        eventId,
        changeType,
        payload
      }
    });

    return {
      success: true,
      executedAt
    };
  }
}
