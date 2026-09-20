import { prisma } from '../../../core/database/prisma';

export interface PlatformFeatureDefinition {
  code: string;
  name: string;
  category: 'PLATFORM' | 'ACCESS' | 'MARKETING' | 'BOX_OFFICE' | 'REPORTS' | 'FINANCE';
  description: string;
  defaultLimitType?: 'COUNT' | 'MAX_VALUE' | 'VOLUME' | 'BOOLEAN_FLAG';
  defaultLimitKey?: string;
  defaultLimitValue?: number;
  defaultLimitUnit?: string;
}

export const PLATFORM_FEATURES: PlatformFeatureDefinition[] = [
  {
    code: 'feature.events.unlimited_events',
    name: 'Criação Ilimitada de Eventos',
    category: 'PLATFORM',
    description: 'Permite criar eventos sem restrição numérica de publicações ativas',
    defaultLimitType: 'BOOLEAN_FLAG',
    defaultLimitValue: 1,
    defaultLimitUnit: 'BOOLEAN'
  },
  {
    code: 'feature.events.max_active_events',
    name: 'Limite de Eventos Ativos Simultâneos',
    category: 'PLATFORM',
    description: 'Determina o número máximo de eventos em venda simultaneamente',
    defaultLimitType: 'COUNT',
    defaultLimitKey: 'events.active_max',
    defaultLimitValue: 5,
    defaultLimitUnit: 'EVENTS'
  },
  {
    code: 'feature.access.offline_validator',
    name: 'Validação Offline de Ingressos',
    category: 'ACCESS',
    description: 'Permite sincronização segura e operação de coletores de portaria sem conexão contínua',
    defaultLimitType: 'COUNT',
    defaultLimitKey: 'devices.offline_max',
    defaultLimitValue: 10,
    defaultLimitUnit: 'DEVICES'
  },
  {
    code: 'feature.access.facial_biometrics',
    name: 'Validação por Biometria Facial',
    category: 'ACCESS',
    description: 'Catracas e módulos com reconhecimento facial anti-fraude',
    defaultLimitType: 'BOOLEAN_FLAG',
    defaultLimitValue: 1,
    defaultLimitUnit: 'BOOLEAN'
  },
  {
    code: 'feature.boxoffice.pos_terminals',
    name: 'Terminais de Venda PDV e Caixa Físico',
    category: 'BOX_OFFICE',
    description: 'Emissão e venda presencial de ingressos em pontos de venda físicos',
    defaultLimitType: 'COUNT',
    defaultLimitKey: 'boxoffice.terminals_max',
    defaultLimitValue: 3,
    defaultLimitUnit: 'TERMINALS'
  },
  {
    code: 'feature.boxoffice.cash_control',
    name: 'Controle de Caixa Cego e Sangria',
    category: 'BOX_OFFICE',
    description: 'Módulo de auditoria para fechamento de caixa cego e conferência de valores',
    defaultLimitType: 'BOOLEAN_FLAG',
    defaultLimitValue: 1,
    defaultLimitUnit: 'BOOLEAN'
  },
  {
    code: 'feature.marketing.boost_email',
    name: 'Disparo de Campanhas de E-mail',
    category: 'MARKETING',
    description: 'Disparos promocionais e comunicados para compradores segmentados',
    defaultLimitType: 'VOLUME',
    defaultLimitKey: 'marketing.emails_monthly_max',
    defaultLimitValue: 50000,
    defaultLimitUnit: 'EMAILS'
  },
  {
    code: 'feature.marketing.pixel_tracking',
    name: 'Pixels de Rastreamento Meta e Google',
    category: 'MARKETING',
    description: 'Configuração customizada de eventos de conversão e rastreamento de anúncios',
    defaultLimitType: 'BOOLEAN_FLAG',
    defaultLimitValue: 1,
    defaultLimitUnit: 'BOOLEAN'
  },
  {
    code: 'feature.reports.advanced_analytics',
    name: 'Bordero e Analytics em Tempo Real',
    category: 'REPORTS',
    description: 'Acesso a relatórios avançados de retenção, ticket médio, canais e mapas de calor',
    defaultLimitType: 'BOOLEAN_FLAG',
    defaultLimitValue: 1,
    defaultLimitUnit: 'BOOLEAN'
  },
  {
    code: 'feature.reports.financial_dreports',
    name: 'Relatórios Fiscais e Repasse Automático',
    category: 'FINANCE',
    description: 'Conciliação bancária diária e borderô analítico de taxas e splits',
    defaultLimitType: 'BOOLEAN_FLAG',
    defaultLimitValue: 1,
    defaultLimitUnit: 'BOOLEAN'
  }
];

export class FeatureRegistry {
  public static getAll(): PlatformFeatureDefinition[] {
    return [...PLATFORM_FEATURES];
  }

  public static getByCode(code: string): PlatformFeatureDefinition | undefined {
    return PLATFORM_FEATURES.find(f => f.code === code);
  }

  public static async ensureSyncWithDatabase(): Promise<void> {
    for (const feat of PLATFORM_FEATURES) {
      const existing = await prisma.commercialFeature.findUnique({
        where: { code: feat.code }
      });
      if (!existing) {
        await prisma.commercialFeature.create({
          data: {
            code: feat.code,
            name: feat.name,
            description: feat.description,
            category: feat.category,
            active: true
          }
        });
      }
    }
  }
}
