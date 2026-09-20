# Fase 1.3.7 — Catálogo Comercial, Planos, Pacotes, Serviços e Condições Padrão

## 1. Visão Geral e Propósito

A **Fase 1.3.7** estabelece a fonte oficial e única do que a **DiskIngressos** comercializa para **produtores** (B2B). Ela fecha uma dependência estrutural que emergiu organicamente nas propostas comerciais (Fase 1.3.5) e nos contratos comerciais (Fase 1.3.6).

A premissa arquitetural norteadora é a **Fonte Única da Verdade (Single Source of Truth)**: não criar entidades divergentes ou tabelas duplicadas (`CommercialPlan`, `CommercialPackage`). Toda a comercialização da DiskIngressos é governada pela entidade raiz `CommercialOffering`, categorizada pelos seus tipos canônicos (`PLAN`, `PACKAGE`, `SERVICE`, `MODULE`, `ADD_ON`), versionada de maneira imutável e consumida via provedor desacoplado (`CommercialCatalogProvider`).

---

## 2. Princípios Arquiteturais e Diretrizes Críticas

1. **Catálogo Único B2B:**
   - O cliente de todas as ofertas deste domínio é estritamente o **Produtor** ou **Organizador de Eventos**.
   - Ingressos individuais vendidos ao comprador final pertencem estritamente ao módulo de Ticketeria/Checkout (B2C), jamais a este catálogo.
2. **Versionamento Imutável com Hash Criptográfico (SHA-256):**
   - Nenhuma alteração de termos, preços ou escopo técnico altera diretamente versões já publicadas.
   - Cada versão (`CommercialOfferingVersion`) possui um hash determinístico SHA-256 (`contentHash`) calculado sobre: `nameSnapshot`, `descriptionSnapshot`, `defaultTerms`, `features` e `compositions`.
   - Versões publicadas são somente-leitura; novas negociações demandam a criação de uma nova versão (iniciando em `DRAFT`).
3. **Isolamento por Snapshot em Propostas e Contratos:**
   - Propostas comerciais (Fase 1.3.5) e Contratos assinados (Fase 1.3.6) salvam o snapshot completo dos termos e da versão contratada.
   - A publicação de uma versão `v2` ou a descontinuação de uma oferta no catálogo **jamais altera** propostas em andamento ou contratos vigentes.
4. **Prevenção Rigorosa de Ciclos na Composição de Pacotes (DFS):**
   - Um pacote não pode incluir a si mesmo.
   - Inclusões circulares (ex.: Pacote A inclui Pacote B, e Pacote B tenta incluir Pacote A) são interceptadas e rejeitadas em tempo de execução via algoritmo Depth-First Search (DFS).
5. **Recursos Técnicos (Features) Desacoplados de RBAC:**
   - Features técnicas do catálogo (`feature.access.offline_validator`, `feature.boxoffice.cash_control`, `feature.marketing.boost_email`, etc.) definem entregáveis técnicos e limites operacionais incluídos na solução contratada.
   - Elas **não** se confundem com as permissões de acesso do usuário no sistema (RBAC do Disk Interno).
6. **Consumo Desacoplado via `CommercialCatalogProvider`:**
   - O CRM, as Propostas e os Contratos não realizam consultas diretas e acopladas ao banco; eles consomem a interface oficial `ICommercialCatalogProvider`.

---

## 3. Estrutura de Modelos de Dados (Prisma Schema)

