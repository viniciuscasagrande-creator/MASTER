# Documentação Técnica — Fase 1.3.6: Contratos Comerciais B2B + Assinatura + Vigência + Aditivos + Renovação

## 1. Visão Geral da Fase 1.3.6

A **Fase 1.3.6** estabelece a esteira jurídica e de formalização de contratos comerciais da **DiskIngressos** com produtores de eventos (**Produtor B2B**).

Ela posiciona o contrato no ciclo de vida comercial DiskIngressos:
```text
OPORTUNIDADE (1.3.4)
       ↓
PROPOSTA COMERCIAL (1.3.5)
       ↓
ACEITE FORMAL DO PRODUTOR (1.3.5)
       ↓
CONTRATO COMERCIAL (1.3.6)
       ↓
ASSINATURA ELETRÔNICA (1.3.6)
       ↓
VIGÊNCIA EFETIVA (1.3.6)
       ↓
EXECUÇÃO FINANCEIRA / BORDERÔ / REPASSES (Fases Financeiras)
```

---

## 2. Princípios Arquiteturais & Fronteiras de Domínio

1. **Cliente estritamente B2B:**
   * O contratante é **sempre o produtor** (`Producer`).
   * Jamais é o comprador final de ingressos, participante ou SAC.
   * Proibido o uso do termo "360".

2. **Separação entre Comercial e Financeiro:**
   * O módulo Comercial **administra o contrato**, redige minutas, recolhe assinaturas digitais, gerencia aditivos e vigências.
   * O módulo Financeiro **consome as condições efetivas vigentes** via `ContractTermsProvider.getTermsForProducer(producerId, atDate)` para liquidar borderôs e apurar comissões e repasses.

3. **Separação entre Assinatura e Vigência (`SIGNED != ACTIVE`):**
   * A conclusão das assinaturas eletrônicas **não ativa o contrato automaticamente** se a data de início de vigência (`effectiveFrom`) for futura.
   * O status do contrato transita para `SIGNED` e torna-se `ACTIVE` apenas quando `effectiveFrom <= now < effectiveUntil`.
   * Essa separação evita antecipação indevida de efeitos comerciais e fiscais.

4. **Imutabilidade Pós-Assinatura & Aditivos (`ContractAmendment`):**
   * Uma vez assinado, o contrato base e suas versões tornam-se **estritamente imutáveis**.
   * Qualquer repactuação de taxas, prazo ou escopo operacional exige a lavratura de um **Aditivo Contratual (`ContractAmendment`)**, com versionamento, aprovação por alçada (Maker-Checker) e integridade criptográfica.

5. **Webhook como Autoridade de Assinatura & Idempotência:**
   * A autoridade certificadora (Autentique / Clicksign) notifica a plataforma via webhook.
   * O webhook valida assinaturas digitais e processa eventos com rigorosa **idempotência** por `providerReference`.

6. **Rastreabilidade Criptográfica:**
   * Toda versão e todo aditivo computa um SHA-256 canônico (`contentHash`).
   * A conversão de uma proposta aceita (Fase 1.3.5) armazena explicitamente o `sourceProposalContentHash`, garantindo que o contrato deriva exatamente da minuta aceita pelo produtor.

---

## 3. Estrutura de Modelos de Dados (Prisma & In-Memory Store)

* **`CommercialContract`:** Contrato comercial mestre (código `CTR-YYYY-XXXXXX`, produtor, vigência, status, lock otimista `version`).
* **`CommercialContractVersion`:** Versão formal da minuta com snapshot imutável de termos e partes, e hash SHA-256 (`contentHash`).
* **`ContractCommercialTerm`:** Cláusulas de taxa/remuneração (comissão de plataforma, controle de acesso, bilheteria, payer, split).
* **`ContractParty`:** Partes signatárias (DiskIngressos e Produtor, CNPJ, representantes legais, CPF, e-mail).
* **`ContractAmendment`:** Aditivo contratual (código `ADT-YYYY-XXXXXX-NN`, tipo, justificativa, vigência das novas regras, hash).
* **`ContractRenewal`:** Registro de prorrogação simples (`SIMPLE`) ou redirecionamento para o pipeline CRM (`RENEGOTIATION`).
* **`SignatureEnvelope`:** Envelope digital da autoridade certificadora (Autentique), status e referência externa.
* **`SignatureSigner`:** Signatário do envelope com status (`PENDING`, `SIGNED`, `REJECTED`) e timestamp.

---

## 4. Endpoints REST da API (`/api/v1/commercial/contracts`)

