import {
  ImportDefinition,
  ImportType,
  ImportColumnDefinition,
  DuplicateStrategy,
  AtomicityPolicy,
  ScopeType
} from '@shared/types/index';

export class ImportTypeRegistry {
  private static registry: Map<ImportType, ImportDefinition> = new Map();

  static {
    // 1. CUSTOMERS
    this.register({
      type: 'CUSTOMERS',
      name: 'Clientes',
      description: 'Importação de base de clientes, compradores e titulares',
      module: 'SAC',
      requiredPermission: 'dados.importacao.criar',
      allowedScopes: ['GLOBAL', 'PRODUCER'],
      templateVersion: 3,
      atomicityPolicy: 'PARTIAL',
      defaultDuplicateStrategy: 'UPDATE',
      allowedDuplicateStrategies: ['IGNORE', 'UPDATE', 'CREATE_NEW', 'MANUAL_DECISION'],
      protectedFields: [
        'id', 'balance', 'creditLimit', 'roleSlug', 'permissions', 'passwordHash',
        'isInternalStaff', 'financialStatus', 'accountingStatus'
      ],
      columns: [
        { name: 'name', label: 'Nome do Cliente', required: true, type: 'STRING', aliases: ['nome', 'nome_cliente', 'cliente', 'razao_social'], example: 'João da Silva' },
        { name: 'cpf', label: 'CPF', required: true, type: 'DOCUMENT', aliases: ['documento', 'cpf_cliente', 'doc', 'cpf_cnpj'], isSensitive: true, example: '123.456.789-00' },
        { name: 'email', label: 'E-mail', required: true, type: 'EMAIL', aliases: ['mail', 'e_mail', 'email_cliente'], example: 'joao@email.com' },
        { name: 'phone', label: 'Telefone', required: false, type: 'PHONE', aliases: ['fone', 'celular', 'whatsapp', 'tel'], example: '(41) 99999-8888' },
        { name: 'city', label: 'Cidade', required: false, type: 'STRING', aliases: ['municipio'], example: 'Curitiba' },
        { name: 'state', label: 'UF / Estado', required: false, type: 'STRING', aliases: ['uf', 'estado'], example: 'PR' },
        { name: 'birthDate', label: 'Data de Nascimento', required: false, type: 'DATE', aliases: ['nascimento', 'data_nasc'], example: '15/05/1990' }
      ]
    });

    // 2. EVENT_PARTICIPANTS
    this.register({
      type: 'EVENT_PARTICIPANTS',
      name: 'Participantes de Evento',
      description: 'Importação de lista de convidados, portadores e cortesias para eventos',
      module: 'EVENTOS',
      requiredPermission: 'dados.importacao.criar',
      allowedScopes: ['PRODUCER', 'EVENT'],
      templateVersion: 2,
      atomicityPolicy: 'PARTIAL',
      defaultDuplicateStrategy: 'IGNORE',
      allowedDuplicateStrategies: ['IGNORE', 'UPDATE', 'BLOCK'],
      protectedFields: ['id', 'checkinStatus', 'orderId', 'qrCodeSecret'],
      columns: [
        { name: 'name', label: 'Nome do Participante', required: true, type: 'STRING', aliases: ['nome', 'convidado', 'titular'], example: 'Maria Santos' },
        { name: 'document', label: 'Documento / CPF', required: true, type: 'DOCUMENT', aliases: ['cpf', 'rg', 'doc'], example: '987.654.321-99' },
        { name: 'email', label: 'E-mail', required: false, type: 'EMAIL', aliases: ['mail'], example: 'maria@empresa.com' },
        { name: 'phone', label: 'Telefone / WhatsApp', required: false, type: 'PHONE', aliases: ['celular', 'fone'], example: '(11) 98888-7777' },
        { name: 'sector', label: 'Setor / Área', required: true, type: 'STRING', aliases: ['setor', 'area', 'setor_ingresso'], example: 'Camarote VIP' },
        { name: 'category', label: 'Tipo / Categoria', required: false, type: 'STRING', aliases: ['tipo', 'categoria', 'tipo_ingresso'], example: 'Cortesia Patrocinador' }
      ]
    });

    // 3. SUPPLIERS
    this.register({
      type: 'SUPPLIERS',
      name: 'Fornecedores',
      description: 'Cadastro de fornecedores, credores e prestadores de serviços de eventos',
      module: 'FINANCEIRO',
      requiredPermission: 'dados.importacao.criar',
      allowedScopes: ['GLOBAL', 'PRODUCER'],
      templateVersion: 2,
      atomicityPolicy: 'PARTIAL',
      defaultDuplicateStrategy: 'UPDATE',
      allowedDuplicateStrategies: ['IGNORE', 'UPDATE', 'BLOCK'],
      protectedFields: ['id', 'verifiedStatus', 'totalPaid'],
      columns: [
        { name: 'corporateName', label: 'Razão Social / Nome', required: true, type: 'STRING', aliases: ['razao_social', 'nome', 'fornecedor'], example: 'Iluminação & Som Curitiba LTDA' },
        { name: 'cnpj', label: 'CNPJ / CPF', required: true, type: 'DOCUMENT', aliases: ['documento', 'cnpj_fornecedor'], example: '12.345.678/0001-90' },
        { name: 'email', label: 'E-mail Financeiro', required: true, type: 'EMAIL', aliases: ['mail', 'contato_email'], example: 'financeiro@iluminacao.com.br' },
        { name: 'phone', label: 'Telefone Comercial', required: false, type: 'PHONE', aliases: ['fone', 'telefone'], example: '(41) 3333-4444' },
        { name: 'bankCode', label: 'Código do Banco', required: true, type: 'STRING', aliases: ['banco', 'num_banco'], example: '341' },
        { name: 'branch', label: 'Agência Bancária', required: true, type: 'STRING', aliases: ['agencia', 'ag'], example: '0001' },
        { name: 'accountNumber', label: 'Conta Corrente', required: true, type: 'STRING', aliases: ['conta', 'conta_corrente'], example: '12345-6' },
        { name: 'pixKey', label: 'Chave Pix', required: false, type: 'STRING', aliases: ['pix', 'chave_pix'], example: 'financeiro@iluminacao.com.br' }
      ]
    });

    // 4. ACCOUNTS_PAYABLE
    this.register({
      type: 'ACCOUNTS_PAYABLE',
      name: 'Contas a Pagar',
      description: 'Importação de títulos e compromissos financeiros a liquidar',
      module: 'FINANCEIRO',
      requiredPermission: 'dados.importacao.criar',
      allowedScopes: ['GLOBAL', 'PRODUCER'],
      templateVersion: 1,
      atomicityPolicy: 'ALL_OR_NOTHING', // Financial is strict
      defaultDuplicateStrategy: 'BLOCK',
      allowedDuplicateStrategies: ['IGNORE', 'BLOCK'],
      requiresApprovalThreshold: 10000, // Above R$ 10.000 requires Approval Engine
      protectedFields: ['id', 'paymentStatus', 'paidAt', 'paidAmount', 'voucherId'],
      columns: [
        { name: 'supplierDocument', label: 'CNPJ/CPF Fornecedor', required: true, type: 'DOCUMENT', aliases: ['cnpj', 'fornecedor_doc'], example: '12.345.678/0001-90' },
        { name: 'description', label: 'Descrição da Despesa', required: true, type: 'STRING', aliases: ['historico', 'descricao'], example: 'Locação Gerador de Energia' },
        { name: 'amount', label: 'Valor Nominal (R$)', required: true, type: 'CURRENCY', aliases: ['valor', 'total'], example: '4500.00' },
        { name: 'dueDate', label: 'Data de Vencimento', required: true, type: 'DATE', aliases: ['vencimento', 'data_vencimento'], example: '25/09/2026' },
        { name: 'costCenter', label: 'Centro de Custo', required: true, type: 'STRING', aliases: ['centro_custo', 'ccusto'], example: 'PRODUCAO_INFRA' },
        { name: 'category', label: 'Categoria Financeira', required: false, type: 'STRING', aliases: ['categoria', 'plano_contas'], example: 'Infraestrutura Técnica' }
      ]
    });

    // 5. ACCOUNTS_RECEIVABLE
    this.register({
      type: 'ACCOUNTS_RECEIVABLE',
      name: 'Contas a Receber',
      description: 'Previsões e direitos a receber de patrocínios, cotas e parceiros',
      module: 'FINANCEIRO',
      requiredPermission: 'dados.importacao.criar',
      allowedScopes: ['GLOBAL', 'PRODUCER'],
      templateVersion: 1,
      atomicityPolicy: 'PARTIAL',
      defaultDuplicateStrategy: 'BLOCK',
      allowedDuplicateStrategies: ['IGNORE', 'BLOCK'],
      requiresApprovalThreshold: 25000,
      protectedFields: ['id', 'receivedStatus', 'receivedAt', 'settlementBatchId'],
      columns: [
        { name: 'debtorDocument', label: 'CNPJ/CPF Sacado', required: true, type: 'DOCUMENT', aliases: ['cnpj', 'cliente_doc', 'devedor'], example: '99.888.777/0001-11' },
        { name: 'description', label: 'Título / Descrição', required: true, type: 'STRING', aliases: ['descricao', 'contrato'], example: 'Cota de Patrocínio Ouro Lote 1' },
        { name: 'amount', label: 'Valor a Receber (R$)', required: true, type: 'CURRENCY', aliases: ['valor'], example: '50000.00' },
        { name: 'dueDate', label: 'Data de Vencimento', required: true, type: 'DATE', aliases: ['vencimento'], example: '30/09/2026' }
      ]
    });

    // 6. FINANCIAL_TRANSACTIONS
    this.register({
      type: 'FINANCIAL_TRANSACTIONS',
      name: 'Movimentações Financeiras',
      description: 'Extratos, lançamentos de tarifas e movimentações bancárias para conciliação',
      module: 'FINANCEIRO',
      requiredPermission: 'dados.importacao.criar',
      allowedScopes: ['GLOBAL'],
      templateVersion: 1,
      atomicityPolicy: 'ALL_OR_NOTHING',
      defaultDuplicateStrategy: 'BLOCK',
      allowedDuplicateStrategies: ['BLOCK'],
      requiresApprovalThreshold: 50000,
      protectedFields: ['id', 'reconciledStatus', 'ledgerEntryId'],
      columns: [
        { name: 'transactionDate', label: 'Data da Operação', required: true, type: 'DATE', aliases: ['data', 'data_mov'], example: '18/09/2026' },
        { name: 'type', label: 'Tipo (DÉBITO/CRÉDITO)', required: true, type: 'ENUM', allowedValues: ['DEBIT', 'CREDIT', 'DEBITO', 'CREDITO'], aliases: ['tipo_mov', 'dc'], example: 'CREDIT' },
        { name: 'amount', label: 'Valor da Movimentação (R$)', required: true, type: 'CURRENCY', aliases: ['valor'], example: '18450.20' },
        { name: 'description', label: 'Histórico / Descrição', required: true, type: 'STRING', aliases: ['historico'], example: 'Crédito Adquirente Cielo Lote #891' },
        { name: 'bankAccount', label: 'Identificador Conta / Banco', required: true, type: 'STRING', aliases: ['conta', 'banco'], example: 'ITAU_CONTA_PRINCIPAL' }
      ]
    });

    // 7. MARKETING_CONTACTS
    this.register({
      type: 'MARKETING_CONTACTS',
      name: 'Contatos de Marketing',
      description: 'Audiências para campanhas (LGPD: dados de contato separados do consentimento)',
      module: 'MARKETING',
      requiredPermission: 'dados.importacao.criar',
      allowedScopes: ['GLOBAL', 'PRODUCER'],
      templateVersion: 2,
      atomicityPolicy: 'PARTIAL',
      defaultDuplicateStrategy: 'UPDATE',
      allowedDuplicateStrategies: ['IGNORE', 'UPDATE', 'CREATE_NEW'],
      protectedFields: ['id', 'lgpdConsentGranted', 'unsubscribedAt', 'suppressionList'],
      columns: [
        { name: 'name', label: 'Nome do Contato', required: true, type: 'STRING', aliases: ['nome'], example: 'Camila Rocha' },
        { name: 'phone', label: 'WhatsApp / Telefone', required: true, type: 'PHONE', aliases: ['whatsapp', 'celular', 'fone'], example: '(41) 99111-2222' },
        { name: 'email', label: 'E-mail', required: false, type: 'EMAIL', aliases: ['mail'], example: 'camila@email.com' },
        { name: 'tags', label: 'Tags / Interesses', required: false, type: 'STRING', aliases: ['segmento', 'interesses', 'tags'], example: 'Festival, Rock, VIP' }
      ]
    });

    // 8. LEGACY_ORDERS
    this.register({
      type: 'LEGACY_ORDERS',
      name: 'Pedidos Históricos (Legado)',
      description: 'Migração de pedidos e vendas de plataformas e bilheterias antigas',
      module: 'EVENTOS',
      requiredPermission: 'dados.migracao.criar',
      allowedScopes: ['GLOBAL', 'PRODUCER'],
      templateVersion: 1,
      atomicityPolicy: 'CHUNK_ATOMIC',
      defaultDuplicateStrategy: 'BLOCK',
      allowedDuplicateStrategies: ['IGNORE', 'BLOCK'],
      requiresApprovalThreshold: 100000,
      protectedFields: ['id', 'orderToken', 'settlementBatchId', 'disputeStatus'],
      columns: [
        { name: 'legacyId', label: 'ID Pedido Sistema Antigo', required: true, type: 'STRING', aliases: ['id_antigo', 'id_pedido_antigo', 'codigo_legado'], example: 'ORD-2023-8891' },
        { name: 'customerDocument', label: 'CPF Comprador', required: true, type: 'DOCUMENT', aliases: ['cpf', 'doc_cliente'], example: '111.222.333-44' },
        { name: 'customerName', label: 'Nome Comprador', required: true, type: 'STRING', aliases: ['nome_cliente', 'comprador'], example: 'Roberto Carlos' },
        { name: 'totalAmount', label: 'Valor Total Pago (R$)', required: true, type: 'CURRENCY', aliases: ['valor_total', 'total'], example: '350.00' },
        { name: 'status', label: 'Status da Venda', required: true, type: 'ENUM', allowedValues: ['PAID', 'REFUNDED', 'CANCELLED'], aliases: ['status_pedido'], example: 'PAID' },
        { name: 'paymentMethod', label: 'Forma de Pagamento', required: false, type: 'STRING', aliases: ['forma_pagamento', 'meio'], example: 'PIX' },
        { name: 'orderDate', label: 'Data do Pedido', required: true, type: 'DATE', aliases: ['data_venda', 'data'], example: '10/08/2025 14:30' }
      ]
    });
  }

  public static register(definition: ImportDefinition): void {
    this.registry.set(definition.type, definition);
  }

  public static get(type: ImportType): ImportDefinition | undefined {
    return this.registry.get(type);
  }

  public static getAll(): ImportDefinition[] {
    return Array.from(this.registry.values());
  }

  public static getTypes(): ImportType[] {
    return Array.from(this.registry.keys());
  }
}
