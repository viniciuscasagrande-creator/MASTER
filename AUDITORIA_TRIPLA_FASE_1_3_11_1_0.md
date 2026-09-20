# AUDITORIA TRIPLA — FASE 1.3.11.1.0
## Reconciliação Estrutural: MASTER × SafeSaff × Limitless

**Data:** 20/09/2026  
**Autoridade Técnica:** Disk Interno Core Team  
**Status:** Congelamento de Arquitetura Aprovado  

---

## 1. Princípio Fundamental e Papel das Três Bases

A reconstrução do Disk Interno não é feita por suposição nem por cópia cega de código legado. Trabalhamos com três referências com papéis estritamente delimitados:

```
                  NOVO DISK INTERNO
                         ▲
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    SAFESAFF         LIMITLESS          MASTER
        │                │                │
    O QUE FAZ        COMO EXIBIR       O QUE JÁ
    E ONDE FICA      E ORGANIZAR       CONSTRUÍMOS
   (Funcionalidade   (UI, UX,          (Base Técnica,
    e Domínios)       Componentes)      React/TS/APIs)
```

1. **SafeSaff (Referência Funcional):**
   - Define os fluxos operacionais, regras de negócio, dados requeridos, responsabilidades de cada tela, filtros e ações por item/lote.
   - Define a arquitetura central de contexto: **Produtor × Evento**.
2. **Limitless (Referência de UI/UX e Design System):**
   - Define a composição visual executiva, estrutura de sidebar, navbar, page headers, breadcrumbs, content cards, grids responsivos, data tables densas, wizards, tabs, modais e drawers.
   - **Regra:** Não copiar jQuery, Bootstrap legado ou HTML estático. Traduzir o padrão visual para React + TypeScript + Tailwind + shadcn/ui + Lucide.
3. **MASTER (Base Técnica Atual):**
   - Repositório React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, Node.js backend com Clean Architecture.
   - Preservar o código funcional existente, reorganizando-o nos contextos adequados e corrigindo desvios.

---

## 2. Diagnóstico das Diferenças e Desvios Encontrados

| Área / Módulo | SafeSaff (Referência Funcional) | MASTER (Estado Anterior) | Desvio Identificado | Ação Corretiva |
| :--- | :--- | :--- | :--- | :--- |
| **Navegação Global** | Separada entre visão global do Produtor e visão contextual do Evento ativo (`EventContextSidebar`). | Sidebar única e monolítica com 25+ sub-itens de evento abertos na raiz global. | Poluição da navegação; ferramentas de evento vazadas para a raiz. | `AppSidebar` orquestrando `ProducerSidebar` (geral) e `EventSidebar` (contextual). |
| **Contexto Produtor × Evento** | Troca contextual clara; ao escolher evento, o operador entra no evento com botão `← Voltar aos Eventos`. | Contexto existia no `DiskContext`, mas a sidebar global não refletia a mudança. | Usuário ficava sem saber se estava no evento ou na visão geral da produtora. | Integrar `DiskContext.activeEvent` com a troca instantânea da Sidebar. |
| **Módulo Comercial** | Focado na operação de vendas de ingressos: Pedidos, Vendas, Borderôs, Canais, Lotes, Transações. | Misturou CRM B2B completo (leads, prospecções, propostas, contratos) no menu principal de vendas. | Diluição da operação core de ingressos por um pipeline B2B. | Reorganizar CRM B2B em sub-seção estruturada; priorizar Pedidos, Vendas e Canais. |
| **Módulo Eventos** | Catálogo geral com status, busca, e entrada nos sub-domínios operacionais dentro do evento. | Todos os 23 subcomponentes expostos na sidebar global independente de evento selecionado. | Complexidade cognitiva excessiva para o operador. | Contextualizar sub-itens dentro da `EventSidebar` do evento ativo. |
| **Terminologia "360"** | Usava "Visão 360°", "Dossiê 360°", "Central 360°". | Herdado no SAC ("Central 360°", "Visão 360°"). | Termo comercial vago e expressamente vetado. | Substituído por "Central de Consulta" e "Ficha Consolidada do Comprador". |
| **Design System** | Dark navy (`#1a222f`) na sidebar + content area clara/neutra (`#f8fafc`). | 100% Dark Mode (`bg-slate-950` em todo o shell, cards pretos). | Cansaço visual em turnos operacionais prolongados; fora do padrão Limitless. | Sidebar dark premium (`#0f172a`) + workspace claro/executivo (`#f8fafc`), cards brancos, bordas sutis. |
| **Mocks em Produção** | Fallback implícito sem sinalização. | `INITIAL_PRODUCERS` e `INITIAL_EVENTS` hardcoded no `DiskContext`. | Risco de operadores confundirem mocks com dados reais de produção. | Flag explícita `isDevelopmentFallback` e preparação para `GET /api/v1/context`. |

