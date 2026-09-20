# MATRIZ DE APIS DE EVENTOS — FASE 1.3.11.1.2
## Especificação de Endpoints, Contratos de Requisição e Validação de Escopo

**Data:** 20/09/2026  
**Status:** Homologada  

---

| Método | Endpoint | Finalidade Operacional | Parâmetros / Payload | Resposta (DTO) | Permissão / Escopo | Chave TanStack Query |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/events` | Listar eventos autorizados com filtros | `search`, `status`, `producerId`, `limit` | `{ events: EventListItemDTO[], total: number }` | `eventos.evento.visualizar` (Data Scope) | `['events', producerId, filters]` |
| `GET` | `/api/v1/events/summary` | Obter KPIs consolidados do catálogo | `producerId` (opcional) | `EventSummaryDTO` | `eventos.evento.visualizar` | `['events-summary', producerId]` |
| `GET` | `/api/v1/events/:id` | Detalhes completos do evento | `id` (ou `publicCode`) | `EventDetailDTO` | `eventos.evento.visualizar` (Data Scope) | `['event', eventId]` |
| `POST` | `/api/v1/events` | Criar novo evento definitivo | `CreateEventInputDTO` | `EventDetailDTO` | `eventos.evento.criar` | Invalida `['events']` |
| `POST` | `/api/v1/events/drafts` | Criar rascunho inicial de evento | `{ name?: string, producerId?: string }` | `{ event: EventDetailDTO, wizardState: any }` | `eventos.evento.criar` | Invalida `['events']` |
| `PUT` | `/api/v1/events/:id/context` | Selecionar contexto do evento ativo | `id` no path | `EventContextResponse` | `eventos.evento.visualizar` | Dispara auditoria e sincronização |
| `GET` | `/api/v1/events/:id/dashboard` | Dashboard operacional do evento | `sessionId`, `viewType` | `EventDashboardDTO` | `eventos.evento.visualizar` | `['event-dashboard', eventId, sessionId]` |
| `GET` | `/api/v1/events/:id/sessions` | Listar sessões do evento | `id` | `EventSessionDTO[]` | `eventos.sessoes.visualizar` | `['event-sessions', eventId]` |
| `POST` | `/api/v1/events/:id/sessions` | Criar nova sessão | `CreateSessionInputDTO` | `EventSessionDTO` | `eventos.sessoes.editar` | Invalida `['event-sessions', eventId]` |
| `GET` | `/api/v1/events/:id/sections` | Listar setores com lotação | `id` | `EventSectionDTO[]` | `eventos.setor.visualizar` | `['event-sections', eventId]` |
| `GET` | `/api/v1/events/:id/ticket-types`| Listar tipos de ingresso | `id` | `TicketTypeDTO[]` | `eventos.ingresso.visualizar`| `['event-ticket-types', eventId]` |
| `GET` | `/api/v1/events/:id/batches` | Listar lotes de venda | `id` | `EventBatchDTO[]` | `eventos.lote.visualizar` | `['event-batches', eventId]` |
| `POST` | `/api/v1/events/:id/batches` | Criar lote de venda | `CreateBatchInputDTO` | `EventBatchDTO` | `eventos.lote.gerenciar` | Invalida `['event-batches', eventId]` |
| `GET` | `/api/v1/events/:id/pricing` | Obter matriz de preços | `id` | `PricingMatrixDTO` | `eventos.lote.visualizar` | `['event-pricing', eventId]` |
| `PUT` | `/api/v1/events/:id/pricing` | Atualizar matriz de preços | `UpdatePricingInputDTO` | `PricingMatrixDTO` | `eventos.lote.gerenciar` | Invalida `['event-pricing', eventId]` |
| `GET` | `/api/v1/events/:id/capacity`| Obter inventário e capacidade | `id` | `CapacitySummaryDTO` | `eventos.sessoes.capacidade.visualizar` | `['event-capacity', eventId]` |
| `GET` | `/api/v1/events/:id/channels`| Listar canais de venda | `id` | `EventChannelDTO[]` | `eventos.canais.visualizar` | `['event-channels', eventId]` |
| `POST` | `/api/v1/events/:id/complimentary`| Emitir cortesia nominal | `IssueComplimentaryDTO`| `ComplimentaryTicketDTO` | `eventos.cortesias.criar` | Invalida `['event-complimentary']` |
| `GET` | `/api/v1/events/:id/team` | Listar equipe do evento | `id` | `EventTeamMemberDTO[]` | `eventos.equipe.visualizar` | `['event-team', eventId]` |
| `GET` | `/api/v1/events/:id/documents`| Listar documentos do evento | `id` | `EventDocumentDTO[]` | `eventos.documentos.visualizar`| `['event-documents', eventId]` |
| `GET` | `/api/v1/events/:id/readiness`| Avaliar prontidão do evento | `id` | `EventReadinessDTO` | `eventos.preparacao.visualizar`| `['event-readiness', eventId]` |
| `POST` | `/api/v1/events/:id/publish` | Publicar evento (gate final) | `{ reviewNotes?: string }` | `EventDetailDTO` | `eventos.lifecycle.review` | Invalida `['event', eventId]` |
| `POST` | `/api/v1/events/:id/close` | Encerrar sessão / evento | `{ closeNotes?: string }` | `EventDetailDTO` | `eventos.encerramento.sessao.encerrar` | Invalida `['event', eventId]` |
| `POST` | `/api/v1/events/:id/cancel` | Cancelar evento com impacto | `CancelEventInputDTO` | `CancellationImpactDTO` | `eventos.cancelamento.solicitar` | Invalida `['event', eventId]` |
| `GET` | `/api/v1/events/:id/history` | Trilha de auditoria e deltas | `id` | `EventAuditLogDTO[]` | `eventos.evento.visualizar` | `['event-history', eventId]` |

---

## 2. Validação Rigorosa de Segurança e Data Scope no Backend

Todas as requisições para `/api/v1/events/*`:
1. Validam o cabeçalho `X-Producer-Id` e `X-Event-Id` injetados pelo `apiFetch` do `DiskContext`.
2. Validam se o usuário autenticado possui vínculo com a produtora dona do evento.
3. Se o usuário tiver escopo `PRODUCER`, qualquer tentativa de acessar evento pertencente a outra organização retorna **HTTP 403 Forbidden** com mensagem "Acesso não autorizado ao evento solicitado".
4. Prevenção de IDOR: O backend nunca confia exclusivamente no parâmetro de URL sem checagem de autorização no banco.
