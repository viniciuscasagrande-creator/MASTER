import { ConfigurationRepository } from './configuration.repository';
import { ConfigurationRegistry } from './configuration.registry';
import { ConfigurationCacheService } from './configuration-cache.service';
import { EffectiveConfigService } from './effective-config.service';
import { SetOverrideInput, RemoveOverrideInput, EffectiveConfigResult } from './configuration.types';
import { AppError } from '../errors/AppError';
import { AuthenticatedUser } from '../middleware/authenticate';
import { DomainEvents } from '../../events/DomainEvents';
import { ApprovalEngineService } from '../../modules/approvals/engine/approval-engine.service';

export class ConfigurationService {
  /**
   * Validate scope access: Producers can only alter/override their own producer scope or events they own
   */
  public static validateScopeAccess(
    scopeType: string,
    producerId: string | null | undefined,
    eventId: string | null | undefined,
    user: AuthenticatedUser
  ): void {
    const isSuperAdmin = user.roles?.includes('ADMIN') || (user as any).isSuperAdmin;
    if (isSuperAdmin) return;

    const isProducer = user.roles?.includes('PRODUTOR') || (user as any).role === 'PRODUTOR';
    const userProducerId = (user as any).producerId || user.scope?.producers?.[0] || null;

    if (scopeType === 'GLOBAL') {
      if (!isSuperAdmin && !user.permissions?.includes('configuracoes.parametro.editar')) {
        throw new AppError('Acesso negado: apenas administradores podem configurar parâmetros globais.', 403);
      }
    }

    if (isProducer) {
      if (scopeType === 'GLOBAL') {
        throw new AppError('Produtor não tem permissão para alterar configurações globais.', 403);
      }
      if (scopeType === 'PRODUCER' && producerId && producerId !== userProducerId) {
        throw new AppError('Acesso negado: você só pode configurar parâmetros do seu próprio produtor.', 403);
      }
    }
  }

  public static async getEffective<T = any>(
    key: string,
    context?: { producerId?: string | null; eventId?: string | null }
  ): Promise<EffectiveConfigResult<T>> {
    return EffectiveConfigService.resolveEffective<T>(key, context);
  }

  public static async getAllEffective(
    domain?: string,
    context?: { producerId?: string | null; eventId?: string | null }
  ): Promise<EffectiveConfigResult[]> {
    const definitions = domain
      ? ConfigurationRegistry.listByDomain(domain)
      : ConfigurationRegistry.list();

    const results: EffectiveConfigResult[] = [];
    for (const def of definitions) {
      const eff = await EffectiveConfigService.resolveEffective(def.key, context);
      results.push(eff);
    }
    return results;
  }

  public static async setOverride(
    key: string,
    input: SetOverrideInput,
    user: AuthenticatedUser
  ): Promise<{ value: any; pendingApproval?: boolean; approvalRequestId?: string }> {
    this.validateScopeAccess(input.scopeType, input.producerId, input.eventId, user);

    const definition = await ConfigurationRepository.getDefinition(key);
    const regDef = ConfigurationRegistry.get(key);

    if (!definition && !regDef) {
      throw new AppError(`Definição de configuração não encontrada para "${key}".`, 404);
    }

    const definitionId = definition?.id || `cfg_def_${key}`;
    const requiresApproval = definition?.requiresApproval ?? regDef?.requiresApproval ?? false;

    // Validate strong typed value
    const validatedValue = ConfigurationRegistry.validateValue(key, input.value);

    // If critical and requires approval
    if (requiresApproval && !(user as any).skipApproval) {
      const approvalRequest = await ApprovalEngineService.createRequest(user, {
        operation: 'CONFIGURATION_OVERRIDE',
        title: `Alteração Crítica de Configuração: ${regDef?.name || key}`,
        description: input.changeReason,
        amount: typeof validatedValue === 'number' ? validatedValue : undefined,
        producerId: input.producerId || undefined,
        eventId: input.eventId || undefined,
        payload: {
          key,
          scopeType: input.scopeType,
          producerId: input.producerId,
          eventId: input.eventId,
          value: validatedValue,
          changeReason: input.changeReason
        }
      });

      return {
        value: validatedValue,
        pendingApproval: true,
        approvalRequestId: approvalRequest.id
      };
    }

    // Direct apply
    const existingEffective = await this.getEffective(key, {
      producerId: input.producerId,
      eventId: input.eventId
    });

    const updated = await ConfigurationRepository.upsertValue(
      definitionId,
      input.scopeType,
      input.producerId,
      input.eventId,
      validatedValue,
      input.changeReason,
      user.id,
      user.name,
      input.effectiveFrom,
      input.effectiveUntil
    );

    // Log audit
    await ConfigurationRepository.logAudit(
      'CONFIGURATION',
      updated.id,
      key,
      existingEffective.source === input.scopeType ? 'UPDATE' : 'OVERRIDE',
      input.scopeType,
      input.producerId,
      input.eventId,
      existingEffective.value,
      validatedValue,
      input.changeReason,
      user.id,
      user.name
    );

    // Invalidate Cache
    ConfigurationCacheService.invalidate(key);

    // Dispatch event
    DomainEvents.dispatch('CONFIGURATION_UPDATED', {
      producerId: input.producerId || undefined,
      eventId: input.eventId || undefined,
      resourceType: 'CONFIGURATION',
      resourceId: updated.id,
      actorUserId: user.id,
      data: {
        key,
        scopeType: input.scopeType,
        value: validatedValue,
        previousValue: existingEffective.value
      }
    });

    return { value: updated };
  }

  public static async removeOverride(
    key: string,
    input: RemoveOverrideInput,
    user: AuthenticatedUser
  ): Promise<{ success: boolean; fallbackValue: any }> {
    this.validateScopeAccess(input.scopeType, input.producerId, input.eventId, user);

    const definition = await ConfigurationRepository.getDefinition(key);
    if (!definition) throw new AppError(`Definição não encontrada para "${key}".`, 404);

    const existing = await ConfigurationRepository.findValue(
      definition.id,
      input.scopeType,
      input.producerId,
      input.eventId
    );

    if (!existing) {
      throw new AppError('Nenhum override encontrado para remover neste escopo.', 404);
    }

    await ConfigurationRepository.removeValue(
      definition.id,
      input.scopeType,
      input.producerId,
      input.eventId
    );

    // Invalidate cache
    ConfigurationCacheService.invalidate(key);

    // Compute new fallback effective
    const fallback = await this.getEffective(key, {
      producerId: input.producerId,
      eventId: input.eventId
    });

    // Log audit
    await ConfigurationRepository.logAudit(
      'CONFIGURATION',
      existing.id,
      key,
      'REMOVE_OVERRIDE',
      input.scopeType,
      input.producerId,
      input.eventId,
      JSON.parse(existing.value),
      fallback.value,
      input.changeReason,
      user.id,
      user.name
    );

    DomainEvents.dispatch('CONFIGURATION_OVERRIDE_REMOVED', {
      producerId: input.producerId || undefined,
      eventId: input.eventId || undefined,
      resourceType: 'CONFIGURATION',
      resourceId: existing.id,
      actorUserId: user.id,
      data: {
        key,
        scopeType: input.scopeType,
        fallbackValue: fallback.value
      }
    });

    return { success: true, fallbackValue: fallback.value };
  }

  public static async getHistory(key?: string, producerId?: string, take = 50): Promise<any[]> {
    return ConfigurationRepository.listAudits({
      entityKey: key,
      producerId,
      take
    });
  }
}
