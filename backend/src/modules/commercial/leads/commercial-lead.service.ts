import { prisma } from '../../../core/database/prisma';
import { AuditService } from '../../audit/audit.service';
import { CommercialLeadDTO, CommercialLeadStatus } from '../../../../../shared/types';

export class CommercialLeadService {
  /**
   * Listagem de prospecções com filtros
   */
  public static async listLeads(
    filter: { search?: string; status?: string; ownerId?: string },
    user: any
  ): Promise<CommercialLeadDTO[]> {
    let list = await prisma.commercialLead.findMany();

    if (filter.search && filter.search.trim() !== '') {
      const s = filter.search.toLowerCase().trim();
      list = list.filter(
        (l: any) =>
          l.companyName.toLowerCase().includes(s) ||
          (l.tradeName && l.tradeName.toLowerCase().includes(s)) ||
          (l.cnpj && l.cnpj.replace(/\D/g, '').includes(s.replace(/\D/g, ''))) ||
          (l.contactName && l.contactName.toLowerCase().includes(s))
      );
    }

    if (filter.status && filter.status !== 'ALL') {
      list = list.filter((l: any) => l.status === filter.status);
    }

    if (filter.ownerId && filter.ownerId !== 'ALL') {
      list = list.filter((l: any) => l.ownerId === filter.ownerId);
    }

    return list.map((l: any) => ({
      id: l.id,
      companyName: l.companyName,
      tradeName: l.tradeName,
      cnpj: l.cnpj,
      city: l.city,
      state: l.state,
      segmentId: l.segmentId,
      contactName: l.contactName,
      contactEmail: l.contactEmail,
      contactPhone: l.contactPhone,
      origin: l.origin,
      ownerId: l.ownerId,
      ownerName: l.ownerName,
      status: l.status as CommercialLeadStatus,
      convertedProducerId: l.convertedProducerId,
      convertedAt: l.convertedAt ? new Date(l.convertedAt).toISOString() : undefined,
      convertedBy: l.convertedBy,
      notes: l.notes,
      createdAt: new Date(l.createdAt).toISOString(),
      updatedAt: new Date(l.updatedAt).toISOString()
    }));
  }

  /**
   * Busca Lead por ID
   */
  public static async getLeadById(id: string, user: any): Promise<CommercialLeadDTO> {
    const lead = await prisma.commercialLead.findUnique({ where: { id } });
    if (!lead) throw new Error(`Prospecção ${id} não encontrada.`);

    return {
      id: lead.id,
      companyName: lead.companyName,
      tradeName: lead.tradeName,
      cnpj: lead.cnpj,
      city: lead.city,
      state: lead.state,
      segmentId: lead.segmentId,
      contactName: lead.contactName,
      contactEmail: lead.contactEmail,
      contactPhone: lead.contactPhone,
      origin: lead.origin,
      ownerId: lead.ownerId,
      ownerName: lead.ownerName,
      status: lead.status as CommercialLeadStatus,
      convertedProducerId: lead.convertedProducerId,
      convertedAt: lead.convertedAt ? new Date(lead.convertedAt).toISOString() : undefined,
      convertedBy: lead.convertedBy,
      notes: lead.notes,
      createdAt: new Date(lead.createdAt).toISOString(),
      updatedAt: new Date(lead.updatedAt).toISOString()
    };
  }

