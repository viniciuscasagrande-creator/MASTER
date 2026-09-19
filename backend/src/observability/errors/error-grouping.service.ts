import crypto from 'crypto';
import { prisma } from '../../core/database/prisma';
import { ErrorGroupRecord, ErrorOccurrenceRecord, ObservabilitySeverity } from '../../../../shared/types/index';
import { TaskService } from '../../modules/tasks/task.service';

export interface CaptureOccurrenceParams {
  errorCode: string;
  service: string;
  operation: string;
  severity: ObservabilitySeverity;
  errorMessage: string;
  userFriendlyMessage: string;
  stackTrace?: string;
  correlationId?: string;
  requestId?: string;
  userId?: string;
  producerId?: string;
  eventId?: string;
  contextData?: Record<string, any>;
}

export class ErrorGroupingService {
  /**
   * Calcula o fingerprint determinístico de agrupamento
   */
  public static calculateFingerprint(errorCode: string, service: string, operation: string): string {
    const raw = `${errorCode}:${service}:${operation}`.toLowerCase();
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
  }

  /**
   * Registra uma ocorrência de erro agrupando por fingerprint e vinculando a tarefas
   */
  public async captureOccurrence(params: CaptureOccurrenceParams): Promise<{
    group: ErrorGroupRecord;
    occurrence: ErrorOccurrenceRecord;
    taskCreated?: boolean;
  }> {
    const fingerprint = ErrorGroupingService.calculateFingerprint(
      params.errorCode,
      params.service,
      params.operation
    );

    let group = await prisma.errorGroup.findUnique({
      where: { fingerprint }
    });

    let taskCreated = false;

    if (!group) {
      // Criação de novo grupo de erros
      group = await prisma.errorGroup.create({
        data: {
          fingerprint,
          errorCode: params.errorCode,
          title: `[${params.errorCode}] Falha em ${params.service} (${params.operation})`,
          service: params.service,
          operation: params.operation,
          severity: params.severity,
          status: 'UNRESOLVED',
          occurrencesCount: 1,
          affectedEventsCount: params.eventId ? 1 : 0,
          affectedUsersCount: params.userId ? 1 : 0,
          firstSeenAt: new Date(),
          lastSeenAt: new Date()
        }
      });
    } else {
      // Atualização de grupo existente
      const updatedCount = group.occurrencesCount + 1;
      group = await prisma.errorGroup.update({
        where: { id: group.id },
        data: {
          occurrencesCount: updatedCount,
          lastSeenAt: new Date(),
          affectedEventsCount: params.eventId ? (group.affectedEventsCount || 0) + 1 : group.affectedEventsCount,
          affectedUsersCount: params.userId ? (group.affectedUsersCount || 0) + 1 : group.affectedUsersCount
        }
      });
    }

    // Cria registro de ocorrência individual
    const occurrence = await prisma.errorOccurrence.create({
      data: {
        errorGroupId: group.id,
        correlationId: params.correlationId || null,
        requestId: params.requestId || null,
        userId: params.userId || null,
        producerId: params.producerId || null,
        eventId: params.eventId || null,
        errorMessage: params.errorMessage,
        userFriendlyMessage: params.userFriendlyMessage,
        stackTrace: params.stackTrace || null,
        contextData: params.contextData || null
      }
    });

    // Se a severidade for HIGH ou CRITICAL e ainda não tiver tarefa vinculada, dispara tarefa operacional
    if ((params.severity === 'HIGH' || params.severity === 'CRITICAL') && !group.relatedTaskId) {
      try {
        const task = await TaskService.createTask({
          title: `[ALERTA DE ERRO] Investigar ${params.errorCode} em ${params.service}`,
          description: `Grupo de erros #${group.id} atingiu ${group.occurrencesCount} ocorrências.\nÚltima falha: ${params.errorMessage}\nCorrelation ID: ${params.correlationId || 'N/A'}`,
          module: 'OPERACOES',
          priority: params.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          producerId: params.producerId,
          eventId: params.eventId,
          checklist: [
            { text: 'Inspecionar logs detalhados e payload da chamada', isRequired: true },
            { text: 'Verificar status do parceiro/adaptador externo', isRequired: true },
            { text: 'Validar se há novos clientes afetados', isRequired: false }
          ]
        }, {
          id: 'usr-system-observability',
          name: 'Robô de Observabilidade',
          email: 'observability@diskingressos.com.br',
          roleSlug: 'admin_geral',
          organization: 'DiskIngressos Matriz',
          isInternalStaff: true,
          scope: { type: 'GLOBAL', producerIds: [], eventIds: [] },
          permissions: ['tarefas.tarefa.criar']
        } as any);

        if (task && task.id) {
          await prisma.errorGroup.update({
            where: { id: group.id },
            data: { relatedTaskId: task.taskNumber || task.id }
          });
          group.relatedTaskId = task.taskNumber || task.id;
          taskCreated = true;
        }
      } catch (taskErr) {
        // Log preventivo: falha ao criar tarefa não interrompe o registro do erro
        console.error('Falha ao disparar tarefa automática para o grupo de erros:', taskErr);
      }
    }

    return {
      group: this.mapGroup(group),
      occurrence: this.mapOccurrence(occurrence),
      taskCreated
    };
  }

