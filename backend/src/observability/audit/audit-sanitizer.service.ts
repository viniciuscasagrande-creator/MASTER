/**
 * AuditSanitizerService - Sanitização Central de Dados Sensíveis
 * 
 * Garante que senhas, tokens, credenciais bancárias, CVV e segredos 2FA
 * NUNCA sejam persistidos na trilha de auditoria ou logs, prevenindo vazamentos
 * sem depender de sanitização manual em cada controller.
 */

export class AuditSanitizerService {
  private static readonly SENSITIVE_KEYS: RegExp[] = [
    /password/i,
    /senha/i,
    /token/i,
    /jwt/i,
    /refreshtoken/i,
    /refresh_token/i,
    /secret/i,
    /totp/i,
    /recoverycode/i,
    /recovery_code/i,
    /clientsecret/i,
    /client_secret/i,
    /accesstoken/i,
    /access_token/i,
    /cvv/i,
    /cvc/i,
    /cardnumber/i,
    /card_number/i,
    /cartao/i,
    /creditcard/i,
    /credit_card/i,
    /pin/i,
    /authorization/i
  ];

  private static readonly REDACTED_VALUE = '[REDACTED]';

  /**
   * Sanitiza recursivamente objetos, arrays e valores primitivos
   */
  public static sanitize<T = any>(data: T): T {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (typeof parsed === 'object' && parsed !== null) {
          return JSON.stringify(this.sanitizeObject(parsed)) as unknown as T;
        }
      } catch {
        // String comum, não JSON
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item)) as unknown as T;
    }

    if (typeof data === 'object') {
      return this.sanitizeObject(data as Record<string, any>) as unknown as T;
    }

    return data;
  }

  private static sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveKey(key)) {
        sanitized[key] = this.REDACTED_VALUE;
      } else if (value !== null && typeof value === 'object') {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  public static isSensitiveKey(key: string): boolean {
    return this.SENSITIVE_KEYS.some(regex => regex.test(key));
  }
}
