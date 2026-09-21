# Matriz de Integrações e Cascata Reversa do Estorno

**Fase:** 1.3.11.1.4.3 — Recuperação Completa de ESTORNO  
**Data:** 20/09/2026  
**Status:** 100% Homologado e Sincronizado  
**Localização:** `docs/phases/MATRIZ_INTEGRACOES_ESTORNO.md`

---

## 1. Módulos Conectados na Cascata Reversa

Ao concluir a execução de um estorno no provedor de pagamento, o motor de estornos dispara automaticamente as seguintes ações em cascata:

| Módulo Alvo | Ação Disparada | Efeito no Sistema |
| :--- | :--- | :--- |
| **Catracas / Acesso** | `invalidateTickets(ticketIds)` | QR Codes dos ingressos estornados são marcados como `CANCELLED_REFUNDED`, bloqueando imediatamente a entrada no evento. |
| **Comercial (Pedidos)**| `updateOrderStatus(orderId)` | O pedido é atualizado para `REFUNDED` (estorno total) ou `PARTIALLY_REFUNDED` (estorno parcial) com registro na timeline de compras. |
| **Financeiro / Split** | `reverseSplit(amount)` | O split contratual entre Disk Ingressos e Produtor é recalculado de forma proporcional, debitando a conta gráfica do produtor. |
| **Contabilidade / Ledger**| `emitCompensatingEntry()`| Lançamento de contrapartida compensatória no diário contábil, sem alterar registros ou saldos históricos prévios. |
| **Atendimento SAC** | `notifyTicketResolved(ticketId)`| Se a solicitação originou-se de um ticket SAC, é adicionada uma nota de sistema informando a liquidação da devolução. |
| **Auditoria Core** | `AuditService.log()` | Registro do hash de auditoria, IP, usuário aprovador, provedor e ID bancário para conformidade legal. |
