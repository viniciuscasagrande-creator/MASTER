import { AnalyticsQuery, FilterDefinition } from '@shared/types/index';
import { MetricRegistry } from './metric.registry';
import { DimensionRegistry } from './dimension.registry';

export interface ValidatedExecutionPlan {
  query: AnalyticsQuery;
  resolvedMetrics: Array<{
    code: string;
    name: string;
    format: string;
    domain: string;
    formula: string;
    requiredPermission?: string | null;
    isSensitive?: boolean;
  }>;
  resolvedDimensions: Array<{
    code: string;
    name: string;
    type: string;
  }>;
  dateRange: {
    startDate: Date;
    endDate: Date;
    timezone: string;
  };
  hasSensitiveData: boolean;
}

export type ValidatedMetric = ValidatedExecutionPlan['resolvedMetrics'][number];
export type ValidatedDimension = ValidatedExecutionPlan['resolvedDimensions'][number];

export class QueryBuilderService {
  private metricRegistry: MetricRegistry;
  private dimensionRegistry: DimensionRegistry;

  constructor() {
    this.metricRegistry = MetricRegistry.getInstance();
    this.dimensionRegistry = DimensionRegistry.getInstance();
  }

  public validateAndBuildPlan(query: AnalyticsQuery): ValidatedExecutionPlan {
    // 1. Validate Metrics presence
    if (!query.metrics || query.metrics.length === 0) {
      throw new Error('Consulta analítica inválida: Pelo menos uma métrica oficial deve ser informada.');
    }

    const resolvedMetrics: ValidatedMetric[] = [];
    let hasSensitiveData = false;

    for (const code of query.metrics) {
      const metric = this.metricRegistry.getMetric(code);
      if (!metric) {
        throw new Error(`Métrica não cadastrada ou não autorizada no catálogo oficial: "${code}"`);
      }

      if (metric.isSensitive) {
        hasSensitiveData = true;
      }

      resolvedMetrics.push({
        code: metric.code,
        name: metric.name,
        format: metric.format,
        domain: metric.domain,
        formula: metric.formula,
        requiredPermission: metric.requiredPermission,
        isSensitive: metric.isSensitive
      });
    }

    // 2. Validate Dimensions presence and validity
    const resolvedDimensions: ValidatedDimension[] = [];
    if (query.dimensions && query.dimensions.length > 0) {
      for (const dimCode of query.dimensions) {
        const dim = this.dimensionRegistry.getDimension(dimCode);
        if (!dim) {
          throw new Error(`Dimensão analítica inválida ou desconhecida: "${dimCode}"`);
        }
        resolvedDimensions.push({
          code: dim.code,
          name: dim.name,
          type: dim.type
        });
      }
    }

    // 3. Resolve Period and Timezone
    const timezone = query.period?.timezone || 'America/Sao_Paulo';
    const dateRange = this.resolveDateRange(query.period, timezone);

    // 4. Validate Filters for SQL injection safety (declarative operators only)
    if (query.filters && query.filters.length > 0) {
      this.validateFilters(query.filters);
    }

    return {
      query,
      resolvedMetrics,
      resolvedDimensions,
      dateRange,
      hasSensitiveData
    };
  }

  private validateFilters(filters: FilterDefinition[]): void {
    const allowedOperators = ['EQUALS', 'NOT_EQUALS', 'IN', 'NOT_IN', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN'];

    for (const f of filters) {
      if (!f.field || typeof f.field !== 'string') {
        throw new Error('Filtro inválido: campo de filtro deve ser string.');
      }
      if (!allowedOperators.includes(f.operator)) {
        throw new Error(`Operador de filtro inválido: "${f.operator}". Apenas operadores declarativos são permitidos.`);
      }
      // Rejeitar tentativas de injeção de SQL arbitrário ou caracteres proibidos
      if (/[;'"\\]|--|\/\*/.test(f.field)) {
        throw new Error(`Tentativa de injeção: Nome de campo de filtro suspeito ou inválido: "${f.field}"`);
      }
      if (typeof f.value === 'string' && /[;]|--|\/\*/.test(f.value)) {
        throw new Error(`Tentativa de injeção: Valor suspeito no filtro "${f.field}": "${f.value}"`);
      }
    }
  }

  public resolveDateRange(
    period: AnalyticsQuery['period'],
    timezone: string
  ): { startDate: Date; endDate: Date; timezone: string } {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    const type = period?.type || 'LAST_30_DAYS';

    switch (type) {
      case 'TODAY':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'YESTERDAY':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case 'LAST_7_DAYS':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'LAST_30_DAYS':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'THIS_MONTH':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        endDate = now;
        break;
      case 'LAST_MONTH':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'THIS_YEAR':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        endDate = now;
        break;
      case 'CUSTOM':
        if (period.startDate && period.endDate) {
          startDate = new Date(period.startDate);
          endDate = new Date(period.endDate);
        } else {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          endDate = now;
        }
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    return { startDate, endDate, timezone };
  }
}
