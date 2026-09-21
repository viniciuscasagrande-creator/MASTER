# Matriz de Serviços Duplicados e Consolidação Backend — Fase 1.3.11.1.5

## 1. Visão Geral da Racionalização de Serviços

A unificação arquitetural do backend (`backend/src/modules/`) eliminou serviços sobrepostos que executavam regras de negócio semelhantes ou concorrentes em diferentes partes da base de código.

Cada capacidade de negócio possui agora **exatamente um serviço de referência** que encapsula suas invariantes e transações no banco de dados relacional.

---

## 2. Mapa de Serviços Consolidados

| Capacidade de Negócio | Serviços Duplicados Anteriores | Serviço Canônico Consolidado | Arquivo Fonte Canônico | Responsabilidade Exclusiva |
|---|---|---|---|---|
| **Gestão de Estornos** | `cancel-order.service.ts`, `refund-handler.ts` | `RefundService` | `backend/src/modules/refunds/refund.service.ts` | Máquina de estados de estorno, Maker-Checker, idempotência e disparo em cascata. |
| **Atendimento SAC & Clientes** | `support.service.ts`, `consumer-query.ts` | `CustomerService` / `SacService` | `backend/src/modules/sac/customer.service.ts` | Central de Consulta, histórico de compras, abertura e SLA de tickets de SAC. |
| **Pedidos e Vendas de Ingressos**| `sales-engine.ts`, `checkout.service.ts` | `OrderService` | `backend/src/modules/commercial/order.service.ts` | Criação de pedidos, emissão e invalidação de ingressos, aplicação de lotes. |
| **Pagamentos e Gateway** | `pix-client.ts`, `credit-card.service.ts` | `PaymentService` | `backend/src/modules/financial/payment.service.ts` | Orquestração de adquirentes, liquidações, webhooks e devoluções no gateway. |
| **Contabilidade e Partidas Dobradas**| `ledger-tracker.ts`, `accounting-hook.ts`| `AccountingService` | `backend/src/modules/accounting/accounting.service.ts` | Registro indelével de partidas dobradas e lançamentos compensatórios. |
| **Recuperação de Carrinho** | `cart-abandonment-cron.ts`, `abandoned.service.ts`| `RemarketingService` | `backend/src/modules/remarketing/remarketing.service.ts` | Monitoramento de abandono, réguas de recuperação e geração de link seguro. |

---

## 3. Diretrizes de Injeção e Uso

1. **Zero Mutação Paralela:** Nenhum controller ou handler de eventos pode invocar diretamente queries Prisma que modifiquem entidades de outro domínio; deve-se chamar o método público correspondente do Serviço Canônico.
2. **Isolamento de Erros:** Erros de domínio lançados pelos serviços canônicos utilizam exceções tipadas (`DomainException`, `ValidationException`, `NotFoundException`), permitindo tratamento semântico homogêneo na camada HTTP.
3. **Idempotência Nativa:** Métodos de serviços que executam transações financeiras ou mutações de estado crítico exigem o parâmetro `idempotencyKey`.
