# Matriz RBAC Definitiva — Fase 1.3.11.1.5

## 1. Papéis Oficiais (Roles) do Sistema

| Papel (Role) | Identificador | Escopo Operacional Principal |
|---|---|---|
| **Administrador Master** | `MASTER_ADMIN` | Acesso global irrestrito a todas as organizações e configurações. |
| **Administrador Produtor**| `PRODUCER_ADMIN` | Gestão completa dos eventos, vendas, finanças e equipe de sua organização. |
| **Operador de Eventos** | `PRODUCER_OPERATOR` | Operação de portaria, credenciamento e acompanhamento de sessões. |
| **Agente SAC** | `SAC_AGENT` | Consulta de compradores, abertura de chamados e solicitação de estorno. |
| **Supervisor SAC** | `SAC_SUPERVISOR` | Gestão da fila de chamados, auditoria e primeira aprovação de estornos. |
| **Operador Financeiro** | `FINANCIAL_OPERATOR`| Análise de conciliação bancária e revisão de solicitações de estorno. |
| **Supervisor Financeiro** | `FINANCIAL_SUPERVISOR`| Execução de repasses bancários e segunda aprovação de estornos de alto valor. |
| **Gestor de Marketing** | `MARKETING_MANAGER` | Gestão de pixels, campanhas e réguas de remarketing. |

---

## 2. Matriz de Permissões Granulares por Papel

| Módulo / Recurso | Permissão Canônica | MASTER_ADMIN | PRODUCER_ADMIN | SAC_AGENT | SAC_SUPERVISOR | FINANCIAL_SUPERVISOR | MARKETING_MANAGER |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Eventos** | `eventos.visualizar` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | `eventos.criar` / `editar` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Comercial** | `comercial.pedidos.visualizar` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| | `comercial.pedidos.criar` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **SAC** | `sac.consulta.executar` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| | `sac.atendimento.criar` / `editar` | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Estorno** | `estorno.visualizar` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| | `estorno.solicitar` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| | `estorno.aprovar` | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| | `estorno.solicitacao.executar` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Financeiro**| `financeiro.visualizar` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| | `financeiro.repasses.gerenciar`| ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Contabilidade**| `contabilidade.visualizar` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Marketing** | `marketing.visualizar` / `gerenciar`| ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Remarketing**| `remarketing.visualizar` / `gerenciar`| ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 3. Segregação de Funções e Aprovação Dupla (Maker-Checker)

Para cumprir normas de compliance financeiro e auditoria:
1. **Regra de Auto-Aprovação:** Um agente não pode aprovar um estorno que ele próprio solicitou (`requestedBy !== approvedBy`).
2. **Dupla Aprovação (Maker-Checker):** Estornos acima de R$ 500,00 exigem obrigatoriamente duas aprovações sequenciais:
   - **1ª Aprovação (Operacional):** Realizada por `SAC_SUPERVISOR`.
   - **2ª Aprovação (Financeira):** Realizada por `FINANCIAL_SUPERVISOR` ou `MASTER_ADMIN`.
3. **Execução Segregada:** Somente quem detém a permissão `estorno.solicitacao.executar` (`FINANCIAL_SUPERVISOR` ou `MASTER_ADMIN`) pode acionar o gateway para desembolso do dinheiro.
