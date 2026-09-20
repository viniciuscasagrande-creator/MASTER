# Implementação da Fase 1.3.3 — Central de Produtores, Carteira Comercial & Visão Comercial do Produtor

## 1. Visão Geral e Princípios Fundamentais

A **Fase 1.3.3** implanta o **CRM B2B Real do Comercial da DiskIngressos**. Esta fase consolida e respeita a fronteira arquitetural fundamental estabelecida no projeto:

> **O CLIENTE DO COMERCIAL É O PRODUTOR DE EVENTOS.**
> Comprador de ingressos, participantes, portadores de CPF, pedidos de consumidores finais e resolução de dúvidas de compra pertencem estritamente ao **ATENDIMENTO SAC**. No Comercial, gerencia-se única e exclusivamente o relacionamento corporativo com as produtoras, promotoras, artistas e casas de espetáculo.

```text
PRODUTOR (Entidade Mestre no Core)
    │
    ├── EVENTOS → Eventos produzidos e sessões em cartaz
    ├── COMERCIAL → Relacionamento B2B (CommercialAccount, Carteira, Contatos, Atividades)
    ├── FINANCEIRO → Conta gráfica, repasses, adiantamentos e liquidações
    ├── MARKETING → Campanhas, pixels, cupons e ferramentas de conversão
    └── SUPORTE → Operação técnica no dia do evento e prontidão de portaria
```

---

## 2. Decisões Arquiteturais e Diretrizes Estritas

1. **Sem Duplicação de Entidades Mestres:**
   - A entidade `Producer` reside no Core da DiskIngressos.
   - A camada comercial é modelada através de `CommercialAccount`, que estende `Producer` via chave estrangeira `producerId`.
   - Razão Social, CNPJ, dados cadastrais primários e usuários de acesso ao portal não são duplicados.

2. **Proibição Absoluta do Termo "360":**
   - O termo "360" é de uso restrito da Central de Consulta de Compradores do SAC.
   - A tela de consolidação de relacionamento do produtor é denominada oficialmente e exclusivamente de **"Visão Comercial do Produtor"**.

3. **Métricas Reais e Sem Scores Artificiais:**
   - Nenhuma métrica artificial ("Lead score 87", "Health Score 92/100") é adotada.
   - Todos os indicadores exibidos são quantificadores matemáticos reais: contagem de eventos ativos, ingressos emitidos, faturamento bruto real, taxa de ocupação ponderada e prazos baseados em calendário.

4. **Separação entre Histórico e Ação Futura:**
   - `CommercialActivity`: Histórico auditável do que **já aconteceu** (reunião, telefonema, WhatsApp, visita técnica).
   - `Task`: Necessidade de **ação futura** orquestrada pela Central de Trabalho (`Task Engine` do Core), gerando tarefas tipadas sob o módulo `'COMERCIAL'`.

---

## 3. Modelo de Dados e Estruturas Criadas

### Backend Prisma (`backend/prisma/schema.prisma` & `backend/src/core/database/prisma.ts`)

- **`CommercialAccount`**:
  - `id`: Identificador único da conta comercial (`cacc_...`).
  - `producerId`: Vínculo com a entidade mestre `Producer`.
  - `commercialStatus`: `PROSPECT`, `ACTIVE`, `INACTIVE`, `SUSPENDED`, `CLOSED`.
  - `commercialClassification`: `ESTRATEGICO`, `KEY_ACCOUNT`, `REGULAR`, `NOVO`, `INATIVO`.
  - `segmentId`: Segmento de mercado (`SHOWS_FESTIVAIS`, `TEATRO_CULTURA`, `CORPORATIVO`, etc.).
  - `commercialOwnerId` / `commercialOwnerName`: Executivo responsável.
  - `notesSummary`: Resumo de notas e acordos contratuais.
  - `version`: Controle de concorrência otimista (optimistic locking).

- **`CommercialPortfolioAssignment`**:
  - Mapeia a responsabilidade comercial de contas para usuários internos com papéis: `PRIMARY` (Owner), `SUPPORT` (Back-office) e `MANAGER` (Liderança).
  - Controle de vigência (`validFrom`, `validUntil`, `active`).

- **`ProducerContact`**:
  - Cadastro de interlocutores corporativos B2B do produtor: Nome, Cargo/Função (`roleTitle`), Email, Telefone, `isPrimary` (contato principal) e `canNegotiate` (decisor contratual).

- **`CommercialLead`**:
  - Prospecções ativas de novos produtores.
  - Validação estrita anti-duplicidade de CNPJ contra a base do Core e contra outros leads ativos.
  - Status: `NEW`, `CONTACTED`, `QUALIFIED`, `NEGOTIATING`, `CONVERTED`, `DISQUALIFIED`, `LOST`.
  - Suporta **conversão idempotente em Produtor**: cria `Producer` no Core, inicializa `CommercialAccount`, vincula na Carteira, cadastra `ProducerContact` e migra oportunidades associadas.

- **`CommercialActivity`**:
  - Registro cronológico de interações B2B: `CALL`, `MEETING`, `EMAIL`, `WHATSAPP`, `VISIT`, `NOTE`, `FOLLOW_UP`.
  - Suporta definição de `nextActionDescription` e `nextActionAt`, sincronizando automaticamente tarefas com a Central de Trabalho.

---

## 4. Camada de Serviços Backend (`backend/src/modules/commercial/`)

1. **`producers/commercial-account.service.ts`**:
   - `getAccountByProducerId`, `upsertAccount`, `validateVersion` para concorrência otimista.
   - Gestão de contatos B2B (`listContacts`, `addContact`, `updateContact`, `deleteContact`), garantindo unicidade de contato principal.

