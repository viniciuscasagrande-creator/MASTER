import { ConfigurationRepository } from './configuration.repository';
import { ConfigurationRegistry } from './configuration.registry';
import { ConfigurationCacheService } from './configuration-cache.service';
import { EffectiveConfigResult } from './configuration.types';
import { prisma } from '../database/prisma';

export class EffectiveConfigService {
  /**
   * Resolves effective configuration following the hierarchy:
   * 1. Event Override
   * 2. Producer Override
   * 3. Global Value
   * 4. Definition Default
   */
  public static async resolveEffective<T = any>(
    key: string,
    context?: { producerId?: string | null; eventId?: string | null }
  ): Promise<EffectiveConfigResult<T>> {
    const producerId = context?.producerId || null;
    const eventId = context?.eventId || null;

    // 1. Check cache first
    const cached = ConfigurationCacheService.get<EffectiveConfigResult<T>>(key, eventId ? 'EVENT' : producerId ? 'PRODUCER' : 'GLOBAL', eventId || producerId);
    if (cached) {
      return cached;
    }

    // 2. Fetch definition from registry or DB
    const regDef = ConfigurationRegistry.get(key);
    let definition = await ConfigurationRepository.getDefinition(key);

    if (!definition && !regDef) {
      throw new Error(`Definição de configuração não encontrada para a chave: "${key}".`);
    }

    const type = regDef?.type || definition?.type || 'STRING';
    const unit = regDef?.unit || definition?.unit || null;
    const defaultRaw = definition?.defaultValue ?? (regDef ? JSON.stringify(regDef.defaultValue) : null);

    const definitionId = definition?.id || `def_${key}`;

    const now = new Date();

    // Helper to check validity period
    const isValidPeriod = (val: any) => {
      if (!val) return false;
      if (val.effectiveFrom && new Date(val.effectiveFrom) > now) return false;
      if (val.effectiveUntil && new Date(val.effectiveUntil) < now) return false;
      return true;
    };

    // Helper to safely parse stored value
    const parseVal = (raw: any) => {
      if (raw === undefined || raw === null) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    };

    // 3. Level 1: Event Scope
    if (eventId) {
      const eventVal = await ConfigurationRepository.findValue(definitionId, 'EVENT', null, eventId);
      if (eventVal && isValidPeriod(eventVal)) {
        const val = parseVal(eventVal.value);
        let eventName: string | null = null;
        const evt = await prisma.event.findUnique({ where: { id: eventId } });
        if (evt) eventName = evt.title;

        const result: EffectiveConfigResult<T> = {
          key,
          value: val,
          type,
          unit,
          source: 'EVENT',
          sourceId: eventId,
          sourceName: eventName,
          policyVersion: eventVal.version,
          effectiveFrom: eventVal.effectiveFrom ? new Date(eventVal.effectiveFrom).toISOString() : null,
          effectiveUntil: eventVal.effectiveUntil ? new Date(eventVal.effectiveUntil).toISOString() : null,
          explanation: `Valor personalizado definido especificamente para o Evento ${eventName || eventId}.`
        };

        ConfigurationCacheService.set(key, 'EVENT', eventId, result);
        return result;
      }
    }

    // 4. Level 2: Producer Scope
    if (producerId) {
      const prodVal = await ConfigurationRepository.findValue(definitionId, 'PRODUCER', producerId, null);
      if (prodVal && isValidPeriod(prodVal)) {
        const val = parseVal(prodVal.value);
        let producerName: string | null = null;
        const prod = await prisma.producer.findUnique({ where: { id: producerId } });
        if (prod) producerName = prod.name;

        const result: EffectiveConfigResult<T> = {
          key,
          value: val,
          type,
          unit,
          source: 'PRODUCER',
          sourceId: producerId,
          sourceName: producerName,
          policyVersion: prodVal.version,
          effectiveFrom: prodVal.effectiveFrom ? new Date(prodVal.effectiveFrom).toISOString() : null,
          effectiveUntil: prodVal.effectiveUntil ? new Date(prodVal.effectiveUntil).toISOString() : null,
          explanation: `Valor personalizado herdado do Produtor ${producerName || producerId}.`
        };

        ConfigurationCacheService.set(key, 'PRODUCER', producerId, result);
        return result;
      }
    }

    // 5. Level 3: Global Scope
    const globalVal = await ConfigurationRepository.findValue(definitionId, 'GLOBAL', null, null);
    if (globalVal && isValidPeriod(globalVal)) {
      const val = parseVal(globalVal.value);
      const result: EffectiveConfigResult<T> = {
        key,
        value: val,
        type,
        unit,
        source: 'GLOBAL',
        sourceId: null,
        sourceName: 'DiskIngressos Global',
        policyVersion: globalVal.version,
        effectiveFrom: globalVal.effectiveFrom ? new Date(globalVal.effectiveFrom).toISOString() : null,
        effectiveUntil: globalVal.effectiveUntil ? new Date(globalVal.effectiveUntil).toISOString() : null,
        explanation: 'Configuração global padrão da plataforma DiskIngressos.'
      };

      ConfigurationCacheService.set(key, 'GLOBAL', null, result);
      return result;
    }

    // 6. Level 4: Fallback Default
    const defaultVal = parseVal(defaultRaw);
    const result: EffectiveConfigResult<T> = {
      key,
      value: defaultVal,
      type,
      unit,
      source: 'DEFAULT',
      sourceId: null,
      sourceName: 'Padrão do Sistema',
      policyVersion: 1,
      explanation: 'Valor padrão de fábrica do sistema.'
    };

    ConfigurationCacheService.set(key, 'DEFAULT', null, result);
    return result;
  }
}
