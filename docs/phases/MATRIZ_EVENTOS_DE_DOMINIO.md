# Matriz de Eventos de Domínio — Fase 1.3.11.1.5

## 1. Visão Geral da Arquitetura Orientada a Eventos

Para garantir o desacoplamento temporal e estrutural entre os domínios sem introduzir silos ou chamadas circulares síncronas, o Disk Interno adota o padrão de **Eventos de Domínio** (Domain Events).

```text
[Publicador] ──► [Event Bus / Outbox] ──► [Subscritor 1 (Comercial)]
                                      ──► [Subscritor 2 (SAC)]
                                      ──► [Subscritor 3 (Contabilidade)]
```

---

## 2. Matriz de Propagação de Eventos

| Evento | Módulo Emissor | Módulos Subscritores | Tipo de Propagação | Política de Retentativa | Ação de Tratamento |
|---|---|---|---|---|---|
| `order.paid` | Financeiro | Comercial, SAC, Marketing | Assíncrona / Transacional | 5 retentativas com backoff exponencial | Comercial emite ingressos; SAC atualiza histórico; Marketing registra conversão. |
| `ticket.issued` | Comercial | Eventos, Portaria | Assíncrona | 3 retentativas | Atualiza inventário do lote e libera QR Code para credenciamento. |
| `sac.ticket.created` | Atendimento SAC | Auditoria, Operação | Assíncrona | 3 retentativas | Registra métrica de SLA e alerta fila de atendimento. |
| `refund.requested` | SAC / Comercial | Estorno, Auditoria | Síncrona / Imediata | N/A (chamada via API com idempotência) | Inicia máquina de estados de elegibilidade do estorno. |
| `refund.approved` | Estorno | Financeiro, Auditoria | Assíncrona / Transacional | 5 retentativas | Coloca estorno na fila de processamento bancário/gateway. |
| `refund.completed` | Estorno | Comercial, Contabilidade, SAC | Transacional / Garantida | 10 retentativas + Fila de Falha (DLQ) | Invalida ingressos no Comercial, lança partida dobrada compensatória na Contabilidade e notifica SAC. |
| `cart.abandoned` | Comercial | Remarketing | Assíncrona | 3 retentativas | Inicia régua de recuperação após 15 minutos de inatividade. |
| `cart.recovered` | Remarketing | Comercial, Marketing | Assíncrona | 3 retentativas | Computa conversão atribuída à campanha de recuperação. |

---

## 3. Garantias de Entrega e Resiliência

1. **Garantia At-Least-Once:** Todos os eventos críticos de transação financeira e cancelamento de ingresso são persistidos no banco antes da publicação (Padrão Transactional Outbox).
2. **Idempotência do Consumidor:** Todo handler consumidor deve verificar se o ID do evento já foi processado antes de executar efeitos colaterais.
3. **Fila de Falhas (DLQ):** Eventos que falharem após o esgotamento das retentativas são direcionados para quarentena técnica para intervenção operacional, sem bloquear o fluxo normal.
