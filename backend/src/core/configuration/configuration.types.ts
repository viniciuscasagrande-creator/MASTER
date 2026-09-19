import {
  ConfigValueType,
  ConfigSensitivity,
  ConfigScopeType,
  PolicyStatus,
  RuleOperator,
  PolicyConflictStatus,
  ConfigurationDefinitionItem,
  ConfigurationValueItem,
  EffectiveConfigResult,
  PolicyRuleItem,
  PolicyVersionItem,
  PolicyItem,
  PolicyConflictItem,
  FeatureFlagItem,
  PolicySimulateInput,
  PolicySimulateResult,
  PolicySimulateTraceStep,
  ConfigAuditItem
} from '../../../../shared/types/index';

export {
  ConfigValueType,
  ConfigSensitivity,
  ConfigScopeType,
  PolicyStatus,
  RuleOperator,
  PolicyConflictStatus,
  ConfigurationDefinitionItem,
  ConfigurationValueItem,
  EffectiveConfigResult,
  PolicyRuleItem,
  PolicyVersionItem,
  PolicyItem,
  PolicyConflictItem,
  FeatureFlagItem,
  PolicySimulateInput,
  PolicySimulateResult,
  PolicySimulateTraceStep,
  ConfigAuditItem
};

export interface SetOverrideInput {
  scopeType: ConfigScopeType;
  producerId?: string | null;
  eventId?: string | null;
  value: any;
  changeReason: string;
  effectiveFrom?: Date | string | null;
  effectiveUntil?: Date | string | null;
}

export interface RemoveOverrideInput {
  scopeType: ConfigScopeType;
  producerId?: string | null;
  eventId?: string | null;
  changeReason: string;
}

export interface ResolvePolicyInput {
  domain: string;
  operation: string;
  context: {
    producerId?: string | null;
    eventId?: string | null;
    user?: any;
  };
  input: Record<string, any>;
}

export interface PolicyRuleAction {
  decision?: boolean;
  approvalsRequired?: number;
  stepUpRequired?: boolean;
  requiredDocuments?: string[];
  slaMinutes?: number;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface ResolvedPolicyDecision {
  decision: boolean;
  effectivePolicy?: {
    id: string;
    code: string;
    name: string;
    version: number;
    ruleId?: string;
    ruleName?: string;
  } | null;
  source: 'EVENT' | 'PRODUCER' | 'GLOBAL' | 'DEFAULT';
  approvalsRequired: number;
  stepUpRequired: boolean;
  requiredDocuments: string[];
  slaMinutes?: number;
  explanation: string;
  actionPayload?: Record<string, any>;
  evaluationId?: string;
}

export interface CreatePolicyInput {
  code: string;
  name: string;
  domain: string;
  description?: string;
  scopeType: ConfigScopeType;
  producerId?: string | null;
  eventId?: string | null;
  priority?: number;
  effectiveFrom?: Date | string | null;
  effectiveUntil?: Date | string | null;
  requiresApproval?: boolean;
  rules: Array<{
    name: string;
    description?: string;
    priority?: number;
    conditions: Array<{
      field: string;
      operator: RuleOperator;
      value: any;
    }>;
    action: {
      decision: boolean;
      approvalsRequired?: number;
      stepUpRequired?: boolean;
      requiredDocuments?: string[];
      slaMinutes?: number;
      message?: string;
      metadata?: Record<string, any>;
    };
    orderIndex?: number;
  }>;
}

export interface VersionDiffItem {
  ruleId?: string;
  ruleName?: string;
  changeType: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';
  fieldDiffs?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
}
