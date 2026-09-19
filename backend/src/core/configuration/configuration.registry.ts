import { ConfigValueType, ConfigSensitivity, ConfigScopeType } from './configuration.types';
import { AppError } from '../errors/AppError';

export interface RegistryDefinition {
  key: string;
  domain: string;
  name: string;
  description?: string;
  type: ConfigValueType;
  unit?: string | null;
  defaultValue: any;
  allowedValues?: any[] | null;
  validationSchema?: any;
  sensitivity: ConfigSensitivity;
  allowedScopes: ConfigScopeType[];
  requiresApproval: boolean;
}

export class ConfigurationRegistry {
  private static definitions: Map<string, RegistryDefinition> = new Map();

  static {
    // Standard Registry Initialization
    this.register({
      key: 'finance.transfer.enabled',
      domain: 'FINANCE',
      name: 'Habilitar Transferências entre Eventos',
      description: 'Permite operações de transferência de saldo entre eventos',
      type: 'BOOLEAN',
      defaultValue: true,
      sensitivity: 'INTERNAL',
      allowedScopes: ['GLOBAL', 'PRODUCER', 'EVENT'],
      requiresApproval: false
    });

    this.register({
      key: 'finance.transfer.minimum_balance',
      domain: 'FINANCE',
      name: 'Saldo Mínimo de Segurança',
      description: 'Saldo de reserva obrigatório retido no evento',
      type: 'CURRENCY',
      unit: 'BRL',
      defaultValue: 5000,
      validationSchema: { min: 0 },
      sensitivity: 'INTERNAL',
      allowedScopes: ['GLOBAL', 'PRODUCER', 'EVENT'],
      requiresApproval: false
    });

    this.register({
      key: 'finance.transfer.approval.threshold',
      domain: 'FINANCE',
      name: 'Limite para Dupla Aprovação de Transferência',
      description: 'Valores acima deste patamar exigem duas validações',
      type: 'CURRENCY',
      unit: 'BRL',
      defaultValue: 50000,
      validationSchema: { min: 0 },
      sensitivity: 'SENSITIVE',
      allowedScopes: ['GLOBAL', 'PRODUCER', 'EVENT'],
      requiresApproval: true
    });

    this.register({
      key: 'finance.transfer.requires_approval',
      domain: 'FINANCE',
      name: 'Exigir Aprovação para Transferência',
      description: 'Determina se transferências requerem aprovação',
      type: 'BOOLEAN',
      defaultValue: true,
      sensitivity: 'INTERNAL',
      allowedScopes: ['GLOBAL', 'PRODUCER', 'EVENT'],
      requiresApproval: false
    });

    this.register({
      key: 'refund.approval.required',
      domain: 'REFUNDS',
      name: 'Exigir Aprovação para Estorno',
      description: 'Determina se estornos requerem validação manual',
      type: 'BOOLEAN',
      defaultValue: true,
      sensitivity: 'INTERNAL',
      allowedScopes: ['GLOBAL', 'PRODUCER', 'EVENT'],
      requiresApproval: false
    });

    this.register({
      key: 'refund.max_days_allowed',
      domain: 'REFUNDS',
      name: 'Prazo Máximo para Solicitação de Estorno',
      description: 'Dias corridos permitidos para solicitar estorno',
      type: 'INTEGER',
      unit: 'DAYS',
      defaultValue: 7,
      validationSchema: { min: 1, max: 90 },
      sensitivity: 'PUBLIC',
      allowedScopes: ['GLOBAL', 'PRODUCER', 'EVENT'],
      requiresApproval: false
    });

    this.register({
      key: 'sac.first_response.sla',
      domain: 'SAC',
      name: 'SLA de Primeira Resposta no SAC',
      description: 'Tempo máximo para o primeiro contato ao cliente',
      type: 'DURATION',
      unit: 'MINUTES',
      defaultValue: 60,
      validationSchema: { min: 5, max: 1440 },
      sensitivity: 'INTERNAL',
      allowedScopes: ['GLOBAL', 'PRODUCER', 'EVENT'],
      requiresApproval: false
    });

    this.register({
      key: 'task.auto_assignment.strategy',
      domain: 'TASKS',
      name: 'Estratégia de Atribuição Automática de Tarefas',
      description: 'Algoritmo para roteamento operacional de tarefas',
      type: 'ENUM',
      defaultValue: 'WORKLOAD',
      allowedValues: ['WORKLOAD', 'DUTY', 'ROUND_ROBIN'],
      sensitivity: 'INTERNAL',
      allowedScopes: ['GLOBAL', 'PRODUCER', 'EVENT'],
      requiresApproval: false
    });

    this.register({
      key: 'security.two_factor.required',
      domain: 'SECURITY',
      name: 'Exigir Autenticação em 2 Etapas (2FA)',
      description: 'Obriga 2FA para operadores do sistema',
      type: 'BOOLEAN',
      defaultValue: false,
      sensitivity: 'SENSITIVE',
      allowedScopes: ['GLOBAL', 'PRODUCER', 'EVENT'],
      requiresApproval: true
    });

    this.register({
      key: 'security.session.duration_minutes',
      domain: 'SECURITY',
      name: 'Duração Máxima da Sessão',
      description: 'Tempo de expiração de token de sessão',
      type: 'DURATION',
      unit: 'MINUTES',
      defaultValue: 1440,
      validationSchema: { min: 15, max: 10080 },
      sensitivity: 'INTERNAL',
      allowedScopes: ['GLOBAL'],
      requiresApproval: false
    });

    this.register({
      key: 'document.upload.max_size_mb',
      domain: 'DOCUMENTS',
      name: 'Tamanho Máximo de Upload',
      description: 'Limite de arquivo em megabytes',
      type: 'INTEGER',
      unit: 'MB',
      defaultValue: 25,
      validationSchema: { min: 1, max: 500 },
      sensitivity: 'INTERNAL',
      allowedScopes: ['GLOBAL', 'PRODUCER'],
      requiresApproval: false
    });

    this.register({
      key: 'integration.retry.max_attempts',
      domain: 'INTEGRATIONS',
      name: 'Tentativas Máximas de Retry em Integrações',
      description: 'Número de tentativas automáticas em falhas de webhook/APIs',
      type: 'INTEGER',
      defaultValue: 3,
      validationSchema: { min: 0, max: 10 },
      sensitivity: 'INTERNAL',
      allowedScopes: ['GLOBAL'],
      requiresApproval: false
    });

    this.register({
      key: 'document.storage.provider',
      domain: 'DOCUMENTS',
      name: 'Provedor de Armazenamento de Arquivos',
      description: 'Destino de armazenamento de anexos e documentos',
      type: 'ENUM',
      defaultValue: 'LOCAL',
      allowedValues: ['LOCAL', 'S3', 'AZURE_BLOB', 'GCS'],
      sensitivity: 'SENSITIVE',
      allowedScopes: ['GLOBAL'],
      requiresApproval: true
    });
  }