```prisma
model CommercialOffering {
  id                   String                       @id @default(uuid())
  publicCode           String                       @unique // OFR-YYYY-XXXXXX
  categoryId           String
  code                 String                       @unique
  name                 String
  type                 String                       @default("SERVICE") // PLAN, PACKAGE, SERVICE, MODULE, ADD_ON
  shortDescription     String?
  description          String?
  status               String                       @default("ACTIVE")  // DRAFT, ACTIVE, INACTIVE, DISCONTINUED
  currentVersionId     String?
  currentVersionNumber Int                          @default(1)
  defaultPricingModel  String                       @default("PERCENTAGE")
  defaultPercentage    Float?
  defaultAmount        Float?
  defaultPayer         String                       @default("PRODUCER")
  active               Boolean                      @default(true)
  sortOrder            Int                          @default(0)
  createdAt            DateTime                     @default(now())
  updatedAt            DateTime                     @updatedAt

  category             CommercialOfferingCategory   @relation(fields: [categoryId], references: [id])
  versions             CommercialOfferingVersion[]
  compositionsAsParent CommercialOfferingComposition[] @relation("ParentComposition")
  compositionsAsChild  CommercialOfferingComposition[] @relation("ChildComposition")
}

model CommercialOfferingVersion {
  id                  String                      @id @default(uuid())
  offeringId          String
  versionNumber       Int
  status              String                      @default("DRAFT") // DRAFT, ACTIVE, INACTIVE, DISCONTINUED
  nameSnapshot        String
  descriptionSnapshot String?
  validFrom           DateTime?
  validUntil          DateTime?
  contentHash         String                      // SHA-256
  changeSummary       String?
  publishedAt         DateTime?
  publishedBy         String?
  publishedByName     String?
  createdBy           String
  createdByName       String?
  createdAt           DateTime                    @default(now())
  updatedAt           DateTime                    @updatedAt

  offering            CommercialOffering          @relation(fields: [offeringId], references: [id], onDelete: Cascade)
  defaultTerms        CommercialDefaultTerm[]
  features            OfferingFeature[]
  compositions        CommercialOfferingComposition[] @relation("ParentComposition")
}

model CommercialOfferingComposition {
  id                      String                  @id @default(uuid())
  parentOfferingId        String
  parentOfferingVersionId String
  childOfferingId         String
  childOfferingVersionId  String?
  quantity                Int                     @default(1)
  required                Boolean                 @default(true)
  sortOrder               Int                     @default(0)
  createdAt               DateTime                @default(now())

  parentOffering          CommercialOffering      @relation("ParentComposition", fields: [parentOfferingId], references: [id], onDelete: Cascade)
  parentVersion           CommercialOfferingVersion @relation("ParentComposition", fields: [parentOfferingVersionId], references: [id], onDelete: Cascade)
  childOffering           CommercialOffering      @relation("ChildComposition", fields: [childOfferingId], references: [id], onDelete: Cascade)
}

model CommercialFeature {
  id               String            @id @default(uuid())
  code             String            @unique
  name             String
  description      String?
  category         String            @default("PLATFORM")
  active           Boolean           @default(true)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  offeringFeatures OfferingFeature[]
}

model OfferingFeature {
  id                 String                    @id @default(uuid())
  offeringVersionId  String
  featureId          String
  included           Boolean                   @default(true)
  limitValue         Int?
  limitUnit          String?
  configurationJson  String?
  createdAt          DateTime                  @default(now())

  offeringVersion    CommercialOfferingVersion @relation(fields: [offeringVersionId], references: [id], onDelete: Cascade)
  feature            CommercialFeature         @relation(fields: [featureId], references: [id], onDelete: Cascade)
}

model CommercialDefaultTerm {
  id                      String                    @id @default(uuid())
  offeringVersionId       String
  termType                String
  calculationType         String
  currency                String                    @default("BRL")
  percentage              Float?
  amount                  Float?
  minimumAmount           Float?
  payer                   String                    @default("PRODUCER")
  splitProducerPercentage Float?
  splitBuyerPercentage    Float?
  conditions              String?
  negotiable              Boolean                   @default(true)
  validFrom               DateTime?
  validUntil              DateTime?
  createdAt               DateTime                  @default(now())

  offeringVersion         CommercialOfferingVersion @relation(fields: [offeringVersionId], references: [id], onDelete: Cascade)
}
```

---

## 4. Camada de Serviços do Backend

Localizada em `backend/src/modules/commercial/catalog/`:

