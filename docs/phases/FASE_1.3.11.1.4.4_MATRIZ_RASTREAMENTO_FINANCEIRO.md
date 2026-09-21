# Matriz de Rastreamento de Requisitos — Módulo Financeiro
## Fase 1.3.11.1.4.4

### 1. Rastreabilidade Requisito -> Implementação Técnica

| ID Requisito | Descrição Operacional | Arquivo Backend | Arquivo Frontend | Rota API / Endpoint | Status de Teste |
|---|---|---|---|---|---|
| **REQ-FIN-01** | Visualização consolidada de saldos factuais (vendas brutas, taxas, repasses, saldo líquido) | `finance.service.ts` (`getProducerSummary`) | `FinanceDashboard.tsx` | `GET /api/finance/summary` | Aprovado (33/33) |
| **REQ-FIN-02** | Segregação estrita de saldos por evento | `finance.service.ts` (`getEventBalances`) | `EventBalancesView.tsx` | `GET /api/finance/event-balances` | Aprovado (33/33) |
| **REQ-FIN-03** | Motor de Transferência Entre Eventos do mesmo produtor | `finance.service.ts` (`createTransfer`) | `TransfersView.tsx`, `NewTransferModal.tsx` | `POST /api/finance/transfers` | Aprovado (33/33) |
| **REQ-FIN-04** | Alçada Maker-Checker para transferências e repasses > R$ 50.000 com Step-Up | `finance.service.ts` (`approveTransfer`, `approvePayout`) | `TransfersView.tsx`, `PayoutDetailModal.tsx` | `POST /api/finance/transfers/:id/approve` | Aprovado (33/33) |
| **REQ-FIN-05** | Reversão compensatória de transferência (proibição de deleção/mutação oculta) | `finance.service.ts` (`revertTransfer`) | `TransfersView.tsx` | `POST /api/finance/transfers/:id/revert` | Aprovado (33/33) |
| **REQ-FIN-06** | Contas a Pagar (provisão de custos técnicos, cachês, fornecedores) | `finance.service.ts` (`listPayables`, `createPayable`, `payPayable`) | `ReceivablesPayablesView.tsx` | `GET /api/finance/payables`, `POST /api/finance/payables` | Aprovado (33/33) |
| **REQ-FIN-07** | Contas a Receber (cartão de crédito, PIX, boleto por adquirente) | `finance.service.ts` (`listReceivables`) | `ReceivablesPayablesView.tsx` | `GET /api/finance/receivables` | Aprovado (33/33) |
| **REQ-FIN-08** | Tesouraria e homologação de contas bancárias e chaves PIX | `finance.service.ts` (`listBankAccounts`) | `TreasuryCashFlowView.tsx` | `GET /api/finance/bank-accounts` | Aprovado (33/33) |
| **REQ-FIN-09** | Fluxo de Caixa (Realizado vs Projetado com saldo acumulado) | `finance.service.ts` (`getCashFlow`) | `TreasuryCashFlowView.tsx` | `GET /api/finance/cash-flow` | Aprovado (33/33) |
| **REQ-FIN-10** | DRE Gerencial analítico por evento e consolidado | `finance.service.ts` (`getManagementDRE`) | `TreasuryCashFlowView.tsx` | `GET /api/finance/management-dre` | Aprovado (33/33) |
| **REQ-FIN-11** | Extrato analítico com todos os lançamentos cronológicos do produtor | `finance.service.ts` (`getAccountStatement`) | `AccountStatementView.tsx` | `GET /api/finance/statement` | Aprovado (33/33) |
| **REQ-FIN-12** | Conciliação contábil com adquirentes e gateways | `finance.service.ts` (`getReconciliationOverview`) | `ReconciliationView.tsx` | `GET /api/finance/reconciliation` | Aprovado (33/33) |
| **REQ-FIN-13** | Segregação de Funções: Solicitante não pode aprovar a própria operação | `finance.service.ts` | Frontend Modal Blocks | Middleware & Service Checks | Aprovado (33/33) |
| **REQ-FIN-14** | Trilha formal de auditoria com username, IP, recurso e payload | `AuditService.log` | Central de Auditoria | `AuditService.ts` | Aprovado (33/33) |
