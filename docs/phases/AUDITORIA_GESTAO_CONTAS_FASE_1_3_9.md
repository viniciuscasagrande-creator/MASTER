# Auditoria Prévia — Gestão de Contas, Renovações e Movimentações Comerciais (Fase 1.3.9)

**Data:** 2026-09-20  
**Contexto:** Fase 1.3.9 — Renovações + Expansão de Conta + Upgrade/Downgrade + Novas Oportunidades do Produtor  
**Status:** APROVADO PARA IMPLEMENTAÇÃO  

---

## 1. Objetivo da Auditoria (Passo Zero Obrigatório)

A diretriz fundamental da Fase 1.3.9 é:
> **"Comercial é B2B. O cliente do Comercial é o Produtor. Renovação, upgrade, downgrade e expansão começam como processos comerciais. Nenhuma dessas ações altera contrato, habilitação ou cobrança diretamente."**

O objetivo desta auditoria prévia é inspecionar minuciosamente todas as entidades, serviços e motores existentes no monorepo `MASTER` construídos nas fases anteriores (1.3.3 a 1.3.8) e garantir que:
1. **Nenhum segundo CRM seja criado**: Não inventaremos entidades paralelas como `RenewalCRM`, `ExpansionCRM`, `UpgradeCRM` ou `AccountCRM`. O produtor (`Producer`) continua sendo a entidade B2B central e `CommercialAccount` sua extensão comercial.
2. **Nenhuma segunda tabela de pipeline seja criada**: Não criaremos `AccountMovementPipeline` ou `RenewalPipeline`. O motor unificado `CommercialOpportunity` e `CommercialPipeline` (Fase 1.3.4) atende plenamente.
3. **Nenhum domínio financeiro ou de habilitação seja burlado**: `Opportunity WON` não altera plano, `grantFeature()` não é chamado prematuramente e nenhuma fatura/cobrança é disparada pelo Comercial.
4. **Nenhum indicador especulativo seja inventado**: Foco estrito em métricas e fatos auditáveis. Rejeição explícita a "health score", "previsão de churn com IA", "propensão de upgrade" ou "ranking subjetivo de vendedores".

---

## 2. Inventário de Recursos Existentes no Repositório

### 2.1. Contas e Produtores (Fase 1.3.3)
- **Modelos:** `Producer`, `ProducerContact`, `ProducerDocument`, `CommercialAccount`, `CommercialPortfolioAssignment`, `CommercialActivity`.
- **Serviços:** `CommercialPortfolioService`, `CommercialActivityService`, `ProducerCommercialQueryService`.
- **Constatação da Auditoria:** O produtor possui vínculo com executivo de contas via `CommercialPortfolioAssignment`. As atividades de relacionamento (`CommercialActivity`) registram fatos passados (reuniões, ligações, e-mails, atas).
- **Aproveitamento na 1.3.9:** A nova aba **Gestão da Conta** na ficha do produtor consumirá e orquestrará esses dados de forma consolidada, sem duplicar tabelas de produtor ou inventar um "CRM de Customer Success".

### 2.2. Oportunidades e Pipeline Comercial (Fase 1.3.4)
- **Modelos:** `CommercialOpportunity`, `CommercialPipeline`, `CommercialPipelineStage`, `OpportunityStageHistory`, `OpportunityCloseReason`.
- **Serviços:** `CommercialOpportunityService`, `OpportunityQueryService`, `OpportunityClosingService`.
- **Constatação da Auditoria:** `CommercialOpportunity` já possui `typeId`, `status` (`OPEN`, `WON`, `CLOSED`), `ownerId`, `estimatedValue` e controle de versão concorrente (`version`).
- **Aproveitamento na 1.3.9:** As movimentações comerciais (`RENEWAL`, `EXPANSION`, `UPGRADE`, `DOWNGRADE`, `ADDITIONAL_SERVICE`, `CONTRACT_CHANGE`) serão categorizações explícitas de `CommercialOpportunity`. O código público segue o padrão `OPP-YYYY-NNNNN`.

