# IMPLEMENTAÇÃO — FASE 1.3.11.1.1
## Relatório Técnico de Implementação da Navegação Global + Contexto Produtor × Evento

**Data de Conclusão:** 20/09/2026  
**Status de Compilação:** 100% Aprovado (`npm run build:api` = 0, `npm run build` = 0)  

---

## 1. Arquivos Criados e Modificados

### 1.1. `apps/web/src/shared/components/EventContextSidebar.tsx` (Novo)
- Componente de navegação contextual do evento ativo.
- Possui botão `← Voltar aos Eventos` que invoca `onExitEventContext()` (acionando `clearEvent()` no `DiskContext` e navegando para `events-all`).
- Renderiza cartão com metadados do evento ativo: código (`EVT-XXXXX`), badge de status (`Em Vendas`), título completo, produtora e data formatada.
- Agrupa os 23 sub-domínios em seções semânticas de alta densidade visual inspiradas no Limitless:
  - `VISÃO GERAL`: Painel do Evento (`events-dashboard`)
  - `PLANEJAMENTO & ESTRUTURA`: Sessões & Agenda (`events-sessions`), Locais & Plantas (`events-venues`)
  - `INGRESSOS & PRECIFICAÇÃO`: Setores (`events-sections`), Tipos de Ingresso (`events-tickets`), Lotes (`events-batches`), Matriz de Preços (`events-pricing`), Capacidade (`events-capacity`), Regras de Venda (`events-rules`), Cortesias (`events-complimentary`), Canais (`events-channels`)
  - `EQUIPE & PRONTIDÃO`: Equipe (`events-team`), Documentos (`events-documents`), Pendências (`events-tasks`), Prontidão (`events-readiness`), Alterações (`events-changes`), Revisão & Publicação (`events-review-publication`)
  - `OPERAÇÃO AO VIVO & ENCERRAMENTO`: Check-in (`events-checkin`), Operação (`events-operation`), Encerramento (`events-closure`), Relatório Pós-Evento (`events-post-event`), Cancelamento (`events-cancellation`)
  - `MÓDULOS VINCULADOS`: Financeiro do Evento (`finance-dashboard`), Marketing do Evento (`marketing-dashboard`), Pedidos do Evento (`commercial-orders`), SAC do Evento (`sac-dashboard`).

### 1.2. `apps/web/src/shared/components/ModuleSidebar.tsx` (Novo)
- Componente de navegação consolidada do Produtor (quando nenhum evento está selecionado).
- Retira da barra global as 25 ferramentas internas de evento, mantendo apenas itens de nível superior:
  - `VISÃO GERAL`: Visão Geral (`overview`), Central de Consulta (`search`)
  - `OPERAÇÃO`: Eventos (`events`), Comercial (`commercial`), Suporte Eventos (`event-support`), Atendimento SAC (`sac`), Estorno (`refunds`)
  - `GESTÃO & BI`: Financeiro (`finance`), Contabilidade (`accounting`), Marketing (`marketing`), Remarketing (`remarketing`), Relatórios & BI (`analytics`)
  - `FERRAMENTAS TRANSVERSAIS`: Notificações (`notifications`), Aprovações (`approvals`), Documentos (`documents`), Central de Trabalho (`tasks`)
  - `SISTEMA & PLATAFORMA`: Administração (`admin`), Regras & Políticas (`configurations`), Auditoria & Observabilidade (`observability`), Processamentos (`jobs`), Importação & Qualidade (`data-management`), Configurações (`settings`).

### 1.3. `apps/web/src/shared/components/Sidebar.tsx` (Refatorado)
- Reduzido de 544 linhas monolíticas para um orquestrador desacoplado e limpo.
- Lê `activeEvent` e `selectedEventId` diretamente de `useDiskContext()`.
- Se `selectedEventId !== 'all'` e `activeEvent` estiver presente, renderiza `<EventContextSidebar />`.
- Caso contrário, renderiza `<ModuleSidebar />`.

### 1.4. `apps/web/src/modules/events/EventsDashboard.tsx` (Refatorado)
- Ao selecionar um evento no catálogo (`EventsPage`), dispara simultaneamente:
  1. `selectEvent(id)` (registra contexto e atualiza `DiskContext`)
  2. `onNavigate('events', 'events-dashboard')` (ajusta rota e ativa o painel operacional do evento).
- Ao clicar em `onClearEventContext`, dispara `deselectEvent()` e navega para `events-all`, restaurando a lista completa e a `ModuleSidebar`.

### 1.5. Expurgamento Total do Termo "360"
- `apps/web/src/modules/sac/SacDashboard.tsx`:
  - `Visão 360° do Comprador` → `Ficha Consolidada do Comprador`
  - `Selecione um pedido para visualizar a ficha 360°` → `... ficha consolidada do comprador`
- `apps/web/src/features/events/tickets/EventSectionsPage.tsx`:
  - `Visão de Capacidade 360°` → `Visão Integrada de Capacidade`
- `apps/web/src/features/events/tickets/EventCapacityPage.tsx`:
  - `Decomposição 360° de Capacidade` → `Decomposição Operacional de Capacidade`
- `apps/web/src/modules/admin/AdminPermissionsView.tsx`, `AdminRolesView.tsx`, `NewUserWizardModal.tsx`, `UserDetailsModal.tsx`:
  - Todas as ocorrências de "Central 360°" e "Consulta 360°" alteradas para "Central de Consulta".

---

## 2. Validação da Compilação e Gates de Qualidade

1. **Backend Build (`npm run build:api`):**
   - TypeScript compiler (`tsc`) executado sem erros.
   - Código de saída: `0`.
2. **Frontend Build (`npm run build`):**
   - `tsc -b` executado sem erros.
   - Vite 8 executado com sucesso: 2.189 módulos transformados.
   - Bundle gerado em `apps/web/dist` e sincronizado com `dist`.
   - Código de saída: `0`.
