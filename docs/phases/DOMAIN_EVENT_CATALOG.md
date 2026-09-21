# Catálogo de Eventos de Domínio — Fase 1.3.11.1.5

## 1. Padrão Canônico do Envelope de Eventos

Todos os eventos emitidos na plataforma seguem a especificação CloudEvents v1.0 compatível:

```typescript
export interface DomainEvent<T = unknown> {
  id: string;               // UUID v4 único da ocorrência
  source: string;           // Ex: 'disk-interno/refunds', 'disk-interno/commercial'
  specversion: '1.0';
  type: string;             // Ex: 'com.diskingressos.refund.completed'
  time: string;             // ISO 8601 UTC
  datacontenttype: 'application/json';
  data: T;
  tenantId: string;         // Isolamento Multi-tenant (produtor/organização)
}
```

---

## 2. Catálogo Detalhado de Esquemas de Evento

### 2.1. `com.diskingressos.order.paid` (Versão 1.0.0)
- **Descrição:** Disparado pelo módulo Financeiro quando uma transação de pagamento de pedido é liquidada com sucesso.
- **Payload:**
```json
{
  "orderId": "ord_88492048",
  "paymentId": "pay_99381203",
  "producerId": "prod_1029",
  "eventId": "evt_4920",
  "grossAmount": 350.00,
  "netAmount": 315.00,
  "feeAmount": 35.00,
  "paymentMethod": "PIX",
  "customer": {
    "id": "cust_1102",
    "name": "Maria Silva",
    "document": "123.456.789-00",
    "email": "maria.silva@exemplo.com"
  },
  "items": [
    {
      "ticketTypeId": "tt_pista_vip",
      "batchId": "batch_01",
      "quantity": 2,
      "unitPrice": 175.00
    }
  ],
  "paidAt": "2026-09-20T21:40:00Z"
}
```

---

### 2.2. `com.diskingressos.refund.completed` (Versão 1.0.0)
- **Descrição:** Disparado pelo módulo de Estorno imediatamente após confirmação de estorno no gateway e invalidação de ingressos.
- **Payload:**
```json
{
  "refundId": "ref_55019283",
  "orderId": "ord_88492048",
  "paymentId": "pay_99381203",
  "producerId": "prod_1029",
  "eventId": "evt_4920",
  "amount": 350.00,
  "type": "TOTAL",
  "reason": "DESISTENCIA_ART_49",
  "invalidatedTicketIds": [
    "tkt_9918231",
    "tkt_9918232"
  ],
  "accountingEntryId": "comp_entry_77182",
  "gatewayTransactionId": "gw_ref_0029192",
  "completedAt": "2026-09-20T21:45:00Z"
}
```

---

### 2.3. `com.diskingressos.sac.ticket.created` (Versão 1.0.0)
- **Descrição:** Disparado quando um chamado de SAC é registrado para acompanhamento de um consumidor.
- **Payload:**
```json
{
  "ticketId": "sac_tk_440192",
  "customerId": "cust_1102",
  "orderId": "ord_88492048",
  "category": "DUVIDA_PAGAMENTO",
  "priority": "HIGH",
  "slaDeadline": "2026-09-21T09:45:00Z",
  "channel": "WHATSAPP",
  "assignedTo": "agent_ana_costa",
  "createdAt": "2026-09-20T21:45:00Z"
}
```

---

### 2.4. `com.diskingressos.cart.abandoned` (Versão 1.0.0)
- **Descrição:** Disparado quando uma sessão de compra com dados de contato é interrompida antes da liquidação.
- **Payload:**
```json
{
  "cartId": "cart_3301928",
  "producerId": "prod_1029",
  "eventId": "evt_4920",
  "customer": {
    "name": "Carlos Eduardo",
    "email": "carlos.eduardo@exemplo.com",
    "phone": "+5541999998888"
  },
  "cartValue": 250.00,
  "itemCount": 1,
  "abandonedAt": "2026-09-20T21:30:00Z",
  "recoveryUrl": "https://diskingressos.com.br/checkout?recovery=token_xyz123"
}
```

---

## 3. Diretrizes de Evolução de Contratos

- **Compatibilidade Retroativa:** Campos novos devem ser estritamente opcionais (`nullable` ou com valores default).
- **Depreciação Controlada:** Nenhuma versão de payload é descontinuada sem aviso prévio mínimo de 6 meses e coexistência de endpoints.
