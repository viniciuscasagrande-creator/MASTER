# Relatório de Testes Automatizados — Fase 1.3.7

## Resumo de Execução

- **Suíte:** `backend/tests/commercial-catalog.test.ts`
- **Ambiente:** Node.js + TypeScript (`npx tsx`) com In-Memory Database Store
- **Status:** **10 / 10 Casos de Teste APROVADOS (100% de Sucesso)**
- **Regressão:** Zero regressões detectadas nas suítes das Fases 1.1.5.1, 1.3.3, 1.3.4, 1.3.5 e 1.3.6.

---

## Casos de Teste Homologados

### Teste 1: Fonte Única da Verdade do Catálogo (Single Source of Truth)
- **Objetivo:** Garantir que não existem tabelas ou coleções duplicadas para planos e pacotes (`CommercialPlan`, `CommercialPackage`).
- **Validação:** Verificou que todas as 13 ofertas iniciais residem na mesma entidade `CommercialOffering`, categorizadas pelos seus tipos canônicos (`PLAN`, `PACKAGE`, `SERVICE`, `ADD_ON`).
- **Resultado:** APROVADO.

### Teste 2: Criação de Oferta Comercial com Código Público e Versão 1 Automática
- **Objetivo:** Validar o cadastro de uma nova oferta com código público `OFR-YYYY-XXXXXX` e publicação imediata da Versão 1 ativa.
- **Validação:** Oferta `OFR-2026-000114` gerada com sucesso; Versão 1 criada com status `ACTIVE` e hash determinístico SHA-256 de 64 caracteres hexadecimais.
- **Resultado:** APROVADO.

### Teste 3: Versionamento Imutável (Criação de DRAFT v2 e Publicação)
- **Objetivo:** Assegurar que versões em rascunho não interferem na versão ativa até que sejam formalmente publicadas.
- **Validação:** Versão `v2` criada em `DRAFT` com hash próprio; a oferta continuou apontando para `v1` (5.5%). Ao publicar `v2`, a oferta foi promovida com sucesso para `v2` (5.2%).
- **Resultado:** APROVADO.

### Teste 4: Composições de Pacotes e Prevenção Rigorosa de Ciclos (DFS)
- **Objetivo:** Impedir que pacotes incluam a si mesmos ou criem dependências circulares recursivas.
- **Validação:** Testou a criação do pacote P1 (Portaria VIP) e do pacote P2 (Infra Total). A tentativa de inclusão circular P1 -> P2 -> P1 foi interceptada e rejeitada com erro explícito de ciclo via algoritmo DFS. Auto-inclusão P1 -> P1 também foi bloqueada.
- **Resultado:** APROVADO.

### Teste 5: Recursos Técnicos do Catálogo Desacoplados de RBAC
- **Objetivo:** Comprovar que features técnicas do produto não colidem com permissões de tela de usuários.
- **Validação:** Criação de `feature.bi.predictive_curve` com limites contratuais e vinculação à versão da oferta sem afetar perfis ou escopos de usuários.
- **Resultado:** APROVADO.

### Teste 6: Resolução de Condições Padrão e CommercialCatalogProvider
- **Objetivo:** Validar a resolução de condições financeiras padrão através de interface desacoplada.
- **Validação:** Provider resolveu com precisão as condições da v1 (5.5%) e da v2 (5.2%) com snapshot desacoplado completo.
- **Resultado:** APROVADO.

### Teste 7: Preservação de Histórico e Isolamento por Snapshot
- **Objetivo:** Garantir que propostas e contratos criados anteriormente não sofram mutações retrospectivas após publicação de novas versões no catálogo.
- **Validação:** Proposta criada com v1 manteve congelada a taxa de 5.5% mesmo após a oferta ter evoluído para v2 (5.2%).
- **Resultado:** APROVADO.

### Teste 8: Análise de Impacto Comercial e Contratual (CatalogImpactService)
- **Objetivo:** Avaliar dependências em tempo real antes de alterar ou descontinuar uma oferta.
- **Validação:** Serviço contabilizou com exatidão as propostas em negociação e contratos vigentes, emitindo advertência contextualizada.
- **Resultado:** APROVADO.

### Teste 9: Descontinuação Segura sem Perda de Dados
- **Objetivo:** Descontinuar uma oferta sem deletar registros e sem corromper propostas existentes.
- **Validação:** Oferta marcada como `DISCONTINUED` e `active: false`; filtrada das opções de novas vendas; propostas históricas continuam intactas.
- **Resultado:** APROVADO.

### Teste 10: Agregações e Métricas do Catálogo
- **Objetivo:** Validar contadores executivos e listagens agrupadas para a diretoria comercial.
- **Validação:** Listagens de planos, pacotes, serviços e contadores de status homologados.
- **Resultado:** APROVADO.
