# Auditoria Prévia — Fase 1.3.11.1.4.3: Recuperação Completa de ESTORNO

**Data:** 20/09/2026  
**Status:** Concluído  
**Escopo:** Módulo de Estornos e Devoluções do Disk Interno  
**Localização:** `docs/phases/AUDITORIA_ESTORNO_FASE_1_3_11_1_4_3.md`

---

## 1. Contexto e Justificativa da Auditoria

O módulo de **Estorno** é o motor de controle e reversão operacional e financeira do Disk Interno. Na arquitetura do sistema, o estorno estava fragmentado entre uma interface prototípica (`RefundsDashboard.tsx`), políticas pontuais no Approval Engine (`refund.policy.ts`), chamadas simuladas de SAC (`sac.service.ts`), sem um endpoint REST unificado sob `/refunds` no backend do MASTER.

Em contrapartida, no **SafeSaff**, o módulo de estornos contava com:
- `server/src/services/refundEnterpriseEngine.ts`: regras formais de elegibilidade (`evaluateRefundEligibility`), cálculo de alçadas por faixa de valor (`requiredApprovalLevels`), checagem de segregação de função (maker-checker: solicitante != aprovador) e plano de reversão contábil/financeiro (`buildReversalPlan`).
- `src/pages/finance/FinanceDisputesHubPage.tsx`: centro de controle denso com abas operacionais, status de disputa e webhooks de pagamento.
- `src/styles/disk-estornos.css`: estilização corporativa densa para filtros, KPIs e tabelas.

---

## 2. Diagnóstico Comparativo das Três Bases

### 2.1 SafeSaff (Referência Funcional)
- **Motor de Elegibilidade Factual:**
  - Valida se o montante solicitado é superior a 0 e não excede o saldo remanescente do pedido.
  - Classifica o risco: `low` (< R$ 1.000), `high` (>= R$ 1.000), `critical` (>= R$ 5.000).
  - Alçadas requeridas: 1 alçada para valores baixos, 2 alçadas para valores médios/altos, 3 alçadas para valores críticos.
  - Segregação de função compulsória: solicitante não pode aprovar a própria solicitação.
- **Plano de Reversão Contábil / Transacional:**
  - Bloqueio de exposição de saldo.
  - Reversão proporcional do split de pagamento.
  - Consumo de reserva elegível antes de gerar saldo negativo na conta do produtor.
  - Execução no gateway com chave de idempotência.
  - Lançamentos compensatórios no ledger (nunca edição direta de saldo histórico).
  - Reconciliação do retorno do provedor e fechamento do protocolo SAC vinculado.

### 2.2 Limitless (Referência Visual / UX)
- Visual denso, corporativo e moderno.
- Badges de status com semântica estrita:
  - Amarelo/Âmbar: `Aguardando Análise`, `Aguardando Aprovação`.
  - Ciano/Azul: `Processando no Gateway`.
  - Esmeralda/Verde: `Concluído / Estornado`.
  - Vermelho/Rosa: `Rejeitado`, `Falha no Gateway`.
- Painel de alçadas e aprovações com stepper visual claro.
- Modais com abas factuais (Resumo, Pedido, Itens, Pagamento, Alçadas, Auditoria).
- Zero "360", 100% pt-BR.

### 2.3 MASTER (Base Técnica Atual)
- **Tabelas / Modelos In-Memory & Prisma:**
  - `prisma.refund`: já possui delegates no `InMemoryPrismaStore`, com registros de semente (`ref-882`).
  - `prisma.order`: já possui pedidos estruturados (`ord-984521`, `ord-952114`, `ord-rodrigo`), com snapshots de comprador e itens.
  - `prisma.ticket`: possui ingressos associados (`tkt-88211`, `tkt-88212`, `tkt-rodrigo`) com status `VALID`.
  - `prisma.payment`: possui pagamentos registrados (`pay-552811`, `pay-998412`) com método, gateway e status `APPROVED`.
- **Lacunas Identificadas no MASTER:**
  1. Ausência de router dedicado `/refunds` em `backend/src/routes/index.ts`.
  2. Falta de State Machine formal de estorno com transições seguras.
  3. Falta de motor de idempotência para evitar duplo estorno por duplo clique, retentativa ou webhooks concorrentes.
  4. Interface `RefundsDashboard.tsx` dependente de mocks contextuais com funções locais limitadas.
  5. Ausência de modal para seleção de estorno parcial por item/ingresso com cálculo factual de saldo remanescente.

---

## 3. Matriz de Autoridade e Fronteiras de Domínio

| Domínio | Papel no Estorno | O que FAZ | O que NÃO FAZ |
| :--- | :--- | :--- | :--- |
| **SAC** | Solicitante & Acompanhante | Abre solicitação vinculada ao comprador, consulta status e notifica o cliente. | NÃO processa pagamentos, NÃO altera dados do pedido comercial, NÃO tem alçada financeira. |
| **COMERCIAL** | Fornecedor do Pedido | Fornece dados do pedido (`Order`, `OrderItem`, snapshots de comprador e canal). | NÃO decide se o estorno deve ser aprovado financeiramente, NÃO executa chamadas de adquirente. |
| **FINANCEIRO** | Fato Financeiro & Conciliação | Fornece dados da transação bancária/cartão, conta gráfica do produtor, split e lançamentos de compensação. | NÃO avalia motivo de SAC nem manipula itens individuais de ingresso. |
| **ESTORNO (Módulo Central)** | Orquestrador & Decisor | Valida elegibilidade, aplica políticas de alçada, executa maker-checker, invoca gateway com idempotência e coordena a cascata reversa. | Não substitui o gateway de pagamentos; atua como motor de orquestração de devoluções. |

---

## 4. Plano de Ação para a Fase 1.3.11.1.4.3

1. **Backend (`backend/src/modules/refunds/`):**
   - `refund.types.ts`: DTOs, Enums, State Machine, Elegibilidade, Reversão.
   - `refund.service.ts`: Serviço central de estornos com elegibilidade factual, cálculo de saldo remanescente, motor de alçadas maker-checker, adaptador de gateway com cache de idempotência e disparo de eventos de cascata reversa.
   - `refund.controller.ts`: Endpoints com filtros multi-tenant, validações e logs de auditoria.
   - `refund.routes.ts`: Roteador Express registrado em `/refunds`.
2. **Frontend (`apps/web/src/modules/refunds/`):**
   - Refatoração do `RefundsDashboard.tsx` com 4 abas: Centro de Controle, Central de Solicitações, Fila de Aprovação (Maker-Checker), Histórico & Auditoria.
   - Criação de `RefundDetailModal.tsx` com visão aprofundada de pedido, itens, pagamentos, alçadas e linha do tempo.
   - Criação de `NewRefundModal.tsx` com busca de pedidos reais, seleção de itens (total vs parcial) e cálculo dinâmico de elegibilidade.
3. **Validação & Testes:**
   - Suíte `backend/tests/refund-lifecycle.test.ts` cobrindo ciclo de vida completo, limites de estorno parcial, maker-checker, idempotência e isolamento multi-tenant.
4. **Documentação:**
   - Publicação de todas as matrizes e relatórios na pasta `docs/phases/`.
