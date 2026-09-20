import { prisma } from '../../../../core/database/prisma';
import { AccessExceptionRequestDTO, AccessMovementType } from '@shared/types/index';
import { AuditService } from '../../../audit/audit.service';

export class AccessExceptionService {
  /**
   * Submits a request for access exception.
   */
  public static async requestException(params: {
    ticketId?: string;
    ticketNumber?: string;
    eventId: string;
    sessionId: string;
    accessPointId: string;
    deviceId: string;
    operatorId: string;
    operatorName: string;
    reason: string;
    requestedMovement?: AccessMovementType;
  }): Promise<AccessExceptionRequestDTO> {
    const created = await prisma.accessExceptionRequest.create({
      data: {
        ticketId: params.ticketId || null,
        ticketNumber: params.ticketNumber || null,
        eventId: params.eventId,
        sessionId: params.sessionId,
        accessPointId: params.accessPointId,
        deviceId: params.deviceId,
        operatorId: params.operatorId,
        operatorName: params.operatorName,
        reason: params.reason,
        requestedMovement: params.requestedMovement || 'ENTRY',
        status: 'PENDING',
        createdAt: new Date()
      }
    });

    await AuditService.log({
      action: 'ACCESS_EXCEPTION_REQUESTED',
      resource: 'access_exception',
      resourceId: created.id,
      userId: params.operatorId,
      details: {
        reason: params.reason,
        ticketNumber: params.ticketNumber,
        sessionId: params.sessionId
      }
    });

    return this.mapToDTO(created);
  }

  /**
   * Reviews and approves or rejects an exception request by supervisor.
   */
  public static async reviewException(params: {
    requestId: string;
    status: 'APPROVED' | 'REJECTED';
    supervisorId: string;
    supervisorName: string;
    decisionNotes?: string;
  }): Promise<AccessExceptionRequestDTO> {
    const req = await prisma.accessExceptionRequest.findUnique({
      where: { id: params.requestId }
    });
    if (!req) throw new Error('Solicitação de exceção não encontrada.');
    if (req.status !== 'PENDING') throw new Error(`Solicitação já avaliada: ${req.status}`);

    const updated = await prisma.accessExceptionRequest.update({
      where: { id: params.requestId },
      data: {
        status: params.status,
        supervisorId: params.supervisorId,
        supervisorName: params.supervisorName,
        decidedAt: new Date(),
        decisionNotes: params.decisionNotes || null
      }
    });

    await AuditService.log({
      action: `ACCESS_EXCEPTION_${params.status}`,
      resource: 'access_exception',
      resourceId: params.requestId,
      userId: params.supervisorId,
      details: {
        decisionNotes: params.decisionNotes,
        ticketNumber: req.ticketNumber
      }
    });

    return this.mapToDTO(updated);
  }

  /**
   * Lists pending exceptions for an event/session.
   */
  public static async listPending(eventId: string, sessionId?: string): Promise<AccessExceptionRequestDTO[]> {
    const list = await prisma.accessExceptionRequest.findMany({
      where: {
        eventId,
        status: 'PENDING',
        ...(sessionId ? { sessionId } : {})
      },
      orderBy: { createdAt: 'desc' }
    });
    return list.map((x: any) => this.mapToDTO(x));
  }

  private static mapToDTO(x: any): AccessExceptionRequestDTO {
    return {
      id: x.id,
      ticketId: x.ticketId || undefined,
      ticketNumber: x.ticketNumber || undefined,
      eventId: x.eventId,
      sessionId: x.sessionId,
      accessPointId: x.accessPointId,
      deviceId: x.deviceId,
      operatorId: x.operatorId,
      operatorName: x.operatorName,
      reason: x.reason,
      requestedMovement: x.requestedMovement as AccessMovementType,
      status: x.status,
      supervisorId: x.supervisorId || undefined,
      supervisorName: x.supervisorName || undefined,
      decidedAt: x.decidedAt ? new Date(x.decidedAt).toISOString() : undefined,
      decisionNotes: x.decisionNotes || undefined,
      createdAt: new Date(x.createdAt).toISOString()
    };
  }
}
