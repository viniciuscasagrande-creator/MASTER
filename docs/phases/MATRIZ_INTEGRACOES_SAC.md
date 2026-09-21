# MATRIZ DE INTEGRAÇÕES — SAC COM DEMAIS MÓDULOS

**Fase:** 1.3.11.1.4.2 — Recuperação Completa do Atendimento SAC  
**Data:** 20/09/2026

---

## 1. Fronteiras Inter-Módulos

```text
       ┌──────────────┐
       │   COMERCIAL  │ ──(Consulta Pedidos, Itens, Vendas)──┐
       └──────────────┘                                      │
                                                             ▼
       ┌──────────────┐                               ┌─────────────┐
       │   EVENTOS    │ ──(Consulta Sessões, Ingressos)─►│     SAC     │
       └──────────────┘                               └─────────────┘
                                                             │
       ┌──────────────┐                                      │
       │   ESTORNO    │ ◄──(Handoff: Solicitação de Estorno)─┘
       └──────────────┘
```

---

## 2. Direitos de Propriedade e Acesso

| Módulo Alvo | O que o SAC pode fazer | O que o SAC NÃO pode fazer |
| :--- | :--- | :--- |
| **Comercial** | Consultar pedidos, status, itens e abrir `OrderDossierModal` | Alterar preços, cancelar pedidos ou conceder descontos |
| **Eventos** | Consultar ingressos, validar check-in e sessões | Alterar capacidade de lotes ou trocar mapa do evento |
| **Estorno** | Criar solicitação de estorno e acompanhar status | Executar estorno financeiro ou movimentar dinheiro |
| **Financeiro** | Consultar forma de pagamento e status da transação | Acessar contas do produtor, repasses ou conciliação |
| **Marketing** | Consultar preferências de comunicação do cliente | Disparar campanhas ou gerenciar anúncios |
