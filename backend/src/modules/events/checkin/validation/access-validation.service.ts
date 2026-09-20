import { prisma } from '../../../../core/database/prisma';
import {
  AccessValidationRequestDTO,
  AccessValidationResultDTO,
  AccessValidationDecision,
  AccessReasonCode,
  AccessMovementType
} from '@shared/types/index';
import { TicketTokenService } from './ticket-token.service';
import { AccessRuleService } from '../rules/access-rule.service';
import { TicketAccessBlockService } from '../exceptions/ticket-access-block.service';
import { DeviceSessionService } from '../devices/device-session.service';
import { OperationTimelineService } from '../../operation/timeline/operation-timeline.service';
import { AuditService } from '../../../audit/audit.service';

export class AccessValidationService {
  // In-memory set for mutual exclusion on simultaneous validations of the same ticket
  private static processingTickets = new Set<string>();

  /**
   * Main entrypoint for validating access.
   * Scanners never decide access alone; this service is the authoritative source.
   */
  public static async validate(request: AccessValidationRequestDTO): Promise<AccessValidationResultDTO> {
    const validationRequestId = request.validationRequestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 1. Idempotency check: if this request ID was already processed, return existing result
    const existingVal = await prisma.accessValidation.findUnique({
      where: { validationRequestId }
    });
    if (existingVal) {
      return this.formatExistingValidation(existingVal);
    }

    const movementType: AccessMovementType = request.movementType || 'ENTRY';

    // 2. Validate Device
    const device = await prisma.accessDevice.findUnique({ where: { id: request.deviceId } });
    if (!device) {
      return this.recordDecision({
        request,
        validationRequestId,
        decision: 'DENY',
        reasonCode: 'DEVICE_NOT_FOUND',
        message: 'Dispositivo leitor não cadastrado ou não identificado.',
        movementType
      });
    }

    if (device.status !== 'ACTIVE') {
      return this.recordDecision({
        request,
        validationRequestId,
        decision: 'DENY',
        reasonCode: 'DEVICE_REVOKED',
        message: 'Dispositivo leitor revogado ou bloqueado pelo comando da operação.',
        movementType
      });
    }

    // Check device allowed access points
    const allowedPoints: string[] = typeof device.allowedAccessPointIds === 'string'
      ? JSON.parse(device.allowedAccessPointIds || '[]')
      : (device.allowedAccessPointIds || []);
    if (allowedPoints.length > 0 && !allowedPoints.includes(request.accessPointId)) {
      return this.recordDecision({
        request,
        validationRequestId,
        decision: 'DENY',
        reasonCode: 'DEVICE_UNAUTHORIZED_POINT',
        message: 'Dispositivo não autorizado para operar neste ponto de acesso.',
        movementType
      });
    }

    // 3. Check Active Device Session
    const activeSession = await prisma.deviceSession.findFirst({
      where: { deviceId: request.deviceId, isActive: true }
    });
    if (!activeSession) {
      return this.recordDecision({
        request,
        validationRequestId,
        decision: 'DENY',
        reasonCode: 'DEVICE_SESSION_EXPIRED',
        message: 'Dispositivo sem sessão de operador ativa. Abra a sessão antes de escanear.',
        movementType
      });
    }

    // 4. Parse Token / Barcode
    const parsed = TicketTokenService.parseTokenOrCode(request.tokenOrCode);
    const lookupKey = parsed.ticketId || parsed.rawCode;

    // Concurrency Lock: Prevent double scan race condition
    if (this.processingTickets.has(lookupKey)) {
      return this.recordDecision({
        request,
        validationRequestId,
        decision: 'DENY',
        reasonCode: 'TICKET_ALREADY_USED',
        message: 'Leitura simultânea detectada. Ingresso em processamento concorrente.',
        movementType
      });
    }
    this.processingTickets.add(lookupKey);

    try {
      // 5. Lookup Ticket
      let ticket: any = null;
      if (parsed.ticketId) {
        ticket = await prisma.ticket.findUnique({ where: { id: parsed.ticketId } });
      }
      if (!ticket) {
        ticket = await prisma.ticket.findFirst({
          where: {
            OR: [
              { id: parsed.rawCode },
              { ticketCode: parsed.rawCode },
              { ticketCodeNormalized: parsed.rawCode.toUpperCase() }
            ]
          }
        });
      }

      if (!ticket) {
        return await this.recordDecision({
          request,
          validationRequestId,
          decision: 'DENY',
          reasonCode: 'TICKET_NOT_FOUND',
          message: 'Ingresso não encontrado no sistema.',
          movementType
        });
      }

      // 6. Check Ticket Status
      const validStatuses = ['PAID', 'ISSUED', 'ACTIVE', 'CONFIRMED', 'VALID'];
      if (!validStatuses.includes((ticket.status || '').toUpperCase())) {
        return await this.recordDecision({
          request,
          validationRequestId,
          decision: 'DENY',
          reasonCode: 'TICKET_INVALID_STATUS',
          message: `Ingresso com status inválido para acesso: ${ticket.status}.`,
          movementType,
          ticket
        });
      }

      // 7. Check Event and Session Match
      if (ticket.eventId && ticket.eventId !== request.eventId) {
        return await this.recordDecision({
          request,
          validationRequestId,
          decision: 'DENY',
          reasonCode: 'TICKET_WRONG_EVENT',
          message: 'Ingresso emitido para outro evento.',
          movementType,
          ticket
        });
      }

      if (ticket.sessionId && ticket.sessionId !== request.sessionId) {
        return await this.recordDecision({
          request,
          validationRequestId,
          decision: 'DENY',
          reasonCode: 'TICKET_WRONG_SESSION',
          message: 'Ingresso pertence a outra sessão ou data do evento.',
          movementType,
          ticket
        });
      }

      // 8. Check Ticket Access Block
      const blockCheck = await TicketAccessBlockService.isTicketBlocked(ticket.id);
      if (blockCheck.blocked) {
        return await this.recordDecision({
          request,
          validationRequestId,
          decision: 'DENY',
          reasonCode: 'TICKET_BLOCKED',
          message: `Ingresso com bloqueio administrativo ativo: ${blockCheck.reason}`,
          movementType,
          ticket
        });
      }

      // 9. Match Access Rule
      const rule = await AccessRuleService.findMatchingRule({
        eventId: request.eventId,
        sessionId: request.sessionId,
        ticketTypeId: ticket.ticketTypeId,
        accessPointId: request.accessPointId,
        sectionId: ticket.sectionId
      });

      if (rule) {
        // Check allowed access points for this ticket type
        if (rule.allowedAccessPointIds.length > 0 && !rule.allowedAccessPointIds.includes(request.accessPointId)) {
          return await this.recordDecision({
            request,
            validationRequestId,
            decision: 'DENY',
            reasonCode: 'TICKET_WRONG_ACCESS_POINT',
            message: 'Portão ou catraca incorreta para este tipo de ingresso. Direcione ao acesso correto.',
            movementType,
            ticket
          });
        }

        // Check time window if session has time boundaries
        const session = await prisma.eventSession.findUnique({ where: { id: request.sessionId } });
        if (session && session.startAt) {
          const nowTime = new Date().getTime();
          const startMs = new Date(session.startAt).getTime();
          const openMs = startMs - (rule.windowStartsBeforeMinutes * 60 * 1000);

          if (nowTime < openMs) {
            return await this.recordDecision({
              request,
              validationRequestId,
              decision: 'DENY',
              reasonCode: 'TICKET_ENTRY_WINDOW_NOT_OPEN',
              message: `Acesso ainda não liberado para esta sessão. Abertura prevista em ${rule.windowStartsBeforeMinutes} minutos antes do início.`,
              movementType,
              ticket
            });
          }

          if (session.endAt) {
            const endMs = new Date(session.endAt).getTime();
            const closeMs = endMs + (rule.windowEndsAfterMinutes * 60 * 1000);
            if (nowTime > closeMs) {
              return await this.recordDecision({
                request,
                validationRequestId,
                decision: 'DENY',
                reasonCode: 'TICKET_ENTRY_WINDOW_CLOSED',
                message: 'Janela de acesso encerrada para esta sessão.',
                movementType,
                ticket
              });
            }
          }
        }
      }

      // 10. Handle Movement Types and Previous Entries
      const previousEntries = await prisma.accessEntry.findMany({
        where: {
          ticketId: ticket.id,
          sessionId: request.sessionId
        },
        orderBy: { createdAt: 'asc' }
      });

      const entryMovements = previousEntries.filter((e: any) => e.movementType === 'ENTRY' || e.movementType === 'REENTRY' || e.movementType === 'MANUAL_ENTRY');
      const lastMovement = previousEntries.length > 0 ? previousEntries[previousEntries.length - 1] : null;

      // Case A: Exit Movement
      if (movementType === 'EXIT') {
        return await this.recordDecision({
          request,
          validationRequestId,
          decision: 'ALLOW',
          reasonCode: 'EXIT_RECORDED',
          message: 'Saída registrada com sucesso.',
          movementType: 'EXIT',
          ticket,
          entriesCount: entryMovements.length,
          maxEntriesAllowed: rule ? rule.maxReentries + 1 : 1
        });
      }

      // Case B: Manual Entry (Supervisor / Contingency Override)
      if (movementType === 'MANUAL_ENTRY') {
        if (!request.overrideJustification) {
          return await this.recordDecision({
            request,
            validationRequestId,
            decision: 'REVIEW',
            reasonCode: 'EXCEPTION_PENDING_SUPERVISOR',
            message: 'Entrada manual em contingência requer justificativa operacional.',
            movementType: 'MANUAL_ENTRY',
            ticket
          });
        }

        return await this.recordDecision({
          request,
          validationRequestId,
          decision: 'ALLOW',
          reasonCode: 'ACCESS_ALLOWED',
          message: 'Entrada manual em contingência autorizada.',
          movementType: 'MANUAL_ENTRY',
          ticket,
          entriesCount: entryMovements.length + 1,
          maxEntriesAllowed: rule ? rule.maxReentries + 1 : 1
        });
      }

      // Case C: Standard Entry or Reentry
      if (entryMovements.length === 0) {
        // First entry
        return await this.recordDecision({
          request,
          validationRequestId,
          decision: 'ALLOW',
          reasonCode: 'ACCESS_ALLOWED',
          message: 'Acesso liberado. Seja bem-vindo(a)!',
          movementType: 'ENTRY',
          ticket,
          entriesCount: 1,
          maxEntriesAllowed: rule ? rule.maxReentries + 1 : 1
        });
      }

      // Ticket already entered once -> check Reentry Policy
      const reentryPolicy = rule ? rule.reentryPolicy : 'NO_REENTRY';
      const maxReentries = rule ? rule.maxReentries : 0;

      if (reentryPolicy === 'NO_REENTRY') {
        return await this.recordDecision({
          request,
          validationRequestId,
          decision: 'DENY',
          reasonCode: 'TICKET_ALREADY_USED',
          message: `Ingresso já utilizado anteriormente em ${new Date(entryMovements[0].createdAt).toLocaleTimeString('pt-BR')}. Reentrada não permitida.`,
          movementType: 'ENTRY',
          ticket,
          entriesCount: entryMovements.length,
          maxEntriesAllowed: 1
        });
      }

      if (reentryPolicy === 'REENTRY_AFTER_EXIT') {
        if (!lastMovement || lastMovement.movementType !== 'EXIT') {
          return await this.recordDecision({
            request,
            validationRequestId,
            decision: 'DENY',
            reasonCode: 'REENTRY_NOT_ALLOWED',
            message: 'Reentrada bloqueada: participante consta como dentro do evento sem registro de saída.',
            movementType: 'REENTRY',
            ticket,
            entriesCount: entryMovements.length,
            maxEntriesAllowed: maxReentries > 0 ? maxReentries + 1 : 999
          });
        }
      }

      if (reentryPolicy === 'LIMITED_REENTRY' || maxReentries > 0) {
        const allowedTotalEntries = maxReentries + 1;
        if (entryMovements.length >= allowedTotalEntries) {
          return await this.recordDecision({
            request,
            validationRequestId,
            decision: 'DENY',
            reasonCode: 'REENTRY_LIMIT_EXCEEDED',
            message: `Limite de reentradas excedido (${entryMovements.length}/${allowedTotalEntries}).`,
            movementType: 'REENTRY',
            ticket,
            entriesCount: entryMovements.length,
            maxEntriesAllowed: allowedTotalEntries
          });
        }
      }

      // Reentry Allowed
      return await this.recordDecision({
        request,
        validationRequestId,
        decision: 'ALLOW',
        reasonCode: 'ACCESS_ALLOWED',
        message: 'Reentrada autorizada.',
        movementType: 'REENTRY',
        ticket,
        entriesCount: entryMovements.length + 1,
        maxEntriesAllowed: maxReentries > 0 ? maxReentries + 1 : 999
      });

    } finally {
      this.processingTickets.delete(lookupKey);
    }
  }

