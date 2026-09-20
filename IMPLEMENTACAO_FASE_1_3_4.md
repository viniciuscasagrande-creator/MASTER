# Implementação da Fase 1.3.4 — Oportunidades, Pipeline Comercial & Gestão de Negociações

## 1. Visão Geral e Princípios Fundamentais

A **Fase 1.3.4** implanta a gestão completa de **Oportunidades Comerciais e Pipeline de Vendas B2B** da DiskIngressos. O objetivo é fornecer ao time comercial um funil visual, auditável e altamente colaborativo para negociações de novos eventos, renovações contratuais e parcerias de exclusividade.

### Princípios Inegociáveis:

1. **O Cliente da Negociação é o Produtor ou Lead:**
   - Oportunidades são vinculadas a uma empresa produtora (`producerId`) ou a uma prospecção ativa (`leadId`).
   - Não há qualquer negociação ou oportunidade vinculada a compradores de ingressos.

2. **Zero Probabilidades Arbitrárias ou Scores Falsos:**
   - Não existem probabilidades inventadas ("Win probability 78%", "Score 87").
   - Métricas reportam fatos quantificáveis: volume financeiro estimado, contagem de oportunidades ativas, tempo de permanência no estágio (`timeInCurrentStageDays`) e tempo médio de ciclo real calculado a partir de transições históricas.

3. **Governança Estrita no Ganho e na Perda:**
   - **Ganho (WON):** O fechamento da oportunidade registra a vitória comercial, mas **não cria contratos nem publica eventos magicamente no catálogo**. A publicação de eventos continua sob governança estrita do módulo de Eventos.
   - **Perda (CLOSED):** O encerramento de qualquer oportunidade perdida ou cancelada exige obrigatoriamente a seleção de um **Motivo de Encerramento (`closeReasonId`)** catalogado e justificativa textual.

4. **Concorrência Otimista (Optimistic Locking):**
   - Oportunidades possuem campo `version`. Toda transição de estágio no Kanban envia `expectedVersion`. Se outro usuário tiver movido o card simultaneamente, a API rejeita com status `409 Conflict`, evitando sobrescritas acidentais e alertando o operador.

---

## 2. Modelo de Dados e Estruturas Criadas

### Backend Prisma (`backend/prisma/schema.prisma`)

- **`CommercialPipeline`**:
  - `id`: Identificador do pipeline (ex: `pip_main`).
  - `name`: Nome do funil (ex: "Funil Comercial Principal").
  - `isDefault`: Indicador de funil padrão do sistema.
  - `stages`: Relação ordenada de estágios.

- **`CommercialPipelineStage`**:
  - `id`: Identificador do estágio (ex: `stage_qual`, `stage_prop`).
  - `pipelineId`: Vínculo com o pipeline.
  - `name`: Nome do estágio (Identificação, Qualificação, Apresentação & Negociação, Proposta Comercial, Decisão & Contrato, Ganho / Won, Fechado / Perdido).
  - `code`: Código técnico do estágio.
  - `position`: Posição ordinal para ordenação visual das colunas.
  - `stageType`: `OPEN` (em andamento), `WON` (vitória comercial) ou `CLOSED` (perdido/cancelado).

- **`CommercialOpportunity`**:
  - `id`: Identificador interno (`opp_...`).
  - `publicCode`: Código público sequencial e legível (`OPC-YYYY-XXXXXX`).
  - `producerId` / `leadId`: Vínculo B2B.
  - `stageId`: Estágio atual no pipeline.
  - `title`: Título da oportunidade (ex: "Festival de Rock 2026 - Exclusividade Curitiba").
  - `typeId`: Tipo de negócio (`NOVO_EVENTO`, `RENOVACAO`, `EXCLUSIVIDADE`, `UPSELL`, `RECUPERACAO`).
  - `ownerId` / `ownerName`: Responsável comercial pela negociação.
  - `estimatedValue`: Valor financeiro estimado de bilheteria / receita.
  - `expectedDecisionAt`: Data prevista de fechamento acordada com o produtor.
  - `status`: `OPEN`, `WON`, `CLOSED`.
  - `closeReasonId` / `closeNotes`: Dados auditáveis de encerramento.
  - `timeInCurrentStageDays`: Dias corridos no estágio atual.
  - `nextActionAt` / `nextActionDescription`: Próxima ação sincronizada com o Core Task Engine.
  - `version`: Inteiro incremental para concorrência otimista.

- **`OpportunityStageHistory`**:
  - Log imutável de transições de estágio: `fromStageId`, `fromStageName`, `toStageId`, `toStageName`, `changedBy`, `changedByName`, `changedAt`, `durationSeconds`.

- **`OpportunityCloseReason`**:
  - Catálogo padronizado de motivos de perda:
    - Preço / Taxa do Concorrente
    - Evento Cancelado pelo Artista / Produtor
    - Sem Praça / Data Disponível
    - Exclusividade Não Aprovada
    - Falta de Retorno do Produtor
    - Incompatibilidade Técnica de Bilheteria
    - Outro Motivo Justificado

---

## 3. Camada de Serviços Backend (`backend/src/modules/commercial/opportunities/`)

1. **`opportunity.service.ts`**:
   - Criação de oportunidades com geração atômica de código sequencial no formato `OPC-YYYY-XXXXXX`.
   - Inicialização do histórico de estágios com registro da entrada no primeiro estágio.
   - Atualização de dados cadastrais com validação de versão concorrente.

