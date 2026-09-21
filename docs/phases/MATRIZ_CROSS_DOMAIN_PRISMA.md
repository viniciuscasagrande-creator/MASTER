# Matriz de Relações Cross-Domain no Prisma — Fase 1.3.11.1.5

## 1. Princípio de Modelagem Relacional

Para equilibrar a integridade referencial do banco relacional PostgreSQL e a independência arquitetural dos domínios, o **Disk Interno** adota uma estratégia mista:
- **Chaves Estrangeiras Físicas (`@relation`):** Mantidas dentro do mesmo domínio ou quando a integridade transacional é estrita (ex: `Order` e `OrderItem`; `Event` e `Batch`).
- **Chaves de Referência Lógica (`string` com índices):** Utilizadas em fronteiras entre domínios autônomos (ex: `Refund.orderId`, `Refund.paymentId`, `SacTicket.customerId`).

---

## 2. Matriz de Entidades e Relacionamentos Cross-Domain

| Entidade Origem | Entidade Destino | Tipo de Relação | Mecanismo Prisma | Transacionalidade |
|---|---|---|---|---|
| `Order` (Comercial) | `Event` (Eventos) | Muitos para Um | `eventId String` `@relation` | Integridade referencial obrigatória no banco. |
| `OrderItem` (Comercial) | `Batch` (Eventos) | Muitos para Um | `batchId String` `@relation` | Integridade referencial com bloqueio de concorrência. |
| `Payment` (Financeiro) | `Order` (Comercial) | Muitos para Um | `orderId String` (indexado) | Transacional via `prisma.$transaction`. |
| `Refund` (Estorno) | `Order` (Comercial) | Muitos para Um | `orderId String` (indexado) | Validação em serviço antes da persistência. |
| `Refund` (Estorno) | `Payment` (Financeiro) | Muitos para Um | `paymentId String` (indexado) | Validação lógica de valor original liquidado. |
| `SacTicket` (SAC) | `Customer` (SAC) | Muitos para Um | `customerId String` `@relation` | Integridade referencial interna do SAC. |
| `SacTicket` (SAC) | `Order` (Comercial) | Muitos para Um | `orderId String?` (indexado) | Relação opcional desacoplada. |
| `CompensatingEntry` (Contabilidade) | `Refund` (Estorno) | Um para Um | `entityId String` (indexado) | Partida dobrada imutável disparada em cascata. |
| `AbandonedCart` (Remarketing) | `Event` (Eventos) | Muitos para Um | `eventId String` (indexado) | Desacoplado; não impede exclusão de evento arquivado. |

---

## 3. Gestão de Transações e Concorrência (`prisma.$transaction`)

Para operações críticas de múltiplos domínios (como a execução de um estorno), as mutações são orquestradas dentro de uma transação Prisma para assegurar consistência ACID:

```typescript
// Padrão de Execução Transacional em Estorno
await prisma.$transaction(async (tx) => {
  // 1. Atualiza status do estorno para EXECUTED
  await tx.refund.update({
    where: { id: refundId },
    data: { status: 'COMPLETED', executedAt: new Date() },
  });

  // 2. Invalida ingressos relacionados no Comercial
  await tx.ticket.updateMany({
    where: { orderId: refund.orderId },
    data: { status: 'CANCELLED_REFUNDED' },
  });

  // 3. Registra partida dobrada compensatória na Contabilidade
  await tx.compensatingEntry.create({
    data: {
      entityType: 'REFUND',
      entityId: refundId,
      amount: refund.amount,
      debitAccount: '4.1.01',
      creditAccount: '1.1.01',
    },
  });
});
```
