import { DocumentStatus, DocumentResourceType } from '../../../../shared/types/index';

export { DocumentStatus, DocumentResourceType };

export interface DocumentCategoryDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  retentionDays?: number;
  isSensitive: boolean;
  allowedMimeTypes?: string;
  maxSizeBytes?: number;
  createdAt: Date | string;
}

export interface DocumentVersionDto {
  id: string;
  documentId: string;
  version: number;
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  size: number;
  checksumAlgorithm: string;
  checksum: string;
  changeReason?: string;
  uploadedByUserId: string;
  uploadedByUserName?: string;
  createdAt: Date | string;
}

export interface DocumentLinkDto {
  id: string;
  documentId: string;
  resourceType: DocumentResourceType;
  resourceId: string;
  producerId?: string;
  eventId?: string;
  createdAt: Date | string;
}

export interface DocumentDto {
  id: string;
  organizationId?: string;
  producerId?: string | null;
  eventId?: string | null;
  title: string;
  description?: string | null;
  categoryId: string;
  category?: DocumentCategoryDto;
  status: DocumentStatus;
  isConfidential: boolean;
  validFrom?: Date | string | null;
  validUntil?: Date | string | null;
  createdBy: string;
  creatorName?: string;
  currentVersionId?: string | null;
  currentVersion?: DocumentVersionDto;
  versions?: DocumentVersionDto[];
  links?: DocumentLinkDto[];
  tags?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

export interface UploadDocumentInput {
  title: string;
  description?: string;
  categoryId?: string;
  categoryCode?: string;
  producerId?: string;
  eventId?: string;
  isConfidential?: boolean;
  validFrom?: string | Date;
  validUntil?: string | Date;
  links?: Array<{
    resourceType: DocumentResourceType;
    resourceId: string;
    producerId?: string;
    eventId?: string;
  }>;
  tags?: string[];
  fileBuffer: Buffer;
  originalFileName: string;
  mimeType: string;
}

export interface CreateVersionInput {
  documentId: string;
  fileBuffer: Buffer;
  originalFileName: string;
  mimeType: string;
  changeReason: string;
}

export interface DocumentListFilters {
  search?: string;
  categoryId?: string;
  categoryCode?: string;
  producerId?: string;
  eventId?: string;
  status?: DocumentStatus;
  resourceType?: DocumentResourceType;
  resourceId?: string;
  isConfidential?: boolean;
  page?: number;
  limit?: number;
}

export interface DownloadUrlResult {
  downloadUrl: string;
  expiresInSeconds: number;
  documentId: string;
  versionId: string;
  versionNumber: number;
  originalFileName: string;
  mimeType: string;
  checksum: string;
}

export interface ValidateRequirementsInput {
  operation: string;
  amount?: number;
  producerId?: string;
  eventId?: string;
  linkedCategoryCodes: string[];
}

export interface RequirementValidationResult {
  valid: boolean;
  operation: string;
  requiredCategories: string[];
  missingCategories: string[];
  message?: string;
}
