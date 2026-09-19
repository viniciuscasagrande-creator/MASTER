import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../../core/middleware/authenticate';

interface QueryRecord {
  timestamp: number;
  query: string;
}

export class AntiEnumerationService {
  private static userQueryHistory: Map<string, QueryRecord[]> = new Map();
  private static readonly CPF_WINDOW_MS = 60 * 1000; // 1 minute window
  private static readonly MAX_CPF_QUERIES_PER_MINUTE = 15;

  /**
   * Track CPF query and verify if rate threshold is violated
   */
  public static checkCpfQuery(
    user: AuthenticatedUser,
    cpf: string,
    ipAddress?: string
  ): { isAllowed: boolean; rateLimitWarning?: boolean } {
    if (user.isSuperAdmin) {
      return { isAllowed: true };
    }

    const now = Date.now();
    const key = `user_${user.id}`;
    let history = this.userQueryHistory.get(key) || [];

    // Purge records older than window
    history = history.filter(r => now - r.timestamp < this.CPF_WINDOW_MS);

    // Add current query
    history.push({ timestamp: now, query: cpf });
    this.userQueryHistory.set(key, history);

    if (history.length > this.MAX_CPF_QUERIES_PER_MINUTE) {
      // Record security audit event
      AuditService.log({
        userId: user.id,
        userName: user.name,
        action: 'SECURITY_SUSPICIOUS_CPF_ENUMERATION',
        resource: 'CUSTOMER_CPF',
        details: `Taxa anormal de consultas de CPF detectada (${history.length} consultas em 60s). Alerta de proteção disparado.`,
        ipAddress: ipAddress || '127.0.0.1',
        result: 'DENIED'
      });

      return {
        isAllowed: false,
        rateLimitWarning: true
      };
    }

    return { isAllowed: true };
  }

  /**
   * Reset records (used in tests)
   */
  public static reset() {
    this.userQueryHistory.clear();
  }
}
