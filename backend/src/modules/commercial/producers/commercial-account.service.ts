import { prisma } from '../../../core/database/prisma';
import { AuditService } from '../../audit/audit.service';
import { CommercialAccountDTO, ProducerContactDTO, CommercialStatus } from '../../../../../shared/types';

export class CommercialAccountService {
  /**
   * Obtém a conta comercial do produtor ou cria uma vazia inicial se não existir
   */
  public static async getCommercialAccount(producerId: string): Promise<CommercialAccountDTO | null> {
    const producer = await prisma.producer.findUnique({ where: { id: producerId } });
    if (!producer) return null;

    let account = await prisma.commercialAccount.findUnique({ where: { producerId } });
    if (!account) {
      // Conta inicial padrão vinculada ao produtor mestre
      account = await prisma.commercialAccount.create({
        data: {
          producerId,
          commercialStatus: 'ACTIVE',
          commercialClassification: 'STANDARD',
          segmentId: 'FESTIVAIS_SHOWS',
          notesSummary: null,
          firstContactAt: null,
          lastContactAt: null,
          nextActionAt: null,
          nextActionDescription: null
        }
      });
    }

    return {
      id: account.id,
      producerId: account.producerId,
      commercialStatus: account.commercialStatus,
      commercialOwnerId: account.commercialOwnerId,
      commercialOwnerName: account.commercialOwnerName,
      segmentId: account.segmentId,
      commercialClassification: account.commercialClassification,
      firstContactAt: account.firstContactAt ? new Date(account.firstContactAt).toISOString() : undefined,
      lastContactAt: account.lastContactAt ? new Date(account.lastContactAt).toISOString() : undefined,
      nextActionAt: account.nextActionAt ? new Date(account.nextActionAt).toISOString() : undefined,
      nextActionDescription: account.nextActionDescription,
      notesSummary: account.notesSummary,
      version: account.version,
      createdAt: new Date(account.createdAt).toISOString(),
      updatedAt: new Date(account.updatedAt).toISOString()
    };
  }

  /**
   * Atualiza ou cadastra detalhes comerciais do produtor
   */
  public static async updateCommercialAccount(
    producerId: string,
    data: {
      commercialStatus?: CommercialStatus;
      commercialOwnerId?: string;
      commercialOwnerName?: string;
      segmentId?: string;
      commercialClassification?: string;
      notesSummary?: string;
      nextActionAt?: string | null;
      nextActionDescription?: string | null;
      expectedVersion?: number;
    },
    user: any
  ): Promise<CommercialAccountDTO> {
    const existing = await prisma.commercialAccount.findUnique({ where: { producerId } });
    if (!existing) {
      const created = await prisma.commercialAccount.create({
        data: {
          producerId,
          commercialStatus: data.commercialStatus || 'ACTIVE',
          commercialOwnerId: data.commercialOwnerId || null,
          commercialOwnerName: data.commercialOwnerName || null,
          segmentId: data.segmentId || 'FESTIVAIS_SHOWS',
          commercialClassification: data.commercialClassification || 'STANDARD',
          notesSummary: data.notesSummary || null,
          nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : null,
          nextActionDescription: data.nextActionDescription || null
        }
      });

      await AuditService.log({
        action: 'COMMERCIAL_ACCOUNT_CREATED',
        resource: `producer:${producerId}`,
        userId: user.id,
        details: { changes: data }
      });

      return {
        id: created.id,
        producerId: created.producerId,
        commercialStatus: created.commercialStatus,
        commercialOwnerId: created.commercialOwnerId,
        commercialOwnerName: created.commercialOwnerName,
        segmentId: created.segmentId,
        commercialClassification: created.commercialClassification,
        firstContactAt: created.firstContactAt ? new Date(created.firstContactAt).toISOString() : undefined,
        lastContactAt: created.lastContactAt ? new Date(created.lastContactAt).toISOString() : undefined,
        nextActionAt: created.nextActionAt ? new Date(created.nextActionAt).toISOString() : undefined,
        nextActionDescription: created.nextActionDescription,
        notesSummary: created.notesSummary,
        version: created.version,
        createdAt: new Date(created.createdAt).toISOString(),
        updatedAt: new Date(created.updatedAt).toISOString()
      };
    }

    if (data.expectedVersion !== undefined && existing.version !== data.expectedVersion) {
      throw new Error('Conflito de versão ao atualizar conta comercial (409)');
    }

    const updated = await prisma.commercialAccount.update({
      where: { producerId },
      data: {
        ...(data.commercialStatus && { commercialStatus: data.commercialStatus }),
        ...(data.commercialOwnerId !== undefined && { commercialOwnerId: data.commercialOwnerId }),
        ...(data.commercialOwnerName !== undefined && { commercialOwnerName: data.commercialOwnerName }),
        ...(data.segmentId && { segmentId: data.segmentId }),
        ...(data.commercialClassification && { commercialClassification: data.commercialClassification }),
        ...(data.notesSummary !== undefined && { notesSummary: data.notesSummary }),
        ...(data.nextActionAt !== undefined && { nextActionAt: data.nextActionAt ? new Date(data.nextActionAt) : null }),
        ...(data.nextActionDescription !== undefined && { nextActionDescription: data.nextActionDescription })
      }
    });

    await AuditService.log({
      action: 'COMMERCIAL_ACCOUNT_UPDATED',
      resource: `producer:${producerId}`,
      userId: user.id,
      details: { changes: data, previousVersion: existing.version, newVersion: updated.version }
    });

    return {
      id: updated.id,
      producerId: updated.producerId,
      commercialStatus: updated.commercialStatus,
      commercialOwnerId: updated.commercialOwnerId,
      commercialOwnerName: updated.commercialOwnerName,
      segmentId: updated.segmentId,
      commercialClassification: updated.commercialClassification,
      firstContactAt: updated.firstContactAt ? new Date(updated.firstContactAt).toISOString() : undefined,
      lastContactAt: updated.lastContactAt ? new Date(updated.lastContactAt).toISOString() : undefined,
      nextActionAt: updated.nextActionAt ? new Date(updated.nextActionAt).toISOString() : undefined,
      nextActionDescription: updated.nextActionDescription,
      notesSummary: updated.notesSummary,
      version: updated.version,
      createdAt: new Date(updated.createdAt).toISOString(),
      updatedAt: new Date(updated.updatedAt).toISOString()
    };
  }

