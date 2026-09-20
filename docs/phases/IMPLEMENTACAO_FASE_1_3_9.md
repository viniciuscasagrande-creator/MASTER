# Documentação de Implementação — Fase 1.3.9

**Fase:** 1.3.9 — Renovações + Expansão de Conta + Upgrade/Downgrade + Novas Oportunidades do Produtor  
**Data de Conclusão:** 2026-09-20  
**Status:** CONCLUÍDO E VALIDADO  
**Repositório:** `MASTER` (Disk Interno PDT / DiskIngressos)

---

## 1. Princípio Norteador e Invariantes Arquiteturais

A **Fase 1.3.9** consolida a operação comercial B2B pós-aquisição da plataforma Disk Interno, estabelecendo a gestão contínua do relacionamento com o produtor ativo.

> **Regra Fundamental:**  
> **Comercial é B2B. O cliente do Comercial é o Produtor. Renovação, upgrade, downgrade e expansão começam como processos comerciais. Nenhuma dessas ações altera contrato, habilitação ou cobrança diretamente.**

### Invariantes Estritamente Cumpridos:
1. **Zero Duplicação de CRM:** Não foi criada nenhuma entidade paralela (`RenewalCRM`, `ExpansionCRM`, `AccountMovementPipeline`, `ProducerCommercialHistory`). O produtor (`Producer`) continua sendo a entidade B2B central e as oportunidades de movimentação utilizam `CommercialOpportunity` (Fase 1.3.4).
2. **Zero Alteração Prematura de Domínios:** Nenhuma simulação ou avanço de etapa no pipeline concede features (`grantFeature`) nem emite faturas financeiras. A reconciliação de entitlements continua ocorrendo exclusivamente no atingimento da data efetiva (`effectiveFrom`) de contratos/aditivos formalmente assinados (Fase 1.3.8).
3. **Idempotência de Ciclo de Renovação:** Cada ciclo de renovação possui chave de idempotência estrita `contractId + renewalCycle` e bloqueio de concorrência otimista (`version`).
4. **Linha do Tempo Factual:** A cronologia da conta é agregada em tempo de consulta a partir dos eventos reais gravados nas tabelas de contratos, aditivos, renovações, oportunidades, propostas, atividades e habilitações.
5. **Simulação Consultiva (CommercialChangeImpactService):** O comparador de pacotes e impactos calcula com precisão matemática as adições, remoções (downgrades), deltas de cotas e condições financeiras com `entitlementWillChangeImmediately: false` garantido.

---

## 2. Componentes e Serviços Implementados

### 2.1. Backend (`backend/src/modules/commercial/account-management/`)

- **`account-query.service.ts` (`AccountQueryService`):**
  - Lista contas da carteira (`listAccounts`) com indicadores factuais: contratos ativos, contratos em janela de planejamento, produtos contratados distintos, oportunidades abertas, tarefas pendentes/vencidas e data do próximo vencimento.
  - Carrega a ficha executiva detalhada (`getAccountDetails`): consolida contratos, produtos contratados via `EntitlementService.listContractedProducts`, entitlements, renovações ativas, movimentações recentes e alertas.
  - Computa métricas operacionais consolidadas (`getMetrics`): total de produtores, cobertura de carteira com executivo de contas, volume em janela de planejamento, contratos vencidos (overdue), renovações em andamento e taxa factual de retenção no ciclo.

- **`account-timeline.service.ts` (`AccountTimelineService`):**
  - Constrói a cronologia factual da conta agregando eventos de `CommercialContract`, `ContractAmendment`, `ContractRenewal`, `CommercialOpportunity`, `CommercialProposal`, `CommercialActivity` e `ProducerEntitlement`.
  - Ordenação cronológica decrescente com metadados e atores auditáveis.

- **`renewals/renewal-policy.ts` (`RenewalPolicy`):**
  - Resolução dinâmica da janela de antecedência de planejamento (`commercial.renewal.planning_window_days`, padrão: 90 dias).
  - Cálculo de dias restantes, verificação de janela e detecção de contratos vencidos (overdue).

- **`renewals/renewal-query.service.ts` (`RenewalQueryService`):**
  - Central de Renovações com descoberta automática de contratos em janela ou vencidos sem ciclo iniciado (`NOT_STARTED`).
  - Filtros operacionais: por produtor, status, tipo de renovação, executivo responsável, apenas janela e apenas vencidos.

- **`renewals/renewal-orchestrator.service.ts` (`RenewalOrchestratorService`):**
  - Início idempotente de ciclo de renovação (`startRenewalNegotiation`). Em caso de renegociação, vincula e cria formalmente `CommercialOpportunity` com código `OPP-YYYY-NNNNN`.
  - Atualização concorrente segura com optimistic locking (`version`).
  - Registro de decisão formal (`decideRenewal`): conclusão simples com extensão da data de vigência do contrato (`effectiveUntil`), conclusão de renegociação com fechamento de oportunidade como `WON`, ou encerramento como `NOT_RENEWED` / `CANCELLED`.

- **`movements/commercial-movement.service.ts` (`CommercialMovementService`):**
  - Orquestra movimentações de contas (`UPGRADE`, `DOWNGRADE`, `EXPANSION`, `ADDITIONAL_SERVICE`, `CONTRACT_CHANGE`) sobre o motor unificado `CommercialOpportunity`.

- **`movements/change-impact.service.ts` (`CommercialChangeImpactService`):**
  - Motor comparador entre condições contratuais efetivas vigentes (`ContractEffectiveTermsService` + `EntitlementService`) e oferta pretendida do catálogo (`CommercialCatalogProvider`).
  - Mapeia `featuresAdded`, `featuresRemoved` (essencial para detecção de riscos em downgrades), `featuresMaintained`, variações de limites operacionais e comparativo de termos de preço.
  - Zero efeitos colaterais no banco de dados.

