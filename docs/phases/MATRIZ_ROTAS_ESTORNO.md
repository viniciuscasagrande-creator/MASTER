# Matriz de Rotas e Navegação de Estorno

**Fase:** 1.3.11.1.4.3 — Recuperação Completa de ESTORNO  
**Data:** 20/09/2026  
**Status:** 100% Homologado e Sincronizado  
**Localização:** `docs/phases/MATRIZ_ROTAS_ESTORNO.md`

---

## 1. Mapeamento de Rotas no Frontend

| Sub-item / Rota | Identificador | Título da Visualização | Permissão Requerida | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `/refunds` | `refunds-dashboard` | Centro de Controle de Estornos | `estorno.solicitacao.visualizar` | Painel geral de controle com KPIs, avisos e visão consolidada |
| `/refunds/requests` | `refunds-requests` | Central de Solicitações | `estorno.solicitacao.visualizar` | Tabela densa corporativa com busca por pedido, comprador, status e filtros |
| `/refunds/approvals`| `refunds-approvals`| Fila de Aprovação | `estorno.solicitacao.aprovar` | Fila exclusiva de solicitações aguardando alçada com Maker-Checker |
| `/refunds/chargebacks`| `refunds-chargebacks`| Disputas & Chargebacks | `estorno.chargeback.gerenciar` | Painel de monitoramento de disputas adquirentes e regras antifraude |

---

## 2. Posição na Barra Lateral (`ModuleSidebar.tsx`)

Na seção **OPERAÇÃO**, imediatamente após o Atendimento SAC:

```text
OPERAÇÃO
├── Eventos
├── Comercial
├── Suporte Eventos
├── Atendimento SAC
└── Estorno
    ├── Painel de Estornos
    ├── Fila de Aprovação (Badge com pendências)
    └── Chargebacks
```

---

## 3. Integração com Contexto de Produtor e Evento (`DiskContext`)

- Quando um produtor estiver selecionado na barra global (`activeProducer`):
  - A lista de estornos é automaticamente filtrada para exibir exclusivamente os registros daquele produtor.
- Quando um evento estiver selecionado (`activeEvent`):
  - Apenas estornos vinculados às sessões e pedidos daquele evento são exibidos.
