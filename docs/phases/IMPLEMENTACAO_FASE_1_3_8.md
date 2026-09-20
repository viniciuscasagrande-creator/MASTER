# Fase 1.3.8 — Habilitações Comerciais do Produtor + Produtos Contratados + Limites + Vigência de Acesso (Entitlements)

## 1. Visão Geral e Propósito

A **Fase 1.3.8** implementa o motor transversal de **Habilitações Comerciais e Direitos da Organização Produtora (*Entitlements*)**. 

Enquanto o **Catálogo Comercial (Fase 1.3.7)** define o que a DiskIngressos comercializa (ofertas, planos, pacotes e condições padrão) e os **Contratos Comerciais (Fase 1.3.6)** formalizam o vínculo jurídico com vigência, a Fase 1.3.8 cria a camada executiva que materializa esses direitos técnicos no dia a dia da plataforma.

Ela resolve de forma definitiva o desacoplamento entre:
- **RBAC (Fase 1.1):** Governa **quem** (o usuário logado) pode realizar uma ação no sistema.
- **Entitlements (Fase 1.3.8):** Governa **o que** a organização contratante (Produtor) tem direito de utilizar com base em contrato vigente ou migração legada.

A fórmula canônica que protege os recursos operacionais da DiskIngressos é:
$$\text{canAccess} = \text{RBAC.can}(user, permission) \land \text{Entitlement.has}(producer, feature) \land \text{Scope.matches}(user, producerId)$$

---

## 2. Princípios Arquiteturais e Diretrizes Críticas

1. **Domínio Transversal Desacoplado:**
   - O motor de Entitlements reside em `backend/src/modules/entitlements/`, fora de `commercial/`, permitindo seu consumo transversal por Portaria (Controle de Acesso), Ticketeria, Bilheteria Física, Marketing e Financeiro.
2. **Rastreabilidade da Origem dos Direitos:**
   - Cada direito registrado em `ProducerEntitlement` tem uma origem explícita via `sourceType`:
     - `CONTRACT`: Provisionado a partir de um contrato comercial formal (`CommercialContract`).
     - `LEGACY_MIGRATION`: Migrado de sistemas legados (CA / DiskHub) para continuidade operacional sem criar contratos fictícios.
     - `ADMIN_OVERRIDE`: Concessão ou bloqueio excepcional temporário devidamente justificado e aprovado.
3. **Ciclo de Vida Temporal e Status `SCHEDULED`:**
   - Contratos assinados com vigência futura (`effectiveFrom > now`) geram entitlements com status `SCHEDULED`, ativando-se apenas quando a data inicial é atingida.
   - Contratos suspensos, cancelados ou vencidos reconciliam os entitlements para `SUSPENDED`, `TERMINATED` ou `EXPIRED` preservando todo o histórico imutável.
4. **Modos de Enforcement Suportados:**
   - `DISABLED`: Sem restrições (desenvolvimento).
   - `OBSERVE`: Permite o uso, mas emite telemetria de auditoria informando que a organização não contratou o recurso.
   - `WARN`: Permite o uso, emitindo aviso HTTP (`X-Entitlement-Warning`) para o operador/produtor.
   - `ENFORCE`: Bloqueio imediato com HTTP `403 Forbidden` (`ENTITLEMENT_REQUIRED` ou `LIMIT_EXCEEDED`).
5. **Consumo Dinâmico Desacoplado (`UsageProvider`):**
   - Não são mantidos contadores duplicados no banco. O consumo de recursos (ex.: eventos ativos, terminais de portaria, volume de e-mails) é computado dinamicamente pelas tabelas reais do sistema.
6. **Overrides Administrativos Temporários:**
   - Mecanismo seguro de bypass com justificativa obrigatória, rastreabilidade de aprovador (`approvedBy`), vigência mandatória e expiração automática na reconciliação.

---

## 3. Modelos de Dados (Prisma Schema)

