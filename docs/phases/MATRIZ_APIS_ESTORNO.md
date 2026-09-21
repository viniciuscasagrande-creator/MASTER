# Matriz de APIs e Endpoints REST de Estorno

**Fase:** 1.3.11.1.4.3 — Recuperação Completa de ESTORNO  
**Data:** 20/09/2026  
**Status:** 100% Homologado e Sincronizado  
**Localização:** `docs/phases/MATRIZ_APIS_ESTORNO.md`

---

## 1. Endpoints do Módulo `/refunds`

Todos os endpoints operam sob o prefixo `/refunds` e exigem autenticação via Bearer Token JWT:

| Método | Endpoint | Permissões Mínimas | Descrição / Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/refunds/metrics` | `estorno.solicitacao.visualizar` | Retorna métricas factuais consolidadas (pendentes, concluídos, valor estornado) |
| `GET` | `/refunds/eligibility/:orderId` | `estorno.solicitacao.criar` | Avalia elegibilidade factual de um pedido antes de registrar solicitação |
| `GET` | `/refunds` | `estorno.solicitacao.visualizar` | Lista solicitações com suporte a filtros (`status`, `producerId`, `eventId`, `search`) |
| `GET` | `/refunds/:id` | `estorno.solicitacao.visualizar` | Retorna dados aprofundados da solicitação, alçadas e plano de reversão |
| `POST` | `/refunds` | `estorno.solicitacao.criar` | Cria nova solicitação de estorno (`CreateRefundRequestDTO`) |
| `POST` | `/refunds/:id/review` | `estorno.solicitacao.criar`, `estorno.solicitacao.aprovar` | Atualiza triagem técnica (`START_REVIEW`, `REQUEST_INFO`, `SEND_TO_APPROVAL`) |
| `POST` | `/refunds/:id/approve` | `estorno.solicitacao.aprovar` | Aprova alçada com validação de Maker-Checker compulsória |
| `POST` | `/refunds/:id/reject` | `estorno.solicitacao.aprovar` | Recusa solicitação de estorno com justificativa obrigatória |
| `POST` | `/refunds/:id/process` | `estorno.solicitacao.executar` | Envia ao gateway adquirente com chave de idempotência e executa cascata |
| `POST` | `/refunds/:id/retry` | `estorno.solicitacao.executar` | Reprocessa estorno com falha prévia |
| `POST` | `/refunds/:id/cancel` | `estorno.solicitacao.criar` | Cancela solicitação antes da aprovação |

---

## 2. Contratos de Dados (DTOs Principais)

### 2.1 Requisição de Criação (`POST /refunds`)
```json
{
  "orderId": "ord-952114",
  "kind": "PARTIAL",
  "amount": 560.00,
  "reason": "CDC_7_DAYS",
  "reasonDescription": "Cliente exerceu direito de arrependimento em até 7 dias para 2 ingressos.",
  "ticketIds": ["tkt-1", "tkt-2"],
  "ticketId": "sac-1001"
}
```

### 2.2 Resposta de Elegibilidade (`GET /refunds/eligibility/:orderId`)
```json
{
  "success": true,
  "eligibility": {
    "eligible": true,
    "riskLevel": "LOW",
    "requiredApprovals": 1,
    "orderTotalAmount": 1120.00,
    "previouslyRefundedAmount": 0.00,
    "maxRefundableAmount": 1120.00,
    "requestedAmount": 1120.00,
    "checks": [
      { "key": "order_status", "label": "Status do Pedido Comercial", "status": "OK", "detail": "Pedido confirmado e apto para estorno." },
      { "key": "amount_limit", "label": "Limite do Saldo Remanescente", "status": "OK", "detail": "Dentro do saldo disponível." },
      { "key": "tickets_gate", "label": "Controle de Catraca / Check-in", "status": "OK", "detail": "Ingressos livres de check-in." }
    ],
    "blockingReasons": []
  }
}
```