  public static register(definition: RegistryDefinition): void {
    this.definitions.set(definition.key, definition);
  }

  public static get(key: string): RegistryDefinition | undefined {
    return this.definitions.get(key);
  }

  public static has(key: string): boolean {
    return this.definitions.has(key);
  }

  public static list(): RegistryDefinition[] {
    return Array.from(this.definitions.values());
  }

  public static listByDomain(domain: string): RegistryDefinition[] {
    const d = domain.toUpperCase();
    return Array.from(this.definitions.values()).filter(def => def.domain.toUpperCase() === d);
  }

  /**
   * Strongly type & validate value against definition
   */
  public static validateValue(key: string, value: any): any {
    const def = this.get(key);
    if (!def) {
      throw new AppError(`Chave de configuração desconhecida: "${key}".`, 400);
    }

    let parsedValue = value;

    switch (def.type) {
      case 'BOOLEAN': {
        if (typeof value === 'boolean') {
          parsedValue = value;
        } else if (value === 'true' || value === 1 || value === '1') {
          parsedValue = true;
        } else if (value === 'false' || value === 0 || value === '0') {
          parsedValue = false;
        } else {
          throw new AppError(`Valor inválido para "${key}". Esperado um booleano (true/false).`, 400);
        }
        break;
      }

      case 'INTEGER': {
        const num = Number(value);
        if (!Number.isInteger(num)) {
          throw new AppError(`Valor inválido para "${key}". Esperado um número inteiro.`, 400);
        }
        if (def.validationSchema?.min !== undefined && num < def.validationSchema.min) {
          throw new AppError(`Valor para "${key}" não pode ser menor que ${def.validationSchema.min}.`, 400);
        }
        if (def.validationSchema?.max !== undefined && num > def.validationSchema.max) {
          throw new AppError(`Valor para "${key}" não pode ser maior que ${def.validationSchema.max}.`, 400);
        }
        parsedValue = num;
        break;
      }

      case 'DECIMAL':
      case 'CURRENCY':
      case 'PERCENTAGE': {
        const num = Number(value);
        if (isNaN(num)) {
          throw new AppError(`Valor numérico inválido para "${key}".`, 400);
        }
        if (def.type === 'PERCENTAGE' && (num < 0 || num > 100)) {
          throw new AppError(`Percentual para "${key}" deve estar entre 0% e 100%.`, 400);
        }
        if (def.validationSchema?.min !== undefined && num < def.validationSchema.min) {
          throw new AppError(`Valor para "${key}" não pode ser menor que ${def.validationSchema.min}.`, 400);
        }
        if (def.validationSchema?.max !== undefined && num > def.validationSchema.max) {
          throw new AppError(`Valor para "${key}" não pode ser maior que ${def.validationSchema.max}.`, 400);
        }
        parsedValue = num;
        break;
      }

      case 'DURATION': {
        const num = Number(value);
        if (isNaN(num) || num < 0) {
          throw new AppError(`Duração inválida para "${key}". Esperado número positivo.`, 400);
        }
        if (def.validationSchema?.min !== undefined && num < def.validationSchema.min) {
          throw new AppError(`Duração mínima permitida para "${key}" é ${def.validationSchema.min} ${def.unit || ''}.`, 400);
        }
        if (def.validationSchema?.max !== undefined && num > def.validationSchema.max) {
          throw new AppError(`Duração máxima permitida para "${key}" é ${def.validationSchema.max} ${def.unit || ''}.`, 400);
        }
        parsedValue = num;
        break;
      }

      case 'ENUM': {
        const allowed = def.allowedValues || [];
        if (!allowed.includes(value)) {
          throw new AppError(
            `Valor "${value}" não permitido para "${key}". Valores permitidos: [${allowed.join(', ')}].`,
            400
          );
        }
        parsedValue = value;
        break;
      }

      case 'STRING': {
        if (typeof value !== 'string') {
          throw new AppError(`Valor inválido para "${key}". Esperado texto.`, 400);
        }
        parsedValue = value.trim();
        break;
      }

      case 'JSON_SCHEMA': {
        if (typeof value === 'string') {
          try {
            parsedValue = JSON.parse(value);
          } catch {
            throw new AppError(`Formato JSON inválido para "${key}".`, 400);
          }
        }
        break;
      }

      default:
        parsedValue = value;
    }

    return parsedValue;
  }
}
