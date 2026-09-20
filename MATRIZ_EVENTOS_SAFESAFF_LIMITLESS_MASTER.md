# MATRIZ TRIPLA DE EVENTOS — SAFESAFF × LIMITLESS × MASTER
## Alinhamento Funcional, Visual e Técnico dos Sub-domínios de Eventos

**Data:** 20/09/2026  
**Status:** Homologada  

---

| Sub-domínio de Evento | SafeSaff (Função) | Limitless (UI/UX) | MASTER (Componente) | Domínio | Situação | Decisão | Componente Reutilizado | Ação Executada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Visão Geral do Evento** | `event-dashboard` / Cockpit | `dashboard_analytics.html` | `EventDashboardPage.tsx` | Eventos | OK | **REFINAR** | `EventDashboardPage.tsx` | Conectado a dados factuais da API sem scores arbitrários. |
| **Sessões & Agenda** | Calendário de sessões | `fullcalendar_views.html` | `EventSessionsPage.tsx` | Eventos | OK | **REORGANIZAR** | `EventSessionsPage.tsx` | Acesso através da `EventSidebar` sob "Planejamento & Estrutura". |
| **Locais & Plantas** | `Venues` / Plantas | `maps_vector.html` | `VenuesPage.tsx` | Eventos | OK | **REORGANIZAR** | `VenuesPage.tsx`, `VenueMapEditorPage.tsx` | Disponível na visão geral e no contexto do evento ativo. |
| **Setores Operacionais** | Setores com lotação | `datatable_basic.html` | `EventSectionsPage.tsx` | Eventos | OK | **REORGANIZAR** | `EventSectionsPage.tsx` | Termo "360" removido; contextualizado na `EventSidebar`. |
| **Tipos de Ingresso** | Inteira, meia, VIP | `datatable_responsive.html` | `EventTicketTypesPage.tsx` | Eventos | OK | **REORGANIZAR** | `EventTicketTypesPage.tsx` | Hierarquia Evento → Sessão → Setor → Ingresso mantida. |
| **Lotes de Venda** | Lotes e virada | `ecommerce_orders_history.html` | `EventBatchesPage.tsx` | Eventos | OK | **REORGANIZAR** | `EventBatchesPage.tsx` | Acesso através da `EventSidebar` sob "Ingressos & Precificação". |
| **Matriz de Preços** | Preços por setor/lote | `table_styling.html` | `EventPricingPage.tsx` | Eventos | OK | **REORGANIZAR** | `EventPricingPage.tsx` | Células monetárias alinhadas à direita; simulação de taxas. |
| **Capacidade & Inventário**| Inventário físico x comercial| `chart_echarts_pies.html` | `EventCapacityPage.tsx` | Eventos | OK | **REORGANIZAR** | `EventCapacityPage.tsx` | "Decomposição 360°" alterada para "Decomposição Operacional". |
| **Regras de Venda** | Meia-entrada, cotas | `form_controls_extended.html` | `EventSalesRulesPage.tsx` | Eventos | OK | **REORGANIZAR** | `EventSalesRulesPage.tsx` | Acesso na `EventSidebar` sob "Ingressos & Precificação". |
| **Canais de Venda** | Habilitação Web/PDV | `components_cards.html` | `EventSalesChannelsPage.tsx` | Eventos | OK | **REORGANIZAR** | `EventSalesChannelsPage.tsx` | Submenu Vendas da `EventSidebar`. |
| **Cortesias & Convites** | Emissão nominal de cortesias| `table_elements.html` | `ComplimentaryPage.tsx` | Eventos | OK | **REORGANIZAR** | `ComplimentaryPage.tsx` | Emissão com autorizador e motivo auditado. |
| **Equipe do Evento** | Gestores de porta | `user_profile.html` | `EventTeamPage.tsx` | Eventos | OK | **REORGANIZAR** | `EventTeamPage.tsx` | Não concede RBAC global; isolado na `EventSidebar`. |
| **Documentos do Evento** | Alvarás, plantas | `file_manager.html` | `EventDocumentsPage.tsx` | Documentos | OK | **REORGANIZAR** | `EventDocumentsPage.tsx` | Reutiliza `DocumentService` central da plataforma. |
| **Pendências do Evento** | Tarefas do evento | `task_detailed.html` | `EventTasksPage.tsx` | Tarefas | OK | **REORGANIZAR** | `EventTasksPage.tsx` | Submenu Equipe & Prontidão da `EventSidebar`. |
| **Central de Prontidão** | Checklist go-live | `task_checklist.html` | `EventReadinessPage.tsx` | Eventos | OK | **REORGANIZAR** | `EventReadinessPage.tsx` | Contagem de verificações factuais (ex: 5 de 7 concluídas). |
| **Alterações Controladas**| Proposta de deltas | `timeline_left.html` | `EventChangeManagementPage.tsx`| Eventos | OK | **REORGANIZAR** | `EventChangeManagementPage.tsx`| Integrado com alçadas de aprovação e policy engine. |
| **Revisão & Publicação** | Gate final para vendas | `form_validation.html` | `EventReviewPublicationPage.tsx`| Eventos | OK | **REORGANIZAR** | `EventReviewPublicationPage.tsx`| Validação segura para transição do status para `ON_SALE`. |
| **Check-in & Portaria** | Validação QR / catracas | `extra_idle_timeout.html` | `EventCheckinPage.tsx` | Operações | OK | **REORGANIZAR** | `EventCheckinPage.tsx` | Autoridade de validação mantida exclusivamente no backend. |
| **Operação ao Vivo** | War room e catracas | `dashboard_realtime.html` | `EventOperationPage.tsx` | Operações | OK | **REORGANIZAR** | `EventOperationPage.tsx` | Painel operacional com métricas em tempo real. |
| **Encerramento** | Fechamento de sessão | `table_summary.html` | `EventClosurePage.tsx` | Eventos | OK | **REORGANIZAR** | `EventClosurePage.tsx` | Transição segura para `FINISHED` sem arquivamento precipitado. |
| **Relatório Pós-Evento** | Resumo geral consolidado | `invoice_template.html` | `PostEventPage.tsx` | Eventos | OK | **REORGANIZAR** | `PostEventPage.tsx` | Relatório gerencial com dados reais de fechamento. |
| **Gestão de Cancelamento**| Cálculo de raio de impacto | `dialogs_sweetalert.html` | `EventCancellationPage.tsx` | Eventos | OK | **REORGANIZAR** | `EventCancellationPage.tsx` | Transição para `CANCELLED` acionando fila do Estorno. |
| **Eventos Arquivados** | Consulta histórica | `table_archive.html` | `ArchivedEventsPage.tsx` | Eventos | OK | **REORGANIZAR** | `ArchivedEventsPage.tsx` | Acesso no menu geral de Eventos na `ProducerSidebar`. |
