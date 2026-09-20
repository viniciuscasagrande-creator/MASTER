# Plano de Migração de Habilitações Legadas — Fase 1.3.8

## 1. Contexto e Motivação

Antes da Fase 1.3.8, os produtores da DiskIngressos operavam nos sistemas legados (CA / DiskHub) sem uma estrutura formal e unificada de direitos contratuais materializados em banco de dados. Recursos como borderô avançado, validação offline em coletores e taxas personalizadas eram controlados por flags manuais dispersas ou parâmetros de configuração direta.

A **Fase 1.3.8** introduz uma governança técnica de direitos baseada em rastreabilidade de origem (`sourceType`).

---

## 2. Diretriz Mandatória: Proibição de Contratos Fictícios

> [!IMPORTANT]
> **É estritamente proibido criar registros artificiais na tabela `CommercialContract`** para representar direitos legados de produtores que não possuem instrumentos jurídicos digitalizados nesta plataforma.
> Contratos comerciais possuem implicações fiscais, jurídicas e de auditoria externa imutável (assinaturas com hash SHA-256 e envelopes). Criar "contratos falsos" corromperia a integridade da Fase 1.3.6.

Por esse motivo, a arquitetura da Fase 1.3.8 suporta nativamente a origem:
```json
{
  "sourceType": "LEGACY_MIGRATION",
  "sourceId": "MIGRATION_BATCH_20260920",
  "notes": "Migração autorizada de direitos legados do DiskHub/CA"
}
```

---

## 3. Fases da Migração

### Fase 1: Identificação e Mapeamento de Produtores Ativos
- Extração da lista de produtores que possuem eventos ativos nos últimos 12 meses.
- Mapeamento das ferramentas técnicas que cada produtor utiliza efetivamente:
  - Validação Offline (`feature.access.offline_validator`)
  - Volume de Eventos Simultâneos (`events.active_max`)
  - Terminais de PDV / Bilheteria Física (`feature.boxoffice.pos_terminals`)
  - Borderô em Tempo Real (`feature.reports.advanced_analytics`)

### Fase 2: Execução do Script de Migração em Lote
O serviço [`EntitlementMigrationService`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/entitlements/migration/entitlement-migration.service.ts) é executado via endpoint autenticado `/api/v1/entitlements/migration/legacy`:

```typescript
await EntitlementMigrationService.migrateLegacyProducer({
  producerId: 'prod_legado_xyz',
  reason: 'Migração de Direitos Operacionais Legados para Fase 1.3.8',
  features: [
    {
      featureCode: 'feature.access.offline_validator',
      limits: [{ limitKey: 'devices.offline_max', value: 15, unit: 'DEVICES' }],
      notes: 'Produtor possui 15 coletores em comodato'
    },
    {
      featureCode: 'feature.events.max_active_events',
      limits: [{ limitKey: 'events.active_max', value: 10, unit: 'EVENTS' }],
      notes: 'Cota de até 10 eventos simultâneos'
    }
  ]
}, actorId, 'Script de Migração');
```

### Fase 3: Validação em Modo `OBSERVE` / `WARN`
Para evitar interrupção acidental em bilheterias e portarias durante grandes festivais:
1. Durante as primeiras duas semanas pós-migração, o `enforcementMode` padrão é configurado como `OBSERVE` ou `WARN`.
2. O sistema emite logs de auditoria em `EntitlementAuditLog` com tipo `CHECK_WARNING` ou `LIMIT_EXCEEDED` sem bloquear as requisições.
3. A equipe de atendimento comercial audita os alertas e ajusta as cotas ou efetua aditivos contratuais formais.
4. Após o período de estabilização, o modo `ENFORCE` é ativado de forma definitiva.

---

## 4. Estratégia de Rollback e Contingência

Em caso de divergência ou necessidade de ajuste emergencial em portaria:
1. **Override Administrativo Imediato:** Qualquer gestor comercial pode emitir um `GRANT` temporário via UI com validade de até 48 horas.
2. **Reconciliação Sob Demanda:** O botão "Reconciliar" na UI reavalia os contratos e restaura os direitos imediatamente.
3. **Imutabilidade de Auditoria:** Todo cancelamento ou concessão gera registro em `EntitlementAuditLog`.
