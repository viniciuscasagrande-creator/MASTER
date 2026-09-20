import { prisma } from '../../../core/database/prisma';
import { CreateInventoryBlockInput, InventoryBlockDTO } from '@shared/types/index';

export class InventoryBlockService {
  /**
   * Cria um bloqueio administrativo de inventário (reserva técnica, segurança, etc.)
   */
  static async createBlock(
    poolId: string,
    input: CreateInventoryBlockInput,
    userId?: string
  ): Promise<InventoryBlockDTO> {
    const pool = await prisma.inventoryPool.findUnique({ where: { id: poolId } });
    if (!pool) {
      throw new Error('Pool de inventário não encontrado');
    }

    const available = pool.capacity - (pool.reserved + pool.blocked + pool.held + pool.sold);
    if (available < input.quantity) {
      const err: any = new Error(
        `Capacidade disponível insuficiente para este bloqueio. Disponível: ${Math.max(0, available)}, Solicitado: ${input.quantity}`
      );
      err.statusCode = 400;
      throw err;
    }

    const block = await prisma.inventoryBlock.create({
      data: {
        inventoryPoolId: poolId,
        reason: input.reason,
        quantity: input.quantity,
        notes: input.notes,
        active: true,
        createdByUserId: userId
      }
    });

    // Atualiza o total de bloqueios no pool
    await prisma.inventoryPool.update({
      where: { id: poolId },
      data: {
        blocked: pool.blocked + input.quantity
      }
    });

    return {
      id: block.id,
      inventoryPoolId: block.inventoryPoolId,
      reason: block.reason as any,
      quantity: block.quantity,
      notes: block.notes,
      active: block.active,
      createdByUserId: block.createdByUserId,
      createdAt: block.createdAt ? new Date(block.createdAt).toISOString() : new Date().toISOString()
    };
  }

  /**
   * Libera ou remove um bloqueio existente
   */
  static async releaseBlock(blockId: string): Promise<void> {
    const block = await prisma.inventoryBlock.findUnique({ where: { id: blockId } });
    if (!block || !block.active) return;

    await prisma.inventoryBlock.update({
      where: { id: blockId },
      data: { active: false }
    });

    const pool = await prisma.inventoryPool.findUnique({ where: { id: block.inventoryPoolId } });
    if (pool) {
      await prisma.inventoryPool.update({
        where: { id: pool.id },
        data: {
          blocked: Math.max(0, pool.blocked - block.quantity)
        }
      });
    }
  }
}
