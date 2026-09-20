import { prisma } from '../../../../core/database/prisma';
import { TicketBatchDTO } from '@shared/types/index';
import { BatchStateMachine } from '../lifecycle/batch-state-machine';

export class BatchActivationService {
  /**
   * Avalia e dispara ativações automáticas para os lotes de um evento
   */
  static async evaluateEventBatches(eventId: string): Promise<TicketBatchDTO[]> {
    const batches = await prisma.ticketBatch.findMany({
      where: { eventId }
    });

    const now = new Date();
    const updatedBatches: TicketBatchDTO[] = [];

    for (const batch of batches) {
      let shouldActivate = false;

      if (batch.status === 'SCHEDULED' || batch.status === 'DRAFT') {
        // Regra 1: Ativação por Data/Hora
        if (batch.activationType === 'DATE_TIME' && batch.activationDate) {
          if (new Date(batch.activationDate) <= now) {
            shouldActivate = true;
          }
        }

        // Regra 2: Ativação por Esgotamento do Lote Anterior
        if (batch.activationType === 'PREVIOUS_BATCH_SOLD_OUT' && batch.previousBatchId) {
          const prev = batches.find((b: any) => b.id === batch.previousBatchId);
          if (prev) {
            const isSoldOut = prev.status === 'SOLD_OUT' || (prev.totalQuantityLimit && prev.soldCount >= prev.totalQuantityLimit);
            if (isSoldOut) {
              shouldActivate = true;
            }
          }
        }

        // Regra 3: Ativação por Quantidade Atingida no Lote Anterior
        if (batch.activationType === 'PREVIOUS_BATCH_QUANTITY' && batch.previousBatchId && batch.triggerQuantity) {
          const prev = batches.find((b: any) => b.id === batch.previousBatchId);
          if (prev && (prev.soldCount || 0) >= batch.triggerQuantity) {
            shouldActivate = true;
          }
        }
      }

      // Regra 4: Desativação / Encerramento por Data Limite
      if (batch.status === 'ACTIVE' && batch.deactivationDate) {
        if (new Date(batch.deactivationDate) <= now) {
          BatchStateMachine.validateTransition(batch.status, 'ENDED');
          const updated = await prisma.ticketBatch.update({
            where: { id: batch.id },
            data: { status: 'ENDED' }
          });
          updatedBatches.push(updated as any);
          continue;
        }
      }

      // Regra 5: Marcação de SOLD_OUT quando limite for atingido
      if (batch.status === 'ACTIVE' && batch.totalQuantityLimit && (batch.soldCount || 0) >= batch.totalQuantityLimit) {
        BatchStateMachine.validateTransition(batch.status, 'SOLD_OUT');
        const updated = await prisma.ticketBatch.update({
          where: { id: batch.id },
          data: { status: 'SOLD_OUT' }
        });
        updatedBatches.push(updated as any);
        // Recursivamente reavalia se novos lotes engatilham
        await this.evaluateEventBatches(eventId);
        continue;
      }

      if (shouldActivate) {
        BatchStateMachine.validateTransition(batch.status, 'ACTIVE');
        const updated = await prisma.ticketBatch.update({
          where: { id: batch.id },
          data: { status: 'ACTIVE' }
        });
        updatedBatches.push(updated as any);
      }
    }

    return updatedBatches;
  }
}