  /**
   * Records decision in database, updates counters and emits timeline event.
   */
  private static async recordDecision(params: {
    request: AccessValidationRequestDTO;
    validationRequestId: string;
    decision: AccessValidationDecision;
    reasonCode: AccessReasonCode;
    message: string;
    movementType: AccessMovementType;
    ticket?: any;
    entriesCount?: number;
    maxEntriesAllowed?: number;
  }): Promise<AccessValidationResultDTO> {
    const now = new Date();

    // 1. Create AccessValidation record
    const validationRecord = await prisma.accessValidation.create({
      data: {
        eventId: params.request.eventId,
        sessionId: params.request.sessionId,
        ticketId: params.ticket?.id || null,
        ticketNumber: params.ticket?.ticketNumber || params.ticket?.ticketCode || null,
        accessPointId: params.request.accessPointId,
        deviceId: params.request.deviceId,
        operatorId: params.request.operatorId,
        operatorName: params.request.operatorName || null,
        decision: params.decision,
        reasonCode: params.reasonCode,
        movementType: params.movementType,
        validationRequestId: params.validationRequestId,
        overrideJustification: params.request.overrideJustification || null,
        isOfflineProcessed: !!params.request.offlineTimestamp,
        offlineTimestamp: params.request.offlineTimestamp ? new Date(params.request.offlineTimestamp) : null,
        createdAt: now
      }
    });

    // 2. If ALLOW, record AccessEntry and mark ticket as used
    if (params.decision === 'ALLOW' && params.ticket?.id) {
      await prisma.accessEntry.create({
        data: {
          ticketId: params.ticket.id,
          eventId: params.request.eventId,
          sessionId: params.request.sessionId,
          accessPointId: params.request.accessPointId,
          deviceId: params.request.deviceId,
          operatorId: params.request.operatorId,
          movementType: params.movementType,
          validationId: validationRecord.id,
          createdAt: now
        }
      });

      await prisma.ticket.update({
        where: { id: params.ticket.id },
        data: {
          usedAt: now,
          isUsed: true
        }
      });
    }

    // 3. Update Device Session counters
    await DeviceSessionService.recordValidation(params.request.deviceId, params.decision);

    // 4. Push to Operation Timeline (1.2.12 live synchronization)
    const opSession = await prisma.eventOperationSession.findFirst({
      where: { sessionId: params.request.sessionId }
    });
    if (opSession) {
      OperationTimelineService.addEvent({
        operationId: opSession.id,
        category: 'CHECKIN',
        severity: params.decision === 'ALLOW' ? 'SUCCESS' : (params.decision === 'REVIEW' ? 'WARNING' : 'ERROR'),
        title: `Check-in: ${params.decision} (${params.reasonCode})`,
        description: `${params.ticket?.ticketNumber || params.ticket?.ticketCode || 'Ingresso'}: ${params.message}`,
        actorName: params.request.operatorName || 'Operador',
        metadata: {
          ticketId: params.ticket?.id,
          accessPointId: params.request.accessPointId,
          decision: params.decision
        }
      });
    }

    // 5. Audit log
    await AuditService.log({
      action: `CHECKIN_${params.decision}`,
      resource: 'checkin',
      resourceId: validationRecord.id,
      userId: params.request.operatorId,
      details: {
        reasonCode: params.reasonCode,
        ticketId: params.ticket?.id,
        sessionId: params.request.sessionId,
        deviceId: params.request.deviceId
      }
    });

    // 6. Build response DTO
    let accessPointInfo: any = undefined;
    const ap = await prisma.venueAccessPoint.findUnique({ where: { id: params.request.accessPointId } });
    if (ap) {
      accessPointInfo = { id: ap.id, name: ap.name, code: ap.code };
    }

    let sessionInfo: any = undefined;
    const sess = await prisma.eventSession.findUnique({ where: { id: params.request.sessionId } });
    if (sess) {
      sessionInfo = { id: sess.id, name: sess.name };
    }

    return {
      id: validationRecord.id,
      decision: params.decision,
      reasonCode: params.reasonCode,
      message: params.message,
      timestamp: now.toISOString(),
      validationRequestId: params.validationRequestId,
      ticket: params.ticket ? {
        id: params.ticket.id,
        ticketNumber: params.ticket.ticketNumber || params.ticket.ticketCode || params.ticket.id,
        ticketType: params.ticket.ticketTypeName || params.ticket.ticketType || 'Padrão',
        sectorName: params.ticket.sectorName || undefined,
        seatInfo: params.ticket.seatInfo || undefined,
        attendeeName: params.ticket.attendeeName || params.ticket.customerName || undefined,
        documentNumberMasked: params.ticket.documentNumber
          ? `${params.ticket.documentNumber.substring(0, 3)}.***.***-${params.ticket.documentNumber.slice(-2)}`
          : undefined
      } : undefined,
      session: sessionInfo,
      accessPoint: accessPointInfo,
      movementType: params.movementType,
      entriesCount: params.entriesCount || 0,
      maxEntriesAllowed: params.maxEntriesAllowed || 1,
      requiresSupervisorReview: params.decision === 'REVIEW',
      offlineProcessed: !!params.request.offlineTimestamp
    };
  }

  private static formatExistingValidation(v: any): AccessValidationResultDTO {
    return {
      id: v.id,
      decision: v.decision as AccessValidationDecision,
      reasonCode: v.reasonCode as AccessReasonCode,
      message: 'Validação já processada previamente (resposta idempotente).',
      timestamp: new Date(v.createdAt).toISOString(),
      validationRequestId: v.validationRequestId,
      movementType: v.movementType as AccessMovementType,
      entriesCount: 1,
      maxEntriesAllowed: 1,
      offlineProcessed: v.isOfflineProcessed
    };
  }
}
