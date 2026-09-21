# MATRIZ DE ROTAS & TELAS — SAC

**Fase:** 1.3.11.1.4.2 — Recuperação Completa do Atendimento SAC  
**Data:** 20/09/2026

---

## 1. Navegação Operacional no Frontend

| Identificador de Subitem | Título em Português | Propósito & Conteúdo | Componente Responsável |
| :--- | :--- | :--- | :--- |
| `sac-dashboard` | **Visão Geral** | Métricas operacionais em tempo real, resumo de filas e chamados recentes | `SacDashboard.tsx` |
| `sac-query-center` | **Central de Consulta** | Campo unificado de busca, listagem rápida e acionamento de fichas de clientes/pedidos | `SacDashboard.tsx` + `CustomerDossierModal.tsx` |
| `sac-queue` | **Fila de Atendimento** | Mesa de trabalho do atendente, filtros por fila/canal/status e atendimento | `SacDashboard.tsx` + `SacTicketDetailModal.tsx` |
| `sac-customers` | **Clientes & Ingressos** | Diretório geral de compradores e credenciais vinculadas | `SacDashboard.tsx` |

---

## 2. Modais e Drawers de Detalhe

* `CustomerDossierModal.tsx`: Ficha consolidada do cliente (Abas: Resumo, Pedidos, Ingressos, Atendimentos, Estornos, Linha do Tempo).
* `NewSacTicketModal.tsx`: Abertura de protocolo com seleção de cliente, pedido, canal, fila e prioridade.
* `SacTicketDetailModal.tsx`: Atendimento interativo com conversa em tempo real, resposta e notas internas.
* `OrderDossierModal.tsx`: Visualização detalhada do pedido comercial consumida diretamente pelo SAC.
