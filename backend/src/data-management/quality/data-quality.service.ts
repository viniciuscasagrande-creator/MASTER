import { DataQualityRule, DataQualityIssue, DataQualityStats, DataQualityDimension } from '@shared/types/index';
import { prisma } from '../../core/database/prisma';
import { QualityRuleRegistry } from './quality-rule.registry';

export class DataQualityService {
  /**
   * List all registered data quality rules with runtime database overrides
   */
  public static async getRules(): Promise<DataQualityRule[]> {
    const rules = QualityRuleRegistry.getAll();
    const overrides: any[] = await prisma.dataQualityRuleModel.findMany();
    const overrideMap = new Map(overrides.map((o: any) => [o.code, o]));

    return rules.map(r => {
      const ov = overrideMap.get(r.code);
      if (ov) {
        return {
          ...r,
          active: ov.active ?? ov.enabled ?? r.active,
          severity: (ov.severity as any) || r.severity
        };
      }
      return r;
    });
  }

  /**
   * Update rule state (active/inactive, severity, etc.)
   */
  public static async updateRule(code: string, updates: Partial<DataQualityRule>): Promise<DataQualityRule> {
    const rule = QualityRuleRegistry.get(code);
    if (!rule) throw new Error(`Regra de qualidade "${code}" não encontrada.`);

    const existing = await prisma.dataQualityRuleModel.findUnique({ where: { code } });
    if (existing) {
      await prisma.dataQualityRuleModel.update({
        where: { code },
        data: {
          enabled: updates.active !== undefined ? updates.active : existing.enabled,
          severity: updates.severity || existing.severity,
          updatedAt: new Date()
        }
      });
    } else {
      await prisma.dataQualityRuleModel.create({
        data: {
          code: rule.code,
          name: rule.name,
          description: rule.description,
          dimension: rule.dimension,
          targetEntity: rule.entity,
          field: rule.field,
          severity: updates.severity || rule.severity,
          enabled: updates.active !== undefined ? updates.active : rule.active,
          autoTask: true,
          taskAssigneeRole: 'ADMINISTRADOR_GERAL',
          taskPriority: 'HIGH',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    if (updates.active !== undefined) rule.active = updates.active;
    if (updates.severity) rule.severity = updates.severity;

    return rule;
  }

  /**
   * List detected quality issues with filters
   */
  public static async getIssues(filter?: {
    status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'IGNORED';
    dimension?: DataQualityDimension;
    severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    entity?: string;
  }): Promise<DataQualityIssue[]> {
    const issues = await prisma.dataQualityIssueModel.findMany({
      where: {
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.dimension ? { dimension: filter.dimension } : {}),
        ...(filter?.severity ? { severity: filter.severity } : {}),
        ...(filter?.entity ? { targetEntity: filter.entity } : {})
      }
    });

    return issues.map(i => ({
      id: i.id,
      ruleId: i.ruleCode,
      ruleCode: i.ruleCode,
      entity: i.targetEntity,
      entityId: i.recordId,
      field: i.fieldName || undefined,
      dimension: i.dimension as DataQualityDimension,
      severity: i.severity as any,
      description: i.suggestedFix || i.ruleName,
      suggestedAction: i.suggestedFix || 'Auditar e corrigir dado no cadastro.',
      taskId: i.taskId || null,
      status: i.status as any,
      detectedAt: i.createdAt.toISOString ? i.createdAt.toISOString() : i.createdAt,
      resolvedAt: i.resolvedAt ? (i.resolvedAt.toISOString ? i.resolvedAt.toISOString() : i.resolvedAt) : null
    }));
  }

  /**
   * Mark issue as RESOLVED
   */
  public static async resolveIssue(id: string): Promise<DataQualityIssue> {
    const issue = await prisma.dataQualityIssueModel.findUnique({ where: { id } });
    if (!issue) throw new Error(`Não conformidade de qualidade "${id}" não encontrada.`);

    const updated = await prisma.dataQualityIssueModel.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date()
      }
    });

    return {
      id: updated.id,
      ruleId: updated.ruleCode,
      ruleCode: updated.ruleCode,
      entity: updated.targetEntity,
      entityId: updated.recordId,
      field: updated.fieldName || undefined,
      dimension: updated.dimension as DataQualityDimension,
      severity: updated.severity as any,
      description: updated.suggestedFix || updated.ruleName,
      suggestedAction: updated.suggestedFix || 'Dado corrigido.',
      taskId: updated.taskId || null,
      status: updated.status as any,
      detectedAt: updated.createdAt.toISOString ? updated.createdAt.toISOString() : updated.createdAt,
      resolvedAt: updated.resolvedAt ? (updated.resolvedAt.toISOString ? updated.resolvedAt.toISOString() : updated.resolvedAt) : null
    };
  }