| Método | Endpoint | Permissão RBAC | Finalidade |
|---|---|---|---|
| `POST` | `/webhook/signature` | Aberto (Webhook Secret) | Recebimento de eventos da autoridade certificadora |
| `GET` | `/metrics` | `comercial.contratos.visualizar` | Métricas consolidadas (vigentes, em assinatura, aditivos) |
| `GET` | `/` | `comercial.contratos.visualizar` | Listagem com busca, paginação e filtros multi-tenant |
| `GET` | `/:id` | `comercial.contratos.visualizar` | Detalhes completos do contrato |
| `POST` | `/from-proposal` | `comercial.contratos.criar` | Conversão de proposta aceita em contrato formal |
| `POST` | `/` | `comercial.contratos.criar` | Criação direta de contrato |
| `PUT` | `/:id` | `comercial.contratos.editar` | Atualização de rascunho com lock otimista (HTTP 409) |
| `POST` | `/:id/submit-approval` | `comercial.contratos.enviar_aprovacao` | Submissão de minuta para alçada interna |
| `POST` | `/:id/decision` | `comercial.contratos.enviar_aprovacao` | Decisão de aprovação Maker-Checker |
| `POST` | `/:id/versions/:v/document` | `comercial.contratos.documentos.gerar` | Geração de documento HTML formal com SHA-256 |
| `POST` | `/:id/prepare-signature` | `comercial.contratos.preparar_assinatura` | Despacho de envelope de assinatura eletrônica |
| `POST` | `/:id/amendments` | `comercial.contratos.aditivos.gerenciar` | Lavratura de aditivo contratual |
| `POST` | `/:id/amendments/:aId/approve` | `comercial.contratos.aditivos.gerenciar` | Aprovação interna de aditivo |
| `POST` | `/:id/amendments/:aId/activate` | `comercial.contratos.aditivos.gerenciar` | Ativação operacional do aditivo |
| `POST` | `/:id/renewals` | `comercial.contratos.renovacoes.gerenciar` | Registro de renovação ou renegociação CRM |
| `POST` | `/:id/renewals/:rId/complete` | `comercial.contratos.renovacoes.gerenciar` | Conclusão de prorrogação simples de vigência |
| `POST` | `/:id/suspend` | `comercial.contratos.suspender` | Suspensão contratual temporária |
| `POST` | `/:id/reactivate` | `comercial.contratos.suspender` | Reativação de contrato suspenso |
| `POST` | `/:id/terminate` | `comercial.contratos.rescindir` | Rescisão formal com justificativa auditada |
| `GET` | `/effective-terms/:producerId` | `comercial.contratos.condicoes.visualizar` | Condições efetivas para consumo pelo Financeiro |

---

## 5. Componentes Frontend Implementados (`apps/web`)

* **`ContractsPage.tsx`:** Dashboard executivo de contratos com StatCards, abas de filtro (`Vigentes`, `Em Assinatura`, `Rascunhos`, `A Vencer`), tabela rica e paginação.
* **`ContractDetailsPage.tsx`:** Detalhamento profundo com navegação por abas:
  1. *Visão Geral & Partes*: Dados cadastrais das partes, representantes legais, integridade SHA-256 e lock de concorrência.
  2. *Condições Efetivas (Financeiro)*: Grid de taxas vigentes discriminando cláusulas base vs aditivos.
  3. *Minuta & Documento*: Preview do documento contratual compilado e verificação de checksum.
  4. *Assinatura Digital*: Acompanhamento de signatários, status do envelope e simulador para homologação.
  5. *Aditivos Contratuais*: Gestão de amendments, aprovação e ativação.
  6. *Renovações*: Gestão de prorrogações e vínculo com CRM 1.3.4.
* **Modais Especializados:**
  * `ContractCreateModal.tsx`: Criação a partir de proposta aceita ou direta.
  * `ContractAmendmentModal.tsx`: Lavratura de aditivo.
  * `ContractRenewalModal.tsx`: Prorrogação ou renegociação CRM.
  * `ContractTerminationModal.tsx`: Rescisão contratual formal.
  * `SignaturePreparationModal.tsx`: Configuração de signatários e despacho de envelope.
* **`ContractStatusBadge.tsx`:** Badges visuais padronizados para todos os estados do ciclo de vida contratual.
* **Integração de Menu & Navegação:**
  * `Sidebar.tsx`: Item `Contratos Comerciais` adicionado à seção Comercial.
  * `CommercialDashboard.tsx`: Roteamento interno entre central de contratos e detalhe.
  * `ProposalsPage.tsx` & `ProposalDetailsPage.tsx`: Botão de ação "Gerar Contrato Comercial" disponível nas propostas aceitas (`ACCEPTED`).
