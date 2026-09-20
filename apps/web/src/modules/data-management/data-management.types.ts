import {
  ImportType,
  ImportStatus,
  ImportSeverity,
  DuplicateStrategy,
  AtomicityPolicy,
  TransformationType,
  ImportColumnDefinition,
  ImportDefinition,
  ImportMappingField,
  ImportMapping,
  ImportValidationError,
  ImportDuplicate,
  MergePlan,
  ImportSummary,
  ImportRequest,
  ImportTemplate,
  DataQualityDimension,
  DataQualityRule,
  DataQualityIssue,
  DataQualityStats,
  MigrationStage,
  MigrationProject,
  LegacyIdMapping,
  MigrationReconciliation,
  RollbackEligibility
} from '@shared/types/index';

export type {
  ImportType,
  ImportStatus,
  ImportSeverity,
  DuplicateStrategy,
  AtomicityPolicy,
  TransformationType,
  ImportColumnDefinition,
  ImportDefinition,
  ImportMappingField,
  ImportMapping,
  ImportValidationError,
  ImportDuplicate,
  MergePlan,
  ImportSummary,
  ImportRequest,
  ImportTemplate,
  DataQualityDimension,
  DataQualityRule,
  DataQualityIssue,
  DataQualityStats,
  MigrationStage,
  MigrationProject,
  LegacyIdMapping,
  MigrationReconciliation,
  RollbackEligibility
};

export type DataManagementTab =
  | 'OVERVIEW'
  | 'IMPORTS'
  | 'WIZARD'
  | 'TEMPLATES'
  | 'MAPPINGS'
  | 'QUALITY'
  | 'DUPLICATES'
  | 'MIGRATIONS'
  | 'HISTORY';

export interface WizardState {
  step: number; // 1 to 9
  importType: ImportType;
  fileName: string;
  fileBuffer: string | Buffer;
  fileSize: number;
  fileChecksum?: string;
  detectedHeaders: string[];
  mappingFields: ImportMappingField[];
  duplicateStrategy: DuplicateStrategy;
  atomicityPolicy: AtomicityPolicy;
  producerId?: string | null;
  eventId?: string | null;
  partnerName?: string;
  saveMappingAsTemplate: boolean;
  mappingTemplateName?: string;
  importRequestId?: string;
  validationSummary?: ImportSummary;
  validationErrors: ImportValidationError[];
  validationDuplicates: ImportDuplicate[];
}
