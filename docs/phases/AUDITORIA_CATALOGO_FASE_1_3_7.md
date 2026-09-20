# Auditoria de Estruturas Comerciais Existentes — Fase 1.3.7
**Data da Auditoria:** 20/09/2026  
**Sistema:** Disk Interno PDT / DiskIngressos B2B  
**Objetivo:** Verificar estruturas existentes relacionadas a DiskHub, Módulos de Vendas, planos, pacotes, serviços, produtos comerciais, módulos, features e pricing para garantir a existência de uma **fonte única e oficial** antes da criação de novos modelos.

---

## 1. Estruturas Encontradas no Projeto

1. **Catálogo Inicial de Ofertas (`backend/prisma/schema.prisma` e `backend/src/core/database/prisma.ts`):**
   * `CommercialOfferingCategory`: Categorias (`code`, `name`, `description`, `sortOrder`, `active`). Categorias pré-carregadas: *Plataforma & Ticketeria*, *Controle de Acesso & Portaria*, *Bilheteria Física & PDV*, *Marketing & Divulgação*, *Equipamentos & Insumos*, *Serviços Adicionais*.
   * `CommercialOffering`: Tabela plana inicial com `id`, `categoryId`, `code`, `name`, `description`, `defaultPricingModel`, `defaultPercentage`, `defaultAmount`, `defaultPayer`, `active`, `sortOrder`.
   * `CommercialOfferingService` (`backend/src/modules/commercial/proposals/offerings/commercial-offering.service.ts`): Serviço inicial de consulta de categorias e ofertas criado na Fase 1.3.5.

2. **Termos Comerciais e Modelos de Precificação:**
   * `ProposalCommercialTerm`: Condições negociadas em versões de propostas comerciais (`termType`, `calculationType`, `percentage`, `amount`, `payer`, `splitProducerPercentage`, `splitBuyerPercentage`).
   * `ContractCommercialTerm`: Condições vigentes em versões de contratos comerciais.
   * `CommercialPricingModel`: Enum compartilhado com os modelos `PERCENTAGE`, `FIXED_AMOUNT`, `PER_TICKET`, `SUBSCRIPTION`, `HYBRID`, `CUSTOM`.
   * `ProposalTermType`: Enum compartilhado de tipos de remuneração: `PLATFORM_COMMISSION`, `ACCESS_CONTROL`, `BOX_OFFICE`, `MARKETING`, `EQUIPMENT`, `REBATE`, `MINIMUM_GUARANTEE`, `SETUP_FEE`, `CUSTOM`.

3. **Verificação de Outros Repositórios / DiskHub:**
   * Uma busca recursiva no código (`grep_search`) por `DiskHub` e `SalesModule` retornou 0 ocorrências no repositório `MASTER`.
   * **Conclusão:** O repositório `MASTER` é o Monólito Modular canônico do Disk Interno e concentra a definição dos dados corporativos. Não há base externa duplicada de catálogo no ambiente atual.

---

## 2. Fonte Atual dos Dados

* **Entidade Raiz:** `CommercialOffering` no Prisma schema e no In-Memory Prisma Store (`prisma.ts`).
* **Consumidores Atuais:**
  * `ProposalService` (Fase 1.3.5) consome ofertas como referência inicial para adicionar termos a propostas comerciais.
  * `ProposalDetailsPage.tsx` e `ProposalCreateModal.tsx` no frontend realizam chamadas para `/api/v1/commercial/offerings`.

---

## 3. Duplicidades Identificadas

* **Nenhuma duplicidade de tabelas:**
  * Não foram criadas tabelas separadas como `CommercialPlan`, `CommercialPackage`, `CommercialProduct` ou `CommercialService`.
  * Isso é altamente positivo e preserva a recomendação do passo zero: manter a raiz unificada `CommercialOffering`.
* **Localização do Serviço:**
  * O `CommercialOfferingService` foi alocado provisoriamente em `proposals/offerings/`. Ele deve ser promovido para `backend/src/modules/commercial/catalog/` como domínio oficial independente.

