# MATRIZ DE APIS — ENDPOINTS SAC

**Fase:** 1.3.11.1.4.2 — Recuperação Completa do Atendimento SAC  
**Data:** 20/09/2026

---

## 1. Endpoints Registrados sob `/api/sac`

| Método | Endpoint | Permissão Obrigatória | Descrição do Comportamento |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/sac/metrics` | `sac.consulta.acessar` | Retorna métricas factuais (total, abertos, em andamento, SLA estourado, por canal e fila) |
| `GET` | `/api/sac/query` | `sac.consulta.acessar` | Busca unificada na Central de Consulta com normalização e mascaramento LGPD |
| `GET` | `/api/sac/tickets` | `sac.consulta.acessar` | Listagem paginada de atendimentos com filtros (status, fila, canal, agente) |
| `GET` | `/api/sac/tickets/:id` | `sac.consulta.acessar` | Detalhes do atendimento com histórico de mensagens |
| `POST` | `/api/sac/tickets` | `sac.ticket.criar` | Criação de novo atendimento com cálculo de SLA e código `SAC-2026-XXXXXX` |
| `POST` | `/api/sac/tickets/:id/messages` | `sac.ticket.criar` | Adiciona resposta ao cliente ou nota interna privada |
| `PATCH` | `/api/sac/tickets/:id/status` | `sac.ticket.encerrar` | Transiciona status (pausa SLA se `WAITING_CUSTOMER`, encerra se `RESOLVED`) |
| `POST` | `/api/sac/refund-requests` | `estorno.solicitacao.criar` | Inicia solicitação de estorno e encaminha para a fila de análise de Estorno |
