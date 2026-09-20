import { prisma } from '../../../../core/database/prisma';
import { OperationCommandDTO, OperationCommandType } from '@shared/types/index';
import { OperationCommandHandlerRegistry } from './operation-command-handler.registry';
import { OperationTimelineService } from '../timeline/operation-timeline.service';
import { AuditService } from '../../../audit/audit.service';

export interface ExecuteCommandRequest {
  operationId: string;
  sessionId: string;
  eventId: string;
  commandType: OperationCommandType;
  targetType: string;
  targetId?: string | null;
  requestedBy: string;
  requestedByName?: string;
  executionMode?: 'LOGICAL' | 'INTEGRATION';
  idempotencyKey?: string | null;
  reason?: string | null;
  payload?: any;
}

export class OperationCommandService {
  public static async executeCommand(req: ExecuteCommandRequest): Promise<OperationCommandDTO> {
    const {
      operationId,
      sessionId,
      eventId,
      commandType,
      targetType,
      targetId,
      requestedBy,
      requestedByName,
      executionMode = 'LOGICAL',
      idempotencyKey,
      reason,
      payload
    } = req;

    // 1. Check idempotency if key provided
    if (idempotencyKey) {
      const existing = await prisma.operationCommand.findFirst({
        where: { idempotencyKey, operationId }
      });
      if (existing) {
        return {
          id: existing.id,
          operationId: existing.operationId,
          sessionId: existing.sessionId,
          commandType: existing.commandType as any,
          targetType: existing.targetType,
          targetId: existing.targetId,
          status: existing.status as any,
          requestedBy: existing.requestedBy,
          requestedByName: existing.requestedByName,
          requestedAt: new Date(existing.requestedAt).toISOString(),
          executionMode: existing.executionMode as any,
          executedAt: new Date(existing.executedAt).toISOString(),
          idempotencyKey: existing.idempotencyKey,
          reason: existing.reason,
          payload: existing.payload ? JSON.parse(existing.payload) : undefined
        };
      }
    }

    // 2. Resolve handler
    const handler = OperationCommandHandlerRegistry.getHandler(commandType);
    if (!handler) {
      throw new Error(`Nenhum handler registrado para o comando operacional: ${commandType}`);
    }

    let status: 'SUCCESS' | 'FAILED' | 'REJECTED' = 'SUCCESS';
    let executionResult: any = null;

    try {
      executionResult = await handler({
        operationId,
        sessionId,
        eventId,
        userId: requestedBy,
        userName: requestedByName,
        targetId,
        executionMode,
        payload,
        reason
      });
    } catch (err: any) {
      status = 'FAILED';
      throw err;
    } finally {
      // 3. Persist command record
      const record = await prisma.operationCommand.create({
        data: {
          operationId,
          sessionId,
          commandType,
          targetType,
          targetId: targetId || null,
          status,
          requestedBy,
          requestedByName: requestedByName || null,
          executionMode,
          idempotencyKey: idempotencyKey || null,
          reason: reason || null,
          payload: payload ? JSON.stringify(payload) : null
        }
      });

      // 4. Timeline event
      OperationTimelineService.addEvent({
        operationId,
        category: 'COMMAND',
        severity: status === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
        title: `Comando executado: ${commandType}`,
        description: `Modo: ${executionMode}. Alvo: ${targetType}${targetId ? ` (${targetId})` : ''}.${reason ? ` Motivo: ${reason}` : ''}`,
        actorName: requestedByName || requestedBy,
        metadata: { commandId: record.id, commandType, executionMode, result: executionResult }
      });

      // 5. Audit log
      await AuditService.log({
        action: `OPERATION_COMMAND_${commandType}`,
        resource: 'OPERATION_COMMAND',
        resourceId: record.id,
        userId: requestedBy,
        details: { operationId, sessionId, commandType, executionMode, status, targetId }
      });
    }

    return {
      id: `cmd_${Date.now()}`,
      operationId,
      sessionId,
      commandType,
      targetType,
      targetId,
      status,
      requestedBy,
      requestedByName,
      requestedAt: new Date().toISOString(),
      executionMode,
      executedAt: new Date().toISOString(),
      idempotencyKey,
      reason,
      payload
    };
  }

  public static async listCommands(operationId: string): Promise<OperationCommandDTO[]> {
    const list = await prisma.operationCommand.findMany({
      where: { operationId },
      orderBy: { executedAt: 'desc' }
    });

    return list.map((c: any) => ({
      id: c.id,
      operationId: c.operationId,
      sessionId: c.sessionId,
      commandType: c.commandType as any,
      targetType: c.targetType,
      targetId: c.targetId,
      status: c.status as any,
      requestedBy: c.requestedBy,
      requestedByName: c.requestedByName,
      requestedAt: new Date(c.requestedAt).toISOString(),
      executionMode: c.executionMode as any,
      executedAt: new Date(c.executedAt).toISOString(),
      idempotencyKey: c.idempotencyKey,
      reason: c.reason,
      payload: c.payload ? JSON.parse(c.payload) : undefined
    }));
  }
}