---

## 4. Estruturas Reutilizáveis

1. **`CommercialOffering` e `CommercialOfferingCategory`:** Podem ser expandidas para acomodar tipo, versionamento e composição sem quebrar os dados já existentes em propostas (PROP-101, PROP-201, PROP-301).
2. **`CommercialPricingModel` e `ProposalPayer`:** Enums perfeitamente alinhados entre Catálogo, Proposta e Contrato.
3. **`PolicyEngine` e `ApprovalEngine`:** Motores de alçada corporativa do Core, reutilizáveis para publicação de versões sensíveis do catálogo.
4. **`AuditService`:** Trilha de auditoria existente para log de eventos de catálogo.

---

## 5. Estruturas que Precisam ser Consolidadas / Evoluídas

1. **Campo `type` em `CommercialOffering`:**
   * Inclusão do discriminador de tipo: `'PLAN' | 'PACKAGE' | 'SERVICE' | 'MODULE' | 'ADD_ON'`.
2. **Transição de Oferta Estática para Versionada:**
   * A oferta atual possui apenas atributos planos. Deve receber `currentVersionId` e ser acompanhada por `CommercialOfferingVersion`.
3. **Isolamento de Domínio:**
   * O catálogo não deve ser um submódulo de "proposals". Propostas devem consumir o catálogo através de uma interface de contrato (`CommercialCatalogProvider`).

---

## 6. Estruturas Realmente Ausentes (A Implementar na Fase 1.3.7)

1. **`CommercialOfferingVersion`:** Versionamento formal e imutável com `versionNumber`, `contentHash` SHA-256, status (`DRAFT`, `ACTIVE`, `INACTIVE`, `DISCONTINUED`), `validFrom`, `validUntil` e snapshots.
2. **`CommercialOfferingComposition`:** Suporte a pacotes compostos por múltiplas ofertas filhas, com validação de grafos dirigidos contra referências circulares (ex: Pacote A -> Pacote B -> Pacote A).
3. **`CommercialFeature` & `OfferingFeature`:** Catálogo de capacidades técnicas e módulos comercializáveis com identificador técnico e descrição amigável, sem misturar limites comerciais com RBAC.
4. **`CommercialDefaultTerm`:** Condições comerciais padrão atreladas à versão da oferta, servindo de base para novas propostas sem alterar contratos vigentes.
5. **`CommercialCatalogProvider`:** Interface desacopladora que fornece ofertas ativas, versões e resolução de termos padrão.
6. **`CommercialCatalogImpactService`:** Serviço de análise de impacto prévio que quantifica o impacto sobre propostas em rascunho, propostas enviadas, contratos vigentes e pacotes compostos antes de descontinuar ou publicar uma versão.
7. **Frontend Central do Catálogo (`/comercial/configuracoes/catalogo`):**
   * `CommercialCatalogPage.tsx` com filtros de categoria, situação e tipo.
   * `OfferingDetailsPage.tsx` com abas estruturadas: *Resumo*, *Composição*, *Recursos*, *Condições Padrão*, *Versões*, *Uso Comercial* e *Histórico*.
   * Modais de criação, nova versão, publicação com alçada e descontinuação com análise de impacto.

---

## 7. Decisão Arquitetural da Fase 1.3.7

> **Decisão:** Manter **`CommercialOffering` como fonte única oficial de catálogo no monólito `MASTER`**, evoluindo-a para suportar tipos (`PLAN`, `PACKAGE`, `SERVICE`, `MODULE`, `ADD_ON`), versionamento imutável (`CommercialOfferingVersion`), composição sem duplicação de texto e catálogo de capacidades (`CommercialFeature`).
> Propostas (1.3.5) e Contratos (1.3.6) passarão a consultar o catálogo estritamente via `CommercialCatalogProvider`, preservando a integridade dos snapshots históricos.
