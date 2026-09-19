import { prisma } from '../../../core/database/prisma';
import { AppError, ForbiddenError, NotFoundError } from '../../../core/errors/AppError';
import { AuthenticatedUser } from '../../../core/middleware/authenticate';
import { defaultStorageProvider, LocalStorageProvider } from '../storage/local.storage';
import { StorageProvider } from '../storage/storage.provider';
import { DocumentVersionService } from './document-version.service';
import { DocumentLinkService } from './document-link.service';
import { DocumentRetentionService } from './document-retention.service';
import { DocumentRequirementService } from './document-requirement.service';
import { SecurityScanService } from './security-scan.service';
import { AuditService } from '../../audit/audit.service';
import { EventBus } from '../../../events/event-bus';
import {
  UploadDocumentInput,
  CreateVersionInput,
  DocumentListFilters,
  DownloadUrlResult,
  DocumentDto,
  DocumentVersionDto,
  ValidateRequirementsInput,
  RequirementValidationResult
} from '../document.types';

export class DocumentService {
  private static storageProvider: StorageProvider = defaultStorageProvider;

  public static setStorageProvider(provider: StorageProvider): void {
    this.storageProvider = provider;
  }

  public static getStorageProvider(): StorageProvider {
    return this.storageProvider;
  }

  /**
   * Check if user is allowed to access document under Producer/Event scope isolation
   */
  public static verifyScope(document: any, user: AuthenticatedUser): void {
    if (user.isSuperAdmin) return;

    // 1. Check Producer Scope
    if (document.producerId && !user.scope?.isGlobal) {
      const allowedProducers = user.scope?.producers || [];
      if (!allowedProducers.includes(document.producerId)) {
        throw new ForbiddenError(
          'Acesso negado: Você não possui autorização para acessar documentos deste produtor.',
          { scopeIssue: 'PRODUCER_MISMATCH' }
        );
      }
    }

    // 2. Check Event Scope
    if (document.eventId && !user.scope?.isGlobal) {
      const allowedEvents = user.scope?.events || [];
      if (!allowedEvents.includes(document.eventId)) {
        throw new ForbiddenError(
          'Acesso negado: Você não possui autorização para acessar documentos deste evento.',
          { scopeIssue: 'EVENT_MISMATCH' }
        );
      }
    }

    // 3. Confidential documents check
    if (document.isConfidential) {
      const hasAuditorPerm = user.permissions.includes('documentos.auditoria.visualizar');
      if (!hasAuditorPerm) {
        throw new ForbiddenError(
          'Acesso negado: Este documento é confidencial e exige perfil de auditoria ou governança.',
          { scopeIssue: 'CONFIDENTIAL_ACCESS_DENIED' }
        );
      }
    }
  }