### 2.3. Propostas Comerciais (Fase 1.3.5)
- **Modelos:** `CommercialProposal`, `CommercialProposalVersion`, `ProposalCommercialTerm`, `ProposalOffering`.
- **Serviços:** `CommercialProposalService`, `ProposalQueryService`.
- **Constatação da Auditoria:** Qualquer renegociação comercial que demande revisão de taxas ou acréscimo de serviços deve gerar uma proposta formal vinculada à oportunidade de renovação/upgrade/expansão.

### 2.4. Contratos e Renovações Contratuais (Fase 1.3.6)
- **Modelos:** `CommercialContract`, `CommercialContractVersion`, `ContractAmendment`, `ContractRenewal`, `SignatureEnvelope`.
- **Serviços:** `CommercialContractService`, `ContractRenewalService`, `ContractEffectiveTermsService`.
- **Constatação da Auditoria:** `ContractRenewal` já foi criado na 1.3.6 com campos `contractId`, `renewalType` (`SIMPLE`, `RENEGOTIATION`), `status`, `targetEffectiveUntil`, `sourceOpportunityId`.
- **Aproveitamento na 1.3.9:** Operacionalizar a **Central de Renovações** sobre `ContractRenewal`, expandindo os estados operacionais (`NOT_STARTED`, `PLANNED`, `IN_PROGRESS`, `PROPOSAL`, `AWAITING_DECISION`, `COMPLETED`, `NOT_RENEWED`, `CANCELLED`), garantindo **idempotência de ciclo** (`contractId + renewalCycle`) e concorrência otimista com `version`.

### 2.5. Catálogo Comercial (Fase 1.3.7)
- **Modelos:** `CommercialOffering`, `CommercialOfferingVersion`, `CommercialOfferingComposition`, `CommercialFeature`, `OfferingFeature`, `CommercialDefaultTerm`.
- **Provedor:** `CommercialCatalogProvider` (`ICommercialCatalogProvider`).
- **Constatação da Auditoria:** O catálogo fornece snapshots de versões imutáveis de ofertas e suas features técnicas associadas.
- **Aproveitamento na 1.3.9:** Utilizado como a **fonte pretendida** no comparador de impacto comercial (`CommercialChangeImpactService`).

### 2.6. Habilitações e Produtos Contratados (Fase 1.3.8)
- **Modelos:** `ProducerEntitlement`, `EntitlementLimit`, `EntitlementOverride`, `EntitlementAuditLog`.
- **Serviço:** `EntitlementService` (`listContractedProducts`, `listProducerEntitlements`).
- **Constatação da Auditoria:** O estado atual de produtos contratados e features ativas é gerido pelo `EntitlementService` e refletido juridicamente pelo `ContractEffectiveTermsService`.
- **Aproveitamento na 1.3.9:** Não criaremos nenhuma tabela `CommercialCurrentProducts`. A fonte do estado atual contratado será `ContractEffectiveTermsService` (condições de preço e borderô) e `EntitlementService` (features técnicas e cotas).

### 2.7. Motores Transversais
- **Task Engine (`TaskService`):** Responsável pelas próximas ações (`nextAction`). `CommercialActivity` = aconteceu; `Task` = precisa acontecer.
- **Policy Engine:** Fornece a janela de antecedência de planejamento (`commercial.renewal.planning_window_days`). Sem hardcode de "90 dias".
- **Notification Engine & Alert Engine:** Disparo de alertas factuais de contratos vencendo e tarefas atrasadas.
- **Audit Service & Event Bus:** Rastreabilidade estrita de cada alteração de status de renovação e emissão de sinais de movimentação.

---

## 3. Delimitação Estrita do Ciclo de Movimentação

