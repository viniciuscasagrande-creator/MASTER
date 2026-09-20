# MATRIZ DE NAVEGAÇÃO — FASE 1.3.11.1.1
## Estrutura Comparativa: Navegação Global do Produtor × Navegação Contextual do Evento

**Data:** 20/09/2026  
**Status:** Homologada  

---

## 1. Navegação Global do Produtor (`ProducerSidebar` / `ModuleSidebar`)
*Ativa quando `selectedEventId === 'all'` ou nenhum evento estiver selecionado.*

| Seção | ID do Módulo | Rótulo (pt-BR) | Sub-itens Autorizados | Permissão Requerida |
| :--- | :--- | :--- | :--- | :--- |
| **PRINCIPAL** | `overview` | Visão Geral | — | Pública autenticada |
| **PRINCIPAL** | `search` | Central de Consulta | — | Pública autenticada |
| **OPERAÇÃO** | `events` | Eventos (ou Meus Eventos) | `events-dashboard`, `events-all`, `events-create`, `events-venues`, `events-sessions`, `events-operation`, `events-tasks`, `events-archive` | `eventos.evento.visualizar` |
| **OPERAÇÃO** | `commercial` | Comercial | `commercial-dashboard`, `commercial-orders`, `commercial-sales`, `commercial-performance`, `commercial-producers`, `commercial-portfolio`, `commercial-account-management`, `commercial-contracts`, `commercial-proposals`, `commercial-opportunities`, `commercial-leads`, `commercial-catalog` | `comercial.dashboard.visualizar` |
| **OPERAÇÃO** | `event-support` | Suporte Eventos | `support-dashboard`, `support-war-room`, `support-incidents` | `suporte.incidentes.visualizar` |
| **OPERAÇÃO** | `sac` | Atendimento SAC | `sac-dashboard`, `sac-query-center`, `sac-customers`, `sac-orders`, `sac-queue` | `sac.consulta.acessar` |
| **OPERAÇÃO** | `refunds` | Estorno | `refunds-dashboard`, `refunds-approvals`, `refunds-chargebacks` | `estorno.solicitacao.visualizar` |
| **GESTÃO & BI** | `finance` | Financeiro | `finance-dashboard`, `finance-event-balances`, `finance-payouts`, `finance-reconciliation`, `finance-reports` | `financeiro.saldo.visualizar` |
| **GESTÃO & BI** | `accounting` | Contabilidade | `accounting-dashboard`, `accounting-entries`, `accounting-dre` | `contabilidade.diario.visualizar` |
| **GESTÃO & BI** | `marketing` | Marketing | `marketing-dashboard`, `marketing-campaigns`, `marketing-pixels` | `marketing.campanha.visualizar` |
| **GESTÃO & BI** | `remarketing` | Remarketing | `remarketing-dashboard`, `remarketing-abandoned-carts`, `remarketing-journeys` | `remarketing.carrinhos.visualizar` |
| **GESTÃO & BI** | `analytics` | Relatórios & BI | `analytics-overview`, `analytics-builder`, `analytics-reports`, `analytics-exports` | `relatorios.central.visualizar` |
| **TRANSVERSAL** | `notifications` | Notificações | Central de Notificações | Pública autenticada |
| **TRANSVERSAL** | `approvals` | Aprovações | `approvals-inbox`, `approvals-my-requests`, `approvals-history`, `approvals-rules`, `approvals-thresholds` | `aprovacoes.solicitacao.visualizar` |
| **TRANSVERSAL** | `documents` | Central de Documentos | `documents-all`, `documents-upload` | `documentos.central.visualizar` |
| **TRANSVERSAL** | `tasks` | Central de Trabalho | `tasks-inbox`, `tasks-all`, `tasks-kanban`, `tasks-dashboard` | `tarefas.central.visualizar` |
| **SISTEMA** | `admin` | Administração | `admin-dashboard`, `admin-users`, `admin-roles`, `admin-permissions`, `admin-sessions`, `admin-security`, `admin-audit` | `admin.usuarios.visualizar` |
| **SISTEMA** | `configurations` | Regras & Políticas | `config-parameters`, `config-policies`, `config-simulator`, `config-features` | `configuracoes.central.visualizar` |
| **SISTEMA** | `observability` | Auditoria & Observabilidade | `obs-overview`, `obs-audit`, `obs-errors`, `obs-queues` | `observabilidade.dashboard.visualizar` |
| **SISTEMA** | `jobs` | Processamentos | `jobs-overview`, `jobs-running`, `jobs-schedules` | `processamentos.central.visualizar` |
| **SISTEMA** | `data-management` | Importação & Qualidade | `data-overview`, `data-imports`, `data-wizard` | `dados.importacao.visualizar` |
| **SISTEMA** | `settings` | Configurações | Configurações do Sistema | `admin.configuracoes.editar` |

