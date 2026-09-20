# MATRIZ DE ROTAS — FASE 1.3.11.1.1
## Mapeamento de URLs Canônicas, Deep Links e Adaptação Progressiva

**Data:** 20/09/2026  
**Status:** Especificação Aprovada  

---

## 1. Rotas Globais do Produtor

| Rota Canônica | Módulo | Visão / Tela | Breadcrumb | Permissão |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `overview` | Visão Geral Executiva | `Disk Interno › Visão Geral` | Autenticado |
| `/consulta` | `search` | Central de Consulta Global | `Disk Interno › Central de Consulta` | Autenticado |
| `/eventos` | `events` | Todos os Eventos (Catálogo) | `Disk Interno › Eventos › Todos os Eventos` | `eventos.evento.visualizar` |
| `/eventos/novo` | `events` | Criar Evento (Wizard) | `Disk Interno › Eventos › Criar Evento` | `eventos.evento.criar` |
| `/eventos/locais` | `events` | Locais & Plantas Cadastradas | `Disk Interno › Eventos › Locais` | `eventos.locais.visualizar` |
| `/eventos/calendario`| `events` | Calendário Geral de Sessões | `Disk Interno › Eventos › Calendário` | `eventos.sessoes.visualizar` |
| `/eventos/operacao` | `events` | Operação Geral de Eventos | `Disk Interno › Eventos › Operação` | `eventos.operacao.visualizar` |
| `/eventos/pendencias`| `events` | Pendências Globais de Eventos | `Disk Interno › Eventos › Pendências` | `eventos.pendencias.visualizar` |
| `/eventos/arquivados`| `events` | Eventos Arquivados | `Disk Interno › Eventos › Arquivados` | `eventos.arquivamento.visualizar`|
| `/comercial` | `commercial` | Visão Geral Comercial | `Disk Interno › Comercial › Visão Geral` | `comercial.dashboard.visualizar` |
| `/comercial/pedidos` | `commercial` | Central de Pedidos | `Disk Interno › Comercial › Pedidos` | `comercial.pedidos.visualizar` |
| `/comercial/vendas` | `commercial` | Central de Vendas & Performance| `Disk Interno › Comercial › Vendas` | `comercial.vendas.visualizar` |
| `/comercial/produtores`| `commercial`| Central de Produtores | `Disk Interno › Comercial › Produtores` | `comercial.produtores.visualizar`|
| `/comercial/contas` | `commercial` | Gestão de Contas & Renovações | `Disk Interno › Comercial › Gestão de Contas` | `comercial.gestao_contas.visualizar`|
| `/comercial/contratos`| `commercial` | Contratos Comerciais | `Disk Interno › Comercial › Contratos` | `comercial.contratos.visualizar` |
| `/comercial/propostas`| `commercial` | Propostas Comerciais | `Disk Interno › Comercial › Propostas` | `comercial.propostas.visualizar` |
| `/comercial/pipeline` | `commercial` | Oportunidades & Pipeline | `Disk Interno › Comercial › Oportunidades` | `comercial.oportunidades.visualizar`|
| `/suporte-eventos` | `event-support`| Painel Operacional de Suporte | `Disk Interno › Suporte Eventos` | `suporte.incidentes.visualizar` |
| `/sac` | `sac` | Central de Atendimento ao Cliente| `Disk Interno › Atendimento SAC` | `sac.consulta.acessar` |
| `/estorno` | `refunds` | Painel de Estornos & Disputas | `Disk Interno › Estorno` | `estorno.solicitacao.visualizar` |
| `/financeiro` | `finance` | Painel Financeiro Consolidado | `Disk Interno › Financeiro` | `financeiro.saldo.visualizar` |
| `/contabilidade` | `accounting` | Painel Contábil & Livro Diário | `Disk Interno › Contabilidade` | `contabilidade.diario.visualizar`|
| `/marketing` | `marketing` | Painel de Marketing & Campanhas | `Disk Interno › Marketing` | `marketing.campanha.visualizar` |
| `/remarketing` | `remarketing` | Painel de Remarketing | `Disk Interno › Remarketing` | `remarketing.carrinhos.visualizar`|
| `/relatorios` | `analytics` | Relatórios & BI Executivo | `Disk Interno › Relatórios & BI` | `relatorios.central.visualizar` |
| `/administracao` | `admin` | Painel Administrativo de Usuários | `Disk Interno › Administração` | `admin.usuarios.visualizar` |

---

## 2. Rotas Contextuais do Evento Selecionado

*Todas as rotas abaixo requerem que `eventId` pertença a uma produtora autorizada para o usuário logado.*

