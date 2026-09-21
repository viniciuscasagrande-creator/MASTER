# Arquitetura Recuperada do Motor de Estornos

**Fase:** 1.3.11.1.4.3 — Recuperação Completa de ESTORNO  
**Data:** 20/09/2026  
**Status:** Arquitetura Recuperada & Homologada  
**Localização:** `docs/phases/ARQUITETURA_ESTORNO_RECUPERADA.md`

---

## 1. Topologia e Fronteiras de Domínio

O módulo de **Estorno** recupera sua posição de autoridade central sobre o ciclo de devolução e reversão no Disk Interno:

```text
                           CLIENTE / COMPRADOR
                                    │
                                    ▼
                         ATENDIMENTO SAC
                     (Abertura & Acompanhamento)
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │                MOTOR CENTRAL DE ESTORNOS               │
       │                                                        │
       │  1. Avaliação Factual de Elegibilidade (Saldo Real)    │
       │  2. Cálculo de Alçadas por Risco (<1k, 1k-5k, >=5k)     │
       │  3. Regra de Segregação de Função (Maker-Checker)      │
       │  4. State Machine Estrita com 11 Estados               │
       │  5. Despacho ao Gateway com Chave de Idempotência      │
       └────────────────────────────┬───────────────────────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
        COMERCIAL               CATRACAS / EVENTOS    FINANCEIRO / LEDGER
   • Pedido Atualizado      • Invalidação de QR Code  • Estorno no Provedor
   • Status REFUNDED        • Bloqueio na Catraca     • Reversão do Split
   • Timeline de Compra     • Auditoria de Acesso     • Compensação Contábil
```

---

## 2. Princípios Fundamentais do Domínio

1. **SAC Não Toca no Dinheiro:**
   - O SAC pode consultar pedidos, abrir solicitações e notificar clientes, mas NÃO tem poder de execução bancária nem alçada para aprovar valores críticos sem validação gerencial.
2. **Comercial Mantém a Imutabilidade Histórica:**
   - O Comercial fornece a base factual do pedido (`Order`, `OrderItem`, snapshots de comprador e canais). O pedido tem seu status atualizado para `REFUNDED` ou `PARTIALLY_REFUNDED`, preservando integralmente os registros da venda original.
3. **Financeiro e Contabilidade Operam por Compensação:**
   - Nunca há edição manual de saldos históricos. Todo estorno gera lançamentos compensatórios no Ledger (`compensating_entries`), recalculando splits e consumindo reservas elegíveis.
4. **Idempotência Compulsória:**
   - Toda chamada ao gateway utiliza `idempotencyKey` única vinculada à solicitação. Retentativas ou webhooks duplicados retornam o resultado anterior sem duplicar pagamentos.
5. **Maker-Checker Rigoroso:**
   - O solicitante de um estorno é sumariamente impedido de aprovar a própria solicitação em qualquer nível de alçada (`requestedByUserId !== approverUserId`).
