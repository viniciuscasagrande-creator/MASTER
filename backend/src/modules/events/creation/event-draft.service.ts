import { prisma } from '../../../core/database/prisma';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';
import { EventAccessPolicy } from '../policies/event-access.policy';
import {
  EventNotFoundError,
  EventConcurrencyError,
  EventInvalidStatusError,
  EventValidationError
} from '../errors/event.errors';
import { EventMapper } from '../event.mapper';
import { EventWizardService } from '../wizard/event-wizard.service';
import { DomainEvents } from '../../../events/DomainEvents';
import { AuditService } from '../../audit/audit.service';

export class EventDraftService {
  public static async createDraft(user: AuthenticatedUser, input: any) {
    // 1. Resolve Producer ID based on security context & access policy
    let targetProducerId = input.producerId;

    if (targetProducerId) {
      // Must verify if user has access to this producer
      EventAccessPolicy.verifyProducerAccess(user, targetProducerId);
    } else {
      // Auto-resolve from user scope
      if (user.scope.producers && user.scope.producers.length > 0) {
        targetProducerId = user.scope.producers[0];
      } else if (user.scope.isGlobal) {
        // Global admin without specified producer -> pick first available producer
        const allProducers = await prisma.producer.findMany();
        if (allProducers.length > 0) {
          targetProducerId = allProducers[0].id;
        } else {
          throw new EventValidationError('Nenhum produtor cadastrado no sistema.');
        }
      } else {
        EventAccessPolicy.verifyProducerAccess(user, 'unauthorized');
      }
    }

    // 2. Generate immutable public code
    const year = new Date().getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    const publicCode = `EVT-${year}-${rand}`;

    // 3. Name & Initial slug
    const name = (input.name || 'Novo Evento').trim();
    let baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    if (!baseSlug) baseSlug = `evento-${rand}`;

    // Ensure unique slug
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.event.findFirst({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    // 4. Create event with DRAFT status & version 1
    const rawEvent = await prisma.event.create({
      data: {
        publicCode,
        producerId: targetProducerId,
        name,
        title: name,
        slug: finalSlug,
        categoryId: input.categoryId || null,
        format: input.format || 'IN_PERSON',
        ageRating: 'Livre',
        startAt: input.startAt ? new Date(input.startAt) : null,
        endAt: input.endAt ? new Date(input.endAt) : null,
        timezone: input.timezone || 'America/Sao_Paulo',
        venue: input.venue || null,
        city: input.city || null,
        state: input.state || null,
        country: 'BR',
        capacity: null,
        soldTickets: 0,
        currency: 'BRL',
        locale: 'pt-BR',
        visibility: 'PRIVATE',
        status: 'DRAFT',
        version: 1,
        createdBy: user.id
      }
    });

    // 5. Initialize wizard state
    const wizardState = await EventWizardService.getOrCreateWizardState(rawEvent.id, user.id);

    // 6. Record audit log
    await AuditService.log({
      userId: user.id,
      userName: user.email,
      action: 'EVENT_DRAFT_CREATED',
      resource: 'Event',
      resourceId: rawEvent.id,
      producerId: targetProducerId,
      eventId: rawEvent.id,
      details: {
        publicCode,
        name,
        producerId: targetProducerId,
        version: 1
      },
      result: 'SUCCESS'
    });

    // 7. Emit domain event
    await DomainEvents.dispatch({
      id: `evt_draft_${Date.now()}`,
      type: 'EVENT_DRAFT_CREATED' as any,
      producerId: targetProducerId,
      eventId: rawEvent.id,
      resourceType: 'EVENT',
      resourceId: rawEvent.id,
      actorUserId: user.id,
      data: { publicCode, name, producerId: targetProducerId },
      timestamp: new Date()
    });

    // Resolve producer name
    const producer = await prisma.producer.findUnique({ where: { id: targetProducerId } });

    return {
      event: EventMapper.toDetail(rawEvent, producer?.name),
      wizardState
    };
  }

  public static async patchDraft(user: AuthenticatedUser, eventId: string, input: any) {
    const rawEvent = await prisma.event.findUnique({ where: { id: eventId } });
    if (!rawEvent) {
      throw new EventNotFoundError(eventId);
    }

    // 1. Verify access policy
    EventAccessPolicy.verifyEventAccess(user, rawEvent);

    // 2. Status verification: only DRAFT or CONFIGURING can be patched via draft autosave
    if (rawEvent.status !== 'DRAFT' && rawEvent.status !== 'CONFIGURING') {
      throw new EventInvalidStatusError(`Não é permitido alterar rascunho de evento com status ${rawEvent.status}.`);
    }

    // 3. Optimistic Concurrency Control
    if (input.version !== undefined && rawEvent.version !== undefined && rawEvent.version !== input.version) {
      throw new EventConcurrencyError();
    }

    // 4. Sanitize and prepare patch data
    const updateData: any = {
      updatedBy: user.id
    };

    if (input.name !== undefined) {
      const cleanName = input.name.trim();
      if (!cleanName) throw new EventValidationError('O nome do evento não pode ser vazio.');
      updateData.name = cleanName;
      updateData.title = cleanName;
    }

    if (input.slug !== undefined) {
      const cleanSlug = input.slug.trim().toLowerCase();
      // Verify slug uniqueness if changed
      if (cleanSlug !== rawEvent.slug) {
        const existingWithSlug = await prisma.event.findFirst({
          where: { slug: cleanSlug, id: { not: eventId } }
        });
        if (existingWithSlug) {
          throw new EventValidationError(`O endereço (slug) "${cleanSlug}" já está em uso por outro evento.`);
        }
      }
      updateData.slug = cleanSlug;
    }

    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
    if (input.subcategoryId !== undefined) updateData.subcategoryId = input.subcategoryId;
    if (input.format !== undefined) updateData.format = input.format;
    if (input.ageRating !== undefined) updateData.ageRating = input.ageRating;
    if (input.ageRatingDescription !== undefined) updateData.ageRatingDescription = input.ageRatingDescription;

    if (input.description !== undefined) {
      // Basic sanitization: strip script tags
      updateData.description = input.description ? input.description.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim() : null;
    }

    if (input.publicOrganizerName !== undefined) updateData.publicOrganizerName = input.publicOrganizerName ? input.publicOrganizerName.trim() : null;
    if (input.operationalContact !== undefined) updateData.operationalContact = input.operationalContact ? input.operationalContact.trim() : null;
    if (input.operationalEmail !== undefined) updateData.operationalEmail = input.operationalEmail ? input.operationalEmail.trim() : null;
    if (input.internalResponsibleUserId !== undefined) updateData.internalResponsibleUserId = input.internalResponsibleUserId;

    if (input.venue !== undefined) updateData.venue = input.venue ? input.venue.trim() : null;
    if (input.address !== undefined) updateData.address = input.address ? input.address.trim() : null;
    if (input.addressNumber !== undefined) updateData.addressNumber = input.addressNumber ? input.addressNumber.trim() : null;
    if (input.complement !== undefined) updateData.complement = input.complement ? input.complement.trim() : null;
    if (input.neighborhood !== undefined) updateData.neighborhood = input.neighborhood ? input.neighborhood.trim() : null;
    if (input.zipCode !== undefined) updateData.zipCode = input.zipCode ? input.zipCode.trim() : null;
    if (input.city !== undefined) updateData.city = input.city ? input.city.trim() : null;
    if (input.state !== undefined) updateData.state = input.state ? input.state.trim().toUpperCase() : null;
    if (input.country !== undefined) updateData.country = input.country;
    if (input.estimatedCapacity !== undefined) updateData.estimatedCapacity = input.estimatedCapacity ? Number(input.estimatedCapacity) : null;

    if (input.onlinePlatform !== undefined) updateData.onlinePlatform = input.onlinePlatform ? input.onlinePlatform.trim() : null;
    if (input.onlineUrl !== undefined) updateData.onlineUrl = input.onlineUrl ? input.onlineUrl.trim() : null;
    if (input.onlineInstructions !== undefined) updateData.onlineInstructions = input.onlineInstructions ? input.onlineInstructions.trim() : null;

    // Date validations
    const effectiveStartAt = input.startAt !== undefined ? (input.startAt ? new Date(input.startAt) : null) : rawEvent.startAt;
    const effectiveEndAt = input.endAt !== undefined ? (input.endAt ? new Date(input.endAt) : null) : rawEvent.endAt;

    if (effectiveStartAt && effectiveEndAt) {
      if (effectiveEndAt.getTime() <= effectiveStartAt.getTime()) {
        throw new EventValidationError('A data de término deve ser posterior ao início do evento.');
      }
    }

    if (input.startAt !== undefined) updateData.startAt = input.startAt ? new Date(input.startAt) : null;
    if (input.endAt !== undefined) updateData.endAt = input.endAt ? new Date(input.endAt) : null;
    if (input.timezone !== undefined) updateData.timezone = input.timezone;
    if (input.hasMultipleSessions !== undefined) updateData.hasMultipleSessions = Boolean(input.hasMultipleSessions);

    if (input.coverDocumentId !== undefined) updateData.coverDocumentId = input.coverDocumentId;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.locale !== undefined) updateData.locale = input.locale;
    if (input.visibility !== undefined) updateData.visibility = input.visibility;
    if (input.allowSearchIndexing !== undefined) updateData.allowSearchIndexing = Boolean(input.allowSearchIndexing);

    // 5. Execute optimistic update
    const updated = await prisma.event.update({
      where: {
        id: eventId,
        version: input.version
      },
      data: updateData
    });

    // 6. Record Consolidated Audit
    await AuditService.log({
      userId: user.id,
      userName: user.email,
      action: 'EVENT_DRAFT_UPDATED',
      resource: 'Event',
      resourceId: eventId,
      producerId: rawEvent.producerId,
      eventId,
      details: {
        beforeVersion: rawEvent.version,
        afterVersion: updated.version,
        name: updated.name
      },
      result: 'SUCCESS'
    });

    // 7. Emit domain event
    await DomainEvents.dispatch({
      id: `evt_patch_${Date.now()}`,
      type: 'EVENT_UPDATED' as any,
      producerId: rawEvent.producerId,
      eventId,
      resourceType: 'EVENT',
      resourceId: eventId,
      actorUserId: user.id,
      data: { version: updated.version },
      timestamp: new Date()
    });

    const producer = await prisma.producer.findUnique({ where: { id: updated.producerId } });

    return {
      event: EventMapper.toDetail(updated, producer?.name),
      version: updated.version
    };
  }

  public static async discardDraft(user: AuthenticatedUser, eventId: string) {
    const rawEvent = await prisma.event.findUnique({ where: { id: eventId } });
    if (!rawEvent) {
      throw new EventNotFoundError(eventId);
    }

    // 1. Verify access
    EventAccessPolicy.verifyEventAccess(user, rawEvent);

    // 2. Status verification: ONLY DRAFT can be discarded
    if (rawEvent.status !== 'DRAFT') {
      throw new EventInvalidStatusError('Apenas eventos em status Rascunho (DRAFT) podem ser descartados.');
    }

    // 3. Soft Delete
    await prisma.event.update({
      where: { id: eventId },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
        status: 'ARCHIVED'
      }
    });

    // 4. Record Audit
    await AuditService.log({
      userId: user.id,
      userName: user.email,
      action: 'EVENT_DRAFT_DISCARDED',
      resource: 'Event',
      resourceId: eventId,
      producerId: rawEvent.producerId,
      eventId,
      details: {
        publicCode: rawEvent.publicCode
      },
      result: 'SUCCESS'
    });

    // 5. Emit domain event
    await DomainEvents.dispatch({
      id: `evt_discard_${Date.now()}`,
      type: 'EVENT_DRAFT_DISCARDED' as any,
      producerId: rawEvent.producerId,
      eventId,
      resourceType: 'EVENT',
      resourceId: eventId,
      actorUserId: user.id,
      data: { publicCode: rawEvent.publicCode },
      timestamp: new Date()
    });

    return {
      success: true,
      message: 'Rascunho descartado com sucesso.'
    };
  }

  public static async checkSlugAvailability(slug: string, excludeEventId?: string) {
    const cleanSlug = slug.trim().toLowerCase();
    const existing = await prisma.event.findFirst({
      where: {
        slug: cleanSlug,
        id: excludeEventId ? { not: excludeEventId } : undefined
      }
    });

    if (!existing) {
      return {
        available: true,
        slug: cleanSlug
      };
    }

    // Suggest available alternative
    let suggested = `${cleanSlug}-2`;
    let suffix = 2;
    while (await prisma.event.findFirst({ where: { slug: suggested } })) {
      suffix++;
      suggested = `${cleanSlug}-${suffix}`;
    }

    return {
      available: false,
      slug: cleanSlug,
      suggestedSlug: suggested
    };
  }
}
