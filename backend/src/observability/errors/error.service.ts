import { ErrorClassifierService } from './error-classifier.service';
import { ErrorGroupingService } from './error-grouping.service';
import { logger } from '../logging/logger.service';
import { TraceContext } from '../tracing/trace-context';
import { ErrorGroupRecord, ErrorOccurrenceRecord, ObservabilitySeverity } from '../../../../shared/types/index';

export class ErrorService {
  private groupingService: ErrorGroupingService;

  constructor(groupingService?: ErrorGroupingService) {
    this.groupingService = groupingService || new ErrorGroupingService();
  }

  /**
   * Captura uma exceção, classifica, agrupa e registra na observabilidade
   */
  public async captureError(
    err: any,
    context?: {
      service?: string;
      operation?: string;
      correlationId?: string;
      requestId?: string;
      userId?: string;
      producerId?: string;
      eventId?: string;
      contextData?: Record<string, any>;
    }
  ): Promise<{
    group: ErrorGroupRecord;
    occurrence: ErrorOccurrenceRecord;
    userFriendlyMessage: string;
    httpStatus: number;
    errorCode: string;
  }> {
    const classified = ErrorClassifierService.classify(err);
    const traceCtx = TraceContext.getContext();

    const service = context?.service || 'core-service';
    const operation = context?.operation || traceCtx?.operation || 'unspecified-operation';
    const correlationId = context?.correlationId || traceCtx?.correlationId || TraceContext.getCorrelationId();
    const requestId = context?.requestId || traceCtx?.requestId || TraceContext.getRequestId();
    const userId = context?.userId || traceCtx?.userId;
    const producerId = context?.producerId || traceCtx?.producerId;
    const eventId = context?.eventId || traceCtx?.eventId;

    // Agrupa e salva no banco de dados
    const result = await this.groupingService.captureOccurrence({
      errorCode: classified.errorCode,
      service,
      operation,
      severity: classified.severity,
      errorMessage: classified.technicalMessage,
      userFriendlyMessage: classified.userFriendlyMessage,
      stackTrace: classified.stackTrace,
      correlationId,
      requestId,
      userId,
      producerId,
      eventId,
      contextData: context?.contextData
    });

    // Emissão de log estruturado seguro
    logger.error(`[${classified.errorCode}] ${classified.technicalMessage}`, {
      service,
      operation,
      correlationId,
      requestId,
      groupId: result.group.id
    }, classified.errorCode);

    return {
      group: result.group,
      occurrence: result.occurrence,
      userFriendlyMessage: classified.userFriendlyMessage,
      httpStatus: classified.httpStatus,
      errorCode: classified.errorCode
    };
  }

  /**
   * Obtém grupos de erros com filtros
   */
  public async getErrorGroups(filters?: {
    severity?: ObservabilitySeverity;
    service?: string;
    status?: string;
    search?: string;
  }): Promise<ErrorGroupRecord[]> {
    return this.groupingService.getErrorGroups(filters);
  }

  /**
   * Obtém detalhes de um grupo de erros protegendo o stack trace técnico
   */
  public async getErrorGroupById(
    id: string,
    currentUser?: any
  ): Promise<ErrorGroupRecord | null> {
    const group = await this.groupingService.getErrorGroupById(id);
    if (!group) return null;

    // RBAC: Checagem de permissão específica para visualização de stack trace técnico
    const hasTechnicalPerm = currentUser?.roleSlug === 'admin_geral' ||
      (currentUser?.permissions && currentUser.permissions.includes('observabilidade.erro.detalhe_tecnico'));

    if (!hasTechnicalPerm && group.occurrences) {
      group.occurrences = group.occurrences.map(o => ({
        ...o,
        stackTrace: '[ACESSO RESTRITO: Requer permissão observabilidade.erro.detalhe_tecnico]'
      }));
    }

    return group;
  }

  /**
   * Marca grupo de erros como resolvido
   */
  public async resolveErrorGroup(id: string): Promise<ErrorGroupRecord> {
    return this.groupingService.resolveErrorGroup(id);
  }
}