---

## 2. Navegação Contextual do Evento (`EventContextSidebar` / `EventSidebar`)
*Ativa automaticamente quando `selectedEventId !== 'all'` e `activeEvent !== null`.*

| Seção | ID do Sub-item | Rótulo (pt-BR) | Módulo Alvo | Permissão Requerida |
| :--- | :--- | :--- | :--- | :--- |
| **VISÃO GERAL** | `events-dashboard` | Painel do Evento | `events` | `eventos.evento.visualizar` |
| **PLANEJAMENTO & ESTRUTURA** | `events-sessions` | Sessões & Agenda | `events` | `eventos.sessoes.visualizar` |
| **PLANEJAMENTO & ESTRUTURA** | `events-venues` | Locais & Plantas | `events` | `eventos.locais.visualizar` |
| **INGRESSOS & PRECIFICAÇÃO** | `events-sections` | Setores Operacionais | `events` | `eventos.setor.visualizar` |
| **INGRESSOS & PRECIFICAÇÃO** | `events-tickets` | Tipos de Ingresso | `events` | `eventos.ingresso.visualizar` |
| **INGRESSOS & PRECIFICAÇÃO** | `events-batches` | Lotes de Venda | `events` | `eventos.lote.visualizar` |
| **INGRESSOS & PRECIFICAÇÃO** | `events-pricing` | Matriz de Preços & Taxas | `events` | `eventos.lote.gerenciar` |
| **INGRESSOS & PRECIFICAÇÃO** | `events-capacity` | Inventário & Capacidade | `events` | `eventos.sessoes.capacidade.visualizar` |
| **INGRESSOS & PRECIFICAÇÃO** | `events-rules` | Regras de Venda | `events` | `eventos.setores.configurar` |
| **INGRESSOS & PRECIFICAÇÃO** | `events-complimentary` | Cortesias & Convites | `events` | `eventos.cortesias.visualizar` |
| **INGRESSOS & PRECIFICAÇÃO** | `events-channels` | Canais de Venda | `events` | `eventos.canais.visualizar` |
| **EQUIPE & PRONTIDÃO** | `events-team` | Equipe & Escalas | `events` | `eventos.equipe.visualizar` |
| **EQUIPE & PRONTIDÃO** | `events-documents` | Documentos do Evento | `events` | `eventos.documentos.visualizar` |
| **EQUIPE & PRONTIDÃO** | `events-tasks` | Pendências do Evento | `events` | `eventos.pendencias.visualizar` |
| **EQUIPE & PRONTIDÃO** | `events-readiness` | Central de Prontidão | `events` | `eventos.preparacao.visualizar` |
| **EQUIPE & PRONTIDÃO** | `events-changes` | Central de Alterações | `events` | `eventos.alteracoes.visualizar` |
| **EQUIPE & PRONTIDÃO** | `events-review-publication` | Revisão & Publicação | `events` | `eventos.lifecycle.review` |
| **OPERAÇÃO & ENCERRAMENTO** | `events-checkin` | Check-in & Portaria | `events` | `eventos.checkin.operar` |
| **OPERAÇÃO & ENCERRAMENTO** | `events-operation` | Operação ao Vivo | `events` | `eventos.operacao.visualizar` |
| **OPERAÇÃO & ENCERRAMENTO** | `events-closure` | Encerramento de Sessões | `events` | `eventos.encerramento.sessao.encerrar` |
| **OPERAÇÃO & ENCERRAMENTO** | `events-post-event` | Relatório Pós-Evento | `events` | `eventos.pos_evento.visualizar` |
| **OPERAÇÃO & ENCERRAMENTO** | `events-cancellation` | Gestão de Cancelamento | `events` | `eventos.cancelamento.solicitar` |
| **MÓDULOS DO EVENTO** | `finance-dashboard` | Financeiro do Evento | `finance` | `financeiro.saldo.visualizar` |
| **MÓDULOS DO EVENTO** | `marketing-dashboard` | Marketing do Evento | `marketing` | `marketing.campanha.visualizar` |
| **MÓDULOS DO EVENTO** | `commercial-orders` | Pedidos do Evento | `commercial` | `comercial.pedidos.visualizar` |
| **MÓDULOS DO EVENTO** | `sac-dashboard` | Atendimento SAC do Evento | `sac` | `sac.consulta.acessar` |