---

## 3. Matriz de Componentes Reutilizáveis do MASTER

O MASTER possui uma riqueza técnica substancial que **não será descartada**, mas sim reorganizada:

1. **`DiskContext` (`apps/web/src/core/context/DiskContext.tsx`):**
   - Autoridade consolidada para `activeProducer`, `activeEvent`, `selectedProducerId`, `selectedEventId`, `availableProducers`, `availableEvents`, `setProducer`, `setEvent`, `clearProducer`, `clearEvent`, `resetScope`, `apiFetch`.
2. **Sub-domínios de Eventos (`apps/web/src/features/events/`):**
   - Wizard Inteligente de Criação (`EventWizardPage.tsx`)
   - Locais & Plantas (`VenuesPage.tsx`, `VenueMapEditorPage.tsx`)
   - Sessões & Agenda (`EventSessionsPage.tsx`, `EventSessionDetailsPage.tsx`)
   - Setores & Capacidade (`EventSectionsPage.tsx`, `EventCapacityPage.tsx`)
   - Ingressos & Lotes (`EventTicketTypesPage.tsx`, `EventBatchesPage.tsx`, `EventPricingPage.tsx`)
   - Regras & Canais de Venda (`EventSalesRulesPage.tsx`, `EventSalesChannelsPage.tsx`)
   - Cortesias & Convites (`ComplimentaryPage.tsx`)
   - Equipe & Escalas (`EventTeamPage.tsx`)
   - Documentos & Pendências (`EventDocumentsPage.tsx`, `EventTasksPage.tsx`)
   - Prontidão & Alterações Controladas (`EventReadinessPage.tsx`, `EventChangeManagementPage.tsx`)
   - Revisão & Publicação (`EventReviewPublicationPage.tsx`)
   - Operação ao Vivo & Check-in (`EventOperationPage.tsx`, `EventCheckinPage.tsx`)
   - Encerramento & Relatório Pós-Evento (`EventClosurePage.tsx`, `PostEventPage.tsx`)
   - Gestão de Cancelamento (`EventCancellationPage.tsx`)
   - Eventos Arquivados (`ArchivedEventsPage.tsx`)
3. **Sub-domínios Comerciais (`apps/web/src/features/commercial/`):**
   - Central de Pedidos e Detalhes (`OrdersPage.tsx`, `OrderDetailsPage.tsx`)
   - Central de Vendas & Performance com drilldown (`CommercialSalesPage.tsx`)
   - Gestão de Produtores e Carteira (`ProducersPage.tsx`, `ProducerCommercialPage.tsx`, `MyPortfolioPage.tsx`)
   - Gestão de Contas, Renovações e Movimentações (`AccountManagementPage.tsx`)
   - Pipeline, Propostas e Contratos (`OpportunitiesPage.tsx`, `ProposalsPage.tsx`, `ContractsPage.tsx`, `CommercialCatalogPage.tsx`)
4. **Segurança e RBAC:**
   - RBAC multinível (`AuthContext.tsx`, `ProtectedRoute.tsx`, `PermissionString`)
   - Header com Persona Switcher para simulação de perfis operacionais.

---

