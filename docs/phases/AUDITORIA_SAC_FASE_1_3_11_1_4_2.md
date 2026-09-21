# AUDITORIA OBRIGATÓRIA — FASE 1.3.11.1.4.2: ATENDIMENTO SAC

**Data:** 20/09/2026  
**Status:** CONCLUÍDO COM SUCESSO  
**Mapeamento:** SAFESAFF × LIMITLESS × MASTER

---

## 1. Contexto & Regra Fundamental da Fase

> **SAC atende COMPRADORES / PARTICIPANTES.**  
> **SUPORTE EVENTOS atende PRODUTORES / OPERAÇÃO DE EVENTOS.**  
> **NÃO MISTURAR OS DOIS DOMÍNIOS.**

A autoridade funcional do SafeSaff demonstrava clara segregação:
* `src/components/customers/CustomerSearchHubPage.tsx`: Central unificada de busca e CRM operacional de compradores.
* `src/components/customers/CustomerDossierModal.tsx`: Dossiê operacional do cliente sem qualquer uso do termo "360".
* `src/components/tickets/TicketsHubPage.tsx`: Fila operacional de tickets com SLA e histórico de protocolos.
* `src/components/event-support/*`: Sala de guerra, incidentes operacionais de catraca, rede e produtoras.

No MASTER, encontramos a infraestrutura compartilhada:
* `SupportTicket` model em Prisma e `InMemoryPrismaStore`.
* `SearchService` com suporte a normalização e mascaramento LGPD de CPF/e-mail/telefone.
* `CoreDataContext` com pedidos e clientes reais.

---

## 2. Inventário de Recursos Auditados no SAFESAFF

| Recurso SafeSaff | Caminho | Comportamento Observado | Classificação MASTER |
| :--- | :--- | :--- | :--- |
| **Central de Consulta** | `src/components/customers/CustomerSearchHubPage.tsx` | Busca unificada por CPF, nome, e-mail, telefone, pedido | **RECUPERADO** (`SacDashboard.tsx` tab `sac-query-center`) |
| **Dossiê do Cliente** | `src/components/customers/CustomerDossierModal.tsx` | Ficha do comprador com pedidos, ingressos, chamados | **RECUPERADO** (`CustomerDossierModal.tsx` sem "360") |
| **Abertura de Chamado** | `src/components/customers/NewItilCaseModal.tsx` | Protocolo com canal, prioridade, SLA, fila | **RECUPERADO** (`NewSacTicketModal.tsx`) |
| **Reemissão / Transferência** | `src/components/tickets/ReissueTicketModal.tsx` | Reemissão e revogação de QR Code | **INTEGRADO** via OrderDossierModal & Credential Engine |
| **Fila Operacional** | `src/components/tickets/TicketsHubPage.tsx` | Lista densa com SLA restante e pausa | **RECUPERADO** (`SacDashboard.tsx` tab `sac-queue`) |

---

## 3. Inventário Técnico no MASTER

1. **Backend:**
   * `backend/src/modules/sac/sac.service.ts`: Implementado com gerência de tickets, SLA, mensagens segregadas e handoff de estorno.
   * `backend/src/modules/sac/sac.controller.ts`: Endpoints protegidos com RBAC granular (`sac.consulta.acessar`, `sac.ticket.criar`).
   * `backend/src/modules/sac/sac.routes.ts`: Roteador Express registrado em `backend/src/routes/index.ts` sob `/sac`.
   * `backend/src/modules/search/data-mask.service.ts`: Mascaramento padrão de CPF (`***.***.***-XX`) e auditoria ao revelar.

2. **Frontend:**
   * `apps/web/src/modules/sac/SacDashboard.tsx`: 4 abas operacionais (`sac-dashboard`, `sac-query-center`, `sac-queue`, `sac-customers`).
   * `apps/web/src/modules/sac/CustomerDossierModal.tsx`: Visual executivo Limitless com 6 abas factuais.
   * `apps/web/src/modules/sac/NewSacTicketModal.tsx`: Modal para abertura rápida de atendimento.
   * `apps/web/src/modules/sac/SacTicketDetailModal.tsx`: Thread com mensagem do cliente, resposta do atendente e nota interna privada.
