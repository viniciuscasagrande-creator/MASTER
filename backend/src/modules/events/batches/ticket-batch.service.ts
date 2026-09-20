import { prisma } from '../../../core/database/prisma';
import { CreateTicketBatchInput, UpdateTicketBatchInput, TicketBatchDTO, TicketBatchStatus } from '@shared/types/index';
import { BatchStateMachine } from './lifecycle/batch-state-machine';
import { BatchActivationService } from './activation/batch-activation.service';

export class TicketBatchService {
  /**
   * Lista todos os lotes do evento, ordenados por fase
   */
  static async listBatches(eventId: string): Promise<TicketBatchDTO[]> {
    // Reavalia regras automáticas antes da leitura
    await BatchActivationService.evaluateEventBatches(eventId);

    const batches = await prisma.ticketBatch.findMany({
      where: { eventId },
      include: { priceConfigurations: true }
    });

    return batches.map((b: any) => {
      const prev = batches.find((p: any) => p.id === b.previousBatchId);
      return {
        id: b.id,
        eventId: b.eventId,
        name: b.name,
        code: b.code,
        phase: b.phase,
        status: b.status as TicketBatchStatus,
        activationType: b.activationType,
        activationDate: b.activationDate ? new Date(b.activationDate).toISOString() : null,
        deactivationDate: b.deactivationDate ? new Date(b.deactivationDate).toISOString() : null,
        previousBatchId: b.previousBatchId,
        previousBatchName: prev?.name,
        triggerQuantity: b.triggerQuantity,
        totalQuantityLimit: b.totalQuantityLimit,
        soldCount: b.soldCount || 0,
        heldCount: b.heldCount || 0,
        pricesCount: (b.priceConfigurations || []).length,
        version: b.version,
        createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString()
      };
    });
  }

  /**
   * Busca detalhes de um lote por ID
   */
  static async getBatch(id: string): Promise<TicketBatchDTO | null> {
    const b = await prisma.ticketBatch.findUnique({
      where: { id },
      include: { priceConfigurations: true }
    });

    if (!b) return null;

    let prevName: string | undefined;
    if (b.previousBatchId) {
      const prev = await prisma.ticketBatch.findUnique({ where: { id: b.previousBatchId } });
      prevName = prev?.name;
    }

    return {
      id: b.id,
      eventId: b.eventId,
      name: b.name,
      code: b.code,
      phase: b.phase,
      status: b.status as TicketBatchStatus,
      activationType: b.activationType,
      activationDate: b.activationDate ? new Date(b.activationDate).toISOString() : null,
      deactivationDate: b.deactivationDate ? new Date(b.deactivationDate).toISOString() : null,
      previousBatchId: b.previousBatchId,
      previousBatchName: prevName,
      triggerQuantity: b.triggerQuantity,
      totalQuantityLimit: b.totalQuantityLimit,
      soldCount: b.soldCount || 0,
      heldCount: b.heldCount || 0,
      pricesCount: (b.priceConfigurations || []).length,
      version: b.version,
      createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  /**
   * Cria um novo lote para o evento
   */
  static async createBatch(eventId: string, input: CreateTicketBatchInput): Promise<TicketBatchDTO> {
    const existing = await prisma.ticketBatch.findMany({ where: { eventId } });
    const nextPhase = input.phase || (existing.length + 1);
    const code = input.code || `LOTE_${nextPhase}`;

    const created = await prisma.ticketBatch.create({
      data: {
        eventId,
        name: input.name,
        code,
        phase: nextPhase,
        status: 'DRAFT',
        activationType: input.activationType || 'MANUAL',
        activationDate: input.activationDate ? new Date(input.activationDate) : null,
        deactivationDate: input.deactivationDate ? new Date(input.deactivationDate) : null,
        previousBatchId: input.previousBatchId || null,
        triggerQuantity: input.triggerQuantity || null,
        totalQuantityLimit: input.totalQuantityLimit || null,
        soldCount: 0,
        heldCount: 0
      }
    });

    const full = await this.getBatch(created.id);
    return full!;
  }

  /**
   * Atualiza configurações do lote
   */
  static async updateBatch(id: string, input: UpdateTicketBatchInput): Promise<TicketBatchDTO> {
    const current = await prisma.ticketBatch.findUnique({ where: { id } });
    if (!current) throw new Error('Lote não encontrado');

    if (input.status && input.status !== current.status) {
      BatchStateMachine.validateTransition(current.status as TicketBatchStatus, input.status);
    }

    await prisma.ticketBatch.update({
      where: { id },
      data: {
        name: input.name,
        code: input.code,
        phase: input.phase,
        status: input.status,
        activationType: input.activationType,
        activationDate: input.activationDate ? new Date(input.activationDate) : undefined,
        deactivationDate: input.deactivationDate ? new Date(input.deactivationDate) : undefined,
        previousBatchId: input.previousBatchId,
        triggerQuantity: input.triggerQuantity,
        totalQuantityLimit: input.totalQuantityLimit
      }
    });

    const full = await this.getBatch(id);
    return full!;
  }

  /**
   * Altera status do lote com validação de máquina de estados
   */
  static async transitionStatus(id: string, targetStatus: TicketBatchStatus): Promise<TicketBatchDTO> {
    const current = await prisma.ticketBatch.findUnique({ where: { id } });
    if (!current) throw new Error('Lote não encontrado');

    BatchStateMachine.validateTransition(current.status as TicketBatchStatus, targetStatus);

    await prisma.ticketBatch.update({
      where: { id },
      data: { status: targetStatus }
    });

    // Se ativado, reavalia para pausar outros lotes ou ativar dependências
    await BatchActivationService.evaluateEventBatches(current.eventId);

    const full = await this.getBatch(id);
    return full!;
  }

  /**
   * Exclui lote (apenas se for DRAFT e sem vendas)
   */
  static async deleteBatch(id: string): Promise<void> {
    const current = await prisma.ticketBatch.findUnique({ where: { id } });
    if (!current) return;

    if (current.soldCount > 0) {
      const err: any = new Error('Não é possível excluir um lote que já possui vendas realizadas.');
      err.statusCode = 409;
      throw err;
    }

    await prisma.priceConfiguration.deleteMany({ where: { ticketBatchId: id } });
    await prisma.ticketBatch.delete({ where: { id } });
  }
}
