# MAPA ATUAL DO MASTER
## Diagnóstico de Código, Componentes, Estado de Implementação e Dependências

**Data:** 20/09/2026  
**Repositório Auditado:** `viniciuscasagrande-creator/MASTER` (Branch `main`)  
**Tecnologias:** React 18, Vite 8, TypeScript 5.5, Tailwind CSS 4, shadcn/ui, Node.js, Express, Jest  

---

## 1. Estrutura de Diretórios e Componentes Auditados

```
apps/web/src/
├── core/
│   ├── auth/ (AuthContext.tsx, ProtectedRoute.tsx, LoginView.tsx)
│   ├── context/ (DiskContext.tsx, CoreDataContext.tsx, NotificationContext.tsx, ScopeContext.tsx)
│   └── types/ (index.ts, models)
├── shared/
│   ├── components/ (Header.tsx, Sidebar.tsx, ModuleSidebar.tsx, EventContextSidebar.tsx, StatCard.tsx, Badge.tsx, Button.tsx)
│   └── utils/ (formatters.ts)
├── features/
│   ├── events/ (23 sub-domínios operacionais e wizard de 8 passos)
│   └── commercial/ (Pedidos, Vendas, Produtores, Oportunidades, Propostas, Contratos, Catálogo, Contas)
└── modules/
    ├── overview/ (OverviewDashboard.tsx)
    ├── events/ (EventsDashboard.tsx)
    ├── commercial/ (CommercialDashboard.tsx)
    ├── eventSupport/ (EventSupportDashboard.tsx)
    ├── sac/ (SacDashboard.tsx)
    ├── refunds/ (RefundsDashboard.tsx)
    ├── finance/ (FinanceDashboard.tsx)
    ├── accounting/ (AccountingDashboard.tsx)
    ├── marketing/ (MarketingDashboard.tsx)
    ├── remarketing/ (RemarketingDashboard.tsx)
    ├── admin/ (AdminDashboardView.tsx, AdminUsersView.tsx, etc.)
    ├── approvals/ (ApprovalInboxView.tsx, etc.)
    ├── documents/ (DocumentCenterView.tsx)
    ├── tasks/ (WorkCenterView.tsx)
    ├── configuration/ (ConfigurationCenterView.tsx)
    ├── observability/ (ObservabilityCenterView.tsx)
    ├── analytics/ (AnalyticsCenterView.tsx)
    ├── jobs/ (ProcessingCenterView.tsx)
    └── data-management/ (DataManagementCenterView.tsx)
```

---

## 2. Inventário de Estados de Implementação no MASTER