```prisma
model ProducerEntitlement {
  id                 String                      @id @default(uuid())
  producerId         String
  sourceType         String                      @default("CONTRACT") // CONTRACT, LEGACY_MIGRATION, ADMIN_OVERRIDE
  sourceId           String?                     // ID do Contrato, lote de migração ou override
  offeringId         String?                     // ID da CommercialOffering
  offeringVersionId  String?                     // ID da CommercialOfferingVersion
  featureCode        String                      // Código canônico da feature (ex: feature.access.offline_validator)
  featureId          String?                     // Referência a CommercialFeature
  status             String                      @default("ACTIVE") // SCHEDULED, ACTIVE, SUSPENDED, EXPIRED, TERMINATED
  effectiveFrom      DateTime?
  effectiveUntil     DateTime?
  enforcementMode    String                      @default("ENFORCE") // DISABLED, OBSERVE, WARN, ENFORCE
  configurationJson  String?
  notes              String?
  version            Int                         @default(1)
  createdAt          DateTime                    @default(now())
  updatedAt          DateTime                    @updatedAt

  producer           Producer                    @relation(fields: [producerId], references: [id], onDelete: Cascade)
  feature            CommercialFeature?          @relation(fields: [featureId], references: [id])
  limits             ProducerEntitlementLimit[]

  @@unique([producerId, featureCode, sourceId])
  @@index([producerId])
  @@index([featureCode])
  @@index([status])
}

model ProducerEntitlementLimit {
  id                 String              @id @default(uuid())
  entitlementId      String
  limitKey           String              // ex: events.active_max, devices.offline_max
  limitType          String              @default("COUNT") // COUNT, MAX_VALUE, VOLUME, BOOLEAN_FLAG
  value              Float
  unit               String?             @default("UNITS")
  effectiveFrom      DateTime?
  effectiveUntil     DateTime?
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  entitlement        ProducerEntitlement @relation(fields: [entitlementId], references: [id], onDelete: Cascade)

  @@index([entitlementId])
  @@index([limitKey])
}

model EntitlementOverride {
  id                 String              @id @default(uuid())
  producerId         String
  featureCode        String
  action             String              // GRANT, REVOKE, LIMIT_MODIFICATION
  customLimitKey     String?
  customLimitValue   Float?
  reason             String              // Justificativa obrigatória
  status             String              @default("ACTIVE") // ACTIVE, EXPIRED, REVOKED
  effectiveFrom      DateTime            @default(now())
  effectiveUntil     DateTime
  approvedBy         String
  approvedByName     String?
  createdBy          String
  createdByName      String?
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  producer           Producer            @relation(fields: [producerId], references: [id], onDelete: Cascade)

  @@index([producerId])
  @@index([featureCode])
  @@index([status])
}

model EntitlementAuditLog {
  id                 String              @id @default(uuid())
  producerId         String
  featureCode        String?
  eventType          String              // PROVISIONED, RECONCILED, STATUS_CHANGED, OVERRIDE_APPLIED, CHECK_DENIED, CHECK_WARNING, LIMIT_EXCEEDED
  source             String              // CONTRACT_ACTIVATION, RECONCILIATION_JOB, MANUAL_OVERRIDE, MIDDLEWARE_ENFORCEMENT
  detailsJson        String?
  actorId            String?
  actorName          String?
  createdAt          DateTime            @default(now())

  @@index([producerId])
  @@index([featureCode])
  @@index([eventType])
}
```

---

## 4. Estrutura de Serviços Implementados

