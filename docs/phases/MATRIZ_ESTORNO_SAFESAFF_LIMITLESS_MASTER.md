# Matriz de Paridade — Estorno: SafeSaff × Limitless × MASTER

**Fase:** 1.3.11.1.4.3 — Recuperação Completa de ESTORNO  
**Data:** 20/09/2026  
**Status:** 100% Homologado e Sincronizado  
**Localização:** `docs/phases/MATRIZ_ESTORNO_SAFESAFF_LIMITLESS_MASTER.md`

---

## 1. Visão Geral da Tripla Autoridade

A arquitetura do motor de **Estornos** do Disk Interno recupera o equilíbrio entre as três bases de autoridade:
1. **SafeSaff (Autoridade Funcional):** Motor factual de elegibilidade, cálculo de alçadas em 3 níveis (< R$ 1.000, R$ 1.000 a R$ 5.000, >= R$ 5.000), princípio compulsório de segregação de funções (Maker-Checker: solicitante ≠ aprovador), plano de lançamentos compensatórios no Ledger Contábil (`buildReversalPlan`).
2. **Limitless (Autoridade Visual e UX):** Layout denso corporativo, esteira de status com badges semânticos rigorosos, abas operacionais com cards de métricas factuais, modais detalhados com tabs de auditoria, 100% pt-BR e sem termos genéricos ("360").
3. **MASTER (Base Técnica):** Backend Node.js/Express estruturado com rotas `/refunds`, controller REST, delegates de dados no Prisma/InMemoryStore, middlewares de autenticação e RBAC, e barramento de auditoria (`AuditService`).

---

## 2. Matriz Comparativa de Funcionalidades

| Funcionalidade / Componente | SafeSaff | Limitless | MASTER Anterior | MASTER Recuperado (1.3.11.1.4.3) |
| :--- | :---: | :---: | :---: | :---: |
| **Motor de Elegibilidade Factual** | `refundEnterpriseEngine.ts` | ❌ | ❌ (Regras pontuais) | ✅ `RefundService.evaluateEligibility` com cálculo de saldo remanescente |
| **Alçadas por Faixa de Valor** | 1 a 3 níveis por valor | ❌ | ⚠️ Políticas isoladas no Approval Engine | ✅ 1 nível (< 1k), 2 níveis (1k a 5k), 3 níveis (>= 5k) |
| **Segregação de Função (Maker-Checker)** | Compulsório (`requestedBy != approvedBy`) | ❌ | ❌ | ✅ Bloqueio no backend (`ForbiddenError`) e badge no frontend |
| **Garantia de Idempotência no Gateway** | Chave de idempotência no provedor | ❌ | ❌ | ✅ Cache com `idempotencyKey` impedindo duplo estorno bancário |
| **Cascata Reversa Integrada** | Compensating entries | ❌ | ⚠️ Banner explicativo apenas | ✅ Invalidação de ingressos na catraca + atualização de pedido + ledger |
| **Centro de Controle Denso** | `FinanceDisputesHubPage.tsx` | UI moderna | Tabela simples | ✅ `RefundsDashboard.tsx` com 4 abas e filtros completos |
| **Modal / Dossiê de Estorno** | Drawer básico | Cards visuais | ❌ | ✅ `RefundDetailModal.tsx` com 6 abas factuais |
| **Abertura de Estorno Parcial/Total** | Formulário simples | Wizard | ❌ | ✅ `NewRefundModal.tsx` com cálculo de itens e ingressos |
| **Endpoints REST Unificados** | `/financeiro/estornos` | ❌ | ❌ | ✅ `/refunds/*` com RBAC e tratamento de erros |
| **Auditoria e Logs Imutáveis** | DB audit | ❌ | `AuditService` | ✅ Logs completos em cada transição de estado |
| **Isolamento Multi-tenant (Produtor)** | Tenant ID | ❌ | ⚠️ Parcial | ✅ Isolamento rígido por produtor e evento |
| **Testes Automatizados de Ciclo de Vida** | Testes e2e | ❌ | ❌ | ✅ `backend/tests/refund-lifecycle.test.ts` (9/9 aprovados) |

---

## 3. Alinhamento de Terminologia e UX

- ❌ **Termo Depreciado:** "Painel 360", "Estorno Mágico", "Instant Refund".
- ✅ **Termo Corporativo:** "Centro de Controle de Estornos", "Dossiê Operacional", "Alçada de Aprovação", "Cascata Reversa".
- **Semântica de Cores:**
  - 🟡 **Âmbar:** `Aguardando Aprovação`, `Aguardando Informações`.
  - 🔵 **Ciano:** `Em Análise Técnica`, `Aprovado (Pendente Gateway)`, `Processando`.
  - 🟢 **Esmeralda:** `Concluído / Estornado`, `Reconciliado`.
  - 🔴 **Rosa/Vermelho:** `Recusado`, `Falha no Gateway`.