  public async getErrorGroups(filters?: {
    severity?: ObservabilitySeverity;
    service?: string;
    status?: string;
    search?: string;
    limit?: number;
  }): Promise<ErrorGroupRecord[]> {
    const where: any = {};
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.service) where.service = filters.service;
    if (filters?.status) where.status = filters.status;

    let items = await prisma.errorGroup.findMany({
      where,
      take: filters?.limit || 50,
      include: { occurrences: true }
    });

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(g =>
        g.errorCode.toLowerCase().includes(q) ||
        g.title.toLowerCase().includes(q) ||
        g.service.toLowerCase().includes(q)
      );
    }

    return items.map(g => this.mapGroup(g));
  }

  public async getErrorGroupById(id: string): Promise<ErrorGroupRecord | null> {
    const group = await prisma.errorGroup.findUnique({
      where: { id },
      include: { occurrences: true }
    });
    return group ? this.mapGroup(group) : null;
  }

  public async resolveErrorGroup(id: string): Promise<ErrorGroupRecord> {
    const updated = await prisma.errorGroup.update({
      where: { id },
      data: { status: 'RESOLVED' },
      include: { occurrences: true }
    });
    return this.mapGroup(updated);
  }

  private mapGroup(g: any): ErrorGroupRecord {
    return {
      id: g.id,
      fingerprint: g.fingerprint,
      errorCode: g.errorCode,
      title: g.title,
      service: g.service,
      operation: g.operation,
      severity: g.severity,
      status: g.status,
      firstSeenAt: g.firstSeenAt instanceof Date ? g.firstSeenAt.toISOString() : g.firstSeenAt,
      lastSeenAt: g.lastSeenAt instanceof Date ? g.lastSeenAt.toISOString() : g.lastSeenAt,
      occurrencesCount: g.occurrencesCount,
      affectedEventsCount: g.affectedEventsCount || 0,
      affectedUsersCount: g.affectedUsersCount || 0,
      relatedTaskId: g.relatedTaskId || null,
      occurrences: (g.occurrences || []).map((o: any) => this.mapOccurrence(o))
    };
  }

  private mapOccurrence(o: any): ErrorOccurrenceRecord {
    let ctxData: any = null;
    if (o.contextData) {
      try {
        ctxData = typeof o.contextData === 'string' ? JSON.parse(o.contextData) : o.contextData;
      } catch {
        ctxData = o.contextData;
      }
    }

    return {
      id: o.id,
      errorGroupId: o.errorGroupId,
      correlationId: o.correlationId || null,
      requestId: o.requestId || null,
      userId: o.userId || null,
      producerId: o.producerId || null,
      eventId: o.eventId || null,
      errorMessage: o.errorMessage,
      userFriendlyMessage: o.userFriendlyMessage,
      stackTrace: o.stackTrace || null,
      contextData: ctxData,
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt
    };
  }
}
