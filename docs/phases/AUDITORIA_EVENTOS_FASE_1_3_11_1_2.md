# AUDITORIA DE EVENTOS — FASE 1.3.11.1.2
## Diagnóstico Funcional, Componentes Existentes e Mapeamento de Recuperação

**Data:** 20/09/2026  
**Status:** Auditado e Aprovado  

---

## 1. Inventário Completo dos Componentes de Eventos no MASTER

A auditoria em `apps/web/src/features/events/` confirmou que o MASTER já possui todos os 23 sub-domínios operacionais de eventos desenvolvidos com componentes React, modais e integração de API:

| Sub-domínio | Componente Principal | Modais e Componentes Auxiliares | Estado no MASTER | Decisão |
| :--- | :--- | :--- | :--- | :--- |
| **Catálogo Geral** | `EventsPage.tsx` | `EventCard.tsx`, `EventTable.tsx`, `EventsFilters.tsx`, `EventsSummary.tsx` | Implementado | **MANTER** no contexto geral |
| **Wizard Criação** | `EventWizardPage.tsx` | 8 passos (`EventDatesStep`, `EventLocationStep`, etc.) | Implementado | **MANTER** no contexto geral |
| **Painel do Evento** | `EventDashboardPage.tsx` | `EventContextHeader.tsx`, KPIs, filtros de sessão | Implementado | **REFINAR** no contexto do evento |
| **Sessões & Agenda** | `EventSessionsPage.tsx` | `BulkSessionsModal.tsx`, `CreateSessionModal.tsx`, `DuplicateSessionModal.tsx` | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Locais & Plantas** | `VenuesPage.tsx` | `VenueDetailsPage.tsx`, `VenueCreatePage.tsx`, `VenueMapEditorPage.tsx` | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Setores** | `EventSectionsPage.tsx` | Mapeamento de lotação física e regras de ocupação | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Tipos de Ingresso**| `EventTicketTypesPage.tsx`| `TicketTypeModal.tsx`, associação com setores | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Lotes de Venda** | `EventBatchesPage.tsx` | `CreateBatchModal.tsx`, virada de lote | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Matriz de Preços** | `EventPricingPage.tsx` | `BulkPricingModal.tsx`, `PriceSimulatorModal.tsx` | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Capacidade** | `EventCapacityPage.tsx` | `QuotaModal.tsx`, `InventoryBlockModal.tsx` | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Regras de Venda** | `EventSalesRulesPage.tsx` | Políticas de meia-entrada, limites de compra por CPF | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Canais de Venda** | `EventSalesChannelsPage.tsx`| `ConfigureSalesChannelModal.tsx` | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Cortesias** | `ComplimentaryPage.tsx` | `IssueComplimentaryModal.tsx`, `ComplimentaryBatchModal.tsx` | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Equipe & Escalas** | `EventTeamPage.tsx` | `AddTeamMemberModal.tsx`, `AddShiftModal.tsx` | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Documentos** | `EventDocumentsPage.tsx` | `UploadEventDocModal.tsx` | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Pendências** | `EventTasksPage.tsx` | `CreateTaskModal.tsx` | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Prontidão** | `EventReadinessPage.tsx` | Checklist factual de go-live | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Alterações** | `EventChangeManagementPage.tsx`| `ChangeDiffViewerModal.tsx`, `CreateChangeProposalModal.tsx` | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Revisão/Publicar**| `EventReviewPublicationPage.tsx`| `PublicPreviewModal.tsx` | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Check-in** | `EventCheckinPage.tsx` | `ManualCheckinModal.tsx`, `DeviceManagementModal.tsx` | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Operação ao Vivo** | `EventOperationPage.tsx` | `OperationAccessControlCard.tsx`, `OperationIncidentsCard.tsx` | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Encerramento** | `EventClosurePage.tsx` | `CloseSessionModal.tsx`, `FinancialReconciliationModal.tsx` | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Pós-Evento** | `PostEventPage.tsx` | Relatório executivo pós-evento | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Cancelamento** | `EventCancellationPage.tsx`| `CancellationImpactModal.tsx`, `ConfirmCancellationModal.tsx` | Implementado | **REORGANIZAR** na `EventSidebar` |
| **Arquivados** | `ArchivedEventsPage.tsx` | Histórico somente leitura | Implementado | **REORGANIZAR** no menu geral |

---

## 2. Comparativo com o SafeSaff

1. **O que o SafeSaff possuía e o MASTER cobriu:**
   - Todas as funções de lotes, cortesias, borderôs, documentos, check-in e relatórios existem no MASTER com código React mais limpo e modular.
2. **O que precisou de correção no MASTER:**
   - No MASTER anterior, todos esses subcomponentes eram acionados a partir de um menu lateral global inchado de 25 itens.
   - A correção definitiva da Fase 1.3.11.1.1 e 1.3.11.1.2 coloca todos esses componentes sob a `EventSidebar` acionada automaticamente quando `selectedEventId` estiver ativo.