2. **`transition/opportunity-transition.service.ts`**:
   - Transição de estágio via Kanban ou detalhe da oportunidade.
   - Validação de `expectedVersion`: se houver divergência, dispara erro `409 Conflict`.
   - Cálculo automático do tempo de permanência no estágio anterior (`durationSeconds`).
   - Atualização de `timeInCurrentStageDays` e registro no histórico imutável.

3. **`closing/opportunity-closing.service.ts`**:
   - `winOpportunity`: Marca a oportunidade como `WON` e transiciona para o estágio vencedor.
   - `closeOpportunity`: Encerra a oportunidade com `status: 'CLOSED'`, validando a presença obrigatória de `closeReasonId` ativo e notas justificativas.

4. **`metrics/opportunity-metrics.service.ts`**:
   - Consolidação de métricas baseadas em fatos reais:
     - `totalOpen`: Quantidade de oportunidades ativas.
     - `inNegotiation`: Quantidade em estágios intermediários/avançados de negociação.
     - `withoutNextAction`: Oportunidades sem nenhuma próxima ação agendada (alerta de abandono).
     - `overdueActions`: Oportunidades com prazo de próxima ação expirado.
     - `wonInPeriod` / `closedInPeriod`: Taxas reais de fechamento no período.
     - `averageCycleDurationDays`: Ciclo médio real em dias a partir da data de criação até o fechamento.

5. **`opportunity-query.service.ts`**:
   - Listagem com filtros compostos por pipeline, estágio, produtor, lead, responsável e status.
   - Consulta detalhada enriquecida com o histórico completo de transições e atividades registradas.

---

## 4. Rotas e Endpoints da API (`/api/v1/commercial/`)

| Método | Rota | Descrição | Permissão RBAC |
|---|---|---|---|
| `GET` | `/pipelines` | Listagem de Funis Comerciais | `comercial.pipeline.visualizar` |
| `GET` | `/pipelines/:id/stages` | Estágios de um Funil | `comercial.pipeline.visualizar` |
| `GET` | `/close-reasons` | Catálogo de Motivos de Perda | `comercial.oportunidades.visualizar` |
| `GET` | `/opportunities` | Listagem de Oportunidades | `comercial.oportunidades.visualizar` |
| `GET` | `/opportunities/metrics` | Métricas do Funil Comercial | `comercial.oportunidades.visualizar` |
| `GET` | `/opportunities/:id` | Detalhes da Oportunidade com Histórico | `comercial.oportunidades.visualizar` |
| `POST` | `/opportunities` | Criação de Nova Oportunidade | `comercial.oportunidades.criar` |
| `PUT` | `/opportunities/:id` | Atualização de Oportunidade | `comercial.oportunidades.editar` |
| `POST` | `/opportunities/:id/transition` | Transição de Estágio (com Lock Otimista) | `comercial.oportunidades.mover` |
| `POST` | `/opportunities/:id/win` | Fechamento Ganho (WON) | `comercial.oportunidades.ganhar` |
| `POST` | `/opportunities/:id/close` | Fechamento Perdido com Motivo | `comercial.oportunidades.encerrar` |

---

## 5. Interface do Usuário (`apps/web`)

### Telas Criadas:

1. **`OpportunitiesPage.tsx` (Central de Oportunidades & Pipeline):**
   - KPI cards com métricas reais: Total Abertas, Em Negociação, Sem Próxima Ação, Ações Vencidas, Ganhas no Período e Ciclo Médio em dias.
   - Alternador de visualização instantâneo: **[Quadro Kanban]** e **[Lista / Tabela]**.
   - Barra de filtros por busca textual, seletor de pipeline e estágio.
   - Modal de criação de oportunidade com formulário completo.

2. **`CommercialPipelineBoard.tsx` (Quadro Kanban):**
   - Colunas visuais com ordenação ordinal de estágios e cabeçalho com contagem de cards e soma de valor financeiro estimado.
   - Cards com código público (`OPC-2026-000001`), título, empresa vinculada, valor estimado formatado, dias no estágio atual, alerta de prazo de próxima ação e responsável comercial.
   - Ações rápidas no card: botão de avançar para próximo estágio, menu de mover estágio, registrar ganho e registrar perda com motivo.
   - Tratamento de concorrência com alerta elegante em caso de HTTP 409.

3. **`OpportunityDetailsPage.tsx` (Detalhes da Oportunidade):**
   - Cabeçalho corporativo com código público, título, estágio, status e valor estimado.
   - Link direto para a Visão Comercial do Produtor quando associado.
   - **Linha do Tempo de Estágios:** Visualização em timeline de cada transição com operador, data/hora e tempo de permanência em dias.
   - **Histórico de Interações:** Atividades comerciais e reuniões vinculadas à negociação.
   - **Próximo Passo / Ação Comercial:** Exibição com destaque para prazos vencidos.
   - Modais para avanço de estágio, marcação de ganho (WON) e encerramento auditado com motivo.

---

## 6. Homologação e Testes Automatizados

O arquivo `backend/tests/commercial-crm.test.ts` valida com 100% de sucesso os seguintes requisitos da Fase 1.3.4:
- Geração de código sequencial padronizado `OPC-YYYY-XXXXXX`.
- Transição de estágios e registro no histórico imutável.
- Proteção de concorrência otimista com rejeição `409 Conflict` em caso de versão divergente.
- Obrigatoriedade de motivo de encerramento e notas para oportunidades fechadas/perdidas.
- Registro de ganho da oportunidade sem auto-criação de contratos no Core.
- Métricas consolidadas transparentes sem inferências ou probabilidades artificiais.
- Isolamento multi-tenant de dados.
