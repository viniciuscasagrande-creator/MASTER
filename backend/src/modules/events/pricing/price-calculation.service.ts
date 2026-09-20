import { FeeComponentDTO, PriceSimulationInput, PriceSimulationResult } from '@shared/types/index';
import { RoundingUtil } from './money/rounding-policy';

export class PriceCalculationService {
  /**
   * Calcula taxas e totais para comprador e produtor de forma exata em centavos
   */
  static calculate(
    basePriceInCents: number,
    salePriceInCents?: number,
    feeComponents: FeeComponentDTO[] = [],
    quantity: number = 1,
    discountInCents: number = 0
  ): PriceSimulationResult {
    const effectiveSalePrice = salePriceInCents !== undefined ? salePriceInCents : basePriceInCents;
    const subtotal = effectiveSalePrice * quantity;
    const discountedSubtotal = Math.max(0, subtotal - discountInCents);

    let totalBuyerFee = 0;
    let totalProducerFee = 0;
    const feeBreakdown: PriceSimulationResult['feeBreakdown'] = [];

    for (const fee of feeComponents) {
      let rawFee = 0;
      if (fee.type === 'PERCENTAGE') {
        rawFee = Math.round((discountedSubtotal * fee.value) / 100);
      } else {
        rawFee = Math.round(fee.value * quantity);
      }

      if (fee.minFeeInCents !== undefined && fee.minFeeInCents !== null) {
        rawFee = Math.max(rawFee, fee.minFeeInCents * quantity);
      }
      if (fee.maxFeeInCents !== undefined && fee.maxFeeInCents !== null) {
        rawFee = Math.min(rawFee, fee.maxFeeInCents * quantity);
      }

      if (fee.payer === 'BUYER') {
        totalBuyerFee += rawFee;
        feeBreakdown.push({
          name: fee.name,
          payer: 'BUYER',
          amountInCents: rawFee,
          percentageApplied: fee.type === 'PERCENTAGE' ? fee.value : undefined
        });
      } else if (fee.payer === 'PRODUCER') {
        totalProducerFee += rawFee;
        feeBreakdown.push({
          name: fee.name,
          payer: 'PRODUCER',
          amountInCents: rawFee,
          percentageApplied: fee.type === 'PERCENTAGE' ? fee.value : undefined
        });
      } else if (fee.payer === 'SPLIT') {
        const prodPct = fee.producerSharePercentage ?? 50;
        const producerPart = Math.round((rawFee * prodPct) / 100);
        const buyerPart = rawFee - producerPart;

        totalBuyerFee += buyerPart;
        totalProducerFee += producerPart;

        feeBreakdown.push({
          name: `${fee.name} (Comprador)`,
          payer: 'BUYER',
          amountInCents: buyerPart
        });
        feeBreakdown.push({
          name: `${fee.name} (Produtor)`,
          payer: 'PRODUCER',
          amountInCents: producerPart
        });
      }
    }

    const buyerTotalInCents = discountedSubtotal + totalBuyerFee;
    const producerNetInCents = Math.max(0, discountedSubtotal - totalProducerFee);

    return {
      basePriceInCents,
      salePriceInCents: effectiveSalePrice,
      quantity,
      subtotalInCents: subtotal,
      discountInCents,
      buyerFeeInCents: totalBuyerFee,
      producerFeeInCents: totalProducerFee,
      buyerTotalInCents,
      producerNetInCents,
      feeBreakdown
    };
  }

  /**
   * Simula preço e detalhamento a partir de dados de entrada
   */
  static simulate(input: PriceSimulationInput): PriceSimulationResult {
    return this.calculate(
      input.basePriceInCents,
      input.salePriceInCents,
      input.feeComponents || [],
      input.quantity || 1,
      input.discountInCents || 0
    );
  }
}
