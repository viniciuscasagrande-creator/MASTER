# Implementação da Fase 1.3.5 — Propostas Comerciais, Condições de Negociação, Versionamento & Aprovação

## 1. Visão Geral Executiva

A Fase 1.3.5 consolida o processo de **formalização comercial entre a DiskIngressos e o Produtor de Eventos (B2B)**. O fluxo transforma oportunidades geradas nas fases anteriores (1.3.3 e 1.3.4) em **propostas comerciais vinculantes com versionamento imutável e governança estrita de alçadas**.

```text
OPORTUNIDADE (1.3.4)
       ↓
NEGOCIAÇÃO COMERCIAL
       ↓
PROPOSTA COMERCIAL (1.3.5)
  ├── Catálogo de Serviços e Ofertas DiskIngressos
  ├── Termos Comerciais Estruturados (Comissões, Locações, Taxas)
  ├── Referências de Eventos (Dimensionamento de VGV)
  ├── Versionamento Imutável Canônico (SHA-256 contentHash)
  ├── Alçadas Comerciais (Maker-Checker, Aprovação Direta)
  └── Minuta Formal com Checksum de Integridade
       ↓
ACEITE FORMAL DO PRODUTOR (1.3.5)
       ↓
CONTRATO FORMAL (Fase 1.3.6)
       ↓
OPERAÇÃO & FINANCEIRO (Bordirô, Repasses, Eventos)
```

### 1.1 Regras Rígidas de Domínio Respeitadas
1. **Proposta comercial NÃO é contrato**: O aceite comercial formaliza a intenção e termos acordados, mas não substitui as cláusulas contratuais jurídicas da Fase 1.3.6.
2. **Proposta aceita NÃO cria repasse, recebível ou borderô financeiro**: Bloqueio estrito de acoplamento com o financeiro operacional.
3. **Proposta aceita NÃO cria eventos na grade**: Eventos associados à proposta são meras referências (`ProposalEventReference`) para estimativa de VGV e público. A criação na grade só ocorre após o contrato formal.
4. **Comercial é estritamente B2B**: O cliente é o produtor. Compradores finais, participantes ou SAC pertencem a outros módulos.
5. **Ausência total do termo proibido**: Em total conformidade com a diretriz da arquitetura, o termo "360" não é utilizado em nenhuma parte do sistema.

---

## 2. Modelos de Dados (Prisma & Shared Types)

Foram introduzidos 8 modelos no `backend/prisma/schema.prisma` e espelhados em `shared/types/index.ts`:

| Modelo | Finalidade |
|---|---|
| `CommercialOfferingCategory` | Categorias do catálogo de ofertas DiskIngressos (Plataforma, Controle de Acesso, Bilheteria, Marketing, Equipamentos, Adicionais) |
| `CommercialOffering` | Itens de serviços oferecidos com precificação padrão, modelo (Percentual/Fixo) e pagador padrão |
| `CommercialProposal` | Cabeçalho da proposta comercial, com código público único `PROP-YYYY-XXXXXX`, concorrência otimista (`version`) e apontador para a versão corrente |
| `CommercialProposalVersion` | Versão imutável de uma proposta, contendo `contentHash` SHA-256, modelo comercial, resumo de mudanças e snapshot |
| `ProposalCommercialTerm` | Condição comercial estruturada (taxa, percentual, fixo por ingresso, pagador: Produtor ou Comprador Final, split) |
| `ProposalEventReference` | Referência a evento para projeção de volume de vendas (VGV, ingressos projetados, data prevista, local) |
| `ProposalAcceptance` | Registro do aceite formal do produtor (método, responsável legal, documento, evidência, data/hora) |
| `ProposalDelivery` | Histórico de envios da proposta (E-mail, WhatsApp, Portal, Presencial) com status de entrega e rastreamento |

---

## 3. Arquitetura de Serviços Backend

Localização: `backend/src/modules/commercial/proposals/`

### 3.1 Catálogo de Ofertas (`CommercialOfferingService`)
- `listCategories(activeOnly)`: Lista categorias ativas com seus respectivos itens.
- `listOfferings(categoryId)`: Retorna os serviços disponíveis para rápida composição de propostas.
- Seed nativo com categorias reais DiskIngressos: Comissões de bilheteria, locação de catracas móveis, validação por app, pontos de venda físicos (PDV), links patrocinados e marketing direcionado.