| Módulo / Serviço | Arquivo | Responsabilidade Principal |
|---|---|---|
| **`FeatureRegistry`** | [`feature-registry.ts`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/entitlements/features/feature-registry.ts) | Catálogo técnico central de capacidades da plataforma DiskIngressos sincronizado com o banco. |
| **`DatabaseUsageProvider`** | [`usage-provider.ts`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/entitlements/limits/usage-provider.ts) | Provedor de medição de consumo real desacoplado (`IUsageProvider`). |
| **`LimitService`** | [`limit.service.ts`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/entitlements/limits/limit.service.ts) | Validador de limites contratuais e cotas numéricas. |
| **`EntitlementProvisioningService`** | [`entitlement-provisioning.service.ts`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/entitlements/provisioning/entitlement-provisioning.service.ts) | Motor idempotente que transforma contratos comerciais ativos em habilitações concretas. |
| **`EntitlementReconciliationService`** | [`entitlement-reconciliation.service.ts`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/entitlements/reconciliation/entitlement-reconciliation.service.ts) | Varredura de transições temporais (`SCHEDULED` $\rightarrow$ `ACTIVE`, vencimentos e expiração de overrides). |
| **`EntitlementOverrideService`** | [`entitlement-override.service.ts`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/entitlements/overrides/entitlement-override.service.ts) | Gestão auditada de overrides administrativos excepcionais com autorização e prazo. |
| **`EntitlementMigrationService`** | [`entitlement-migration.service.ts`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/entitlements/migration/entitlement-migration.service.ts) | Migração de produtores legados com rastreabilidade sem contratos fictícios. |
| **`EntitlementService`** | [`entitlement.service.ts`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/entitlements/entitlement.service.ts) | Fachada central e motor de resolução em tempo real (`hasEntitlement`, `listContractedProducts`). |
| **`requireEntitlement`** | [`requireEntitlement.ts`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/entitlements/middleware/requireEntitlement.ts) | Middleware Express de proteção de endpoints contra uso não contratado. |

---

## 5. Endpoints REST da API v1

As rotas estão montadas em `/api/v1/entitlements`:

- `GET /features`: Lista catálogo de recursos técnicos conhecidos.
- `GET /check/:producerId/:featureCode`: Avaliação em tempo real de entitlement e cotas.
- `GET /producer/:producerId`: Lista completa de habilitações e limites do produtor.
- `GET /producer/:producerId/contracted-products`: Resumo estruturado para a UI do produtor.
- `POST /reconcile/:producerId`: Reconciliação manual de um produtor.
- `POST /reconcile`: Reconciliação global em lote.
- `POST /overrides`: Criação de override administrativo temporário.
- `GET /overrides`: Listagem de overrides ativos e históricos.
- `DELETE /overrides/:overrideId`: Revogação manual antecipada de override.
- `POST /migration/legacy`: Migração formal de direitos de produtor legado.
- `GET /audit/:producerId`: Trilha de telemetria e auditoria de direitos.

---

## 6. Frontend Integrado na Central do Produtor

Componente: [`ProducerProductsTab.tsx`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/apps/web/src/features/commercial/producers/components/ProducerProductsTab.tsx) montado na Central de Produtores ([`ProducerCommercialPage.tsx`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/apps/web/src/features/commercial/producers/ProducerCommercialPage.tsx)):

1. **Visão de Produtos Contratados:**
   - Nome e tipo da oferta (`PLAN`, `PACKAGE`, `SERVICE`).
   - Código público e número do contrato vinculado.
   - Status visual com badges semânticos (`ACTIVE`, `SCHEDULED`, `SUSPENDED`, `EXPIRED`).
   - Vigência temporal com datas de início e término.
   - Recursos técnicos incluídos com badges por categoria (`PORTARIA`, `MARKETING`, `BORDERÔ`, etc.).
   - Barras de progresso dinâmicas indicando o consumo atual de cada cota (ex.: 3 de 5 eventos ativos utilizados).
2. **Diagnóstico Técnico & Overrides:**
   - Simulador de permissões em tempo real (permite ao gestor testar o acesso a qualquer feature).
   - Gestão de overrides ativos com botão de revogação.
   - Modal com validação de justificativa e vigência futura para novos overrides.
3. **Telemetria & Auditoria:**
   - Linha do tempo imutável de eventos interceptados (concessões, avisos de limite e bloqueios).