| Rota Canônica | Sub-item / Visão | Breadcrumb Contextual | Componente MASTER Reutilizado |
| :--- | :--- | :--- | :--- |
| `/eventos/:eventId` | `events-dashboard` | `Eventos › [Nome do Evento] › Painel` | `EventDashboardPage.tsx` |
| `/eventos/:eventId/informacoes` | `events-info` | `Eventos › [Nome do Evento] › Informações` | `EventWizardPage.tsx` (modo edição) |
| `/eventos/:eventId/sessoes` | `events-sessions` | `Eventos › [Nome do Evento] › Sessões & Agenda` | `EventSessionsPage.tsx` |
| `/eventos/:eventId/local` | `events-venues` | `Eventos › [Nome do Evento] › Locais & Plantas` | `VenuesPage.tsx` / `VenueDetailsPage.tsx` |
| `/eventos/:eventId/setores` | `events-sections` | `Eventos › [Nome do Evento] › Setores` | `EventSectionsPage.tsx` |
| `/eventos/:eventId/ingressos` | `events-tickets` | `Eventos › [Nome do Evento] › Tipos de Ingresso` | `EventTicketTypesPage.tsx` |
| `/eventos/:eventId/lotes` | `events-batches` | `Eventos › [Nome do Evento] › Lotes de Venda` | `EventBatchesPage.tsx` |
| `/eventos/:eventId/precos` | `events-pricing` | `Eventos › [Nome do Evento] › Matriz de Preços` | `EventPricingPage.tsx` |
| `/eventos/:eventId/capacidade` | `events-capacity` | `Eventos › [Nome do Evento] › Capacidade` | `EventCapacityPage.tsx` |
| `/eventos/:eventId/regras` | `events-rules` | `Eventos › [Nome do Evento] › Regras de Venda` | `EventSalesRulesPage.tsx` |
| `/eventos/:eventId/canais` | `events-channels` | `Eventos › [Nome do Evento] › Canais de Venda` | `EventSalesChannelsPage.tsx` |
| `/eventos/:eventId/cortesias` | `events-complimentary`| `Eventos › [Nome do Evento] › Cortesias` | `ComplimentaryPage.tsx` |
| `/eventos/:eventId/equipe` | `events-team` | `Eventos › [Nome do Evento] › Equipe & Escalas` | `EventTeamPage.tsx` |
| `/eventos/:eventId/documentos` | `events-documents` | `Eventos › [Nome do Evento] › Documentos` | `EventDocumentsPage.tsx` |
| `/eventos/:eventId/pendencias` | `events-tasks` | `Eventos › [Nome do Evento] › Pendências` | `EventTasksPage.tsx` |
| `/eventos/:eventId/prontidao` | `events-readiness` | `Eventos › [Nome do Evento] › Prontidão` | `EventReadinessPage.tsx` |
| `/eventos/:eventId/alteracoes` | `events-changes` | `Eventos › [Nome do Evento] › Alterações` | `EventChangeManagementPage.tsx` |
| `/eventos/:eventId/revisao` | `events-review-publication` | `Eventos › [Nome do Evento] › Revisão & Publicação`| `EventReviewPublicationPage.tsx` |
| `/eventos/:eventId/check-in` | `events-checkin` | `Eventos › [Nome do Evento] › Check-in & Portaria` | `EventCheckinPage.tsx` |
| `/eventos/:eventId/operacao` | `events-operation` | `Eventos › [Nome do Evento] › Operação ao Vivo` | `EventOperationPage.tsx` |
| `/eventos/:eventId/encerramento`| `events-closure` | `Eventos › [Nome do Evento] › Encerramento` | `EventClosurePage.tsx` |
| `/eventos/:eventId/pos-evento` | `events-post-event` | `Eventos › [Nome do Evento] › Relatório Pós-Evento`| `PostEventPage.tsx` |
| `/eventos/:eventId/cancelamento`| `events-cancellation`| `Eventos › [Nome do Evento] › Cancelamento` | `EventCancellationPage.tsx` |
| `/eventos/:eventId/comercial` | `commercial-orders` | `Eventos › [Nome do Evento] › Vendas & Pedidos` | `CommercialSalesPage.tsx` (filtrada) |
| `/eventos/:eventId/financeiro` | `finance-dashboard` | `Eventos › [Nome do Evento] › Financeiro` | `FinanceDashboard.tsx` (filtrado) |
| `/eventos/:eventId/marketing` | `marketing-dashboard`| `Eventos › [Nome do Evento] › Marketing` | `MarketingDashboard.tsx` (filtrado) |
