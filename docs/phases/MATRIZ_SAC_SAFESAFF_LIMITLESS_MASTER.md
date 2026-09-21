# MATRIZ TRIPLA — SAC: SAFESAFF × LIMITLESS × MASTER

**Fase:** 1.3.11.1.4.2 — Recuperação Completa do Atendimento SAC  
**Data:** 20/09/2026

---

## 1. Princípio da Tripla Autoridade

* **SAFESAFF (Funcionalidade):** Referência de fluxos operacionais de atendimento a compradores, protocolos, filas e normalização de consultas.
* **LIMITLESS (UI/UX):** Design system corporativo, workspace claro, sidebar dark, tabelas densas, abas limpas, modais e cards sem jQuery ou Bootstrap legado.
* **MASTER (Base Técnica):** Monorepo React 18, TypeScript, Tailwind CSS, Prisma e Node.js Real.

---

## 2. Matriz Comparativa Detalhada

| Dimensão | SafeSaff (Referência Funcional) | Limitless (Referência UI/UX) | MASTER (Implementação Recuperada) |
| :--- | :--- | :--- | :--- |
| **Busca de Comprador** | Campo universal com normalização de CPF/Telefone | Search input com badges e filtros compactos | `SacDashboard.tsx` (`sac-query-center`) + `QueryParserService` |
| **Ficha do Comprador** | `CustomerDossierModal.tsx` com tabs | Sheet / modal com header escuro e tabs claras | `CustomerDossierModal.tsx` (sem "360", 6 abas factuais) |
| **Abertura de Protocolo** | `NewItilCaseModal.tsx` com fila e SLA | Form modal com selects estilizados e badges | `NewSacTicketModal.tsx` com SLA automático (30m a 2h) |
| **Thread de Conversa** | Lista de notas e mensagens | Chat timeline com cores de bolha distintas | `SacTicketDetailModal.tsx` (Cliente vs Operador vs Nota Interna) |
| **Pausa de SLA** | Estado "Aguardando Cliente" congela SLA | Tag de pausa com ícone | `slaPaused: true` quando status for `WAITING_CUSTOMER` |
| **Solicitar Estorno** | Botão que encaminha para Refund | Botão de perigo secundário com confirmação | Handoff para `RefundService` com status `PENDING_REVIEW` |
| **LGPD & Proteção** | Mascaramento de dados e auditoria | Texto com asteriscos e botão "Revelar" | CPF mascarado `***.***.***-XX` com auditoria ao revelar |