  /**
   * Upload single document with validation, checksum, versioning, links and audit
   */
  public static async uploadDocument(
    input: UploadDocumentInput,
    user: AuthenticatedUser,
    ipAddress?: string
  ): Promise<DocumentDto> {
    // 1. Resolve Category
    let category: any = null;
    if (input.categoryId) {
      category = await prisma.documentCategory.findUnique({ where: { id: input.categoryId } });
    } else if (input.categoryCode) {
      category = await prisma.documentCategory.findUnique({ where: { code: input.categoryCode } });
    }

    if (!category) {
      // Default fallback to 'OUTRO'
      category = await prisma.documentCategory.findUnique({ where: { code: 'OUTRO' } });
    }

    if (!category) {
      throw new AppError('Categoria documental inválida ou não encontrada.', 400);
    }

    // 2. Scope Validation for creation
    if (input.producerId && !user.isSuperAdmin && !user.scope?.isGlobal) {
      const allowedProducers = user.scope?.producers || [];
      if (!allowedProducers.includes(input.producerId)) {
        throw new ForbiddenError('Não autorizado a enviar documentos para este produtor.', {
          scopeIssue: 'PRODUCER_SCOPE_VIOLATION'
        });
      }
    }

    // 3. Security Scan
    const scan = SecurityScanService.scanFile(
      input.fileBuffer,
      input.originalFileName,
      input.mimeType,
      category
    );

    const initialStatus = scan.status === 'PASSED' ? 'AVAILABLE' : scan.status;

    // 4. Create Document Record
    const document = await prisma.document.create({
      data: {
        title: input.title,
        description: input.description || null,
        categoryId: category.id,
        producerId: input.producerId || null,
        eventId: input.eventId || null,
        status: initialStatus,
        isConfidential: input.isConfidential === true,
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        createdBy: user.id
      }
    });

    // 5. Create Initial Version (v1)
    const version = await DocumentVersionService.createInitialVersion(
      document.id,
      input.fileBuffer,
      input.originalFileName,
      input.mimeType,
      user.id,
      this.storageProvider,
      category
    );

    // 6. Update document with currentVersionId
    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: { currentVersionId: version.id },
      include: {
        category: true,
        versions: true,
        links: true
      }
    });

    // 7. Process Links (Producer, Event, and explicit links)
    if (input.producerId) {
      await DocumentLinkService.link(document.id, 'PRODUCER', input.producerId, input.producerId, input.eventId);
    }
    if (input.eventId) {
      await DocumentLinkService.link(document.id, 'EVENT', input.eventId, input.producerId, input.eventId);
    }
    if (input.links && Array.isArray(input.links)) {
      for (const link of input.links) {
        await DocumentLinkService.link(
          document.id,
          link.resourceType,
          link.resourceId,
          link.producerId || input.producerId,
          link.eventId || input.eventId
        );
      }
    }

    // 8. Process Tags
    if (input.tags && Array.isArray(input.tags)) {
      for (const tagName of input.tags) {
        if (!tagName || !tagName.trim()) continue;
        let tag = await prisma.documentTag.findUnique({ where: { name: tagName.trim() } });
        if (!tag) {
          tag = await prisma.documentTag.create({ data: { name: tagName.trim() } });
        }
        await prisma.documentTagLink.create({
          data: { documentId: document.id, tagId: tag.id }
        });
      }
    }

    // 9. Document Access Log
    await prisma.documentAccessLog.create({
      data: {
        documentId: document.id,
        versionId: version.id,
        userId: user.id,
        userName: user.name,
        action: scan.status === 'QUARANTINED' ? 'QUARANTINED' : 'VERSION_CREATE',
        ipAddress: ipAddress || '127.0.0.1'
      }
    });

    // 10. Audit Logging
    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'DOCUMENT_UPLOAD',
      resource: `Document:${document.id}`,
      producerId: input.producerId,
      eventId: input.eventId,
      details: {
        documentId: document.id,
        title: document.title,
        fileName: input.originalFileName,
        version: 1,
        checksum: version.checksum,
        status: initialStatus
      },
      ipAddress
    });

    // 11. Domain Events Dispatch
    if (scan.status === 'QUARANTINED') {
      await EventBus.publish({
        id: `evt_quar_${Date.now()}_${document.id}`,
        type: 'DOCUMENT_QUARANTINED',
        producerId: input.producerId,
        eventId: input.eventId,
        resourceType: 'DOCUMENT',
        resourceId: document.id,
        actorUserId: user.id,
        data: { documentId: document.id, threatName: scan.threatName, scanResult: scan.scanResult },
        timestamp: new Date()
      });
    } else {
      await EventBus.publish({
        id: `evt_doc_${Date.now()}_${document.id}`,
        type: 'DOCUMENT_UPLOADED',
        producerId: input.producerId,
        eventId: input.eventId,
        resourceType: 'DOCUMENT',
        resourceId: document.id,
        actorUserId: user.id,
        data: { documentId: document.id, title: document.title, categoryCode: category.code },
        timestamp: new Date()
      });
    }

    return updatedDocument;
  }

  /**
   * Upload multiple documents in batch
   */
  public static async uploadMultiple(
    files: UploadDocumentInput[],
    user: AuthenticatedUser,
    ipAddress?: string
  ): Promise<DocumentDto[]> {
    const results: DocumentDto[] = [];
    for (const fileInput of files) {
      const doc = await this.uploadDocument(fileInput, user, ipAddress);
      results.push(doc);
    }
    return results;
  }

  /**
   * Create a new version for an existing document
   */
  public static async createVersion(
    input: CreateVersionInput,
    user: AuthenticatedUser,
    ipAddress?: string
  ): Promise<{ document: DocumentDto; newVersion: DocumentVersionDto }> {
    const document = await prisma.document.findUnique({
      where: { id: input.documentId },
      include: { category: true }
    });

    if (!document || document.deletedAt) {
      throw new NotFoundError('Documento não encontrado ou foi excluído.');
    }

    // Scope check
    this.verifyScope(document, user);

    // Create next version
    const newVersion = await DocumentVersionService.createNextVersion(
      document.id,
      input.fileBuffer,
      input.originalFileName,
      input.mimeType,
      input.changeReason,
      user.id,
      this.storageProvider,
      document.category
    );

    // Access Log
    await prisma.documentAccessLog.create({
      data: {
        documentId: document.id,
        versionId: newVersion.id,
        userId: user.id,
        userName: user.name,
        action: 'VERSION_CREATE',
        ipAddress: ipAddress || '127.0.0.1'
      }
    });

    // Audit Log
    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'DOCUMENT_NEW_VERSION',
      resource: `Document:${document.id}`,
      producerId: document.producerId,
      eventId: document.eventId,
      details: {
        documentId: document.id,
        versionNumber: newVersion.version,
        changeReason: input.changeReason,
        checksum: newVersion.checksum
      },
      ipAddress
    });

    const refreshedDoc = await prisma.document.findUnique({
      where: { id: document.id },
      include: { category: true, versions: true, links: true }
    });

    return { document: refreshedDoc, newVersion };
  }

  /**
   * Get single document details with scope check & access logging
   */
  public static async getById(
    id: string,
    user: AuthenticatedUser,
    ipAddress?: string
  ): Promise<DocumentDto> {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        category: true,
        versions: true,
        links: true,
        accessLogs: true,
        tagLinks: true
      }
    });

    if (!document || document.deletedAt) {
      throw new NotFoundError('Documento não encontrado ou foi excluído.');
    }

    // Scope check: Producer A cannot view Producer B docs
    this.verifyScope(document, user);

    // Access Log
    await prisma.documentAccessLog.create({
      data: {
        documentId: document.id,
        versionId: document.currentVersionId || undefined,
        userId: user.id,
        userName: user.name,
        action: 'VIEW',
        ipAddress: ipAddress || '127.0.0.1'
      }
    });

    return document;
  }

  /**
   * Generate temporary expiring signed URL for download
   */
  public static async getDownloadUrl(
    documentId: string,
    user: AuthenticatedUser,
    versionId?: string,
    ipAddress?: string
  ): Promise<DownloadUrlResult> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { versions: true }
    });

    if (!document || document.deletedAt) {
      throw new NotFoundError('Documento não encontrado ou foi excluído.');
    }

    // Scope check
    this.verifyScope(document, user);

    // Block download if quarantined
    if (document.status === 'QUARANTINED' || document.status === 'REJECTED') {
      throw new ForbiddenError(
        'Download bloqueado: O arquivo está em quarentena por ameaça de segurança detectada.',
        { scopeIssue: 'DOCUMENT_IN_QUARANTINE' }
      );
    }

    // Find requested or current version
    let version: any = null;
    if (versionId) {
      version = document.versions.find((v: any) => v.id === versionId);
    } else {
      version = document.versions.find((v: any) => v.id === document.currentVersionId) || document.versions[0];
    }

    if (!version) {
      throw new NotFoundError('Versão solicitada do documento não foi encontrada.');
    }

    // Generate signed URL (expires in 15 minutes = 900 seconds)
    const expiresInSeconds = 900;
    const downloadUrl = await this.storageProvider.getSignedUrl(version.storageKey, expiresInSeconds);

    // Access Log
    await prisma.documentAccessLog.create({
      data: {
        documentId: document.id,
        versionId: version.id,
        userId: user.id,
        userName: user.name,
        action: 'DOWNLOAD',
        ipAddress: ipAddress || '127.0.0.1'
      }
    });

    // Audit Log
    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'DOCUMENT_DOWNLOAD',
      resource: `Document:${document.id}`,
      producerId: document.producerId,
      eventId: document.eventId,
      details: {
        documentId: document.id,
        version: version.version,
        checksum: version.checksum
      },
      ipAddress
    });

    return {
      downloadUrl,
      expiresInSeconds,
      documentId: document.id,
      versionId: version.id,
      versionNumber: version.version,
      originalFileName: version.originalFileName,
      mimeType: version.mimeType,
      checksum: version.checksum
    };
  }

  /**
   * Get preview details for document
   */
  public static async getPreview(
    documentId: string,
    user: AuthenticatedUser,
    versionId?: string,
    ipAddress?: string
  ): Promise<DownloadUrlResult> {
    const result = await this.getDownloadUrl(documentId, user, versionId, ipAddress);

    // Record preview in access log
    await prisma.documentAccessLog.create({
      data: {
        documentId,
        versionId: result.versionId,
        userId: user.id,
        userName: user.name,
        action: 'PREVIEW',
        ipAddress: ipAddress || '127.0.0.1'
      }
    });

    return result;
  }

  /**
   * List documents with scope filtering, search and pagination
   */
  public static async listDocuments(
    filters: DocumentListFilters,
    user: AuthenticatedUser
  ): Promise<{ data: DocumentDto[]; total: number; page: number; limit: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null
    };

    // 1. Mandatory Scope Enforcement
    if (!user.isSuperAdmin && !user.scope?.isGlobal) {
      const allowedProducers = user.scope?.producers || [];
      if (allowedProducers.length > 0) {
        where.OR = [
          { producerId: { in: allowedProducers } },
          { producerId: null } // System global templates
        ];
      } else if (filters.producerId) {
        where.producerId = filters.producerId;
      }
    } else {
      if (filters.producerId) {
        where.producerId = filters.producerId;
      }
    }

    if (filters.eventId) {
      where.eventId = filters.eventId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.isConfidential !== undefined) {
      where.isConfidential = filters.isConfidential;
    }

    // Filter by resource if requested
    if (filters.resourceType && filters.resourceId) {
      const docIds = await DocumentLinkService.getDocumentsByResource(
        filters.resourceType,
        filters.resourceId
      );
      where.id = { in: docIds };
    }

    // Search query
    if (filters.search && filters.search.trim()) {
      const s = filters.search.trim().toLowerCase();
      where.OR = [
        { title: { contains: s } },
        { description: { contains: s } }
      ];
    }

    const [total, data] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          versions: true,
          links: true
        }
      })
    ]);

    return {
      data,
      total,
      page,
      limit
    };
  }

  /**
   * Archive document
   */
  public static async archive(
    id: string,
    user: AuthenticatedUser,
    ipAddress?: string
  ): Promise<DocumentDto> {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document || document.deletedAt) {
      throw new NotFoundError('Documento não encontrado.');
    }

    this.verifyScope(document, user);

    const updated = await prisma.document.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: { category: true, versions: true, links: true }
    });

    await prisma.documentAccessLog.create({
      data: {
        documentId: id,
        userId: user.id,
        userName: user.name,
        action: 'ARCHIVE',
        ipAddress: ipAddress || '127.0.0.1'
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'DOCUMENT_ARCHIVE',
      resource: `Document:${id}`,
      producerId: document.producerId,
      eventId: document.eventId,
      details: { documentId: id, title: document.title },
      ipAddress
    });

    return updated;
  }

  /**
   * Soft delete document, strictly verifying legal retention policies
   */
  public static async softDelete(
    id: string,
    user: AuthenticatedUser,
    ipAddress?: string
  ): Promise<{ success: boolean; message: string; retention: any }> {
    const document = await prisma.document.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!document || document.deletedAt) {
      throw new NotFoundError('Documento não encontrado ou já excluído.');
    }

    this.verifyScope(document, user);

    // Evaluate Retention Policy
    const retention = await DocumentRetentionService.evaluateRetention(id);

    // Apply Soft Deletion (Never immediately purge database record or audit trail)
    await prisma.document.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date()
      }
    });

    await prisma.documentAccessLog.create({
      data: {
        documentId: id,
        userId: user.id,
        userName: user.name,
        action: 'DELETE',
        ipAddress: ipAddress || '127.0.0.1'
      }
    });

    await AuditService.log({
      userId: user.id,
      userName: user.name,
      action: 'DOCUMENT_SOFT_DELETE',
      resource: `Document:${id}`,
      producerId: document.producerId,
      eventId: document.eventId,
      details: {
        documentId: id,
        title: document.title,
        retentionDays: retention.retentionDays,
        daysRemaining: retention.daysRemaining
      },
      ipAddress
    });

    await EventBus.publish({
      id: `evt_deldoc_${Date.now()}_${id}`,
      type: 'DOCUMENT_DELETED',
      producerId: document.producerId,
      eventId: document.eventId,
      resourceType: 'DOCUMENT',
      resourceId: id,
      actorUserId: user.id,
      data: { documentId: id, title: document.title },
      timestamp: new Date()
    });

    return {
      success: true,
      message: 'Documento excluído logicamente com preservação de trilha de auditoria.',
      retention
    };
  }

  /**
   * Check for documents approaching validity expiration and trigger alert notifications
   */
  public static async checkExpiringDocuments(daysAhead = 7): Promise<DocumentDto[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const expiring = await prisma.document.findMany({
      where: {
        deletedAt: null,
        status: 'AVAILABLE',
        validUntil: {
          gt: now,
          lte: threshold
        }
      },
      include: { category: true, links: true }
    });

    for (const doc of expiring) {
      await EventBus.publish({
        id: `evt_exp_${Date.now()}_${doc.id}`,
        type: 'DOCUMENT_EXPIRING',
        producerId: doc.producerId,
        eventId: doc.eventId,
        resourceType: 'DOCUMENT',
        resourceId: doc.id,
        data: {
          documentId: doc.id,
          title: doc.title,
          categoryName: doc.category?.name || 'Documento',
          validUntil: doc.validUntil
        },
        timestamp: new Date()
      });
    }

    return expiring;
  }

  /**
   * Validate required documents for operations
   */
  public static async validateRequirements(
    input: ValidateRequirementsInput
  ): Promise<RequirementValidationResult> {
    return DocumentRequirementService.validateRequirements(input);
  }
}
