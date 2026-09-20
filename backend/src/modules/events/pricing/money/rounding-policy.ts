export type RoundingPolicy = 'NONE' | 'ROUND_UP_INT' | 'ROUND_NEAREST_TEN' | 'ROUND_CENTS_99';

export class RoundingUtil {
  /**
   * Aplica política de arredondamento sobre um valor em centavos
   */
  static apply(amountInCents: number, policy: RoundingPolicy = 'NONE'): number {
    switch (policy) {
      case 'ROUND_UP_INT': {
        // Arredonda para cima no próximo real cheio (múltiplo de 100 centavos)
        return Math.ceil(amountInCents / 100) * 100;
      }
      case 'ROUND_NEAREST_TEN': {
        // Arredonda para os 10 centavos mais próximos
        return Math.round(amountInCents / 10) * 10;
      }
      case 'ROUND_CENTS_99': {
        // Formato promocional: X reais e 99 centavos (ex: R$ 99,99)
        const reais = Math.floor(amountInCents / 100);
        return (reais * 100) + 99;
      }
      case 'NONE':
      default:
        return Math.round(amountInCents);
    }
  }
}
