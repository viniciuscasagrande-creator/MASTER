# MATRIZ DE ROTAS DE EVENTOS — FASE 1.3.11.1.2
## Especificação Canônica de URLs e Mapeamento de Telas do Módulo Eventos

**Data:** 20/09/2026  
**Status:** Homologada  

---

## 1. Rotas Globais do Portfólio de Eventos

| Rota Canônica | Sub-item | Seção | Componente MASTER Reutilizado | Permissão RBAC |
| :--- | :--- | :--- | :--- | :--- |
| `/eventos` | `events-all` | Operação | `EventsPage.tsx` | `eventos.evento.visualizar` |
| `/eventos/dashboard` | `events-dashboard` | Operação | `EventsPage.tsx` (visão agregada) | `eventos.evento.visualizar` |
| `/eventos/novo` | `events-create` | Operação | `EventWizardPage.tsx` | `eventos.evento.criar` |
| `/eventos/locais` | `events-venues` | Operação | `VenuesPage.tsx` | `eventos.locais.visualizar` |
| `/eventos/calendario` | `events-sessions` | Operação | `EventSessionsPage.tsx` (geral) | `eventos.sessoes.visualizar` |
| `/eventos/operacao` | `events-operation` | Operação | `EventOperationPage.tsx` (geral) | `eventos.operacao.visualizar` |
| `/eventos/pendencias` | `events-tasks` | Operação | `EventTasksPage.tsx` (geral) | `eventos.pendencias.visualizar` |
| `/eventos/arquivados` | `events-archive` | Operação | `ArchivedEventsPage.tsx` | `eventos.arquivamento.visualizar` |

---

## 2. Rotas Contextuais do Evento Selecionado (`/eventos/:eventId/*`)

*Ao carregar qualquer uma destas rotas diretamente (deep link), o sistema autentica, resolve o evento e a produtora, valida o Data Scope do usuário e hidrata o `DiskContext` com `activeEvent` e `activeProducer`.*

| Rota Canônica | Sub-item | Grupo na `EventSidebar` | Componente MASTER Reutilizado | Permissão RBAC |
| :--- | :--- | :--- | :--- | :--- |
| `/eventos/:eventId` | `events-dashboard` | `VISÃO DO EVENTO` | `EventDashboardPage.tsx` | `eventos.evento.visualizar` |
| `/eventos/:eventId/informacoes` | `events-info` | `VISÃO DO EVENTO` | `EventWizardPage.tsx` (modo detalhes) | `eventos.evento.visualizar` |
| `/eventos/:eventId/local` | `events-venues` | `PLANEJAMENTO & ESTRUTURA` | `VenueDetailsPage.tsx` | `eventos.locais.visualizar` |
| `/eventos/:eventId/sessoes` | `events-sessions` | `PLANEJAMENTO & ESTRUTURA` | `EventSessionsPage.tsx` | `eventos.sessoes.visualizar` |
| `/eventos/:eventId/setores` | `events-sections` | `INGRESSOS & PRECIFICAÇÃO` | `EventSectionsPage.tsx` | `eventos.setor.visualizar` |
| `/eventos/:eventId/ingressos` | `events-tickets` | `INGRESSOS & PRECIFICAÇÃO` | `EventTicketTypesPage.tsx` | `eventos.ingresso.visualizar` |
| `/eventos/:eventId/lotes` | `events-batches` | `INGRESSOS & PRECIFICAÇÃO` | `EventBatchesPage.tsx` | `eventos.lote.visualizar` |
| `/eventos/:eventId/precos` | `events-pricing` | `INGRESSOS & PRECIFICAÇÃO` | `EventPricingPage.tsx` | `eventos.lote.gerenciar` |
| `/eventos/:eventId/capacidade` | `events-capacity` | `INGRESSOS & PRECIFICAÇÃO` | `EventCapacityPage.tsx` | `eventos.sessoes.capacidade.visualizar` |
| `/eventos/:eventId/regras` | `events-rules` | `INGRESSOS & PRECIFICAÇÃO` | `EventSalesRulesPage.tsx` | `eventos.setores.configurar` |
| `/eventos/:eventId/cortesias` | `events-complimentary` | `INGRESSOS & PRECIFICAÇÃO` | `ComplimentaryPage.tsx` | `eventos.cortesias.visualizar` |
| `/eventos/:eventId/canais` | `events-channels` | `INGRESSOS & PRECIFICAÇÃO` | `EventSalesChannelsPage.tsx` | `eventos.canais.visualizar` |
| `/eventos/:eventId/equipe` | `events-team` | `EQUIPE & PRONTIDÃO` | `EventTeamPage.tsx` | `eventos.equipe.visualizar` |
| `/eventos/:eventId/documentos` | `events-documents` | `EQUIPE & PRONTIDÃO` | `EventDocumentsPage.tsx` | `eventos.documentos.visualizar` |
| `/eventos/:eventId/pendencias` | `events-tasks` | `EQUIPE & PRONTIDÃO` | `EventTasksPage.tsx` | `eventos.pendencias.visualizar` |
| `/eventos/:eventId/prontidao` | `events-readiness` | `EQUIPE & PRONTIDÃO` | `EventReadinessPage.tsx` | `eventos.preparacao.visualizar` |
| `/eventos/:eventId/alteracoes` | `events-changes` | `EQUIPE & PRONTIDÃO` | `EventChangeManagementPage.tsx` | `eventos.alteracoes.visualizar` |
| `/eventos/:eventId/revisao` | `events-review-publication` | `EQUIPE & PRONTIDÃO` | `EventReviewPublicationPage.tsx` | `eventos.lifecycle.review` |
| `/eventos/:eventId/check-in` | `events-checkin` | `OPERAÇÃO AO VIVO` | `EventCheckinPage.tsx` | `eventos.checkin.operar` |
| `/eventos/:eventId/operacao` | `events-operation` | `OPERAÇÃO AO VIVO` | `EventOperationPage.tsx` | `eventos.operacao.visualizar` |
| `/eventos/:eventId/encerramento`| `events-closure` | `OPERAÇÃO AO VIVO` | `EventClosurePage.tsx` | `eventos.encerramento.sessao.encerrar` |
| `/eventos/:eventId/pos-evento` | `events-post-event` | `OPERAÇÃO AO VIVO` | `PostEventPage.tsx` | `eventos.pos_evento.visualizar` |
| `/eventos/:eventId/cancelamento`| `events-cancellation` | `OPERAÇÃO AO VIVO` | `EventCancellationPage.tsx` | `eventos.cancelamento.solicitar` |
| `/eventos/:eventId/financeiro` | `finance-dashboard` | `MÓDULOS VINCULADOS` | `FinanceDashboard.tsx` (filtrado) | `financeiro.saldo.visualizar` |
| `/eventos/:eventId/marketing` | `marketing-dashboard` | `MÓDULOS VINCULADOS` | `MarketingDashboard.tsx` (filtrado) | `marketing.campanha.visualizar` |
| `/eventos/:eventId/pedidos` | `commercial-orders` | `MÓDULOS VINCULADOS` | `OrdersPage.tsx` (filtrado) | `comercial.pedidos.visualizar` |
| `/eventos/:eventId/sac` | `sac-dashboard` | `MÓDULOS VINCULADOS` | `SacDashboard.tsx` (filtrado) | `sac.consulta.acessar` |
