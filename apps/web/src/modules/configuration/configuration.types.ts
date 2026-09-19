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
} from '@shared/types/index';

export type {
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

export type ConfigurationTab =
  | 'parameters'
  | 'policies'
  | 'simulator'
  | 'inheritance'
  | 'features'
  | 'killswitch'
  | 'audit';

export interface ConfigurationSummaryStats {
  totalDefinitions: number;
  activePolicies: number;
  totalOverrides: number;
  detectedConflicts: number;
  activeKillSwitches: number;
  featureFlagsCount: number;
  cacheHitRatio: number;
}

export interface VersionDiffItem {
  ruleId: string;
  ruleName: string;
  changeType: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';
  fieldDiffs?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
}

export interface InheritanceTreeNode {
  id: string;
  name: string;
  type: 'GLOBAL' | 'PRODUCER' | 'EVENT';
  producerId?: string;
  eventId?: string;
  children?: InheritanceTreeNode[];
}
