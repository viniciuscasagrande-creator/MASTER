import { ERROR_CATALOG, ErrorDefinition } from './error-catalog';
import { ObservabilitySeverity } from '../../../../shared/types/index';

export interface ClassifiedError {
  errorCode: string;
  severity: ObservabilitySeverity;
  userFriendlyMessage: string;
  technicalMessage: string;
  stackTrace?: string;
  httpStatus: number;
}

export class ErrorClassifierService {
  /**
   * Classifica uma exceção ou erro técnico extraindo código e mensagem segura
   */
  public static classify(err: any): ClassifiedError {
    const rawCode = err?.code || err?.errorCode || err?.name;
    const rawMessage = err?.message || String(err);
    const stackTrace = err?.stack || undefined;

    // Busca exata no catálogo
    if (rawCode && ERROR_CATALOG[rawCode]) {
      const def = ERROR_CATALOG[rawCode];
      return {
        errorCode: def.code,
        severity: def.severity,
        userFriendlyMessage: def.userFriendlyMessage,
        technicalMessage: rawMessage,
        stackTrace,
        httpStatus: def.httpStatus
      };
    }

    // Busca heurística por termos-chave na mensagem de erro
    for (const [code, def] of Object.entries(ERROR_CATALOG)) {
      if (rawMessage.toLowerCase().includes(code.toLowerCase().replace(/_/g, ' ')) ||
          rawMessage.includes(code)) {
        return {
          errorCode: def.code,
          severity: def.severity,
          userFriendlyMessage: def.userFriendlyMessage,
          technicalMessage: rawMessage,
          stackTrace,
          httpStatus: def.httpStatus
        };
      }
    }

    if (rawMessage.toLowerCase().includes('timeout')) {
      const def = ERROR_CATALOG.INTEGRATION_TIMEOUT;
      return {
        errorCode: def.code,
        severity: def.severity,
        userFriendlyMessage: def.userFriendlyMessage,
        technicalMessage: rawMessage,
        stackTrace,
        httpStatus: def.httpStatus
      };
    }

    if (rawMessage.toLowerCase().includes('acesso negado') || rawMessage.toLowerCase().includes('permissão')) {
      const def = ERROR_CATALOG.AUTH_PERMISSION_DENIED;
      return {
        errorCode: def.code,
        severity: def.severity,
        userFriendlyMessage: def.userFriendlyMessage,
        technicalMessage: rawMessage,
        stackTrace,
        httpStatus: def.httpStatus
      };
    }

    // Erro não catalogado: Fallback seguro que NUNCA expõe stack trace ou detalhes internos
    return {
      errorCode: 'UNEXPECTED_INTERNAL_ERROR',
      severity: 'HIGH',
      userFriendlyMessage: 'Não foi possível concluir a operação neste momento. Um código de referência foi gerado para o suporte.',
      technicalMessage: rawMessage,
      stackTrace,
      httpStatus: 500
    };
  }
}
