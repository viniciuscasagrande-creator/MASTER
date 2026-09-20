# Matriz de Domínios e Fronteiras — Fases 1.3.3 e 1.3.4

## 1. Princípio Fundamental de Separação de Clientes

| Módulo | Cliente / Entidade Central | Finalidade | Não Faz (Anti-Padrões Proibidos) |
|---|---|---|---|
| **COMERCIAL** | **PRODUTOR DE EVENTOS (B2B)** e **PROSPECÇÃO (LEAD B2B)** | Relacionamento corporativo, carteira de clientes B2B, taxas de comissão, contratação e pipeline de novos eventos | **NÃO** atende compradores finais de ingressos, **NÃO** consulta participantes, **NÃO** resolve dúvidas de CPF ou pedidos individuais. |
| **ATENDIMENTO SAC** | **COMPRADOR DE INGRESSOS (B2C)** | Resolução de dúvidas de compra, suporte a pedidos, trocas de titularidade, reenvio de vouchers e consulta unificada | **NÃO** faz gestão de carteira de produtores, **NÃO** negocia taxas comerciais de eventos. |
| **CORE EVENTOS** | **EVENTO / SESSÃO / INGRESSO** | Ciclo de vida operacional do evento, catálogo de vendas, lotes, capacidade de setores e inventário | **NÃO** gerencia pipelines comerciais nem registra anotações de negociação contratual. |
| **FINANCEIRO** | **CONTA GRÁFICA / REPASSE** | Conciliação financeira de vendas, adiantamentos, repasses bancários e retenções fiscais | **NÃO** altera status de relacionamento do produtor no Comercial. |
| **CENTRAL DE TRABALHO (TASK ENGINE)** | **TAREFA / PENDÊNCIA (CORE)** | Orquestração central de pendências operacionais para todos os módulos da DiskIngressos | **NÃO** possui regras de negócio específicas embutidas; apenas executa workflows e SLAs configurados. |

---

## 2. Mapa de Entidades e Relacionamentos

```text
       ┌────────────────────────────────────────────────────────┐
       │                   CORE DA APLICAÇÃO                    │
       │                                                        │
       │   PRODUCER (Entidade Mestre do Produtor)                │
       │   ├── id, name, cnpj, email, phone, status             │
       │   │                                                    │
       │   TASK (Central de Trabalho / Task Engine)             │
       │   ├── id, title, module: 'COMERCIAL', dueDate, status  │
       └───────┬──────────────────────────────▲─────────────────┘
               │                              │
               │ Estende (1:1 / 1:N)          │ Sincroniza Próxima Ação
               ▼                              │
┌─────────────────────────────────────────────┴────────────────────────┐
│                          MÓDULO COMERCIAL                            │
│                                                                      │
│  COMMERCIAL_ACCOUNT (Camada Comercial sobre o Produtor)              │
│  ├── producerId (FK para Producer)                                   │
│  ├── commercialStatus: 'ACTIVE' | 'PROSPECT' | 'SUSPENDED' | ...     │
│  ├── commercialClassification: 'ESTRATEGICO' | 'KEY_ACCOUNT' | ...   │
│  ├── segmentId, defaultCommissionRate, notesSummary, version         │
│  │                                                                   │
│  COMMERCIAL_PORTFOLIO_ASSIGNMENT (Carteira Comercial)                │
│  ├── producerId, userId, role: 'PRIMARY' | 'SUPPORT' | 'MANAGER'     │
│  │                                                                   │
│  PRODUCER_CONTACT (Interlocutores Corporativos B2B)                  │
│  ├── producerId, name, roleTitle, email, phone, isPrimary            │
│  │                                                                   │
│  COMMERCIAL_LEAD (Prospecções de Novos Produtores)                   │
│  ├── companyName, cnpj (anti-duplicidade), contactName, status       │
│  └── Operação de Conversão Idempotente -> Cria Producer no Core      │
│  │                                                                   │
│  COMMERCIAL_ACTIVITY (Histórico Auditável de Interações)             │
│  ├── producerId, opportunityId, type, subject, nextActionAt          │
│  │                                                                   │
│  COMMERCIAL_PIPELINE & STAGES (Funil de Vendas B2B)                  │
│  ├── stages: 'OPEN' | 'WON' | 'CLOSED'                               │
│  │                                                                   │
│  COMMERCIAL_OPPORTUNITY (Negociações Comerciais)                     │
│  ├── publicCode: 'OPC-YYYY-XXXXXX', producerId / leadId              │
│  ├── stageId, estimatedValue, expectedDecisionAt, version            │
│  ├── Fechamento WON: não cria eventos de forma automática            │
│  └── Fechamento CLOSED: motivo obrigatório (CloseReason)             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Matriz de Direitos e Permissões Granulares (RBAC)

| Ação | Permissão Requerida | Papel Comercial | Papel Admin | Papel Produtor (Portal B2B) |
|---|---|:---:|:---:|:---:|
| Visualizar Central de Produtores | `comercial.produtores.visualizar` | Sim | Sim | Não (Escopo externo) |
| Editar Parâmetros da Conta Comercial | `comercial.produtores.editar` | Sim | Sim | Não |
| Gerenciar Contatos B2B da Produtora | `comercial.produtores.editar` | Sim | Sim | Apenas dados próprios |
| Acessar Minha Carteira Comercial | `comercial.carteira.visualizar` | Sim | Sim | Não |
| Atribuir / Transferir Carteira | `comercial.carteira.atribuir` | Apenas Manager | Sim | Não |
| Visualizar Prospecções (Leads) | `comercial.prospeccoes.visualizar` | Sim | Sim | Não |
| Criar / Editar Prospecção | `comercial.prospeccoes.criar` | Sim | Sim | Não |
| Converter Lead em Produtor Credenciado | `comercial.prospeccoes.converter` | Sim | Sim | Não |
| Acessar Funil e Oportunidades | `comercial.oportunidades.visualizar` | Sim | Sim | Não |
| Criar Nova Oportunidade | `comercial.oportunidades.criar` | Sim | Sim | Não |
| Mover Estágio no Kanban | `comercial.oportunidades.mover` | Sim | Sim | Não |
| Fechar como Ganho (WON) | `comercial.oportunidades.ganhar` | Sim | Sim | Não |
| Encerrar com Motivo de Perda | `comercial.oportunidades.encerrar` | Sim | Sim | Não |
| Registrar Atividades e Reuniões | `comercial.atividades.registrar` | Sim | Sim | Não |
| Visualizar Histórico de Atividades | `comercial.atividades.visualizar` | Sim | Sim | Não |

---

## 4. Garantias e Diretrizes de Governança

1. **Uso Proibido do Termo "360":**
   - O termo "360" é de uso exclusivo da Central de Consulta de Compradores do SAC (`sac-query-center`).
   - A visão centralizada do produtor de eventos é estritamente designada como **"Visão Comercial do Produtor"** em todas as interfaces, rotas e documentações.

2. **Zero Inferência Fictícia:**
   - Métricas de oportunidade, carteira e desempenho comercial são quantificadas a partir de dados reais transacionados e datas de calendário.
   - Não há pontuações arbitrárias, estimativas probabilísticas de fechamento inventadas ou indicadores desprovidos de lastro empírico.

3. **Auditoria e Concorrência:**
   - Cada oportunidade conta com um histórico imutável (`OpportunityStageHistory`) registrando usuário, instante e duração da estadia em cada estágio.
   - Modificações de estágio utilizam verificação de versão concorrente (`expectedVersion`), mitigando condições de corrida entre múltiplos executivos no mesmo quadro Kanban.