| Componente / Módulo | Caminho no Repositório | Estado de Implementação | Diagnóstico Técnico |
| :--- | :--- | :--- | :--- |
| **`DiskContext`** | `apps/web/src/core/context/DiskContext.tsx` | **IMPLEMENTADO (COM MOCK FALLBACK)** | Autoridade de escopo global. Gerencia `selectedProducerId` e `selectedEventId`. Precisa de flag explícita `isDevelopmentFallback` para não mascarar mocks. |
| **`Header`** | `apps/web/src/shared/components/Header.tsx` | **IMPLEMENTADO** | Possui seletores popover de produtora e evento, busca global, persona switcher, indicadores de realtime e breadcrumbs operacionais. |
| **`AppSidebar`** | `apps/web/src/shared/components/Sidebar.tsx` | **IMPLEMENTADO** | Orquestra dinamicamente `ProducerSidebar` (global) e `EventSidebar` (contextual) baseado em `useDiskContext().activeEvent`. |
| **`EventContextSidebar`** | `apps/web/src/shared/components/EventContextSidebar.tsx` | **IMPLEMENTADO** | Contém seletor rápido de evento, dados do evento ativo, botão `← Voltar aos Eventos` e submenus operacionais agrupados. |
| **`ModuleSidebar`** | `apps/web/src/shared/components/ModuleSidebar.tsx` | **IMPLEMENTADO** | Menu operacional enxuto para a visão consolidada do produtor, sem as 25 ferramentas do evento poluindo a raiz. |
| **Eventos: Catálogo Geral** | `apps/web/src/features/events/pages/EventsPage.tsx` | **IMPLEMENTADO** | Exibe cards e tabela de eventos com filtros de status, busca por texto e botão "Acessar Evento" que ativa o contexto. |
| **Eventos: Wizard Criação** | `apps/web/src/features/events/wizard/EventWizardPage.tsx` | **IMPLEMENTADO** | 8 etapas completas: Informações, Local, Datas, Mídia, Organização, Responsabilidades, Revisão e Configurações. |
| **Eventos: Painel do Evento** | `apps/web/src/features/events/pages/EventDashboardPage.tsx` | **IMPLEMENTADO** | KPIs de ingressos, faturamento e ocupação, filtros por sessão e visão operacional em tempo real. |
| **Eventos: Sessões & Agenda** | `apps/web/src/features/events/sessions/EventSessionsPage.tsx` | **IMPLEMENTADO** | Gestão de sessões múltiplas, horários de portão, conflito de horários e detalhamento por sessão. |
| **Eventos: Locais & Plantas** | `apps/web/src/features/events/venues/VenuesPage.tsx` | **IMPLEMENTADO** | Cadastro de locais, gerenciamento de plantas e editor visual de mapas de assento. |
| **Eventos: Setores & Ingressos** | `apps/web/src/features/events/tickets/EventSectionsPage.tsx` | **IMPLEMENTADO** | Setores com capacidade e tipos de ingresso (inteira, meia, VIP) associados. Termo "360" removido com sucesso. |
| **Eventos: Lotes & Preços** | `apps/web/src/features/events/sales/EventBatchesPage.tsx` | **IMPLEMENTADO** | Lotes comerciais com controle de quantidade, virada por data/cota e matriz de preços com simulador. |
| **Eventos: Canais & Cortesias** | `apps/web/src/features/events/sales-channels/`, `complimentary/` | **IMPLEMENTADO** | Habilitação de canais de venda e emissão nominal de cortesias com controle de cotas e auditoria. |
| **Eventos: Equipe & Escalas** | `apps/web/src/features/events/team/EventTeamPage.tsx` | **IMPLEMENTADO** | Atribuição de coordenadores e operadores ao evento sem misturar com o RBAC sistêmico. |
| **Eventos: Prontidão & Publicação**| `apps/web/src/features/events/readiness/`, `publication/` | **IMPLEMENTADO** | Checklist de prontidão antes do go-live e gate de revisão para transição para `ON_SALE`. |
| **Eventos: Operação & Check-in** | `apps/web/src/features/events/operation/`, `checkin/` | **IMPLEMENTADO** | Monitoramento de catracas, leitura de QR Code, controle de contingência offline e incidentes de porta. |
| **Eventos: Encerramento & Cancel.**| `apps/web/src/features/events/closure/`, `cancellation/` | **IMPLEMENTADO** | Fechamento de sessões, relatório pós-evento e gestão de cancelamento com raio de impacto. |
| **Comercial: Pedidos & Vendas** | `apps/web/src/features/commercial/orders/`, `sales/` | **IMPLEMENTADO** | Central de pedidos com busca rápida, detalhes do pedido e velocidade de vendas com drilldown em abas. |
| **Comercial: CRM B2B** | `apps/web/src/features/commercial/opportunities/`, `contracts/`| **MÓDULO DESLOCADO (REALOCAR)** | Pipeline B2B e contratos de produtores estavam misturados na operação de ingressos. Realocado sob "Gestão B2B". |
| **SAC & Central de Consulta** | `apps/web/src/modules/sac/SacDashboard.tsx` | **IMPLEMENTADO (REFINADO)** | Busca por CPF/código, ficha consolidada do comprador, reenvio de vouchers. "360" removido com sucesso. |
| **Estorno & Disputas** | `apps/web/src/modules/refunds/RefundsDashboard.tsx` | **IMPLEMENTADO** | Fila de solicitações de estorno, aprovação baseada em alçadas e gestão de chargebacks. |
| **Financeiro & Contabilidade** | `apps/web/src/modules/finance/`, `accounting/` | **IMPLEMENTADO** | Saldos por evento, conciliação bancária, extrato de repasses, Livro Diário e DRE gerencial. |
| **Marketing & Remarketing** | `apps/web/src/modules/marketing/`, `remarketing/` | **IMPLEMENTADO** | Desempenho de campanhas, pixels por evento, recuperação de carrinhos abandonados e réguas de automação. |

---

## 3. Avaliação Técnica do MASTER

O MASTER possui uma implementação moderna e de alto valor:
1. **Componentes bem tipados:** Uso intensivo de interfaces TypeScript e DTOs compartilhados entre backend e frontend.
2. **Modularidade:** Todos os sub-domínios de eventos já foram construídos de forma atômica e desacoplada em `apps/web/src/features/events/`.
3. **Desvios corrigidos nesta auditoria:**
   - O monolito de navegação em `Sidebar.tsx` foi desacoplado em `AppSidebar`, `ProducerSidebar` e `EventContextSidebar`.
   - As 25 ferramentas internas de evento foram retiradas da barra global e posicionadas no contexto do evento ativo.
   - A terminologia "360" foi expurgada de todos os rótulos visuais.
   - O design system está pronto para receber a paleta executiva clara/neutra inspirada no Limitless.
