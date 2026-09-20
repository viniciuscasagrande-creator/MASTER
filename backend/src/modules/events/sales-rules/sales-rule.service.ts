import { prisma } from '../../../core/database/prisma';
import { CreateSalesRuleInput, UpdateSalesRuleInput, SalesRuleDTO, SalesRuleScope } from '@shared/types/index';

export class SalesRuleService {
  static async listRules(eventId: string, scope?: SalesRuleScope, scopeId?: string): Promise<SalesRuleDTO[]> {
    const where: any = { eventId };
    if (scope) where.scope = scope;
    if (scopeId) where.scopeId = scopeId;

    const rules = await prisma.salesRule.findMany({ where });

    return rules.map((r: any) => {
      let config = {};
      try {
        config = typeof r.ruleConfig === 'string' ? JSON.parse(r.ruleConfig) : r.ruleConfig;
      } catch {
        config = {};
      }

      return {
        id: r.id,
        eventId: r.eventId,
        type: r.type,
        scope: r.scope,
        scopeId: r.scopeId,
        name: r.name,
        description: r.description,
        ruleConfig: config,
        active: r.active,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
      };
    });
  }

  static async getRule(id: string): Promise<SalesRuleDTO | null> {
    const r = await prisma.salesRule.findUnique({ where: { id } });
    if (!r) return null;

    let config = {};
    try {
      config = typeof r.ruleConfig === 'string' ? JSON.parse(r.ruleConfig) : r.ruleConfig;
    } catch {
      config = {};
    }

    return {
      id: r.id,
      eventId: r.eventId,
      type: r.type,
      scope: r.scope,
      scopeId: r.scopeId,
      name: r.name,
      description: r.description,
      ruleConfig: config,
      active: r.active,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  static async createRule(eventId: string, input: CreateSalesRuleInput): Promise<SalesRuleDTO> {
    const created = await prisma.salesRule.create({
      data: {
        eventId,
        type: input.type,
        scope: input.scope || 'EVENT',
        scopeId: input.scopeId || null,
        name: input.name,
        description: input.description,
        ruleConfig: JSON.stringify(input.ruleConfig || {}),
        active: input.active ?? true
      }
    });

    const full = await this.getRule(created.id);
    return full!;
  }

  static async updateRule(id: string, input: UpdateSalesRuleInput): Promise<SalesRuleDTO> {
    const current = await prisma.salesRule.findUnique({ where: { id } });
    if (!current) throw new Error('Regra de venda não encontrada');

    await prisma.salesRule.update({
      where: { id },
      data: {
        type: input.type,
        scope: input.scope,
        scopeId: input.scopeId,
        name: input.name,
        description: input.description,
        ruleConfig: input.ruleConfig ? JSON.stringify(input.ruleConfig) : undefined,
        active: input.active
      }
    });

    const full = await this.getRule(id);
    return full!;
  }

  static async deleteRule(id: string): Promise<void> {
    await prisma.salesRule.delete({ where: { id } });
  }
}
