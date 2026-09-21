# Contratos de API do Módulo Financeiro — Disk Interno PDT
## Fase 1.3.11.1.4.4

### 1. Endpoints de Saldos e Resumos
- `GET /api/finance/summary`
  - Query: `producerId`, `eventId`, `timeRange`
  - Permissão: `financeiro.saldo.visualizar`
  - Resposta: `{ success: true, data: ProducerBalanceSummary }`
- `GET /api/finance/event-balances`
  - Query: `producerId`
  - Permissão: `financeiro.saldo.visualizar`
  - Resposta: `{ success: true, data: EventBalanceItem[] }`
- `GET /api/finance/statement`
  - Query: `producerId`, `eventId`, `timeRange`
  - Permissão: `financeiro.saldo.visualizar`
  - Resposta: `{ success: true, total: number, data: FinancialTransaction[] }`

### 2. Endpoints de Transferências Entre Eventos
- `GET /api/finance/transfers`
  - Query: `producerId`
  - Permissão: `financeiro.saldo.visualizar` ou `financeiro.transferencia.criar`
  - Resposta: `{ success: true, total: number, data: EventTransfer[] }`
- `POST /api/finance/transfers`
  - Body: `{ producerId, fromEventId, toEventId, amount, reason }`
  - Permissão: `financeiro.transferencia.criar`
  - Resposta: `{ success: true, message: string, data: EventTransfer }`
- `POST /api/finance/transfers/:id/approve`
  - Headers: `x-step-up-token` (se valor > 50k)
  - Permissão: `financeiro.transferencia.aprovar`
  - Resposta: `{ success: true, message: string, data: EventTransfer }`
- `POST /api/finance/transfers/:id/revert`
  - Body: `{ reason: string }`
  - Permissão: `financeiro.transferencia.aprovar`
  - Resposta: `{ success: true, message: string, data: EventTransfer }`

### 3. Endpoints de Contas a Pagar e Receber
- `GET /api/finance/receivables`
  - Permissão: `financeiro.saldo.visualizar`
  - Resposta: `{ success: true, total: number, data: ReceivableRecord[] }`
- `GET /api/finance/payables`
  - Permissão: `financeiro.saldo.visualizar`
  - Resposta: `{ success: true, total: number, data: PayableRecord[] }`
- `POST /api/finance/payables`
  - Body: `{ producerId, eventId?, beneficiary, category, costCenter, amount, dueDate, paymentMethod, notes? }`
  - Permissão: `financeiro.transferencia.criar`
  - Resposta: `{ success: true, data: PayableRecord }`
- `POST /api/finance/payables/:id/pay`
  - Body: `{ bankAuth: string }`
  - Permissão: `financeiro.transferencia.aprovar`
  - Resposta: `{ success: true, data: PayableRecord }`

### 4. Endpoints de Tesouraria e DRE
- `GET /api/finance/bank-accounts`: Lista contas homologadas do produtor.
- `GET /api/finance/cash-flow`: Fluxo de caixa com realizado vs projetado.
- `GET /api/finance/management-dre`: DRE analítico com margem de contribuição.
- `GET /api/finance/reconciliation`: Conciliação com adquirentes (Cielo, Rede, PIX).
- `GET /api/finance/payouts` e sub-rotas `/payouts/schedule`, `/payouts/:id/approve`, `/payouts/:id/process`, `/payouts/:id/reject`.