2. **`portfolio/portfolio.service.ts`**:
   - `assignProducer`, `unassignProducer`, `getProducerOwners`.
   - `getMyPortfolioSummary`: Retorna contadores reais de produtores atribuídos, eventos em cartaz, oportunidades abertas, ações pendentes e ações vencidas.
   - `getMyPortfolioProducers`: Retorna os produtores atribuídos ao usuário logado enriquecidos com status comercial e próximas ações.

3. **`producers/commercial-producer-query.service.ts`**:
   - `listProducers`: Listagem paginada com filtros por texto (nome, razão social ou dígitos de CNPJ), segmento, classificação, status comercial e responsável.
   - `getProducerCommercialSummary`: Monta a Visão Comercial do Produtor consolidando entidade mestre, conta comercial, carteira, contatos, métricas de eventos e próximas ações, aplicando isolamento de escopo multi-tenant.

4. **`leads/commercial-lead.service.ts` & `leads/lead-conversion.service.ts`**:
   - CRUD completo de prospecções.
   - Prevenção de duplicidade: impede cadastro de lead com CNPJ já pertencente a produtor credenciado ou outro lead ativo.
   - `convertLead`: Operação atômica e idempotente que promove o lead a Produtor Credenciado no Core.

5. **`activities/commercial-activity.service.ts`**:
   - Registro de interações com atualização de `lastContactAt` e `nextActionAt` na conta comercial.
   - Criação automática de `Task` no Task Engine do Core quando houver próxima ação agendada.

---

## 5. Rotas e Endpoints da API (`/api/v1/commercial/`)

| Método | Rota | Descrição | Permissão RBAC |
|---|---|---|---|
| `GET` | `/producers` | Listagem da Central de Produtores | `comercial.produtores.visualizar` |
| `GET` | `/producers/:id/summary` | Visão Comercial do Produtor | `comercial.produtores.visualizar` |
| `GET` | `/producers/:id/account` | Dados da Conta Comercial | `comercial.produtores.visualizar` |
| `PUT` | `/producers/:id/account` | Atualização da Conta Comercial | `comercial.produtores.editar` |
| `GET` | `/producers/:id/contacts` | Listagem de Contatos B2B | `comercial.produtores.visualizar` |
| `POST` | `/producers/:id/contacts` | Adição de Contato B2B | `comercial.produtores.editar` |
| `GET` | `/portfolio/my-summary` | Resumo de Carteira do Usuário | `comercial.carteira.visualizar` |
| `GET` | `/portfolio/my-producers` | Produtores da Minha Carteira | `comercial.carteira.visualizar` |
| `POST` | `/portfolio/assign` | Atribuição de Carteira Comercial | `comercial.carteira.atribuir` |
| `GET` | `/leads` | Listagem de Prospecções (Leads) | `comercial.prospeccoes.visualizar` |
| `POST` | `/leads` | Criação de Prospecção Comercial | `comercial.prospeccoes.criar` |
| `POST` | `/leads/:id/convert` | Conversão de Lead em Produtor | `comercial.prospeccoes.converter` |
| `GET` | `/activities` | Histórico de Atividades | `comercial.atividades.visualizar` |
| `POST` | `/activities` | Registro de Nova Atividade | `comercial.atividades.registrar` |

---

## 6. Frontend e Experiência do Usuário (`apps/web`)

### Telas Criadas:

1. **`ProducersPage.tsx` (Central de Produtores):**
   - KPI cards com produtores ativos, eventos ativos em cartaz e alertas de ações atrasadas.
   - Barra de filtros rápidos por texto, segmento, classificação e status comercial.
   - Tabela com dados completos do produtor, contatos principais e atalho direto para a Visão Comercial.

2. **`ProducerCommercialPage.tsx` (Visão Comercial do Produtor):**
   - Cabeçalho corporativo com nome fantasia, razão social, CNPJ, status, classificação e responsável atribuído.
   - Abas temáticas organizadas:
     - **Resumo:** Condições comerciais, notas estratégicas e contato principal.
     - **Eventos:** Listagem detalhada de todos os eventos produzidos com ingressos vendidos e faturamento.
     - **Performance Comercial:** KPIs de vendas brutas, ticket médio e distribuição por canais.
     - **Contatos B2B:** Gestão de interlocutores corporativos (produção, financeiro, marketing).
     - **Oportunidades:** Pipeline comercial associado à conta.
     - **Histórico de Interações:** Linha do tempo com reuniões, chamadas e follow-ups.
     - **Pendências:** Tarefas operacionais vinculadas via Core Task Engine.

3. **`MyPortfolioPage.tsx` (Minha Carteira Comercial):**
   - Visão individualizada para o consultor/executivo comercial.
   - Seção destacada de **Prioridades do Dia e Ações Vencidas**, permitindo ação imediata.
   - Listagem dos produtores geridos pelo usuário logado.

4. **`CommercialLeadsPage.tsx` (Prospecções & Novos Negócios):**
   - Funil de qualificação de novas empresas promotoras.
   - Modal de cadastro com validação de CNPJ.
   - Modal assistido de **Conversão em Produtor Credenciado**.

---

## 7. Homologação e Testes

A suíte automatizada `backend/tests/commercial-crm.test.ts` valida com 100% de sucesso os seguintes cenários:
- Extensão comercial sobre produtor (`CommercialAccountService`) e contatos B2B.
- Resumo de carteira comercial com métricas calculadas em tempo real e sem scores fictícios.
- Consulta central de produtores e montagem da Visão Comercial.
- Bloqueio de duplicidade de CNPJ e conversão idempotente de leads.
- Registro de atividades e sincronização bidirecional com a Central de Trabalho.
- Isolamento estrito de dados multi-tenant de acordo com o escopo do usuário.
