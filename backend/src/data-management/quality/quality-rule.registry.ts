import { DataQualityRule, DataQualityDimension } from '@shared/types/index';

export class QualityRuleRegistry {
  private static rules: Map<string, DataQualityRule> = new Map();

  static {
    this.registerDefaults();
  }

  public static register(rule: DataQualityRule): void {
    this.rules.set(rule.code, rule);
  }

  public static get(code: string): DataQualityRule | undefined {
    return this.rules.get(code);
  }

  public static getAll(): DataQualityRule[] {
    return Array.from(this.rules.values());
  }

  public static getByDimension(dimension: DataQualityDimension): DataQualityRule[] {
    return this.getAll().filter(r => r.dimension === dimension);
  }

  public static getByEntity(entity: string): DataQualityRule[] {
    return this.getAll().filter(r => r.entity === entity);
  }

  private static registerDefaults(): void {
    const defaultRules: DataQualityRule[] = [
      {
        id: 'qr-comp-01',
        code: 'FORNECEDOR_SEM_CONTA_BANCARIA',
        name: 'Fornecedor sem Dados Bancários',
        description: 'Fornecedor ativo cadastrado sem informações bancárias completas (chave PIX, agência ou conta)',
        dimension: 'COMPLETENESS',
        entity: 'SUPPLIERS',
        field: 'bankDetails',
        severity: 'WARNING',
        condition: 'bankDetails.pixKey IS NULL AND bankDetails.accountNumber IS NULL',
        recommendedAction: 'Preencher chave PIX ou dados bancários para liquidação.',
        active: true
      },
      {
        id: 'qr-comp-02',
        code: 'CLIENTE_SEM_CONTATO',
        name: 'Cliente sem Contato Válido',
        description: 'Cliente cadastrado sem e-mail ou telefone de contato',
        dimension: 'COMPLETENESS',
        entity: 'CUSTOMERS',
        field: 'email',
        severity: 'WARNING',
        condition: 'email IS NULL AND phone IS NULL',
        recommendedAction: 'Cadastrar pelo menos um e-mail ou telefone válido.',
        active: true
      },
      {
        id: 'qr-val-01',
        code: 'CPF_CNPJ_INVALIDO',
        name: 'CPF ou CNPJ com Dígito Verificador Inválido',
        description: 'Documento fiscal contendo formato ou checksum inválido pelo algoritmo Mod11',
        dimension: 'VALIDITY',
        entity: 'CUSTOMERS',
        field: 'document',
        severity: 'ERROR',
        condition: 'isValidMod11(document) = FALSE',
        recommendedAction: 'Corrigir os dígitos verificadores do documento.',
        active: true
      },
      {
        id: 'qr-val-02',
        code: 'EMAIL_FORMATO_INVALIDO',
        name: 'Formato de E-mail Inválido',
        description: 'E-mail do registro não cumpre especificação RFC 5322',
        dimension: 'VALIDITY',
        entity: 'CUSTOMERS',
        field: 'email',
        severity: 'WARNING',
        condition: 'email NOT REGEX RFC5322',
        recommendedAction: 'Corrigir formato de e-mail do cliente.',
        active: true
      },
      {
        id: 'qr-val-03',
        code: 'LANCAMENTO_VALOR_NEGATIVO',
        name: 'Lançamento Financeiro Não Positivo',
        description: 'Lançamento financeiro com valor monetário menor ou igual a zero',
        dimension: 'VALIDITY',
        entity: 'FINANCIAL_TRANSACTIONS',
        field: 'amount',
        severity: 'ERROR',
        condition: 'amount <= 0',
        recommendedAction: 'Corrigir valor monetário para montante estritamente positivo.',
        active: true
      },
      {
        id: 'qr-val-04',
        code: 'CONTATO_SEM_CONSENTIMENTO_LGPD',
        name: 'Contato de Marketing sem Consentimento LGPD',
        description: 'Contato de marketing ativo sem opt-in explícito ou base legal cadastrada',
        dimension: 'VALIDITY',
        entity: 'MARKETING_CONTACTS',
        field: 'optIn',
        severity: 'ERROR',
        condition: 'tags CONTAINS MARKETING AND optInConsent IS NULL',
        recommendedAction: 'Obter ou registrar consentimento LGPD explícito.',
        active: true
      },
      {
        id: 'qr-uniq-01',
        code: 'CLIENTE_DUPLICADO_DOCUMENTO',
        name: 'Clientes com Documento Duplicado',
        description: 'Mais de um cadastro de cliente compartilhando o mesmo CPF ou CNPJ',
        dimension: 'UNIQUENESS',
        entity: 'CUSTOMERS',
        field: 'document',
        severity: 'WARNING',
        condition: 'COUNT(document) > 1',
        recommendedAction: 'Executar plano de mesclagem para unificar cadastros.',
        active: true
      },
      {
        id: 'qr-cons-01',
        code: 'PEDIDO_SEM_INGRESSOS',
        name: 'Pedido Pago sem Itens de Ingresso',
        description: 'Pedido com status pago que não possui ingressos gerados ou vinculados',
        dimension: 'CONSISTENCY',
        entity: 'LEGACY_ORDERS',
        field: 'items',
        severity: 'CRITICAL',
        condition: 'status = PAID AND ticketsCount = 0',
        recommendedAction: 'Emitir ou reatribuir ingressos correspondentes ao pedido.',
        active: true
      },
      {
        id: 'qr-time-01',
        code: 'TRANSACAO_DATA_FUTURA_ANOMALA',
        name: 'Transação Financeira em Data Futura',
        description: 'Lançamento financeiro com data posterior à data atual de auditoria',
        dimension: 'TIMELINESS',
        entity: 'FINANCIAL_TRANSACTIONS',
        field: 'date',
        severity: 'WARNING',
        condition: 'date > CURRENT_TIMESTAMP',
        recommendedAction: 'Ajustar a data de competência da transação.',
        active: true
      },
      {
        id: 'qr-ref-01',
        code: 'INTEGRIDADE_EVENTO_INEXISTENTE',
        name: 'Vínculo com Evento Inexistente',
        description: 'Registro referenciando ID de evento que não existe na base multi-tenant',
        dimension: 'REFERENTIAL_INTEGRITY',
        entity: 'EVENT_PARTICIPANTS',
        field: 'eventId',
        severity: 'CRITICAL',
        condition: 'eventId NOT IN (SELECT id FROM events)',
        recommendedAction: 'Reatribuir registro para um evento válido.',
        active: true
      }
    ];

    for (const r of defaultRules) {
      this.rules.set(r.code, r);
    }
  }
}
