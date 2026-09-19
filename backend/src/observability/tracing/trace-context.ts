import { AsyncLocalStorage } from 'async_hooks';
import crypto from 'crypto';
import { RequestContextData } from './trace.types';

export class TraceContext {
  private static asyncLocalStorage = new AsyncLocalStorage<RequestContextData>();

  /**
   * Gera um Correlation ID no padrão COR-YYYYMMDD-XXXXXX
   */
  public static generateCorrelationId(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `COR-${yyyy}${mm}${dd}-${rand}`;
  }

  /**
   * Gera um Request ID no padrão REQ-XXXXXX
   */
  public static generateRequestId(): string {
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `REQ-${rand}`;
  }

  /**
   * Executa uma função dentro do contexto assíncrono isolado
   */
  public static runWithContext<T>(context: RequestContextData, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }

  /**
   * Obtém o contexto atual da requisição
   */
  public static getContext(): RequestContextData | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Obtém o Correlation ID ativo ou gera um novo caso ausente
   */
  public static getCorrelationId(): string {
    const ctx = this.getContext();
    return ctx?.correlationId || this.generateCorrelationId();
  }

  /**
   * Obtém o Request ID ativo ou gera um novo caso ausente
   */
  public static getRequestId(): string {
    const ctx = this.getContext();
    return ctx?.requestId || this.generateRequestId();
  }
}
