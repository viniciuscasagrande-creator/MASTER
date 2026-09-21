# Matriz de Domínios Definitiva — Fase 1.3.11.1.5

## 1. Visão Geral da Separação Canônica

A arquitetura do **Disk Interno (MASTER)** opera com segregação estrita de responsabilidades. Cada módulo é o detentor exclusivo da autoridade de escrita sobre suas tabelas e entidades proprietárias. Módulos consumidores consom dados através de serviços internos, contratos de interface ou eventos de domínio assíncronos.

```text
                                DISK INTERNO
                                      │
                     DiskContext (Produtor × Evento)
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       │                              │                              │
   OPERAÇÃO                        GESTÃO                       CRESCIMENTO
   ├── Eventos                     ├── Financeiro               ├── Marketing
   ├── Comercial                   └── Contabilidade            └── Remarketing
   ├── Suporte Eventos
   ├── Atendimento SAC
   └── Estorno
```

---

## 2. Matriz de Autoridade e Limites de Domínio

| Domínio | Entidades Proprietárias | Autoridade de Escrita | Consumidores de Leitura | Limites Estritos (O que NUNCA deve fazer) |
|---|---|---|---|---|
| **Eventos** | `Event`, `Session`, `Section`, `TicketType`, `Batch`, `Inventory` | Cadastro de eventos, lotes, capacidade, configurações de taxa e setorização. | Comercial, SAC, Estorno, Financeiro, Marketing. | NUNCA processa pedidos, pagamentos ou liquidações financeiras. |
| **Comercial** | `Order`, `OrderItem`, `SaleChannel`, `SalesPolicy` | Criação de pedidos, emissão de ingressos, aplicação de regras de venda e checkout. | SAC, Estorno, Financeiro, Contabilidade, Remarketing. | NUNCA decide ou aprova estornos; NUNCA altera contabilidade de partidas dobradas. |
| **Suporte Eventos** | `SupportTicket`, `AccessIncident`, `GateIncident`, `CredentialLog` | Gestão operacional no dia do evento: catracas, contingência, credenciamento técnico. | Eventos, Operação de Portaria. | NUNCA altera status financeiro ou cadastro do comprador. |
| **Atendimento SAC** | `Customer`, `SacTicket`, `SacInteraction`, `CustomerNotes` | Abertura de chamados do comprador, registro de interações e solicitações de suporte. | Central de Consulta, Auditoria, Estorno. | NUNCA processa estorno diretamente no gateway nem altera o pedido no Comercial. |
| **Estorno** | `Refund`, `RefundItem`, `RefundApproval`, `RefundLog` | Avaliação de elegibilidade, fluxo de aprovação Maker-Checker, orquestração de gateway e disparo em cascata. | SAC, Comercial, Financeiro, Contabilidade. | NUNCA cancela pedidos sem validação de pagamento; NUNCA emite ingressos. |
| **Financeiro** | `Payment`, `Transaction`, `Payout`, `Split`, `BankAccount`, `CashFlow` | Orquestração de adquirentes, liquidação, split entre produtor/DiskIngressos e repasses bancários. | Contabilidade, Comercial, Estorno, Diretoria. | NUNCA emite ingressos ou define políticas de lote de eventos. |
| **Contabilidade** | `ChartOfAccounts`, `JournalEntry`, `CompensatingEntry`, `Ledger`, `DRE` | Plano de contas, partidas dobradas, conciliação fiscal e fechamento contábil. | Financeiro, Compliance, Auditoria. | NUNCA altera dados transacionais de pedidos de venda diretamente. |
| **Marketing** | `Campaign`, `Pixel`, `TrackingTag`, `AttributionLog` | Configuração de tags de rastreio, campanhas de aquisição e modelos de atribuição UTM. | Remarketing, Comercial. | NUNCA interage diretamente com catracas de portaria ou estornos. |
| **Remarketing** | `AbandonedCart`, `RecoveryJourney`, `RecoveryMessage` | Detecção de carrinhos abandonados, disparos de mensagens transacionais e links de recuperação. | Comercial, Marketing. | NUNCA cria pedidos paralelos; direciona o comprador para o fluxo oficial do Comercial. |

---

## 3. Garantias Transacionais e Consistência

1. **Idempotência no Estorno:** Nenhuma solicitação de estorno é executada duas vezes. A chave de idempotência é composta por `idempotencyKey = orderId + paymentId + round(amount, 2) + itemsHash`.
2. **Invalidação Atômica no Contexto:** Ao trocar de Produtor em `DiskContext`, qualquer evento selecionado anteriormente que não pertença ao novo produtor é instantaneamente anulado no estado do React, prevenindo vazamento visual de dados (zero cross-tenant).
3. **Imutabilidade de Partidas Dobradas:** Toda alteração financeira ou de estorno registrada na Contabilidade gera novas linhas de estorno/compensação (`compensating_entries`), nunca realizando `DELETE` físico ou `UPDATE` destrutivo em lançamentos já consolidados.
