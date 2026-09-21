# Matriz de Observabilidade e Monitoramento — Fase 1.3.11.1.5

## 1. Visão Geral dos Pilares de Observabilidade

Para assegurar disponibilidade, desempenho e detecção proativa de falhas, o Disk Interno adota os três pilares canônicos: **Logs Estruturados**, **Métricas de Negócio/Técnicas** e **Rastreamento Distribuído**.

---

## 2. Padrão de Logs Estruturados (Pino / Winston)

Todos os logs no backend são emitidos em formato JSON estruturado com chave de correlação única (`correlationId` ou `requestId`), permitindo rastrear uma transação desde a chamada inicial do frontend até a query no banco de dados e chamada de webhook externo.

```json
{
  "level": "info",
  "timestamp": "2026-09-20T21:45:00.123Z",
  "correlationId": "req_88492048-2819",
  "tenantId": "prod_1029",
  "userId": "usr_99182",
  "module": "refunds",
  "action": "execute_refund",
  "status": "SUCCESS",
  "durationMs": 142,
  "metadata": {
    "orderId": "ord_88492048",
    "refundAmount": 350.00,
    "gatewayTransactionId": "gw_ref_0029192"
  }
}
```

---

## 3. Endpoints de Health Check e Prontidão

| Endpoint | Tipo de Verificação | Condições de Retorno 200 OK | Ação em caso de 503 |
|---|---|---|---|
| `GET /health/live` | Liveness Probe | API HTTP está online e aceitando conexões | Kubernetes/Orquestrador reinicia o pod |
| `GET /health/ready`| Readiness Probe | Conexão com PostgreSQL ativa e migrações aplicadas | Remove instância do balanceador até conexão restabelecida |
| `GET /health/deep` | Deep Health Check | PostgreSQL OK, Redis OK, Fila de Mensagens OK | Alerta prioritário para equipe de infraestrutura |

---

## 4. Métricas Críticas de Negócio e Alertas

| Métrica Monitorada | Limiar de Atenção (Warning) | Limiar Crítico (Critical) | Ação Operacional |
|---|---|---|---|
| **Taxa de Falha em Pagamentos** | > 3% nos últimos 10 min | > 8% nos últimos 5 min | Verificar status da adquirente / contingência PIX |
| **Erros 5xx na API** | > 1% das requisições | > 3% das requisições | PagerDuty / plantão técnico acionado |
| **Tempo de Resposta P95** | > 800ms | > 2000ms | Escalar pods de backend e verificar índices de banco |
| **Estornos Pendentes > 24h** | > 10 solicitações | > 30 solicitações | Notificar supervisão financeira do SAC |
| **Fila de Webhooks Acumulada** | > 500 mensagens | > 2000 mensagens | Verificar workers e gargalos de banco |