## 4. Padrões Visuais e de Experiência do Limitless Selecionados

| Padrão Limitless | Referência no Template | Aplicação no Disk Interno | Implementação Tecnológica |
| :--- | :--- | :--- | :--- |
| **Sidebar Hierárquica** | `layout_sidebar_fixed.html` | Sidebar escura (`#0f172a`), seções em caixa alta com tracking, submenus com recuo e linha de guia. | Tailwind CSS, Lucide icons, shadcn/ui. |
| **Sidebar Recolhida** | `layout_sidebar_collapsed.html` | Redução para 64px com centralização de ícones, ocultação de labels e ativação por clique (não hover). | CSS transitions, Tailwind `w-16` / `w-64`. |
| **Page Header Executivo** | `page_header_breadcrumbs.html` | Topo de página com breadcrumbs contextuais, título grande, badge de status e botões de ação contextuais à direita. | `EventPageHeader.tsx`, `Header.tsx`. |
| **Tabelas de Dados Densas** | `datatable_responsive.html` | Tabelas de pedidos, ingressos e lotes com alta densidade de informação, cabeçalho sutil, números alinhados à direita e status chips. | `EventTable.tsx`, `DiskDataTable.tsx`. |
| **Cards de Estatísticas (KPIs)** | `dashboard_analytics.html` | Cards de valor principal em destaque (`text-2xl font-black`), label compacto em caixa alta, e badge de variação percentual. | `StatCard.tsx`, `EventSummary.tsx`. |
| **Drawer Operacional** | `components_offcanvas.html` | Painéis laterais deslizantes para auditoria, notificações e detalhes rápidos sem sair da tela de trabalho. | `AuditDrawer.tsx`, `NotificationsDrawer.tsx`. |
| **Assistente em Passos (Wizard)** | `form_wizard.html` | Criação de eventos e fluxos complexos divididos em passos lógicos com indicador de progresso e salvamento de rascunho. | `EventWizardStepper.tsx`, `EventWizardLayout.tsx`. |

---

## 5. Riscos Mapeados e Estratégia de Mitigação

1. **Risco de Tela Branca / Regressão:**
   - *Mitigação:* Migração incremental mantendo `LegacyNavigationAdapter` e garantindo que todas as rotas apontem para componentes reais já homologados.
2. **Risco de Vazamento de Contexto (Cross-Producer / Cross-Event):**
   - *Mitigação:* Ao trocar produtor ou evento no `DiskContext`, disparar limpeza automática de filtros órfãos, eventos incompatíveis e invalidar chaves do TanStack Query.
3. **Risco de Dependência de Tecnologias Antigas do Limitless:**
   - *Mitigação:* Vetar explicitamente importação de scripts jQuery, Bootstrap e bibliotecas obsoletas. Aproveitar puramente o layout e tokens de design.
4. **Risco de Desvio Funcional:**
   - *Mitigação:* SafeSaff permanece a régua funcional definitiva. Nenhuma função existente no SafeSaff será descartada.

---

## 6. Ordem de Recuperação Homologada

1. **Fase 1.3.11.1.0:** Auditoria Tripla e Congelamento de Arquitetura (Concluída).
2. **Fase 1.3.11.1.1:** Recuperação da Navegação Global + Contexto Produtor × Evento (`AppShell`, `AppHeader`, `ProducerSidebar`, `EventSidebar`).
3. **Fase 1.3.11.1.2:** Recuperação Completa de EVENTOS (Reorganização de todos os 23 sub-domínios dentro da `EventSidebar`).
4. **Fase 1.3.11.1.3:** Recuperação Completa do COMERCIAL (Central de Pedidos, Vendas, Performance, Canais; desacoplamento do CRM B2B).
5. **Fase 1.3.11.1.4:** Recuperação dos Módulos Operacionais e Financeiros (SAC sem "360", Suporte Eventos, Estornos, Financeiro e Contabilidade).
6. **Fase 1.3.11.1.5:** Homologação Visual Final e Design System Unificado.
