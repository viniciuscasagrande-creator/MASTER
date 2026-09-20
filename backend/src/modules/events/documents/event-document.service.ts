import { prisma } from '../../../core/database/prisma';
import {
  EventDocumentRequirementDTO,
  CreateDocumentRequirementInput,
  UploadEventDocumentInput,
  EventDocumentRequirementStatus
} from '@shared/types/index';

export class EventDocumentService {
  /**
   * Requisitos documentais padrão para eventos ao vivo
   */
  private static defaultRequirements = [
    {
      categoryCode: 'AVCB',
      categoryName: 'Auto de Vistoria do Corpo de Bombeiros (AVCB)',
      required: true,
      blocking: true,
      notes: 'Obrigatório para liberação de capacidade e alvará'
    },
    {
      categoryCode: 'ALVARA_PREFEITURA',
      categoryName: 'Alvará de Funcionamento e Localização da Prefeitura',
      required: true,
      blocking: true,
      notes: 'Alvará do município autorizando o evento para o público previsto'
    },
    {
      categoryCode: 'SEGURO_RESPONSABILIDADE',
      categoryName: 'Apólice de Seguro de Responsabilidade Civil',
      required: true,
      blocking: true,
      notes: 'Cobertura integral para público, artistas e estrutura operacional'
    },
    {
      categoryCode: 'CONTRATO_LOCACAO',
      categoryName: 'Contrato de Locação / Termo de Cessão do Espaço',
      required: true,
      blocking: false,
      notes: 'Contrato firmado entre a arena e a produtora'
    },
    {
      categoryCode: 'LAUDO_ENGENHARIA',
      categoryName: 'Anotação de Responsabilidade Técnica (ART / RRT) das Estruturas',
      required: true,
      blocking: true,
      notes: 'ART de montagem de palcos, tendas, gradis e arquibancadas temporárias'
    },
    {
      categoryCode: 'ECAD',
      categoryName: 'Comprovante / Protocolo de Arrecadação do ECAD',
      required: false,
      blocking: false,
      notes: 'Direitos autorais musicais para execução pública'
    }
  ];

  /**
   * Garante requisitos padrão e avalia vencimento
   */
  static async listRequirements(eventId: string): Promise<EventDocumentRequirementDTO[]> {
    let list = await prisma.eventDocumentRequirement.findMany({
      where: { eventId }
    });

    if (list.length === 0) {
      for (const def of this.defaultRequirements) {
        const created = await prisma.eventDocumentRequirement.create({
          data: {
            eventId,
            categoryCode: def.categoryCode,
            categoryName: def.categoryName,
            required: def.required,
            blocking: def.blocking,
            status: 'MISSING',
            notes: def.notes
          }
        });
        list.push(created);
      }
    }

    const now = Date.now();
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;

    return list.map((r: any) => {
      let currentStatus: EventDocumentRequirementStatus = r.status;

      // Avaliação temporal de validade
      if (r.validUntil && (r.status === 'VALID' || r.status === 'EXPIRING' || r.status === 'EXPIRED')) {
        const expiry = new Date(r.validUntil).getTime();
        if (expiry < now) {
          currentStatus = 'EXPIRED';
        } else if (expiry - now < fifteenDaysMs) {
          currentStatus = 'EXPIRING';
        }
      }

      return {
        id: r.id,
        eventId: r.eventId,
        categoryCode: r.categoryCode,
        categoryName: r.categoryName,
        required: r.required,
        blocking: r.blocking,
        validFrom: r.validFrom ? new Date(r.validFrom).toISOString() : null,
        validUntil: r.validUntil ? new Date(r.validUntil).toISOString() : null,
        status: currentStatus,
        linkedDocumentId: r.linkedDocumentId,
        linkedDocumentName: r.linkedDocumentName,
        linkedDocumentUrl: r.linkedDocumentUrl,
        fileSize: r.fileSize,
        rejectionReason: r.rejectionReason,
        notes: r.notes,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
      };
    });
  }

