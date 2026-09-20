import { prisma } from '../../../core/database/prisma';
import {
  PricingMatrixDTO,
  PricingMatrixCellDTO,
  SavePriceConfigurationInput,
  BulkPricingUpdateInput,
  BulkPricingUpdateResult,
  PriceConfigurationDTO
} from '@shared/types/index';
import { PriceCalculationService } from './price-calculation.service';
import { RoundingUtil } from './money/rounding-policy';

export class PricingMatrixService {
  /**
   * Constrói a Matriz de Preços (Setores x Tipos de Ingresso) para um lote específico
   */
  static async getMatrix(eventId: string, batchId: string): Promise<PricingMatrixDTO> {
    const batch = await prisma.ticketBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error('Lote não encontrado');

    const sections = await prisma.eventSection.findMany({
      where: { eventId, enabled: true }
    });

    const ticketTypes = await prisma.eventTicketType.findMany({
      where: { eventId, active: true }
    });

    const existingConfigs = await prisma.priceConfiguration.findMany({
      where: { ticketBatchId: batchId },
      include: { feeComponents: true }
    });

    const cells: Record<string, PricingMatrixCellDTO> = {};

    for (const sec of sections) {
      for (const tt of ticketTypes) {
        const key = `${sec.id}_${tt.id}`;
        const match = existingConfigs.find(
          (c: any) => c.eventSectionId === sec.id && c.eventTicketTypeId === tt.id
        );

        if (match) {
          const fees = match.feeComponents || [];
          const calc = PriceCalculationService.calculate(
            match.basePriceInCents,
            match.salePriceInCents,
            fees
          );

          cells[key] = {
            sectionId: sec.id,
            ticketTypeId: tt.id,
            priceConfigId: match.id,
            basePriceInCents: match.basePriceInCents,
            salePriceInCents: match.salePriceInCents,
            buyerTotalInCents: calc.buyerTotalInCents,
            producerNetInCents: calc.producerNetInCents,
            active: match.active ?? true,
            feeComponents: fees
          };
        } else {
          cells[key] = {
            sectionId: sec.id,
            ticketTypeId: tt.id,
            basePriceInCents: 0,
            salePriceInCents: 0,
            buyerTotalInCents: 0,
            producerNetInCents: 0,
            active: false
          };
        }
      }
    }

    return {
      batchId: batch.id,
      batchName: batch.name,
      sections: sections.map((s: any) => ({
        id: s.id,
        name: s.name,
        capacity: s.capacity
      })),
      ticketTypes: ticketTypes.map((t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category
      })),
      cells
    };
  }

  /**
   * Salva ou atualiza a configuração de preço de uma célula individual
   */
  static async savePriceConfig(input: SavePriceConfigurationInput): Promise<PriceConfigurationDTO> {
    const salePrice = input.salePriceInCents !== undefined ? input.salePriceInCents : input.basePriceInCents;

    const upserted = await prisma.priceConfiguration.upsert({
      where: {
        ticketBatchId_eventSectionId_eventTicketTypeId: {
          ticketBatchId: input.ticketBatchId,
          eventSectionId: input.eventSectionId,
          eventTicketTypeId: input.eventTicketTypeId
        }
      },
      update: {
        basePriceInCents: input.basePriceInCents,
        salePriceInCents: salePrice,
        active: input.active ?? true
      },
      create: {
        ticketBatchId: input.ticketBatchId,
        eventSectionId: input.eventSectionId,
        eventTicketTypeId: input.eventTicketTypeId,
        basePriceInCents: input.basePriceInCents,
        salePriceInCents: salePrice,
        active: input.active ?? true
      }
    });

    if (input.feeComponents !== undefined) {
      await prisma.feeComponent.deleteMany({ where: { priceConfigurationId: upserted.id } });
      for (const fee of input.feeComponents) {
        await prisma.feeComponent.create({
          data: {
            priceConfigurationId: upserted.id,
            name: fee.name,
            type: fee.type,
            value: fee.value,
            payer: fee.payer || 'BUYER',
            producerSharePercentage: fee.producerSharePercentage,
            minFeeInCents: fee.minFeeInCents,
            maxFeeInCents: fee.maxFeeInCents,
            taxDeductible: fee.taxDeductible ?? false
          }
        });
      }
    }

    const fees = await prisma.feeComponent.findMany({ where: { priceConfigurationId: upserted.id } });
    const calc = PriceCalculationService.calculate(upserted.basePriceInCents, upserted.salePriceInCents, fees);

    const sec = await prisma.eventSection.findUnique({ where: { id: upserted.eventSectionId } });
    const tt = await prisma.eventTicketType.findUnique({ where: { id: upserted.eventTicketTypeId } });
    const batch = await prisma.ticketBatch.findUnique({ where: { id: upserted.ticketBatchId } });

    return {
      id: upserted.id,
      ticketBatchId: upserted.ticketBatchId,
      eventSectionId: upserted.eventSectionId,
      eventTicketTypeId: upserted.eventTicketTypeId,
      basePriceInCents: upserted.basePriceInCents,
      salePriceInCents: upserted.salePriceInCents,
      active: upserted.active,
      sectionName: sec?.name,
      ticketTypeName: tt?.name,
      batchName: batch?.name,
      feeComponents: fees,
      calculatedBuyerFeeInCents: calc.buyerFeeInCents,
      calculatedBuyerTotalInCents: calc.buyerTotalInCents,
      calculatedProducerNetInCents: calc.producerNetInCents,
      createdAt: upserted.createdAt ? new Date(upserted.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: upserted.updatedAt ? new Date(upserted.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  /**
   * Atualização em massa com simulação/preview antes de aplicar
   */
  static async bulkUpdate(eventId: string, input: BulkPricingUpdateInput): Promise<BulkPricingUpdateResult> {
    const matrix = await this.getMatrix(eventId, input.batchId);
    const preview: BulkPricingUpdateResult['preview'] = [];

    const targetSecIds = input.targetSectionIds && input.targetSectionIds.length > 0
      ? input.targetSectionIds
      : matrix.sections.map(s => s.id);

    const targetTtIds = input.targetTicketTypeIds && input.targetTicketTypeIds.length > 0
      ? input.targetTicketTypeIds
      : matrix.ticketTypes.map(t => t.id);

    for (const sec of matrix.sections) {
      if (!targetSecIds.includes(sec.id)) continue;

      for (const tt of matrix.ticketTypes) {
        if (!targetTtIds.includes(tt.id)) continue;

        const key = `${sec.id}_${tt.id}`;
        const currentCell = matrix.cells[key];
        const oldPrice = currentCell ? currentCell.basePriceInCents : 0;

        let newPrice = oldPrice;
        switch (input.operation) {
          case 'SET_VALUE':
            newPrice = input.value;
            break;
          case 'INCREASE_PERCENTAGE':
            newPrice = Math.round(oldPrice * (1 + (input.value / 100)));
            break;
          case 'DECREASE_PERCENTAGE':
            newPrice = Math.max(0, Math.round(oldPrice * (1 - (input.value / 100))));
            break;
          case 'INCREASE_FIXED':
            newPrice = oldPrice + input.value;
            break;
          case 'DECREASE_FIXED':
            newPrice = Math.max(0, oldPrice - input.value);
            break;
        }

        // Aplica política de arredondamento
        newPrice = RoundingUtil.apply(newPrice, input.roundingPolicy || 'NONE');

        const fees = currentCell?.feeComponents || [];
        const oldCalc = PriceCalculationService.calculate(oldPrice, oldPrice, fees);
        const newCalc = PriceCalculationService.calculate(newPrice, newPrice, fees);

        preview.push({
          sectionId: sec.id,
          sectionName: sec.name,
          ticketTypeId: tt.id,
          ticketTypeName: tt.name,
          oldPriceInCents: oldPrice,
          newPriceInCents: newPrice,
          oldBuyerTotalInCents: oldCalc.buyerTotalInCents,
          newBuyerTotalInCents: newCalc.buyerTotalInCents
        });

        // Se NÃO for simulação (dryRun = false), persiste
        if (!input.dryRun) {
          await this.savePriceConfig({
            ticketBatchId: input.batchId,
            eventSectionId: sec.id,
            eventTicketTypeId: tt.id,
            basePriceInCents: newPrice,
            salePriceInCents: newPrice,
            active: true,
            feeComponents: fees
          });
        }
      }
    }

    return {
      updatedCount: preview.length,
      preview
    };
  }

  /**
   * Copia todas as configurações de preços de um lote para outro
   */
  static async copyFromBatch(fromBatchId: string, toBatchId: string): Promise<number> {
    const sourceConfigs = await prisma.priceConfiguration.findMany({
      where: { ticketBatchId: fromBatchId },
      include: { feeComponents: true }
    });

    for (const src of sourceConfigs) {
      await this.savePriceConfig({
        ticketBatchId: toBatchId,
        eventSectionId: src.eventSectionId,
        eventTicketTypeId: src.eventTicketTypeId,
        basePriceInCents: src.basePriceInCents,
        salePriceInCents: src.salePriceInCents,
        active: src.active,
        feeComponents: src.feeComponents || []
      });
    }

    return sourceConfigs.length;
  }
}