### 3.2 Validador de Termos e Alçadas (`CommercialTermsValidator`)
- Valida percentuais (0% a 100%), valores monetários não-negativos e regras de split.
- **Regra de Alçada Direta**: Taxa de plataforma inferior a 7,00% ou ativação de split de conveniência dispara obrigatoriamente a necessidade de aprovação da Diretoria Comercial antes do envio formal ao produtor.

### 3.3 Versionamento Imutável e Hashing Canônico (`ProposalVersionService`)
- Cálculo determinístico de `contentHash` SHA-256:
  - Header canônico: `proposalId`, `versionNumber`, `commercialModel`, `validUntil` normalizado.
  - Termos ordenados por chave única (`offeringId`, `termType`, `name`, `calculationType`, `percentage`, `amount`, `payer`).
  - Eventos ordenados canonicamente por nome e data prevista.
- Criação atômica de novas versões (`v1`, `v2`, ...): nenhuma versão já criada é sobrescrita ou destruída.

### 3.4 Comparador de Versões (`ProposalDiffService`)
- Executa comparação estruturada entre duas versões quaisquer da mesma proposta (`baseVersionNumber` vs `targetVersionNumber`).
- Retorna lista categorizada de diferenças: `category: HEADER | TERM | EVENT`, `changeType: ADDED | REMOVED | MODIFIED | UNCHANGED`, com valor anterior e novo valor.

### 3.5 Integração com Alçadas & Maker-Checker (`ProposalApprovalAdapter`)
- Integração ao mecanismo de alçadas de aprovação.
- **Princípio Maker-Checker**: O criador da proposta é expressamente bloqueado de aprovar sua própria solicitação.
- **Vínculo Criptográfico**: O parecer de aprovação da alçada é vinculado ao `(proposalVersionId, contentHash)`. Qualquer tentativa de alterar termos invalida a aprovação e força a criação de nova versão.

### 3.6 Minuta Formal & Checksum (`ProposalDocumentService`)
- Renderização de documento formal em HTML padronizado com identidade visual DiskIngressos.
- Checksum SHA-256 do documento gerado gravado na versão e auditado.

### 3.7 Entrega & Rastreamento (`ProposalDeliveryService`)
- Suporte a múltiplos canais: `EMAIL`, `WHATSAPP`, `LINK_PORTAL`, `MANUAL_HANDOFF`.
- Ao realizar o primeiro envio, a proposta transita automaticamente para `SENT`.

### 3.8 Aceite Comercial & Recusa (`ProposalAcceptanceService`)
- `registerAcceptance`: Registra aceite formal pelo produtor (`DIGITAL_SIGNATURE`, `EMAIL_CONFIRMATION`, `WRITTEN_FORM`, `WHATSAPP_FORMAL`, etc.), transiciona o status para `ACCEPTED`.
- **Fronteira Rígida**: Mantém a oportunidade aberta e não gera nenhum evento ou borderô financeiro.
- `declineProposal`: Registra a recusa pelo produtor (`DECLINED`), permitindo geração imediata de contraproposta (V2, V3) no CRM.

---

## 4. Endpoints REST Implementados

Todos os endpoints estão documentados, autenticados e protegidos por RBAC:

| Método | Rota | Permissão Requerida | Descrição |
|---|---|---|---|
| `GET` | `/commercial/offerings/categories` | `comercial.propostas.visualizar` | Categorias de ofertas DiskIngressos |
| `GET` | `/commercial/offerings` | `comercial.propostas.visualizar` | Catálogo de serviços e taxas padrão |
| `GET` | `/commercial/proposals` | `comercial.propostas.visualizar` | Listagem paginada com busca e filtros |
| `GET` | `/commercial/proposals/metrics` | `comercial.propostas.visualizar` | KPIs consolidados de propostas |
| `GET` | `/commercial/proposals/:id` | `comercial.propostas.visualizar` | Detalhes da proposta e versões |
| `POST` | `/commercial/proposals` | `comercial.propostas.criar` | Criação de nova proposta (V1) |
| `PUT` | `/commercial/proposals/:id` | `comercial.propostas.editar` | Atualização de rascunho (DRAFT) |
| `POST` | `/commercial/proposals/:id/cancel` | `comercial.propostas.cancelar` | Cancelamento formal de proposta |
| `POST` | `/commercial/proposals/:id/versions` | `comercial.propostas.editar` | Criação de nova versão imutável |
| `GET` | `/commercial/proposals/:id/diff` | `comercial.propostas.versoes.visualizar` | Comparador de versões estruturado |
| `POST` | `/commercial/proposals/:id/versions/:ver/submit-approval` | `comercial.propostas.enviar_aprovacao` | Submissão à alçada da diretoria |
| `POST` | `/commercial/proposals/:id/versions/:ver/decision` | `comercial.alçadas.aprovar` | Decisão da alçada (Aprovar / Reprovar) |
| `POST` | `/commercial/proposals/:id/versions/:ver/document` | `comercial.propostas.documentos.gerar` | Geração de minuta formal |
| `POST` | `/commercial/proposals/:id/versions/:ver/send` | `comercial.propostas.enviar` | Envio formal ao produtor |
| `POST` | `/commercial/proposals/:id/versions/:ver/accept` | `comercial.propostas.aceite.registrar` | Registro do aceite formal do produtor |
| `POST` | `/commercial/proposals/:id/versions/:ver/decline` | `comercial.propostas.aceite.registrar` | Registro formal de recusa comercial |

---

## 5. Interface Web & Experiência do Usuário (Frontend)

Localização: `apps/web/src/features/commercial/proposals/`

1. **`ProposalsPage.tsx` (Central de Propostas)**:
   - 5 StatCards executivos: Total de Propostas, Aguardando Alçada, Enviadas ao Produtor, Aceitas Formalmente, Taxa de Aceite %.
   - Abas de filtragem rápida: "Todas as Propostas", "Aguardando Alçada", "Enviadas ao Produtor", "Aceitas Formalmente", "Rascunhos".
   - Busca fulltext instantânea (código público `PROP-...`, nome do produtor, objeto).
   - Tabela rica com código, versão corrente, identificador sha canônico, produtor, objeto, modelo, validade e badge de status dinâmico.
   - Paginação e ações contextuais rápidas de envio e aceite.

2. **`ProposalDetailsPage.tsx` (Detalhes & Ações)**:
   - Header executivo com código, badges de versão, status, identificador SHA-256 com botão de cópia instantânea.
   - Botões contextuais de acordo com o ciclo de vida (Submeter Alçada, Decidir Alçada, Enviar ao Produtor, Registrar Aceite, Recusar, Cancelar, Nova Versão).
   - 7 Abas integradas:
     - **Resumo Geral**: Objeto, modelo comercial, prazos, produtor parceiro e oportunidade vinculada.
     - **Condições Comerciais**: Tabela estruturada de taxas, percentuais, fixos por ingresso, pagador (Produtor ou Comprador Final) e condições especiais.
     - **Eventos Abrangidos**: Escopo de eventos previstos com VGV projetado e aviso de domínio.
     - **Versões & Histórico**: Lista cronológica de versões imutáveis com seus hashes SHA-256 e botão de comparação.
     - **Documento Formal**: Visualização da minuta oficial em HTML renderizado, checksum SHA-256 e botão para impressão direta ou salvar PDF.
     - **Alçadas & Aprovações**: Status de governança, histórico de auditoria e garantia do Maker-Checker.
     - **Envios & Aceite**: Histórico dos canais de entrega e evidências do aceite formal.

3. **`ProposalDiffModal.tsx`**:
   - Visualizador side-by-side de diferenças entre versões históricas (Header, Termos e Eventos).

4. **`ProposalCreateModal.tsx`**:
   - Assistente inteligente de criação de propostas com atalhos para importação do catálogo de serviços DiskIngressos.

5. **`ProposalActionModals.tsx`**:
   - Modais dedicados: Envio ao Produtor, Aceite Formal com evidências, Recusa com motivo, Submissão e Decisão da Alçada Comercial, Cancelamento e Criação de Nova Versão.

---

## 6. Sincronização de Deployments

- **Frontend Vercel**: `master-85iwtiuia-developdiskingressos-9897s-projects.vercel.app`
- **Backend API Vercel**: `master-api-three.vercel.app`
- **Sincronização**: Repositório unificado com deploy automático engatilhado no branch `main`.
