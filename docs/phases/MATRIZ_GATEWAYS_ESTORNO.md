# Matriz de Integração com Gateways e Adquirentes para Estorno

**Fase:** 1.3.11.1.4.3 — Recuperação Completa de ESTORNO  
**Data:** 20/09/2026  
**Status:** 100% Homologado e Sincronizado  
**Localização:** `docs/phases/MATRIZ_GATEWAYS_ESTORNO.md`

---

## 1. Adaptadores de Gateway Suportados

| Provedor / Gateway | Métodos de Pagamento | Modelo de Estorno | Tempo Médio de Confirmação | Idempotência Suportada |
| :--- | :--- | :--- | :--- | :---: |
| **PIX (Banco Central / SPI)** | PIX Instantâneo | Devolução Direta via Chave EndToEndId | < 5 segundos | ✅ Sim (`idempotencyKey`) |
| **Cielo 3.0** | Cartão de Crédito / Débito | Void (D0) ou Refund Diferido (D+n) | Imediato (Void) / 24-72h (Fatura) | ✅ Sim (`MerchantOrderId` / Key) |
| **Stone / Pagar.me** | Cartão de Crédito / PIX | Cancelamento Parcial ou Total | Imediato a D+1 | ✅ Sim (`idempotency_key`) |
| **Rede (e.Rede)** | Cartão de Crédito | Cancelamento total ou parcial | Imediato a D+2 | ✅ Sim (`idempotencyKey`) |

---

## 2. Tratamento de Timeouts e Inconsistências de Rede

1. **Estado `PROCESSING_UNKNOWN`:**
   - Em caso de timeout de socket com a adquirente, o estorno NÃO é marcado como `FAILED` nem retentado cegamente para evitar duplo débito.
   - O estado permanece em `PROCESSING` com chave de idempotência travada.
   - Uma tarefa agendada de reconciliação consulta a adquirente pelo código da transação original antes de qualquer nova tentativa.
2. **Registro do `gatewayRefundId`:**
   - O retorno de sucesso do provedor grava imediatamente o ID formal de cancelamento gerado pela adquirente no registro de estorno.
3. **Cascata Reversa Desencadeada:**
   - Somente após a confirmação do provedor bancário os ingressos são desativados no controle de acesso e o pedido comercial é marcado como estornado.
