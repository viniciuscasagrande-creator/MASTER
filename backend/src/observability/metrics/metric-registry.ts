/**
 * MetricRegistry - Registro Central de Métricas Operacionais
 * Previne cardinalidade explosiva validando labels permitidas (evitando IDs de usuários, pedidos, etc.)
 */

export interface MetricDefinition {
  name: string;
  help: string;
  type: 'COUNTER' | 'GAUGE' | 'HISTOGRAM';
  allowedLabels: string[];
}

export class MetricRegistry {
  private static readonly FORBIDDEN_LABEL_KEYS: RegExp[] = [
    /userid/i,
    /user_id/i,
    /orderid/i,
    /order_id/i,
    /ticketid/i,
    /customerid/i,
    /sessionid/i,
    /token/i,
    /cpf/i,
    /email/i
  ];

  private static metrics: Map<string, MetricDefinition> = new Map([
    ['requests_total', { name: 'requests_total', help: 'Total de requisições HTTP recebidas', type: 'COUNTER', allowedLabels: ['method', 'route', 'status', 'module'] }],
    ['request_duration_ms', { name: 'request_duration_ms', help: 'Duração das requisições em milissegundos', type: 'HISTOGRAM', allowedLabels: ['method', 'route', 'module'] }],
    ['active_requests', { name: 'active_requests', help: 'Requisições HTTP em processamento simultâneo', type: 'GAUGE', allowedLabels: ['module'] }],
    ['slow_queries_total', { name: 'slow_queries_total', help: 'Total de queries lentas no banco de dados', type: 'COUNTER', allowedLabels: ['module', 'operation'] }],
    ['queue_jobs_waiting', { name: 'queue_jobs_waiting', help: 'Quantidade de jobs aguardando em fila', type: 'GAUGE', allowedLabels: ['queue_name'] }],
    ['queue_jobs_failed_total', { name: 'queue_jobs_failed_total', help: 'Total de jobs falhos em fila', type: 'COUNTER', allowedLabels: ['queue_name'] }],
    ['workers_active', { name: 'workers_active', help: 'Total de workers em execução ativa', type: 'GAUGE', allowedLabels: ['worker_type'] }],
    ['websocket_connections_active', { name: 'websocket_connections_active', help: 'Conexões WebSocket ativas', type: 'GAUGE', allowedLabels: ['status'] }]
  ]);

  private static metricValues: Map<string, { value: number; labels?: Record<string, string>; timestamp: number }[]> = new Map();

  /**
   * Valida se os rótulos passados não contêm chaves de alta cardinalidade proibidas
   */
  public static validateLabels(labels?: Record<string, string>): boolean {
    if (!labels) return true;

    for (const key of Object.keys(labels)) {
      if (this.FORBIDDEN_LABEL_KEYS.some(regex => regex.test(key))) {
        throw new Error(`Cardinalidade explosiva rejeitada: o rótulo '${key}' não é permitido em métricas.`);
      }
    }
    return true;
  }

  /**
   * Registra incremento de métrica
   */
  public static increment(name: string, value: number = 1, labels?: Record<string, string>): void {
    this.validateLabels(labels);

    const values = this.metricValues.get(name) || [];
    values.push({ value, labels, timestamp: Date.now() });
    this.metricValues.set(name, values);
  }

  /**
   * Define valor absoluto para Gauge ou Histograma
   */
  public static setGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.validateLabels(labels);

    const values = this.metricValues.get(name) || [];
    values.push({ value, labels, timestamp: Date.now() });
    this.metricValues.set(name, values);
  }

  /**
   * Obtém os valores coletados de uma métrica
   */
  public static getValues(name: string): { value: number; labels?: Record<string, string>; timestamp: number }[] {
    return this.metricValues.get(name) || [];
  }

  /**
   * Limpa métricas antigas (reset)
   */
  public static clear(): void {
    this.metricValues.clear();
  }
}
