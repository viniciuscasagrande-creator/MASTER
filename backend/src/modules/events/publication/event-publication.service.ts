import crypto from 'crypto';
import { prisma } from '../../../core/database/prisma';
import {
  PublishEventInput,
  PauseSalesInput,
  EventPublicationScheduleDTO,
  EventPreviewTokenDTO
} from '@shared/types/index';
import { EventTransitionService } from '../lifecycle/event-transition.service';
import { AuditService } from '../../audit/audit.service';

const PREVIEW_SECRET = process.env.JWT_SECRET || 'diskingressos-preview-secret-salt-2026';

export class EventPublicationService {
  /**
   * Realiza a publicação imediata do evento abrindo as vendas
   */
  static async publishEventImmediate(
    eventId: string,
    input: PublishEventInput,
    user: { id: string; name?: string; permissions?: string[] }
  ): Promise<{ success: boolean; event: any }> {
    // Transiciona o evento para ON_SALE através da State Machine
    const result = await EventTransitionService.requestTransition(
      eventId,
      {
        targetStatus: 'ON_SALE',
        reason: 'Publicação imediata do evento autorizada'
      },
      user
    );

    return {
      success: true,
      event: result.event
    };
  }

  /**
   * Programa a publicação automática do evento em data/hora e fuso específicos
   */
  static async schedulePublication(
    eventId: string,
    input: PublishEventInput,
    user: { id: string; name?: string; permissions?: string[] }
  ): Promise<EventPublicationScheduleDTO> {
    if (!input.scheduledAt) {
      throw new Error('Data e horário de agendamento (scheduledAt) são obrigatórios para agendar publicação.');
    }

    const scheduledDate = new Date(input.scheduledAt);
    if (scheduledDate.getTime() <= Date.now()) {
      throw new Error('O horário de publicação programada deve ser futuro.');
    }

    // Cria registro de agendamento
    const schedule = await (prisma as any).eventPublicationSchedule.create({
      data: {
        id: `pub_sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        eventId,
        scheduledAt: scheduledDate,
        timezone: input.timezone || 'America/Sao_Paulo',
        status: 'PENDING',
        createdBy: user.id,
        createdAt: new Date()
      }
    });

    // Transiciona evento para SCHEDULED
    await EventTransitionService.requestTransition(
      eventId,
      {
        targetStatus: 'SCHEDULED',
        reason: `Publicação agendada para ${scheduledDate.toISOString()} (${input.timezone || 'America/Sao_Paulo'})`
      },
      user
    );

    await AuditService.log({
      action: 'EVENT_PUBLICATION_SCHEDULED',
      resource: 'EventPublicationSchedule',
      resourceId: schedule.id,
      userId: user.id,
      eventId,
      details: {
        eventId,
        scheduledAt: scheduledDate,
        timezone: input.timezone || 'America/Sao_Paulo'
      }
    });

    return {
      id: schedule.id,
      eventId: schedule.eventId,
      scheduledAt: schedule.scheduledAt.toISOString ? schedule.scheduledAt.toISOString() : schedule.scheduledAt,
      timezone: schedule.timezone,
      status: schedule.status,
      createdBy: schedule.createdBy,
      createdAt: schedule.createdAt.toISOString ? schedule.createdAt.toISOString() : schedule.createdAt
    };
  }

  /**
   * Pausa as vendas do evento
   */
  static async pauseSales(
    eventId: string,
    input: PauseSalesInput,
    user: { id: string; name?: string; permissions?: string[] }
  ): Promise<{ success: boolean; event: any }> {
    const result = await EventTransitionService.requestTransition(
      eventId,
      {
        targetStatus: 'SALES_PAUSED',
        reason: input.reason
      },
      user
    );

    return {
      success: true,
      event: result.event
    };
  }

  /**
   * Retoma as vendas do evento pausado
   */
  static async resumeSales(
    eventId: string,
    user: { id: string; name?: string; permissions?: string[] }
  ): Promise<{ success: boolean; event: any }> {
    const result = await EventTransitionService.requestTransition(
      eventId,
      {
        targetStatus: 'ON_SALE',
        reason: 'Retomada de vendas pelo operador'
      },
      user
    );

    return {
      success: true,
      event: result.event
    };
  }

  /**
   * Gera um token assinado e temporário para visualização prévia (Preview) do evento antes da publicação
   */
  static generatePreviewToken(eventId: string, user: { id: string; name?: string }): EventPreviewTokenDTO {
    const expiresInHours = 24;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const payload = JSON.stringify({
      eventId,
      userId: user.id,
      exp: expiresAt.getTime()
    });

    const signature = crypto
      .createHmac('sha256', PREVIEW_SECRET)
      .update(payload)
      .digest('hex');

    const token = `${Buffer.from(payload).toString('base64url')}.${signature}`;

    return {
      token,
      eventId,
      expiresAt: expiresAt.toISOString(),
      previewUrl: `/preview/events/${eventId}?token=${token}`
    };
  }

  /**
   * Valida a autenticidade e validade temporal do preview token
   */
  static verifyPreviewToken(token: string): { valid: boolean; eventId?: string; error?: string } {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) {
        return { valid: false, error: 'Formato do token de preview inválido.' };
      }

      const [b64Payload, signature] = parts;
      const payloadStr = Buffer.from(b64Payload, 'base64url').toString('utf8');
      const expectedSig = crypto
        .createHmac('sha256', PREVIEW_SECRET)
        .update(payloadStr)
        .digest('hex');

      if (signature !== expectedSig) {
        return { valid: false, error: 'Assinatura criptográfica do token de preview inválida.' };
      }

      const payload = JSON.parse(payloadStr);
      if (Date.now() > payload.exp) {
        return { valid: false, error: 'O token de preview expirou.' };
      }

      return { valid: true, eventId: payload.eventId };
    } catch (err: any) {
      return { valid: false, error: `Erro na decodificação do token: ${err.message}` };
    }
  }

  /**
   * Lista os agendamentos pendentes ou históricos de publicação de um evento
   */
  static async getSchedules(eventId: string): Promise<EventPublicationScheduleDTO[]> {
    const schedules = await (prisma as any).eventPublicationSchedule.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    });

    return (schedules || []).map((s: any) => ({
      id: s.id,
      eventId: s.eventId,
      scheduledAt: s.scheduledAt?.toISOString ? s.scheduledAt.toISOString() : s.scheduledAt,
      timezone: s.timezone,
      status: s.status,
      createdBy: s.createdBy,
      createdAt: s.createdAt?.toISOString ? s.createdAt.toISOString() : s.createdAt,
      executedAt: s.executedAt?.toISOString ? s.executedAt.toISOString() : s.executedAt,
      failureReason: s.failureReason
    }));
  }
}
