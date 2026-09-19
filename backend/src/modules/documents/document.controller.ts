import { Request, Response, NextFunction } from 'express';
import { DocumentService } from './services/document.service';
import { DocumentVersionService } from './services/document-version.service';
import { DocumentLinkService } from './services/document-link.service';
import { prisma } from '../../core/database/prisma';
import { AppError } from '../../core/errors/AppError';
import { UploadDocumentInput, CreateVersionInput } from './document.types';

export class DocumentController {
  /**
   * Upload single document
   */
  public static async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const body = req.body;

      let fileBuffer: Buffer;
      if (body.fileContent) {
        // Base64 content
        const base64Data = body.fileContent.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else if ((req as any).file && (req as any).file.buffer) {
        fileBuffer = (req as any).file.buffer;
      } else {
        throw new AppError('Conteúdo do arquivo não fornecido.', 400);
      }

      const input: UploadDocumentInput = {
        title: body.title || body.fileName || 'Documento sem título',
        description: body.description,
        categoryId: body.categoryId,
        categoryCode: body.categoryCode,
        producerId: body.producerId,
        eventId: body.eventId,
        isConfidential: body.isConfidential === true || body.isConfidential === 'true',
        validFrom: body.validFrom,
        validUntil: body.validUntil,
        links: body.links,
        tags: body.tags,
        fileBuffer,
        originalFileName: body.fileName || 'arquivo.bin',
        mimeType: body.mimeType || 'application/octet-stream'
      };

      const document = await DocumentService.uploadDocument(input, user, req.ip);

      res.status(201).json({
        success: true,
        message: 'Documento enviado e processado com sucesso.',
        document
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Upload multiple documents in batch
   */
  public static async uploadMultiple(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { files, commonData } = req.body;

      if (!files || !Array.isArray(files) || files.length === 0) {
        throw new AppError('Nenhum arquivo enviado para upload múltiplo.', 400);
      }

      const inputs: UploadDocumentInput[] = files.map((f: any) => {
        let fileBuffer: Buffer;
        if (f.fileContent) {
          const base64Data = f.fileContent.replace(/^data:([A-Za-z-+/]+);base64,/, '');
          fileBuffer = Buffer.from(base64Data, 'base64');
        } else {
          fileBuffer = Buffer.from(f.content || '', 'utf-8');
        }

        return {
          title: f.title || f.fileName || 'Documento',
          description: f.description || commonData?.description,
          categoryId: f.categoryId || commonData?.categoryId,
          categoryCode: f.categoryCode || commonData?.categoryCode,
          producerId: f.producerId || commonData?.producerId,
          eventId: f.eventId || commonData?.eventId,
          isConfidential: f.isConfidential ?? commonData?.isConfidential ?? false,
          validFrom: f.validFrom || commonData?.validFrom,
          validUntil: f.validUntil || commonData?.validUntil,
          links: f.links || commonData?.links,
          tags: f.tags || commonData?.tags,
          fileBuffer,
          originalFileName: f.fileName || 'arquivo.bin',
          mimeType: f.mimeType || 'application/octet-stream'
        };
      });

      const uploaded = await DocumentService.uploadMultiple(inputs, user, req.ip);

      res.status(201).json({
        success: true,
        message: `${uploaded.length} documentos enviados com sucesso.`,
        count: uploaded.length,
        documents: uploaded
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create new immutable version of document
   */
  public static async createVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const documentId = String(req.params.id);
      const body = req.body;

      let fileBuffer: Buffer;
      if (body.fileContent) {
        const base64Data = body.fileContent.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else if ((req as any).file && (req as any).file.buffer) {
        fileBuffer = (req as any).file.buffer;
      } else {
        throw new AppError('Conteúdo do novo arquivo não fornecido.', 400);
      }

      const input: CreateVersionInput = {
        documentId,
        fileBuffer,
        originalFileName: body.fileName || 'nova_versao.bin',
        mimeType: body.mimeType || 'application/octet-stream',
        changeReason: body.changeReason
      };

      const result = await DocumentService.createVersion(input, user, req.ip);

      res.status(201).json({
        success: true,
        message: `Nova versão v${result.newVersion.version} registrada com sucesso.`,
        ...result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get document by ID
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const document = await DocumentService.getById(String(req.params.id), user, req.ip);
      res.json(document);
    } catch (err) {
      next(err);
    }
  }

  /**
   * List documents with filters
   */
  public static async listDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const q = req.query;

      const result = await DocumentService.listDocuments(
        {
          search: q.search as string,
          categoryId: q.categoryId as string,
          categoryCode: q.categoryCode as string,
          producerId: q.producerId as string,
          eventId: q.eventId as string,
          status: q.status as any,
          resourceType: q.resourceType as any,
          resourceId: q.resourceId as string,
          isConfidential: q.isConfidential ? q.isConfidential === 'true' : undefined,
          page: q.page ? parseInt(q.page as string, 10) : 1,
          limit: q.limit ? parseInt(q.limit as string, 10) : 20
        },
        user
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get signed temporary URL for download
   */
  public static async getDownloadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const versionId = req.query.versionId ? String(req.query.versionId) : undefined;

      const result = await DocumentService.getDownloadUrl(String(req.params.id), user, versionId, req.ip);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get signed temporary URL for preview
   */
  public static async getPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const versionId = req.query.versionId ? String(req.query.versionId) : undefined;

      const result = await DocumentService.getPreview(String(req.params.id), user, versionId, req.ip);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Direct download endpoint verifying signed URL signature and expiration
   */
  public static async downloadSigned(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const key = req.query.key as string;
      const expires = parseInt(req.query.expires as string, 10);
      const sig = req.query.sig as string;

      if (!key || !expires || !sig) {
        res.status(401).json({ error: 'URL temporária inválida ou parâmetros ausentes.' });
        return;
      }

      const storage = DocumentService.getStorageProvider();
      const isValid = storage.verifySignedUrl(key, expires, sig);

      if (!isValid) {
        res.status(403).json({ error: 'Link de download expirado ou assinatura inválida.' });
        return;
      }

      const buffer = await storage.download(key);
      const fileName = key.split('/').pop() || 'documento.bin';

      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Archive document
   */
  public static async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const updated = await DocumentService.archive(String(req.params.id), user, req.ip);
      res.json({
        success: true,
        message: 'Documento arquivado com sucesso.',
        document: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Soft delete document
   */
  public static async softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const result = await DocumentService.softDelete(String(req.params.id), user, req.ip);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * List document versions
   */
  public static async listVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const document = await DocumentService.getById(String(req.params.id), user, req.ip);
      const versions = await DocumentVersionService.listVersions(document.id);
      res.json(versions);
    } catch (err) {
      next(err);
    }
  }

  /**
   * List document links
   */
  public static async listLinks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      await DocumentService.getById(String(req.params.id), user, req.ip);
      const links = await DocumentLinkService.listLinks(String(req.params.id));
      res.json(links);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Add resource link
   */
  public static async linkResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { resourceType, resourceId, producerId, eventId } = req.body;
      await DocumentService.getById(String(req.params.id), user, req.ip);

      const link = await DocumentLinkService.link(
        String(req.params.id),
        resourceType,
        resourceId,
        producerId,
        eventId
      );

      res.status(201).json(link);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Remove resource link
   */
  public static async unlinkResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      await DocumentService.getById(String(req.params.id), user, req.ip);
      await DocumentLinkService.unlink(String(req.params.id), String(req.params.linkId));
      res.json({ success: true, message: 'Vínculo removido com sucesso.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get documents by resource (e.g. /resources/:resourceType/:resourceId/documents)
   */
  public static async getByResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const resourceType = String(req.params.resourceType);
      const resourceId = String(req.params.resourceId);

      const result = await DocumentService.listDocuments(
        {
          resourceType: resourceType as any,
          resourceId,
          page: 1,
          limit: 100
        },
        user
      );

      res.json(result.data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * List document categories
   */
  public static async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await prisma.documentCategory.findMany();
      res.json(categories);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Validate required documents
   */
  public static async validateRequirements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { operation, amount, producerId, eventId, linkedCategoryCodes } = req.body;

      const result = await DocumentService.validateRequirements({
        operation,
        amount: amount ? Number(amount) : undefined,
        producerId,
        eventId,
        linkedCategoryCodes: linkedCategoryCodes || []
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Trigger scan for expiring documents
   */
  public static async checkExpiring(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const daysAhead = req.query.days ? parseInt(req.query.days as string, 10) : 7;
      const expiring = await DocumentService.checkExpiringDocuments(daysAhead);
      res.json({ count: expiring.length, expiring });
    } catch (err) {
      next(err);
    }
  }
}