  /**
   * Cria nova prospecção com validação de duplicidade de CNPJ
   */
  public static async createLead(
    input: {
      companyName: string;
      tradeName?: string;
      cnpj?: string;
      city?: string;
      state?: string;
      segmentId?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      origin?: string;
      ownerId?: string;
      ownerName?: string;
      notes?: string;
    },
    user: any
  ): Promise<CommercialLeadDTO> {
    if (!input.companyName || input.companyName.trim() === '') {
      throw new Error('Razão Social ou Nome da Empresa é obrigatório.');
    }

    if (input.cnpj && input.cnpj.trim() !== '') {
      const cleanCnpj = input.cnpj.replace(/\D/g, '');

      // 1. Verifica duplicidade em Produtores existentes no Core
      const existingProducers = await prisma.producer.findMany();
      const duplicateProducer = existingProducers.find((p: any) => p.cnpj && p.cnpj.replace(/\D/g, '') === cleanCnpj);
      if (duplicateProducer) {
        throw new Error(`Este CNPJ já pertence ao Produtor cadastrado "${duplicateProducer.name}" (ID: ${duplicateProducer.id}).`);
      }

      // 2. Verifica duplicidade em outras prospecções ativas
      const existingLeads = await prisma.commercialLead.findMany();
      const duplicateLead = existingLeads.find(
        (l: any) => l.cnpj && l.cnpj.replace(/\D/g, '') === cleanCnpj && l.status !== 'DISQUALIFIED'
      );
      if (duplicateLead) {
        throw new Error(`Já existe uma prospecção ativa com este CNPJ: "${duplicateLead.companyName}" (Responsável: ${duplicateLead.ownerName || 'Não atribuído'}).`);
      }
    }

    const created = await prisma.commercialLead.create({
      data: {
        companyName: input.companyName.trim(),
        tradeName: input.tradeName ? input.tradeName.trim() : null,
        cnpj: input.cnpj ? input.cnpj.trim() : null,
        city: input.city || null,
        state: input.state || null,
        segmentId: input.segmentId || 'FESTIVAIS_SHOWS',
        contactName: input.contactName || null,
        contactEmail: input.contactEmail || null,
        contactPhone: input.contactPhone || null,
        origin: input.origin || 'DIRECT',
        ownerId: input.ownerId || user.id,
        ownerName: input.ownerName || user.name,
        status: 'NEW',
        notes: input.notes || null
      }
    });

    await AuditService.log({
      action: 'COMMERCIAL_LEAD_CREATED',
      resource: `lead:${created.id}`,
      userId: user.id,
      details: { companyName: created.companyName, cnpj: created.cnpj }
    });

    return {
      id: created.id,
      companyName: created.companyName,
      tradeName: created.tradeName,
      cnpj: created.cnpj,
      city: created.city,
      state: created.state,
      segmentId: created.segmentId,
      contactName: created.contactName,
      contactEmail: created.contactEmail,
      contactPhone: created.contactPhone,
      origin: created.origin,
      ownerId: created.ownerId,
      ownerName: created.ownerName,
      status: created.status as CommercialLeadStatus,
      convertedProducerId: created.convertedProducerId,
      convertedAt: created.convertedAt ? new Date(created.convertedAt).toISOString() : undefined,
      convertedBy: created.convertedBy,
      notes: created.notes,
      createdAt: new Date(created.createdAt).toISOString(),
      updatedAt: new Date(created.updatedAt).toISOString()
    };
  }

  /**
   * Atualização de prospecção
   */
  public static async updateLead(
    id: string,
    data: Partial<CommercialLeadDTO>,
    user: any
  ): Promise<CommercialLeadDTO> {
    const existing = await prisma.commercialLead.findUnique({ where: { id } });
    if (!existing) throw new Error(`Prospecção ${id} não encontrada.`);

    if (existing.status === 'CONVERTED' && data.status && data.status !== 'CONVERTED') {
      throw new Error('Prospecção já convertida em produtor não pode ter o status alterado.');
    }

    const updated = await prisma.commercialLead.update({
      where: { id },
      data: {
        ...(data.companyName && { companyName: data.companyName.trim() }),
        ...(data.tradeName !== undefined && { tradeName: data.tradeName }),
        ...(data.cnpj !== undefined && { cnpj: data.cnpj }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.segmentId !== undefined && { segmentId: data.segmentId }),
        ...(data.contactName !== undefined && { contactName: data.contactName }),
        ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
        ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
        ...(data.origin !== undefined && { origin: data.origin }),
        ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
        ...(data.ownerName !== undefined && { ownerName: data.ownerName }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes })
      }
    });

    await AuditService.log({
      action: 'COMMERCIAL_LEAD_UPDATED',
      resource: `lead:${id}`,
      userId: user.id,
      details: { changes: data }
    });

    return {
      id: updated.id,
      companyName: updated.companyName,
      tradeName: updated.tradeName,
      cnpj: updated.cnpj,
      city: updated.city,
      state: updated.state,
      segmentId: updated.segmentId,
      contactName: updated.contactName,
      contactEmail: updated.contactEmail,
      contactPhone: updated.contactPhone,
      origin: updated.origin,
      ownerId: updated.ownerId,
      ownerName: updated.ownerName,
      status: updated.status as CommercialLeadStatus,
      convertedProducerId: updated.convertedProducerId,
      convertedAt: updated.convertedAt ? new Date(updated.convertedAt).toISOString() : undefined,
      convertedBy: updated.convertedBy,
      notes: updated.notes,
      createdAt: new Date(updated.createdAt).toISOString(),
      updatedAt: new Date(updated.updatedAt).toISOString()
    };
  }

  /**
   * Exclusão ou desqualificação de prospecção
   */
  public static async deleteLead(id: string, user: any): Promise<void> {
    const existing = await prisma.commercialLead.findUnique({ where: { id } });
    if (!existing) throw new Error(`Prospecção ${id} não encontrada.`);
    if (existing.status === 'CONVERTED') {
      throw new Error('Prospecção convertida em produtor não pode ser excluída.');
    }

    await prisma.commercialLead.update({
      where: { id },
      data: { status: 'DISQUALIFIED' }
    });

    await AuditService.log({
      action: 'COMMERCIAL_LEAD_DISQUALIFIED',
      resource: `lead:${id}`,
      userId: user.id,
      details: { companyName: existing.companyName }
    });
  }
}
