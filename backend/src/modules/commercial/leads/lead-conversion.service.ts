import { prisma } from '../../../core/database/prisma';
import { AuditService } from '../../audit/audit.service';

export class LeadConversionService {
  /**
   * Converte uma prospecção (Lead) em um Produtor formal com idempotência e sem duplicidade de entidades
   */
  public static async convertLeadToProducer(
    leadId: string,
    user: any
  ): Promise<{ producerId: string; commercialAccountId: string }> {
    const lead = await prisma.commercialLead.findUnique({ where: { id: leadId } });
    if (!lead) {
      throw new Error(`Prospecção ${leadId} não encontrada.`);
    }

    // 1. Idempotência: Se já foi convertido anteriormente, retorna o produtor existente sem reexecutar
    if (lead.status === 'CONVERTED' && lead.convertedProducerId) {
      const existingAccount = await prisma.commercialAccount.findUnique({
        where: { producerId: lead.convertedProducerId }
      });
      return {
        producerId: lead.convertedProducerId,
        commercialAccountId: existingAccount?.id || ''
      };
    }

    // 2. Validação rigorosa de duplicidade de CNPJ contra Produtores do Core
    if (lead.cnpj && lead.cnpj.trim() !== '') {
      const cleanCnpj = lead.cnpj.replace(/\D/g, '');
      const existingProducers = await prisma.producer.findMany();
      const duplicateProducer = existingProducers.find(
        (p: any) => p.cnpj && p.cnpj.replace(/\D/g, '') === cleanCnpj
      );

      if (duplicateProducer) {
        throw new Error(
          `Impossível converter: o CNPJ "${lead.cnpj}" já pertence ao Produtor existente "${duplicateProducer.name}" (ID: ${duplicateProducer.id}).`
        );
      }
    }

    // 3. Criação da entidade mestre Producer no Core
    const newProducerId = `prd_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newProducer = await prisma.producer.create({
      data: {
        id: newProducerId,
        name: lead.tradeName || lead.companyName,
        cnpj: lead.cnpj || null,
        status: 'ACTIVE'
      }
    });

    // 4. Criação da extensão comercial B2B (CommercialAccount)
    const newAccount = await prisma.commercialAccount.create({
      data: {
        producerId: newProducer.id,
        commercialStatus: 'ACTIVE',
        commercialOwnerId: lead.ownerId || user.id,
        commercialOwnerName: lead.ownerName || user.name,
        segmentId: lead.segmentId || 'FESTIVAIS_SHOWS',
        commercialClassification: 'STANDARD',
        notesSummary: lead.notes || `Convertido a partir da prospecção "${lead.companyName}".`,
        firstContactAt: lead.createdAt,
        lastContactAt: new Date(),
        nextActionAt: null,
        nextActionDescription: null
      }
    });

    // 5. Se havia responsável na prospecção, adiciona à Carteira Comercial
    if (lead.ownerId) {
      await prisma.commercialPortfolioAssignment.create({
        data: {
          producerId: newProducer.id,
          userId: lead.ownerId,
          userName: lead.ownerName || 'Operador Comercial',
          userEmail: '',
          role: 'PRIMARY',
          assignedBy: user.id,
          active: true
        }
      });
    }

    // 6. Se o lead continha dados de contato, cria o contato comercial inicial
    if (lead.contactName && lead.contactName.trim() !== '') {
      await prisma.producerContact.create({
        data: {
          producerId: newProducer.id,
          name: lead.contactName.trim(),
          roleTitle: 'Contato Principal (Lead)',
          email: lead.contactEmail || null,
          phone: lead.contactPhone || null,
          isPrimary: true,
          canNegotiate: true,
          notes: 'Origem da prospecção comercial.',
          active: true
        }
      });
    }

    // 7. Migra eventuais oportunidades vinculadas ao Lead diretamente para o novo Produtor
    const leadOpportunities = await prisma.commercialOpportunity.findMany({
      where: { leadId: lead.id }
    });
    for (const opp of leadOpportunities) {
      await prisma.commercialOpportunity.update({
        where: { id: opp.id },
        data: { producerId: newProducer.id }
      });
    }

    // 8. Atualiza o Lead para CONVERTED com rastreabilidade
    await prisma.commercialLead.update({
      where: { id: lead.id },
      data: {
        status: 'CONVERTED',
        convertedProducerId: newProducer.id,
        convertedAt: new Date(),
        convertedBy: user.id
      }
    });

    // 9. Auditoria
    await AuditService.log({
      action: 'COMMERCIAL_LEAD_CONVERTED',
      resource: `lead:${lead.id}`,
      userId: user.id,
      details: {
        producerId: newProducer.id,
        producerName: newProducer.name,
        commercialAccountId: newAccount.id
      }
    });

    return {
      producerId: newProducer.id,
      commercialAccountId: newAccount.id
    };
  }
}
