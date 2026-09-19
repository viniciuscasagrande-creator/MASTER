export type DocumentStatus =
  | 'PROCESSING'
  | 'AVAILABLE'
  | 'REJECTED'
  | 'QUARANTINED'
  | 'EXPIRED'
  | 'ARCHIVED'
  | 'DELETED';

export type DocumentResourceType =
  | 'PRODUCER'
  | 'EVENT'
  | 'ORDER'
  | 'TICKET'
  | 'PAYMENT'
  | 'TRANSFER'
  | 'REFUND'
  | 'SUPPORT_TICKET'
  | 'SUPPLIER'
  | 'CONTRACT'
  | 'CAMPAIGN'
  | 'APPROVAL_REQUEST'
  | 'TASK';

export interface DocumentCategoryItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  retentionDays?: number;
  isSensitive: boolean;
  allowedMimeTypes?: string;
  maxSizeBytes?: number;
  createdAt: string;
}

export interface DocumentVersionItem {
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
  createdAt: string;
}

export interface DocumentLinkItem {
  id: string;
  documentId: string;
  resourceType: DocumentResourceType;
  resourceId: string;
  producerId?: string;
  eventId?: string;
  createdAt: string;
}

export interface DocumentAccessLogItem {
  id: string;
  documentId: string;
  versionId?: string;
  userId: string;
  userName?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  organizationId?: string;
  producerId?: string | null;
  eventId?: string | null;
  title: string;
  description?: string | null;
  categoryId: string;
  category?: DocumentCategoryItem;
  status: DocumentStatus;
  isConfidential: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  createdBy: string;
  creatorName?: string;
  currentVersionId?: string | null;
  currentVersion?: DocumentVersionItem;
  versions?: DocumentVersionItem[];
  links?: DocumentLinkItem[];
  accessLogs?: DocumentAccessLogItem[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface DocumentStats {
  totalCount: number;
  availableCount: number;
  quarantineCount: number;
  expiringCount: number;
  archivedCount: number;
  totalSizeBytes: number;
}
