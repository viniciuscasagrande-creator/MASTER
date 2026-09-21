# MATRIZ DE ROTAS DO COMERCIAL — DISK INTERNO

## 1. Mapeamento de Rotas do Frontend (`CommercialDashboard.tsx`)

| Identificador da Rota | Componente Renderizado | Escopo de Contexto | Descrição da Tela |
| :--- | :--- | :--- | :--- |
| `commercial-dashboard` | `CommercialDashboardPage` | Global / Produtor | Painel de controle executivo com indicadores de bilheteria, faturamento, tickets e alertas. |
| `commercial-orders` | `OrdersPage` | Global / Produtor / Evento | Central de pedidos omnichannel com filtros por canal, status, comprador e paginação. |
| `commercial-orders-detail` | `OrderDetailsPage` / `OrderDossierModal` | Global / Produtor / Evento | Dossiê completo da transação com abas Geral, Ingressos, Pagamento, Linha do Tempo e Técnico. |
| `commercial-sales` | `CommercialSalesPage` | Global / Produtor / Evento | Velocidade de comercialização, faturamento acumulado e filtros por sessão e lote. |
| `commercial-performance` | `CommercialSalesPage` (aba performance) | Global / Produtor / Evento | Drilldowns de absorção por setor, tipo de ingresso, canal e taxa de ocupação. |
| `commercial-conditions` | `CommercialConditionsPage` | Global / Produtor / Evento | Configuração de taxas de serviço, pagador, spread, antecipação e prazos de repasse. |
| `commercial-channels` | `CommercialChannelsPage` | Global / Produtor | Gerenciamento de canais autorizados (Site, Bilheteria, PDVs, Portal Produtor). |
| `commercial-advances` | `CommercialAdvancesPage` | Global / Produtor / Evento | Solicitações e autorizações de antecipação financeira (Advanced) baseadas no saldo elegível. |
| `commercial-producers` | `ProducersPage` | Global | Central de Produtoras cadastradas, status de conta e responsável comercial. |
| `commercial-producer-detail` | `ProducerCommercialPage` | Global | Ficha comercial completa da produtora, eventos vinculados e faturamento acumulado. |
| `commercial-portfolio` | `MyPortfolioPage` | Global (Executivo B2B) | Carteira de produtoras atribuídas ao executivo comercial logado. |
| `commercial-leads` | `CommercialLeadsPage` | Global | Central de prospecção de novas produtoras e organizadores de eventos. |
| `commercial-opportunities` | `OpportunitiesPage` | Global | Pipeline de oportunidades B2B (Kanban e Lista de Negociações). |
| `commercial-opportunity-detail`| `OpportunityDetailsPage` | Global | Detalhes da negociação comercial, valor estimado e histórico de interações. |
| `commercial-proposals` | `ProposalsPage` | Global | Central de propostas comerciais de bilhetagem com gerador de versões. |
| `commercial-proposal-detail` | `ProposalDetailsPage` | Global | Minuta da proposta, itens contratados, comparador de versões e aprovação. |
| `commercial-contracts` | `ContractsPage` | Global | Central de contratos comerciais, status de assinatura e prazos de vigência. |
| `commercial-contract-detail` | `ContractDetailsPage` | Global | Detalhes do contrato de bilhetagem, anexos, habilitações e aditivos. |
| `commercial-catalog` | `CommercialCatalogPage` | Global | Catálogo de ofertas, módulos e planos de bilhetagem da DiskIngressos. |
| `commercial-offering-detail` | `OfferingDetailsPage` | Global | Detalhes do produto do catálogo, tabela de preços e versões ativas. |
| `commercial-account-management`| `AccountManagementPage` | Global | Gestão contínua de carteira, monitoramento de renovações e movimentações. |
| `commercial-renewals` | `AccountManagementPage` (tab renewals) | Global | Central de contratos em fase de renovação e controle de churn. |
| `commercial-movements` | `AccountManagementPage` (tab movements)| Global | Histórico de upgrades, downgrades e alterações contratuais de produtoras. |

---

## 2. Rotas do Menu Lateral (`ModuleSidebar.tsx` e `EventContextSidebar.tsx`)

### No Menu Global (`ModuleSidebar.tsx`)
```text
Comercial
├── Visão Geral (commercial-dashboard)
├── Pedidos (commercial-orders)
├── Vendas (commercial-sales)
├── Performance (commercial-performance)
├── Condições & Taxas (commercial-conditions)
├── Canais de Venda (commercial-channels)
├── Antecipações (commercial-advances)
└── Gestão Comercial B2B
    ├── Central de Produtores (commercial-producers)
    ├── Minha Carteira (commercial-portfolio)
    ├── Gestão de Contas & Renovações (commercial-account-management)
    ├── Contratos Comerciais (commercial-contracts)
    ├── Propostas Comerciais (commercial-proposals)
    ├── Oportunidades & Pipeline (commercial-opportunities)
    ├── Prospecções / Leads (commercial-leads)
    └── Catálogo DiskIngressos (commercial-catalog)
```

### No Menu de Evento (`EventContextSidebar.tsx`)
```text
MÓDULOS VINCULADOS AO EVENTO
├── Pedidos do Evento (commercial-orders)
├── Vendas do Evento (commercial-sales)
└── Condições & Taxas do Evento (commercial-conditions)
```
