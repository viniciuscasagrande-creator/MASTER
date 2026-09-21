# Matriz Definitiva de Rotas Frontend — Fase 1.3.11.1.5

## 1. Estrutura Canônica de Navegação

A navegação do Disk Interno é orientada pela hierarquia de 5 seções canônicas de navegação renderizadas em `apps/web/src/shared/components/ModuleSidebar.tsx`:

1. **VISÃO GERAL** (Dashboard da organização ou do produtor)
2. **OPERAÇÃO** (Eventos, Comercial, Suporte Eventos, Atendimento SAC, Estorno)
3. **GESTÃO** (Financeiro, Contabilidade)
4. **CRESCIMENTO** (Marketing, Remarketing)
5. **SISTEMA** (Administração, Configurações)

---

## 2. Inventário de Rotas e Telas

| Rota / Path | Seção da Sidebar | Componente React | Contexto Requerido | Permissão RBAC | Resumo da Interface |
|---|---|---|---|---|---|
| `/` ou `/dashboard` | VISÃO GERAL | `DashboardOverview.tsx` | Global ou Produtor | `dashboard.visualizar` | Indicadores consolidados de vendas, eventos ativos e alertas operacionais. |
| `/events` | OPERAÇÃO | `EventsListPage.tsx` | Produtor | `eventos.visualizar` | Listagem de eventos com filtros de status, data e busca textual. |
| `/events/:id` | OPERAÇÃO | `EventDetailPage.tsx` | Produtor × Evento | `eventos.visualizar` | Ficha técnica, sessões, lotes, setores e configurações do evento. |
| `/commercial` | OPERAÇÃO | `CommercialDashboard.tsx` | Produtor / Evento | `comercial.visualizar` | Central de vendas de ingressos, canais e balanço comercial. |
| `/commercial/orders` | OPERAÇÃO | `OrdersListPage.tsx` | Produtor / Evento | `comercial.pedidos.visualizar` | Listagem de pedidos, status de pagamento e itens emitidos. |
| `/commercial/orders/:id` | OPERAÇÃO | `OrderDetailModal.tsx` | Produtor | `comercial.pedidos.visualizar` | Modal com dados completos do pedido, ingressos e transação. |
| `/support-events` | OPERAÇÃO | `SupportEventsDashboard.tsx` | Produtor × Evento | `suporte_eventos.visualizar` | Monitoramento de catracas, contingência e credenciamento no dia do evento. |
| `/sac` | OPERAÇÃO | `SacDashboard.tsx` | Global | `sac.atendimento.visualizar` | Central de Consulta do comprador, histórico de chamados e SLAs de resposta. |
| `/sac/customer/:id` | OPERAÇÃO | `CustomerDossierModal.tsx`| Global | `sac.consulta.executar` | Dossiê Operacional do consumidor: ingressos, pedidos e ocorrências. |
| `/refunds` | OPERAÇÃO | `RefundsDashboard.tsx` | Global ou Produtor | `estorno.visualizar` | Central de gestão de estornos com filtros por status e valor. |
| `/refunds/new` | OPERAÇÃO | `NewRefundModal.tsx` | Produtor | `estorno.solicitar` | Formulário para solicitação e cálculo de elegibilidade de estorno. |
| `/refunds/:id` | OPERAÇÃO | `RefundDetailModal.tsx` | Global ou Produtor | `estorno.visualizar` | Dossiê do estorno, histórico de aprovações e botão de execução. |
| `/financial` | GESTÃO | `FinancialDashboard.tsx` | Produtor | `financeiro.visualizar` | Saldo disponível, a liberar, histórico de repasses e extrato. |
| `/accounting` | GESTÃO | `AccountingDashboard.tsx` | Global ou Produtor | `contabilidade.visualizar` | Livro razão, partidas dobradas compensatórias e DRE operacional. |
| `/marketing` | CRESCIMENTO | `MarketingDashboard.tsx` | Produtor | `marketing.visualizar` | Gestão de pixels, links rastreados e performance de campanhas. |
| `/remarketing` | CRESCIMENTO | `RemarketingDashboard.tsx` | Produtor | `remarketing.visualizar` | Gestão de carrinhos abandonados, réguas de recuperação e taxa de conversão. |
| `/admin` | SISTEMA | `AdminDashboard.tsx` | Global | `admin.visualizar` | Gestão de usuários internos, papéis, auditoria e permissões. |
| `/settings` | SISTEMA | `SettingsPage.tsx` | Global | `configuracoes.visualizar` | Configurações gerais da instância DiskIngressos. |

---

## 3. Regra de Contexto e Invalidação Visual

- Se a rota exigir `Produtor × Evento` e nenhum evento estiver ativo no `DiskContext`, uma faixa contextual (Callout) solicita a seleção de um evento ativo ou exibe a listagem geral agregada do produtor.
- Quando o usuário altera o `activeProducer`, o `activeEvent` anterior é imediatamente purgado do estado, impedindo qualquer cruzamento ou vazamento de dados de outro produtor.
