# MATRIZ RBAC & PERMISSÕES — SAC

**Fase:** 1.3.11.1.4.2 — Recuperação Completa do Atendimento SAC  
**Data:** 20/09/2026

---

## 1. Permissões Granulares

| Permissão | Módulo | Descrição do Acesso |
| :--- | :--- | :--- |
| `sac.consulta.acessar` | SAC | Acesso à Central de Consulta e dashboard básico do SAC |
| `sac.cliente.visualizar` | SAC | Visualização da ficha e dados cadastrais do comprador |
| `sac.pedido.visualizar` | SAC / Comercial | Visualização de pedidos vinculados ao atendimento |
| `sac.ticket.criar` | SAC | Abertura de novos protocolos e envio de mensagens |
| `sac.ticket.encerrar` | SAC | Alteração de status e encerramento de chamados |
| `sac.voucher.reenviar` | SAC | Disparo de reenvio de credencial e voucher para o e-mail do titular |
| `estorno.solicitacao.criar` | Estorno / SAC | Permissão para abrir solicitação de estorno a partir do SAC |
| `cliente.documento.visualizar_completo` | Segurança / LGPD | Permissão restrita para revelar CPF desmascarado (auditada) |

---

## 2. Perfis de Usuário & Acessos no SAC

* **SUPER ADMIN:** Acesso total universal, sem restrição de produtor/evento.
* **ATENDENTE SAC:** Acesso completo a consultas, abertura de tickets, mensagens e solicitação de estorno.
* **PRODUTOR:** Acesso restrito a compradores e pedidos vinculados aos seus próprios eventos.
