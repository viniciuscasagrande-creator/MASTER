import { DimensionDefinition } from '@shared/types/index';

export class DimensionRegistry {
  private static instance: DimensionRegistry;
  private dimensions: Map<string, DimensionDefinition> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): DimensionRegistry {
    if (!DimensionRegistry.instance) {
      DimensionRegistry.instance = new DimensionRegistry();
    }
    return DimensionRegistry.instance;
  }

  private registerDefaults(): void {
    const defaultDimensions: DimensionDefinition[] = [
      {
        id: 'dim-01',
        code: 'time',
        name: 'Período / Tempo',
        type: 'DATE',
        description: 'Agrupamento temporal por Dia, Semana, Mês ou Ano.',
        options: ['hour', 'day', 'week', 'month', 'year']
      },
      {
        id: 'dim-02',
        code: 'producer',
        name: 'Produtor / Empresa',
        type: 'ENTITY',
        description: 'Entidade jurídica proprietária ou organizadora dos eventos.'
      },
      {
        id: 'dim-03',
        code: 'event',
        name: 'Evento',
        type: 'ENTITY',
        description: 'Espetáculo, festival ou atração cadastrada na plataforma.'
      },
      {
        id: 'dim-04',
        code: 'session',
        name: 'Sessão / Horário',
        type: 'ENTITY',
        description: 'Apresentação ou data específica de realização do evento.'
      },
      {
        id: 'dim-05',
        code: 'channel',
        name: 'Canal de Venda',
        type: 'ENUM',
        description: 'Meio de comercialização e aquisição do ingresso.',
        options: ['SITE', 'APP', 'PDV_FISICO', 'BILHETERIA', 'CORTESIA', 'CONSIGNADO']
      },
      {
        id: 'dim-06',
        code: 'payment_method',
        name: 'Forma de Pagamento',
        type: 'ENUM',
        description: 'Instrumento financeiro utilizado na liquidação.',
        options: ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO', 'VOUCHER']
      },
      {
        id: 'dim-07',
        code: 'gateway',
        name: 'Adquirente / Gateway',
        type: 'ENUM',
        description: 'Processador de pagamento e conectividade bancária.',
        options: ['CIELO', 'PAGAR_ME', 'ITAU', 'MERCADO_PAGO']
      },
      {
        id: 'dim-08',
        code: 'status',
        name: 'Status da Operação',
        type: 'ENUM',
        description: 'Estado da transação, pedido ou chamado.',
        options: ['PAID', 'PENDING', 'CANCELLED', 'REFUNDED', 'DISPUTED']
      },
      {
        id: 'dim-09',
        code: 'sector',
        name: 'Setor / Área',
        type: 'STRING',
        description: 'Divisão física da casa de espetáculos (ex: Pista Premium, Camarote, Balcão).'
      },
      {
        id: 'dim-10',
        code: 'lot',
        name: 'Lote de Venda',
        type: 'STRING',
        description: 'Etapa comercial de precificação do lote.'
      },
      {
        id: 'dim-11',
        code: 'campaign',
        name: 'Campanha de Marketing',
        type: 'STRING',
        description: 'Nome da campanha ou identificador UTM da mídia de atração.'
      },
      {
        id: 'dim-12',
        code: 'team',
        name: 'Equipe / Setor',
        type: 'ENTITY',
        description: 'Departamento responsável pelo atendimento ou fluxo.'
      },
      {
        id: 'dim-13',
        code: 'user',
        name: 'Usuário / Operador',
        type: 'ENTITY',
        description: 'Identificador do atendente, bilheteiro ou analista que realizou a ação.'
      }
    ];

    for (const dim of defaultDimensions) {
      this.dimensions.set(dim.code, dim);
    }
  }

  public getDimension(code: string): DimensionDefinition | undefined {
    return this.dimensions.get(code);
  }

  public getAllDimensions(): DimensionDefinition[] {
    return Array.from(this.dimensions.values());
  }
}