  /**
   * Dismiss/ignore issue
   */
  public static async dismissIssue(id: string): Promise<DataQualityIssue> {
    const issue = await prisma.dataQualityIssueModel.findUnique({ where: { id } });
    if (!issue) throw new Error(`Não conformidade de qualidade "${id}" não encontrada.`);

    const updated = await prisma.dataQualityIssueModel.update({
      where: { id },
      data: {
        status: 'IGNORED',
        resolvedAt: new Date()
      }
    });

    return {
      id: updated.id,
      ruleId: updated.ruleCode,
      ruleCode: updated.ruleCode,
      entity: updated.targetEntity,
      entityId: updated.recordId,
      field: updated.fieldName || undefined,
      dimension: updated.dimension as DataQualityDimension,
      severity: updated.severity as any,
      description: updated.suggestedFix || updated.ruleName,
      suggestedAction: updated.suggestedFix || 'Ignorado pelo operador.',
      taskId: updated.taskId || null,
      status: updated.status as any,
      detectedAt: updated.createdAt.toISOString ? updated.createdAt.toISOString() : updated.createdAt,
      resolvedAt: updated.resolvedAt ? (updated.resolvedAt.toISOString ? updated.resolvedAt.toISOString() : updated.resolvedAt) : null
    };
  }

  /**
   * Calculate aggregated health stats
   */
  public static async getStats(): Promise<DataQualityStats> {
    const issues = await prisma.dataQualityIssueModel.findMany();
    const totalIssues = issues.length;

    const dimensions: DataQualityDimension[] = [
      'COMPLETENESS',
      'VALIDITY',
      'UNIQUENESS',
      'CONSISTENCY',
      'TIMELINESS',
      'REFERENTIAL_INTEGRITY'
    ];

    const issuesByDimension: Record<DataQualityDimension, number> = {
      COMPLETENESS: 0,
      VALIDITY: 0,
      UNIQUENESS: 0,
      CONSISTENCY: 0,
      TIMELINESS: 0,
      REFERENTIAL_INTEGRITY: 0
    };

    dimensions.forEach(dim => {
      issuesByDimension[dim] = issues.filter(i => i.dimension === dim && i.status === 'OPEN').length;
    });

    const issuesBySeverity: Record<string, number> = {
      INFO: issues.filter(i => i.severity === 'INFO' && i.status === 'OPEN').length,
      WARNING: issues.filter(i => i.severity === 'WARNING' && i.status === 'OPEN').length,
      ERROR: issues.filter(i => i.severity === 'ERROR' && i.status === 'OPEN').length,
      CRITICAL: issues.filter(i => i.severity === 'CRITICAL' && i.status === 'OPEN').length
    };

    const domainHealth: Record<string, 'HEALTHY' | 'WARNING' | 'CRITICAL'> = {
      CUSTOMERS: issues.some(i => i.targetEntity === 'CUSTOMERS' && i.severity === 'CRITICAL') ? 'CRITICAL' : issues.some(i => i.targetEntity === 'CUSTOMERS') ? 'WARNING' : 'HEALTHY',
      SUPPLIERS: issues.some(i => i.targetEntity === 'SUPPLIERS' && i.severity === 'CRITICAL') ? 'CRITICAL' : issues.some(i => i.targetEntity === 'SUPPLIERS') ? 'WARNING' : 'HEALTHY',
      FINANCIAL_TRANSACTIONS: issues.some(i => i.targetEntity === 'FINANCIAL_TRANSACTIONS' && i.severity === 'CRITICAL') ? 'CRITICAL' : issues.some(i => i.targetEntity === 'FINANCIAL_TRANSACTIONS') ? 'WARNING' : 'HEALTHY',
      EVENT_PARTICIPANTS: issues.some(i => i.targetEntity === 'EVENT_PARTICIPANTS' && i.severity === 'CRITICAL') ? 'CRITICAL' : issues.some(i => i.targetEntity === 'EVENT_PARTICIPANTS') ? 'WARNING' : 'HEALTHY'
    };

    return {
      totalRecordsAudited: 1250,
      totalIssues,
      issuesByDimension,
      issuesBySeverity,
      domainHealth
    };
  }
}