```text
+-----------------------------------------------------------------------------------------+
|                                     PRODUTOR ATIVO                                      |
|  - Contratos Vigentes (ContractEffectiveTermsService)                                  |
|  - Produtos Habilitados (EntitlementService)                                           |
|  - Carteira & Responsável (CommercialPortfolioAssignment)                               |
+-----------------------------------------------------------------------------------------+
                                             │
                          Identificação de Necessidade B2B
                          (Janela de Renovação / Demanda do Produtor)
                                             ▼
+-----------------------------------------------------------------------------------------+
|                                  GESTÃO DA CONTA (1.3.9)                                 |
|                                                                                         |
|   ┌─────────────────────────┬─────────────────────────┬─────────────────────────────┐   |
|   │       RENOVAÇÃO         │        EXPANSÃO         │      UPGRADE / DOWNGRADE    │   |
|   │  ContractRenewal        │  Oportunidade           │  Oportunidade               │   |
|   │  status: NOT_STARTED... │  type: EXPANSION        │  type: UPGRADE / DOWNGRADE  │   |
|   └─────────────────────────┴─────────────────────────┴─────────────────────────────┘   |
|                                             │                                           |
|                                             ▼                                           |
|                     CommercialChangeImpactService (SIMULAÇÃO)                          |
|                     "Compara estado atual vs. estado pretendido"                         |
|                     [Fatos: Features adicionadas/removidas, limites, contratos]        |
|                     *NENHUMA alteração é executada aqui*                                |
+-----------------------------------------------------------------------------------------+
                                             │
                             Necessita Negociação Comercial?
                                             ▼
+-----------------------------------------------------------------------------------------+
|                              OPORTUNIDADE & PROPOSTA (1.3.4 / 1.3.5)                    |
|  - Negociação comercial, prazos e condições acordadas                                   |
|  - Proposta formal emitida e aceita pelo Produtor                                      |
+-----------------------------------------------------------------------------------------+
                                             │
                                Formalização Jurídica
                                             ▼
+-----------------------------------------------------------------------------------------+
|                               CONTRATO / ADITIVO (1.3.6)                                |
|  - Assinatura digital do novo instrumento ou aditivo                                    |
|  - Fixação da data efetiva de vigência (effectiveFrom)                                  |
+-----------------------------------------------------------------------------------------+
                                             │
                              Data Efetiva de Vigência Atingida
                                             ▼
+-----------------------------------------------------------------------------------------+
|                            HABILITAÇÕES / ENTITLEMENTS (1.3.8)                          |
|  - EntitlementReconciliationService ativa os novos limites                             |
|  - Features do plano antigo descontinuadas e novas liberadas                            |
+-----------------------------------------------------------------------------------------+
```

---

## 4. O Que NÃO Será Desenvolvido na Fase 1.3.9

1. **Alteração Direta de Plano/Entitlement:** A 1.3.9 não executa queries de update de plano nem concede features.
2. **Motor Financeiro:** Sem geração de boleto, fatura, cobrança, repasse ou conciliação bancária.
3. **Health Score & Previsões Artificiais:** Não calculamos probabilidade de churn ou nota de produtor sem especificação formal.
4. **Tabelas Redundantes:** Não criaremos `ProducerCommercialHistory`, `RenewalCRM`, `UpgradePipeline`, etc.
5. **Ranking de Vendedores:** Mostramos dados operacionais factuais (volume de renovações, tarefas), sem juízo de valor ou ranking subjetivo.

---

## 5. Conclusão e Parecer Técnico

A arquitetura do `MASTER` possui bases sólidas nas Fases 1.3.3 a 1.3.8 para sustentar a **Fase 1.3.9 como uma camada pura de orquestração, leitura e inteligência relacional**. 

A modelagem proposta respeita o princípio de B2B corporativo, preserva a integridade contratual e assegura idempotência e rastreabilidade total.

**Parecer:** AUTORIZADO O INÍCIO DA IMPLEMENTAÇÃO DA FASE 1.3.9.
