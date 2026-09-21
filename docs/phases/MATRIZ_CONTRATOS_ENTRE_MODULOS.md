# Matriz de Contratos entre Módulos — Fase 1.3.11.1.5

## 1. Visão Geral dos Contratos

Todos os módulos interagem através de contratos fortemente tipados em TypeScript (`backend/src/modules/` e `packages/shared/`). Não são permitidos payloads `any` soltos ou parâmetros sem validação Zod/class-validator.

---

## 2. Contratos Principais de Integração

### 2.1. Contrato SAC → Estorno (Solicitação de Reembolso)
- **Origem:** Atendimento SAC (Central de Consulta ou Atendimento ao Comprador)
- **Destino:** Módulo Estorno (`POST /api/refunds/requests`)
- **Payload de Requisição:**
```typescript
interface CreateRefundInput {
  orderId: string;
  reason: 'DESISTENCIA_ART_49' | 'CANCELAMENTO_EVENTO' | 'PROBLEMA_TECNICO' | 'DUPLICIDADE_PAGAMENTO' | 'OUTROS';
  items?: Array<{
    ticketId: string;
    amount: number;
  }>;
  requestedBy: string; // ID do agente ou solicitante
  notes?: string;
  bankDetails?: {
    pixKey?: string;
    bankCode?: string;
    agency?: string;
    accountNumber?: string;
    accountType?: 'CORRENTE' | 'POUPANCA';
    documentNumber?: string;
  };
}
```
- **Resposta Sucesso (201 Created):**
```typescript
interface RefundResponse {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'FAILED';
  reason: string;
  requiresSecondApproval: boolean;
  createdAt: string;
}
```

---

### 2.2. Contrato Estorno → Financeiro (Execução de Devolução no Gateway)
- **Origem:** Módulo Estorno (`RefundService.executeRefund`)
- **Destino:** Módulo Financeiro (`PaymentService.executeGatewayRefund`)
- **Payload Interno:**
```typescript
interface GatewayRefundRequest {
  paymentId: string;
  amount: number;
  idempotencyKey: string;
  gatewayTransactionId: string;
  refundId: string;
}
```
- **Resposta Esperada:**
```typescript
interface GatewayRefundResult {
  success: boolean;
  gatewayRefundId: string;
  refundedAt: string;
  rawGatewayResponse?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
}
```

---

### 2.3. Contrato Estorno → Contabilidade (Partida Dobrada Compensatória)
- **Origem:** Módulo Estorno (após confirmação de estorno no gateway)
- **Destino:** Módulo Contabilidade (`AccountingService.recordCompensatingEntry`)
- **Payload Interno:**
```typescript
interface CompensatingEntryInput {
  entityType: 'REFUND';
  entityId: string;
  orderId: string;
  debitAccount: string;  // Ex: "4.1.01 - Estornos Concedidos / Dedução de Receita"
  creditAccount: string; // Ex: "1.1.01 - Banco / Disponibilidades"
  amount: number;
  description: string;
  metadata: {
    paymentMethod: string;
    gatewayTransactionId: string;
    processedBy: string;
  };
}
```

---

### 2.4. Contrato Remarketing → Comercial (Conversão de Carrinho Recuperado)
- **Origem:** Módulo Remarketing (clique no link de recuperação de carrinho)
- **Destino:** Módulo Comercial (`POST /api/commercial/orders/checkout-from-cart`)
- **Payload:**
```typescript
interface RecoverCartInput {
  cartId: string;
  recoveryToken: string;
  customerData: {
    name: string;
    email: string;
    document: string;
  };
  paymentMethod: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
}
```

---

## 3. Padrão Global de Erro em Contratos

Todas as rotas de API do Disk Interno retornam o envelope de erro canônico em caso de falha:

```json
{
  "success": false,
  "error": {
    "code": "ERR_VALIDATION_FAILED | ERR_NOT_FOUND | ERR_UNAUTHORIZED | ERR_FORBIDDEN | ERR_IDEMPOTENCY_CONFLICT | ERR_BUSINESS_RULE",
    "message": "Mensagem detalhada e amigável em português (pt-BR)",
    "details": []
  }
}
```
