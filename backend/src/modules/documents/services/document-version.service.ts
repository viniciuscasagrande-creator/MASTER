import { prisma } from '../../../core/database/prisma';
import { AppError } from '../../../core/errors/AppError';
import { StorageProvider } from '../storage/storage.provider';
import { SecurityScanService } from './security-scan.service';
import { DocumentVersionDto } from '../document.types';

export class DocumentVersionService {
  /**
   * Creates the initial version (v1) of a document
   */
  public static async createInitialVersion(
    documentId: string,
    fileBuffer: Buffer,
    originalFileName: string,
    declaredMimeType: string,
    uploadedByUserId: string,
    storageProvider: StorageProvider,
    category?: any
  ): Promise<DocumentVersionDto> {
    // 1. Security Scan
    const scan = SecurityScanService.scanFile(fileBuffer, originalFileName, declaredMimeType, category);

    // 2. Storage Upload with SHA-256 Checksum
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `docs/${year}/${month}/${documentId}_v1_${sanitizedName}`;

    const uploadResult = await storageProvider.upload(storageKey, fileBuffer, scan.detectedMimeType);

    // 3. Persist Version 1
    const version = await prisma.documentVersion.create({
      data: {
        documentId,
        version: 1,
        storageKey: uploadResult.storageKey,
        originalFileName,
        mimeType: scan.detectedMimeType,
        size: uploadResult.size,
        checksumAlgorithm: uploadResult.checksumAlgorithm,
        checksum: uploadResult.checksum,
        changeReason: 'Versão inicial do documento',
        uploadedByUserId
      }
    });

    // 4. Record Security Check Result
    await prisma.documentSecurityCheck.create({
      data: {
        versionId: version.id,
        status: scan.status,
        scanResult: scan.scanResult,
        threatName: scan.threatName || null
      }
    });

    return version;
  }

  /**
   * Creates an immutable subsequent version (v2, v3, ...)
   * Requires non-empty changeReason
   */
  public static async createNextVersion(
    documentId: string,
    fileBuffer: Buffer,
    originalFileName: string,
    declaredMimeType: string,
    changeReason: string,
    uploadedByUserId: string,
    storageProvider: StorageProvider,
    category?: any
  ): Promise<DocumentVersionDto> {
    if (!changeReason || changeReason.trim().length < 3) {
      throw new AppError(
        'O motivo da nova versão é estritamente obrigatório (mínimo 3 caracteres).',
        400,
        { field: 'changeReason' }
      );
    }

    // 1. Find existing versions to determine next version number
    const existingVersions = await prisma.documentVersion.findMany({
      where: { documentId }
    });

    const maxVersion = existingVersions.reduce(
      (max: number, v: any) => Math.max(max, v.version),
      0
    );
    const nextVersionNumber = maxVersion + 1;

    // 2. Security Scan
    const scan = SecurityScanService.scanFile(fileBuffer, originalFileName, declaredMimeType, category);

    // 3. Storage Upload
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `docs/${year}/${month}/${documentId}_v${nextVersionNumber}_${sanitizedName}`;

    const uploadResult = await storageProvider.upload(storageKey, fileBuffer, scan.detectedMimeType);

    // 4. Save Version (Immutable)
    const newVersion = await prisma.documentVersion.create({
      data: {
        documentId,
        version: nextVersionNumber,
        storageKey: uploadResult.storageKey,
        originalFileName,
        mimeType: scan.detectedMimeType,
        size: uploadResult.size,
        checksumAlgorithm: uploadResult.checksumAlgorithm,
        checksum: uploadResult.checksum,
        changeReason: changeReason.trim(),
        uploadedByUserId
      }
    });

    // 5. Update Document currentVersionId
    await prisma.document.update({
      where: { id: documentId },
      data: {
        currentVersionId: newVersion.id,
        status: scan.status === 'PASSED' ? 'AVAILABLE' : scan.status
      }
    });

    // 6. Security Check Record
    await prisma.documentSecurityCheck.create({
      data: {
        versionId: newVersion.id,
        status: scan.status,
        scanResult: scan.scanResult,
        threatName: scan.threatName || null
      }
    });

    return newVersion;
  }

  /**
   * List all versions of a document
   */
  public static async listVersions(documentId: string): Promise<DocumentVersionDto[]> {
    return prisma.documentVersion.findMany({
      where: { documentId }
    });
  }

  /**
   * Get specific version
   */
  public static async getVersion(versionId: string): Promise<DocumentVersionDto | null> {
    return prisma.documentVersion.findUnique({
      where: { id: versionId }
    });
  }
}