| Serviço | Responsabilidade |
|---|---|
| [`OfferingService`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/commercial/catalog/offerings/offering.service.ts) | CRUD de ofertas, geração de `publicCode`, criação automática da Versão 1 (v1), descontinuação com auditoria de impacto. |
| [`OfferingVersionService`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/commercial/catalog/versions/offering-version.service.ts) | Gerenciamento de ciclo de vida de versões, cálculo do hash canônico SHA-256 e promoção de rascunhos para versão ativa. |
| [`OfferingCompositionService`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/commercial/catalog/composition/offering-composition.service.ts) | Composição hierárquica de combos/pacotes com algoritmo DFS de detecção e prevenção de ciclos. |
| [`OfferingFeatureService`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/commercial/catalog/features/offering-feature.service.ts) | Catálogo de capacidades técnicas de produto e limites operacionais ativados por oferta. |
| [`DefaultTermsResolver`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/commercial/catalog/terms/default-terms.resolver.ts) | Resolução consolidada de condições comerciais padrão vigentes para ofertas e pacotes. |
| [`CatalogImpactService`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/commercial/catalog/impact/catalog-impact.service.ts) | Análise de dependências em tempo real (propostas em rascunho, propostas enviadas, contratos ativos e pacotes pai). |
| [`CommercialCatalogProvider`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/commercial/catalog/commercial-catalog.provider.ts) | Interface e implementação singleton desacoplada para consumo seguro por Propostas e Contratos. |
| [`CatalogQueryService`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/backend/src/modules/commercial/catalog/catalog-query.service.ts) | Agregações executivas, contadores de métricas e visualizações agrupadas de planos, pacotes e serviços. |

---

## 5. Endpoints REST da API

Montados em `/api/v1/commercial/catalog`:

- `GET /metrics` — Métricas executivas consolidadas do catálogo
- `GET /plans` — Lista de planos oficiais de ticketeria
- `GET /packages` — Lista de pacotes comerciais com itens componentes
- `GET /services` — Lista de serviços individuais e adicionais
- `GET /categories` — Categorias com ofertas vinculadas
- `GET /offerings` — Lista paginada/filtrada de ofertas comerciais
- `POST /offerings` — Cadastro de nova oferta comercial (gera v1 automática)
- `GET /offerings/:id` — Detalhes completos da oferta com versão corrente
- `PUT /offerings/:id` — Atualização de metadados gerais da oferta
- `POST /offerings/:id/discontinue` — Descontinuação segura de oferta
- `GET /offerings/:id/impact` — Relatório de impacto comercial e contratual
- `GET /offerings/:id/terms` — Resolução das condições padrão ativas
- `GET /offerings/:id/versions` — Linha do tempo de versões históricas
- `POST /offerings/:id/versions` — Criação de versão em rascunho (DRAFT)
- `POST /versions/:versionId/publish` — Publicação e ativação oficial de versão
- `GET /features` — Lista de recursos técnicos cadastrados
- `POST /features` — Cadastro de novo recurso técnico

---

## 6. Interface do Usuário (Frontend Web)

Localizada em `apps/web/src/features/commercial/catalog/`:

- **Página Principal ([`CommercialCatalogPage.tsx`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/apps/web/src/features/commercial/catalog/CommercialCatalogPage.tsx)):**
  - Cards de métricas no topo (Ofertas Ativas, Planos, Pacotes, Serviços).
  - Abas especializadas: *Todas as Ofertas*, *Planos Oficiais*, *Pacotes (Combos)*, *Serviços Individuais*.
  - Filtros por busca textual, categoria comercial e status de ciclo de vida.
  - Tabela detalhada com códigos públicos `OFR-YYYY-XXXXXX`, versões e hashes SHA-256.
- **Página de Detalhes ([`OfferingDetailsPage.tsx`](file:///C:/Users/vinad/OneDrive/Desktop/MASTER/apps/web/src/features/commercial/catalog/OfferingDetailsPage.tsx)):**
  - Banner com código público, tipo, status e badge de integridade SHA-256.
  - Abas: *Resumo*, *Composição*, *Recursos Técnicos*, *Condições Padrão*, *Versões Históricas*, *Uso & Impacto*.
  - Ações para criar rascunho de nova versão e descontinuação segura.
- **Modais de Ação:**
  - `CreateOfferingModal.tsx`: Wizard de criação de oferta com precificação padrão, itens componentes e recursos.
  - `NewVersionModal.tsx`: Formulário de criação de nova versão com resumo obrigatório de mudanças (`changeSummary`).
  - `PublishVersionModal.tsx`: Homologação e publicação de versão com confirmação de imutabilidade.
  - `DiscontinueOfferingModal.tsx`: Painel de impacto em tempo real demonstrando ausência de ruptura para contratos e propostas existentes.
