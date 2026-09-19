import { AnalyticsQuery, AnalyticsResult, MetricDefinition, DimensionDefinition } from '@shared/types/index';
import { QueryBuilderService } from './query-builder.service';
import { MetricRegistry } from './metric.registry';
import { DimensionRegistry } from './dimension.registry';
import { AnalyticsCacheService } from './analytics-cache.service';
import { AnalyticsProvider, PostgreSQLAnalyticsProvider } from './analytics.provider';
import { AnalyticsAuthorizationService } from '../security/analytics-authorization.service';
import { FieldSecurityService } from '../security/field-security.service';

export class AnalyticsService {
  private queryBuilder: QueryBuilderService;
  private metricRegistry: MetricRegistry;
  private dimensionRegistry: DimensionRegistry;
  private cacheService: AnalyticsCacheService;
  private provider: AnalyticsProvider;
  private authService: AnalyticsAuthorizationService;
  private fieldSecurity: FieldSecurityService;

  constructor(provider?: AnalyticsProvider) {
    this.queryBuilder = new QueryBuilderService();
    this.metricRegistry = MetricRegistry.getInstance();
    this.dimensionRegistry = DimensionRegistry.getInstance();
    this.cacheService = new AnalyticsCacheService();
    this.provider = provider || new PostgreSQLAnalyticsProvider();
    this.authService = new AnalyticsAuthorizationService();
    this.fieldSecurity = new FieldSecurityService();
  }

  public async executeQuery(query: AnalyticsQuery, user: any): Promise<AnalyticsResult> {
    // 1. Build and validate execution plan (Rejects arbitrary SQL / invalid metrics)
    const plan = this.queryBuilder.validateAndBuildPlan(query);

    // 2. Authorize query by RBAC and Scope (Producer/Event)
    this.authService.authorizeQuery(plan, user);

    // 3. Check Cache
    const cacheKey = this.cacheService.generateCacheKey(query, {
      roleSlug: user?.roleSlug,
      scopeType: user?.scope?.type
    });

    const cachedResult = this.cacheService.get(cacheKey);
    if (cachedResult) {
      return this.fieldSecurity.sanitizeResult(cachedResult, plan, user);
    }

    // 4. Execute via Analytics Provider
    const result = await this.provider.query(plan);

    // 5. Cache result before user-specific sanitization
    const domains = plan.resolvedMetrics.map(m => m.domain);
    this.cacheService.set(cacheKey, result, domains);

    // 6. Sanitize result according to Field Security
    return this.fieldSecurity.sanitizeResult(result, plan, user);
  }

  public getMetricsCatalog(user?: any): MetricDefinition[] {
    const all = this.metricRegistry.getAllMetrics();
    if (!user || user.roleSlug === 'admin_geral' || user.isSuperAdmin) {
      return all;
    }

    const permissions: string[] = user.permissions || [];
    return all.filter(m => !m.requiredPermission || permissions.includes(m.requiredPermission));
  }

  public getMetricDetails(code: string): MetricDefinition | undefined {
    return this.metricRegistry.getMetric(code);
  }

  public getDimensionsCatalog(): DimensionDefinition[] {
    return this.dimensionRegistry.getAllDimensions();
  }

  public explainMetric(code: string): { metric: MetricDefinition; calculationExplanation: string } {
    const metric = this.metricRegistry.getMetric(code);
    if (!metric) {
      throw new Error(`Métrica não encontrada no catálogo: "${code}"`);
    }

    const explanation = `O indicador "${metric.name}" (${metric.code}) pertence ao domínio ${metric.domain}. ` +
      `Sua fórmula oficial de cálculo é: ${metric.formula}. ` +
      `Fonte de dados original: ${metric.source}. ` +
      `Frequência de atualização: ${metric.updateFrequency}. ` +
      `Responsável pela governança: ${metric.responsible}.`;

    return {
      metric,
      calculationExplanation: explanation
    };
  }

  public invalidateCache(eventType: string): number {
    return this.cacheService.invalidateOnEvent(eventType);
  }

  public getCacheStats(): any {
    return this.cacheService.getStats();
  }

  public clearCache(): void {
    this.cacheService.clear();
  }
}
