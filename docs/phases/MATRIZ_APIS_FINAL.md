# Matriz Definitiva de APIs Backend — Fase 1.3.11.1.5

## 1. Visão Geral dos Endpoints do Sistema

A API Express opera na base `/api/` com suporte a autenticação JWT, validação de permissões RBAC e injeção do contexto do produtor/evento via headers (`x-tenant-id`, `x-producer-id`, `x-event-id`).

---

## 2. Inventário Canônico de APIs por Domínio

### 2.1. Domínio: Eventos (`/api/events`)
| Método | Endpoint | Permissão RBAC | Idempotência | Descrição |
|---|---|---|---|---|
| `GET` | `/api/events` | `eventos.visualizar` | Não | Lista eventos filtrados pelo produtor ativo. |
| `POST` | `/api/events` | `eventos.criar` | Não | Cria um novo evento e suas configurações básicas. |
| `GET` | `/api/events/:id` | `eventos.visualizar` | Não | Retorna ficha cadastral e técnica do evento. |
| `PUT` | `/api/events/:id` | `eventos.editar` | Não | Atualiza configurações e detalhes do evento. |
| `GET` | `/api/events/:id/sessions` | `eventos.visualizar` | Não | Lista sessões e datas cadastradas para o evento. |
| `GET` | `/api/events/:id/batches` | `eventos.visualizar` | Não | Lista lotes e capacidades de ingressos. |
| `POST` | `/api/events/:id/batches` | `eventos.editar` | Não | Cria novo lote de ingressos. |

---

### 2.2. Domínio: Comercial (`/api/commercial`)
| Método | Endpoint | Permissão RBAC | Idempotência | Descrição |
|---|---|---|---|---|
| `GET` | `/api/commercial/orders` | `comercial.pedidos.visualizar` | Não | Lista pedidos com paginação e filtros operacionais. |
| `GET` | `/api/commercial/orders/:id` | `comercial.pedidos.visualizar` | Não | Retorna detalhes completos do pedido e seus itens. |
| `POST` | `/api/commercial/orders` | `comercial.pedidos.criar` | Sim | Cria pedido no balcão/PDV ou checkout. |
| `GET` | `/api/commercial/sales/overview` | `comercial.vendas.visualizar` | Não | Retorna métricas factuais agregadas de vendas. |
| `GET` | `/api/commercial/channels` | `comercial.canais.visualizar` | Não | Lista pontos de venda e canais credenciados. |

---

### 2.3. Domínio: Atendimento SAC (`/api/sac`)
| Método | Endpoint | Permissão RBAC | Idempotência | Descrição |
|---|---|---|---|---|
| `GET` | `/api/sac/search` | `sac.consulta.executar` | Não | Busca omnicanal na Central de Consulta (CPF, e-mail, pedido). |
| `GET` | `/api/sac/customers/:id` | `sac.atendimento.visualizar` | Não | Retorna Dossiê Operacional do consumidor. |
| `POST` | `/api/sac/tickets` | `sac.atendimento.criar` | Não | Abre novo chamado de suporte com classificação e SLA. |
| `GET` | `/api/sac/tickets/:id` | `sac.atendimento.visualizar` | Não | Retorna histórico de interações do chamado. |
| `POST` | `/api/sac/tickets/:id/interactions`| `sac.atendimento.editar` | Não | Adiciona réplica, nota interna ou resposta ao chamado. |

---

### 2.4. Domínio: Estorno (`/api/refunds`)
| Método | Endpoint | Permissão RBAC | Idempotência | Descrição |
|---|---|---|---|---|
| `GET` | `/api/refunds` | `estorno.visualizar` | Não | Lista solicitações de estorno e seus status. |
| `GET` | `/api/refunds/:id` | `estorno.visualizar` | Não | Retorna detalhes do estorno, auditoria e aprovações. |
| `POST` | `/api/refunds/requests` | `estorno.solicitar` | Sim | Cria solicitação de estorno e valida elegibilidade. |
| `POST` | `/api/refunds/:id/approve` | `estorno.aprovar` | Sim | Registra aprovação operacional ou financeira. |
| `POST` | `/api/refunds/:id/execute` | `estorno.solicitacao.executar` | Sim (Header `Idempotency-Key` obrigatório) | Orquestra estorno no gateway, invalida ingressos e compensa. |
| `POST` | `/api/refunds/:id/reject` | `estorno.aprovar` | Não | Rejeita solicitação com justificativa auditável. |

---

### 2.5. Domínio: Financeiro (`/api/financial`)
| Método | Endpoint | Permissão RBAC | Idempotência | Descrição |
|---|---|---|---|---|
| `GET` | `/api/financial/overview` | `financeiro.visualizar` | Não | Retorna resumo consolidado de saldos e disponibilidades. |
| `GET` | `/api/financial/payouts` | `financeiro.repasses.visualizar` | Não | Lista repasses agendados e efetuados aos produtores. |
| `POST` | `/api/financial/payouts/schedule`| `financeiro.repasses.gerenciar` | Sim | Agenda solicitação de repasse com validação de saldo. |
| `GET` | `/api/financial/reconciliation` | `financeiro.conciliacao.visualizar` | Não | Lista divergências entre adquirentes e pedidos. |

---

### 2.6. Domínio: Contabilidade (`/api/accounting`)
| Método | Endpoint | Permissão RBAC | Idempotência | Descrição |
|---|---|---|---|---|
| `GET` | `/api/accounting/ledger` | `contabilidade.visualizar` | Não | Extrato de partidas dobradas e histórico de lançamentos. |
| `GET` | `/api/accounting/dre` | `contabilidade.dre.visualizar` | Não | Demonstrativo de Resultado do Exercício consolidado. |
| `POST` | `/api/accounting/compensating-entries`| `contabilidade.gerenciar` | Sim | Registra lançamento contábil compensatório. |

---

### 2.7. Domínio: Marketing e Remarketing (`/api/marketing` & `/api/remarketing`)
| Método | Endpoint | Permissão RBAC | Idempotência | Descrição |
|---|---|---|---|---|
| `GET` | `/api/marketing/campaigns` | `marketing.visualizar` | Não | Lista campanhas ativas e métricas de conversão. |
| `GET` | `/api/marketing/pixels` | `marketing.pixels.gerenciar` | Não | Configura pixels do Meta, Google Analytics e TikTok. |
| `GET` | `/api/remarketing/abandoned-carts`| `remarketing.visualizar` | Não | Lista carrinhos abandonados com métricas de recuperação. |
| `POST` | `/api/remarketing/trigger` | `remarketing.gerenciar` | Sim | Dispara réguas de notificação para carrinhos elegíveis. |
