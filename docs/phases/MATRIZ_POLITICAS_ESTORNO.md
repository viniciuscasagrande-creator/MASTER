# Matriz de Políticas e Regras de Negócio de Estorno

**Fase:** 1.3.11.1.4.3 — Recuperação Completa de ESTORNO  
**Data:** 20/09/2026  
**Status:** 100% Homologado e Sincronizado  
**Localização:** `docs/phases/MATRIZ_POLITICAS_ESTORNO.md`

---

## 1. Catálogo Formal de Motivos de Estorno

| Código do Motivo | Descrição Legal / Operacional | Prazo / Condição | Validações Requeridas |
| :--- | :--- | :--- | :--- |
| `CDC_7_DAYS` | Direito de Arrependimento (Art. 49 do Código de Defesa do Consumidor) | Até 7 dias corridos após a compra | Ingressos não validados na catraca do evento |
| `EVENT_CANCELLED` | Cancelamento Oficial do Evento pelo Produtor | A partir do comunicado público | Devolução integral do valor dos ingressos |
| `EVENT_POSTPONED` | Adiamento com alteração substancial de data ou local | Conforme prazo definido no termo do evento | Cliente manifesta discordância da nova data |
| `OPERATIONAL_ERROR` | Erro operacional de cobrança ou duplicidade | Imediato à constatação | Verificação de duplicidade de transação bancária |
| `MEDICAL_REASON` | Impossibilidade médica comprovada | Até 24h antes do início do evento | Anexação e conferência de atestado médico |
| `FRAUD_CHARGEBACK_PREVENT`| Prevenção de chargeback ou suspeita de fraude | Imediato | Análise de risco antifraude |
| `OTHER` | Outro motivo específico de exceção | Sob avaliação gerencial | Justificativa circunstanciada obrigatória |

---

## 2. Regras de Saldo Remanescente e Elegibilidade

1. **Limite Máximo Reembolsável:**
   $$\text{Saldo Elegível} = \text{Valor Total do Pedido} - \sum \text{Estornos Anteriores Ativos}$$
   - Qualquer solicitação com valor superior ao saldo elegível é bloqueada em tempo de compilação/execução (`ValidationError`).
2. **Estorno Parcial vs Total:**
   - **Estorno Total:** Cancela todos os ingressos do pedido e altera o status do pedido comercial para `REFUNDED`.
   - **Estorno Parcial:** Permite selecionar ingressos específicos do pedido. O status do pedido comercial torna-se `PARTIALLY_REFUNDED`.
3. **Bloqueio por Uso em Catraca:**
   - Ingressos com `checkInAt != null` (já validados nas catracas físicas) NÃO podem ser selecionados para estorno sem override de auditoria.
