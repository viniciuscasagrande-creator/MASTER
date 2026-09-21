# ARQUITETURA DO SAC RECUPERADO

**Fase:** 1.3.11.1.4.2 — Recuperação Completa do Atendimento SAC  
**Data:** 20/09/2026

---

## 1. Topologia de Domínio

```text
COMPRADOR / PARTICIPANTE
          │
          ▼
   ATENDIMENTO SAC
          │
          ├── Central de Consulta (Busca Normalizada: CPF, Nome, E-mail, Pedido, Ingresso)
          │         │
          │         ▼
          │   ┌─────────────┬──────────────┬─────────────┐
          │   │             │              │             │
          │   ▼             ▼              ▼             ▼
          │ CLIENTE       PEDIDO        INGRESSO      ESTORNO
          │ (SAC/Customer) (Comercial)   (Eventos)    (Estorno)
          │
          ├── Atendimentos & Filas (Ticket Core Compartilhado)
          │         │
          │         ▼
          │   Conversa Segregada:
          │     • Mensagem do Comprador (CUSTOMER)
          │     • Resposta do Operador (AGENT)
          │     • Nota Interna Privada (INTERNAL_NOTE)
          │     • Evento do Sistema (SYSTEM_EVENT)
          │
          └── Handoff Operacional de Estorno
                    │
                    ▼
              Refund Core (Criação de solicitação com status PENDING_REVIEW)
              * SAC NUNCA movimenta dinheiro diretamente *
```

---

## 2. Segregação Absoluta: SAC × Suporte Eventos

| Aspecto | Atendimento SAC | Suporte Eventos |
| :--- | :--- | :--- |
| **Público Atendido** | Compradores e participantes finais | Produtoras, organizadores e equipe de bilheteria |
| **Canal Primário** | WhatsApp, E-mail, Chat, Telefone do Consumidor | Sala de Guerra, rádio, canal direto da produtora |
| **Escopo de Ação** | Localizar pedido, reenviar voucher, tirar dúvidas | Resolver catraca travada, lote incorreto, incidentes de rede |
| **Domínio do Ticket** | `domain: 'SAC'` | `domain: 'EVENT_SUPPORT'` |
| **Handoff Financeiro** | Solicita estorno por arrependimento/duplicidade | Solicita estorno em lote por cancelamento de evento |
