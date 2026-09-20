import { ContractEffectiveTermsService } from './effective-terms.service';
import { EffectiveCommercialTermsDTO } from '../../../../../../shared/types';

/**
 * Provedor de Condições Contratuais Efetivas para integração com outros módulos (Financeiro, Borderô, Eventos).
 * Garante que o Comercial administra os contratos, e o Financeiro apenas consulta os termos aplicáveis.
 */
export class ContractTermsProvider {
  /**
   * Obtém as taxas e termos comerciais vigentes para o produtor na data de ocorrência da transação ou fechamento de borderô.
   */
  public static async getTermsForProducer(
    producerId: string,
    atDate: Date = new Date(),
    context?: { eventId?: string }
  ): Promise<EffectiveCommercialTermsDTO | null> {
    return ContractEffectiveTermsService.getEffectiveTerms(producerId, atDate);
  }
}