  static async createRequirement(eventId: string, input: CreateDocumentRequirementInput): Promise<EventDocumentRequirementDTO> {
    const created = await prisma.eventDocumentRequirement.create({
      data: {
        eventId,
        categoryCode: input.categoryCode,
        categoryName: input.categoryName,
        required: input.required !== undefined ? input.required : true,
        blocking: input.blocking !== undefined ? input.blocking : false,
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        status: 'MISSING',
        notes: input.notes || null
      }
    });

    return {
      id: created.id,
      eventId: created.eventId,
      categoryCode: created.categoryCode,
      categoryName: created.categoryName,
      required: created.required,
      blocking: created.blocking,
      validFrom: created.validFrom ? new Date(created.validFrom).toISOString() : null,
      validUntil: created.validUntil ? new Date(created.validUntil).toISOString() : null,
      status: created.status,
      linkedDocumentId: null,
      linkedDocumentName: null,
      linkedDocumentUrl: null,
      fileSize: null,
      rejectionReason: null,
      notes: created.notes,
      createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: created.updatedAt ? new Date(created.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  static async uploadDocument(eventId: string, input: UploadEventDocumentInput): Promise<EventDocumentRequirementDTO> {
    const req = await prisma.eventDocumentRequirement.findUnique({
      where: { id: input.requirementId }
    });
    if (!req || req.eventId !== eventId) {
      throw new Error('Requisito documental não encontrado para este evento');
    }

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const documentUrl = `/uploads/events/${eventId}/documents/${documentId}.pdf`;

    const updated = await prisma.eventDocumentRequirement.update({
      where: { id: input.requirementId },
      data: {
        linkedDocumentId: documentId,
        linkedDocumentName: input.documentName,
        linkedDocumentUrl: documentUrl,
        fileSize: input.fileSize || '1.8 MB',
        validFrom: input.validFrom ? new Date(input.validFrom) : (req.validFrom || new Date()),
        validUntil: input.validUntil ? new Date(input.validUntil) : req.validUntil,
        status: 'VALID',
        notes: input.notes || req.notes,
        rejectionReason: null
      }
    });

    return {
      id: updated.id,
      eventId: updated.eventId,
      categoryCode: updated.categoryCode,
      categoryName: updated.categoryName,
      required: updated.required,
      blocking: updated.blocking,
      validFrom: updated.validFrom ? new Date(updated.validFrom).toISOString() : null,
      validUntil: updated.validUntil ? new Date(updated.validUntil).toISOString() : null,
      status: updated.status,
      linkedDocumentId: updated.linkedDocumentId,
      linkedDocumentName: updated.linkedDocumentName,
      linkedDocumentUrl: updated.linkedDocumentUrl,
      fileSize: updated.fileSize,
      rejectionReason: updated.rejectionReason,
      notes: updated.notes,
      createdAt: updated.createdAt ? new Date(updated.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  static async updateRequirementStatus(
    requirementId: string,
    status: EventDocumentRequirementStatus,
    rejectionReason?: string
  ): Promise<EventDocumentRequirementDTO> {
    const updated = await prisma.eventDocumentRequirement.update({
      where: { id: requirementId },
      data: {
        status,
        rejectionReason: rejectionReason || null
      }
    });

    return {
      id: updated.id,
      eventId: updated.eventId,
      categoryCode: updated.categoryCode,
      categoryName: updated.categoryName,
      required: updated.required,
      blocking: updated.blocking,
      validFrom: updated.validFrom ? new Date(updated.validFrom).toISOString() : null,
      validUntil: updated.validUntil ? new Date(updated.validUntil).toISOString() : null,
      status: updated.status,
      linkedDocumentId: updated.linkedDocumentId,
      linkedDocumentName: updated.linkedDocumentName,
      linkedDocumentUrl: updated.linkedDocumentUrl,
      fileSize: updated.fileSize,
      rejectionReason: updated.rejectionReason,
      notes: updated.notes,
      createdAt: updated.createdAt ? new Date(updated.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : new Date().toISOString()
    };
  }
}