  /**
   * Contatos comerciais do produtor
   */
  public static async listContacts(producerId: string): Promise<ProducerContactDTO[]> {
    const contacts = await prisma.producerContact.findMany({
      where: { producerId, active: true }
    });

    return contacts.map((c: any) => ({
      id: c.id,
      producerId: c.producerId,
      name: c.name,
      roleTitle: c.roleTitle,
      email: c.email,
      phone: c.phone,
      isPrimary: c.isPrimary,
      canNegotiate: c.canNegotiate,
      notes: c.notes,
      active: c.active,
      createdAt: new Date(c.createdAt).toISOString(),
      updatedAt: new Date(c.updatedAt).toISOString()
    }));
  }

  public static async addContact(
    producerId: string,
    data: {
      name: string;
      roleTitle?: string;
      email?: string;
      phone?: string;
      isPrimary?: boolean;
      canNegotiate?: boolean;
      notes?: string;
    },
    user: any
  ): Promise<ProducerContactDTO> {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Nome do contato é obrigatório.');
    }

    if (data.isPrimary) {
      // Desmarca contato primário anterior
      const existing = await prisma.producerContact.findMany({ where: { producerId, isPrimary: true } });
      for (const ex of existing) {
        await prisma.producerContact.update({ where: { id: ex.id }, data: { isPrimary: false } });
      }
    }

    const created = await prisma.producerContact.create({
      data: {
        producerId,
        name: data.name.trim(),
        roleTitle: data.roleTitle || null,
        email: data.email || null,
        phone: data.phone || null,
        isPrimary: data.isPrimary || false,
        canNegotiate: data.canNegotiate !== undefined ? data.canNegotiate : true,
        notes: data.notes || null,
        active: true
      }
    });

    await AuditService.log({
      action: 'PRODUCER_CONTACT_CREATED',
      resource: `producer:${producerId}:contact:${created.id}`,
      userId: user.id,
      details: { contactName: created.name, role: created.roleTitle }
    });

    return {
      id: created.id,
      producerId: created.producerId,
      name: created.name,
      roleTitle: created.roleTitle,
      email: created.email,
      phone: created.phone,
      isPrimary: created.isPrimary,
      canNegotiate: created.canNegotiate,
      notes: created.notes,
      active: created.active,
      createdAt: new Date(created.createdAt).toISOString(),
      updatedAt: new Date(created.updatedAt).toISOString()
    };
  }

  public static async updateContact(
    contactId: string,
    data: Partial<ProducerContactDTO>,
    user: any
  ): Promise<ProducerContactDTO> {
    const existing = await prisma.producerContact.findUnique({ where: { id: contactId } });
    if (!existing) throw new Error('Contato não encontrado.');

    if (data.isPrimary && !existing.isPrimary) {
      const existingPrimary = await prisma.producerContact.findMany({ where: { producerId: existing.producerId, isPrimary: true } });
      for (const ex of existingPrimary) {
        await prisma.producerContact.update({ where: { id: ex.id }, data: { isPrimary: false } });
      }
    }

    const updated = await prisma.producerContact.update({
      where: { id: contactId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.roleTitle !== undefined && { roleTitle: data.roleTitle }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
        ...(data.canNegotiate !== undefined && { canNegotiate: data.canNegotiate }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.active !== undefined && { active: data.active })
      }
    });

    await AuditService.log({
      action: 'PRODUCER_CONTACT_UPDATED',
      resource: `producer:${existing.producerId}:contact:${contactId}`,
      userId: user.id,
      details: { changes: data }
    });

    return {
      id: updated.id,
      producerId: updated.producerId,
      name: updated.name,
      roleTitle: updated.roleTitle,
      email: updated.email,
      phone: updated.phone,
      isPrimary: updated.isPrimary,
      canNegotiate: updated.canNegotiate,
      notes: updated.notes,
      active: updated.active,
      createdAt: new Date(updated.createdAt).toISOString(),
      updatedAt: new Date(updated.updatedAt).toISOString()
    };
  }

  public static async deleteContact(contactId: string, user: any): Promise<void> {
    const existing = await prisma.producerContact.findUnique({ where: { id: contactId } });
    if (!existing) throw new Error('Contato não encontrado.');

    await prisma.producerContact.update({
      where: { id: contactId },
      data: { active: false }
    });

    await AuditService.log({
      action: 'PRODUCER_CONTACT_DEACTIVATED',
      resource: `producer:${existing.producerId}:contact:${contactId}`,
      userId: user.id,
      details: { contactName: existing.name }
    });
  }
}
