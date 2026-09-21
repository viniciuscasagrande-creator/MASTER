# MATRIZ TICKET CORE — SAC × SUPORTE EVENTOS

**Fase:** 1.3.11.1.4.2 — Recuperação Completa do Atendimento SAC  
**Data:** 20/09/2026

---

## 1. Princípio do Motor Único (Zero Duplicação de Engines)

Em vez de criar dois motores de tickets separados (`SacTicketEngine` e `SupportTicketEngine`), o Disk Interno utiliza uma infraestrutura unificada parametrizada por domínio:

```text
                     TICKET CORE UNIFICADO
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
      DOMÍNIO: SAC                     DOMÍNIO: EVENT_SUPPORT
            │                                     │
      Consumidor Final                      Produtora / Evento
      Protocolos (SAC-2026-X)               Incidentes (INC-2026-X)
      Canais: WhatsApp, E-mail, Chat        Canais: Sala de Guerra, Interno
      Fila: Pedidos, Ingressos, Estorno     Fila: Catracas, Lotes, Rede
      SLA: Pausável por "Aguardando Cliente" SLA: Rígido por criticidade técnica
```

---

## 2. Tipagem das Mensagens e Segregação

Toda mensagem dentro do Ticket Core é estritamente classificada:

| Tipo | Descrição | Visibilidade ao Comprador |
| :--- | :--- | :--- |
| `CUSTOMER` | Mensagem enviada pelo consumidor | Sim |
| `AGENT` | Resposta oficial do operador | Sim |
| `INTERNAL_NOTE` | Anotação privada entre operadores e supervisão | **NÃO** (Exclusiva para equipe interna) |
| `SYSTEM_EVENT` | Registro automático de mudança de status ou handoff | Sim (em formato de pílula informativa) |
