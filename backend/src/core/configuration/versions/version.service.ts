import { prisma } from '../../database/prisma';
import { AppError } from '../../errors/AppError';
import { AuthenticatedUser } from '../../middleware/authenticate';
import { VersionDiffItem } from '../configuration.types';

export class VersionService {
  /**
   * Compares two versions of a policy and returns the rule differences
   */
  public static async compareVersions(
    policyId: string,
    v1Number: number,
    v2Number: number
  ): Promise<{ v1: number; v2: number; diffs: VersionDiffItem[] }> {
    const policy = await prisma.policy.findUnique({ where: { id: policyId } });
    if (!policy) throw new AppError('Política não encontrada.', 404);

    const v1 = await prisma.policyVersion.findFirst({
      where: { policyId, versionNumber: v1Number }
    });
    const v2 = await prisma.policyVersion.findFirst({
      where: { policyId, versionNumber: v2Number }
    });

    if (!v1 || !v2) {
      throw new AppError('Uma ou ambas as versões especificadas não foram encontradas.', 404);
    }

    const rulesV1: any[] = JSON.parse(v1.rulesSnapshot || '[]');
    const rulesV2: any[] = JSON.parse(v2.rulesSnapshot || '[]');

    const diffs: VersionDiffItem[] = [];

    // Map rules by name
    const map1 = new Map<string, any>(rulesV1.map(r => [r.name, r]));
    const map2 = new Map<string, any>(rulesV2.map(r => [r.name, r]));

    // Check v1 rules in v2
    for (const [name, r1] of map1.entries()) {
      if (!map2.has(name)) {
        diffs.push({
          ruleId: r1.id,
          ruleName: name,
          changeType: 'REMOVED'
        });
      } else {
        const r2 = map2.get(name)!;
        const fieldDiffs: Array<{ field: string; oldValue: any; newValue: any }> = [];

        if (r1.priority !== r2.priority) {
          fieldDiffs.push({ field: 'priority', oldValue: r1.priority, newValue: r2.priority });
        }

        const cond1 = typeof r1.conditionJson === 'string' ? r1.conditionJson : JSON.stringify(r1.conditions || []);
        const cond2 = typeof r2.conditionJson === 'string' ? r2.conditionJson : JSON.stringify(r2.conditions || []);
        if (cond1 !== cond2) {
          fieldDiffs.push({ field: 'conditions', oldValue: cond1, newValue: cond2 });
        }

        const act1 = typeof r1.actionJson === 'string' ? r1.actionJson : JSON.stringify(r1.action || {});
        const act2 = typeof r2.actionJson === 'string' ? r2.actionJson : JSON.stringify(r2.action || {});
        if (act1 !== act2) {
          fieldDiffs.push({ field: 'action', oldValue: act1, newValue: act2 });
        }

        if (fieldDiffs.length > 0) {
          diffs.push({
            ruleId: r2.id,
            ruleName: name,
            changeType: 'MODIFIED',
            fieldDiffs
          });
        } else {
          diffs.push({
            ruleId: r2.id,
            ruleName: name,
            changeType: 'UNCHANGED'
          });
        }
      }
    }

    // Check newly added in v2
    for (const [name, r2] of map2.entries()) {
      if (!map1.has(name)) {
        diffs.push({
          ruleId: r2.id,
          ruleName: name,
          changeType: 'ADDED'
        });
      }
    }

    return { v1: v1Number, v2: v2Number, diffs };
  }

  /**
   * Creates a new version of a policy with updated rules
   */
  public static async createNewVersion(
    policyId: string,
    rulesData: any[],
    changeReason: string,
    user: AuthenticatedUser
  ): Promise<any> {
    if (!changeReason || !changeReason.trim()) {
      throw new AppError('O motivo da alteração de versão é obrigatório.', 400);
    }

    const policy = await prisma.policy.findUnique({ where: { id: policyId } });
    if (!policy) throw new AppError('Política não encontrada.', 404);

    const nextVersion = (policy.currentVersion || 1) + 1;

    // Create rules for next version
    const createdRules: any[] = [];
    for (let i = 0; i < rulesData.length; i++) {
      const r = rulesData[i];
      const rule = await prisma.policyRule.create({
        data: {
          policyId,
          version: nextVersion,
          name: r.name,
          description: r.description || null,
          priority: r.priority || (i + 1) * 10,
          conditionJson: typeof r.conditions === 'string' ? r.conditions : JSON.stringify(r.conditions || []),
          actionJson: typeof r.action === 'string' ? r.action : JSON.stringify(r.action || { decision: true }),
          orderIndex: r.orderIndex || (i + 1),
          isActive: true
        }
      });
      createdRules.push(rule);
    }

    // Create version record
    const versionRecord = await prisma.policyVersion.create({
      data: {
        policyId,
        versionNumber: nextVersion,
        status: policy.status,
        rulesSnapshot: JSON.stringify(createdRules),
        changeReason,
        createdBy: user.id,
        creatorName: user.name
      }
    });

    // Update policy current version
    await prisma.policy.update({
      where: { id: policyId },
      data: { currentVersion: nextVersion }
    });

    return {
      version: versionRecord,
      policy: await prisma.policy.findUnique({
        where: { id: policyId },
        include: { rules: true, versions: true }
      })
    };
  }
}