- **`alerts/account-commercial-alerts.provider.ts` (`AccountCommercialAlertsProvider`):**
  - Dispara alertas factuais e auditáveis: contratos vencidos sem renovação (`CRITICAL`), contratos a menos de 30 dias do término sem negociação aberta (`WARNING`), contratos em janela de planejamento (`INFO`) e produtores sem executivo responsável atribuído.

- **Controller & Rotas (`account-management.controller.ts` & `account-management.routes.ts`):**
  - Endpoints RESTful montados em `/api/v1/commercial/accounts`, `/api/v1/commercial/renewals`, `/api/v1/commercial/movements` e `/api/v1/commercial/change-impact`.
  - Autenticação e proteção estrita pelas novas permissões granulares da 1.3.9.

### 2.2. Frontend (`apps/web/src/features/commercial/account-management/`)

- **`AccountManagementPage.tsx`:** Painel executivo integrado com cards de métricas factuais no topo e alternância entre as três visões principais:
  - **Minha Carteira de Contas:** Tabela com status comercial, executivo responsável, contadores de contratos/produtos e atalhos rápidos.
  - **Central de Renovações:** Visão dedicada do ciclo de vida de renovação de contratos, prazos de expiração, status do ciclo e ações.
  - **Movimentações Comerciais:** Pipeline de oportunidades de expansão, upgrades, downgrades e serviços adicionais.
- **Modais Integrados:**
  - `StartRenewalModal.tsx`: Início formal de negociação (Simples vs Renegociação).
  - `RenewalStatusModal.tsx`: Atualização de status operacional com trava de concorrência.
  - `RenewalDecisionModal.tsx`: Registro de decisão formal de renovação.
  - `CreateMovementModal.tsx`: Abertura de nova oportunidade de movimentação.
  - `CommercialChangeImpactModal.tsx`: Simulador visual de impacto comercial e riscos.
  - `AccountTimelineModal.tsx`: Visualização da linha do tempo cronológica com filtros por categoria de evento.

---

## 3. Catálogo de Permissões Granulares (Fase 1.3.9)

| Permissão | Módulo | Recurso | Ação | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `comercial.gestao_contas.visualizar` | comercial | gestao_contas | visualizar | Consultar carteira de contas e métricas de relacionamento |
| `comercial.renovacoes.visualizar` | comercial | renovacoes | visualizar | Consultar central de renovações de contratos |
| `comercial.renovacoes.iniciar` | comercial | renovacoes | criar | Iniciar ciclo de renovação e oportunidade vinculada |
| `comercial.renovacoes.atualizar_status` | comercial | renovacoes | editar | Atualizar status operacional do ciclo de renovação |
| `comercial.renovacoes.decidir` | comercial | renovacoes | aprovar | Formalizar conclusão, não renovação ou cancelamento |
| `comercial.movimentacoes.visualizar` | comercial | movimentacoes | visualizar | Consultar oportunidades de expansão, upgrades e downgrades |
| `comercial.movimentacoes.criar` | comercial | movimentacoes | criar | Registrar nova oportunidade de movimentação de conta |
| `comercial.movimentacoes.analisar_impacto` | comercial | movimentacoes | visualizar | Simular comparativo de impacto comercial sem efeitos colaterais |
| `comercial.contas.historico.visualizar` | comercial | contas | visualizar | Inspecionar linha do tempo factual da conta |

---

## 4. Endpoints Disponibilizados

| Método | Endpoint | Permissão Exigida | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/commercial/accounts` | `comercial.gestao_contas.visualizar` | Lista resumo factual das contas da carteira |
| `GET` | `/api/v1/commercial/accounts/metrics` | `comercial.gestao_contas.visualizar` | Métricas consolidadas de gestão de contas |
| `GET` | `/api/v1/commercial/accounts/:producerId` | `comercial.gestao_contas.visualizar` | Ficha executiva completa da conta do produtor |
| `GET` | `/api/v1/commercial/accounts/:producerId/timeline` | `comercial.contas.historico.visualizar` | Linha do tempo unificada de eventos |
| `GET` | `/api/v1/commercial/accounts/alerts` | `comercial.gestao_contas.visualizar` | Alertas factuais da carteira comercial |
| `GET` | `/api/v1/commercial/renewals` | `comercial.renovacoes.visualizar` | Lista contratos e ciclos na Central de Renovações |
| `GET` | `/api/v1/commercial/renewals/:id` | `comercial.renovacoes.visualizar` | Detalhes de um ciclo de renovação |
| `POST` | `/api/v1/commercial/renewals/start-negotiation` | `comercial.renovacoes.iniciar` | Inicia ciclo de renovação e gera oportunidade |
| `PATCH` | `/api/v1/commercial/renewals/:id/status` | `comercial.renovacoes.atualizar_status` | Atualiza status com optimistic locking (`version`) |
| `POST` | `/api/v1/commercial/renewals/:id/decide` | `comercial.renovacoes.decidir` | Conclui ou encerra ciclo de renovação |
| `GET` | `/api/v1/commercial/movements` | `comercial.movimentacoes.visualizar` | Lista oportunidades de movimentações |
| `POST` | `/api/v1/commercial/movements` | `comercial.movimentacoes.criar` | Cria oportunidade formal de movimentação |
| `POST` | `/api/v1/commercial/change-impact/simulate` | `comercial.movimentacoes.analisar_impacto`| Simula comparativo de termos e features |
