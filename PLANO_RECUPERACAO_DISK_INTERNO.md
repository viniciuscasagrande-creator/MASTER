# PLANO DE RECUPERAÇÃO DO DISK INTERNO
## Roteiro Estruturado de Execução: Fase 1.3.11.1.0 a 1.3.11.1.5

**Data de Aprovação:** 20/09/2026  
**Status:** Baseline Homologada e em Execução  

---

## 1. Princípios Imutáveis de Execução

1. **SafeSaff = Referência Funcional:**
   - Define o que o sistema faz, quais fluxos existem, como ocorrem as transições de estado e quais dados são necessários.
2. **Limitless = Referência Visual e de Experiência (UI/UX):**
   - Define a composição de tela, proporção da sidebar, hierarquia de cabeçalhos, tabelas responsivas densas, cards executivos e modais.
   - **Regra:** Nunca importar dependências legadas (jQuery/Bootstrap). Traduzir visualmente para React + Tailwind + shadcn/ui.
3. **MASTER = Base Técnica Atual:**
   - Preservar os componentes modernos já desenvolvidos, os schemas de dados, o backend Node.js e as APIs consolidadas.
4. **Zero Fórmulas / KPIs Artificiais:**
   - Nenhuma métrica fictícia (ex: "Score 96", "78% de chance de churn", "R$ 4.250.000 de forecast") sem metodologia matemática formal e dados reais.
5. **Zero "360":**
   - Utilizar "Central de Consulta" e "Ficha Consolidada do Comprador".
6. **100% Português do Brasil:**
   - Todos os textos, botões, alertas e relatórios visíveis para o usuário em pt-BR.

---

## 2. Roteiro Cronológico de Fases

```
┌─────────────────────────┐
│     Fase 1.3.11.1.0     │  Auditoria Tripla MASTER × SafeSaff × Limitless
│ (CONCLUÍDA / CONGELADA) │  Congelamento de Arquitetura e Matrizes
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│     Fase 1.3.11.1.1     │  Navegação Global + Produtor × Evento
│ (CONCLUÍDA / AVALIADA)  │  AppSidebar + ProducerSidebar + EventContextSidebar
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│     Fase 1.3.11.1.2     │  Recuperação Completa de EVENTOS
│       (EM FOCO)         │  Reorganização dos 23 sub-domínios operacionais no contexto do evento
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│     Fase 1.3.11.1.3     │  Recuperação Completa do COMERCIAL
│       (PLANEJADA)       │  Desacoplamento: Pedidos & Vendas (Core) vs Gestão B2B & Expansão
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│     Fase 1.3.11.1.4     │  Recuperação Operacional e Financeira
│       (PLANEJADA)       │  SAC (sem 360), Suporte Eventos, Estorno, Financeiro e Contabilidade
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│     Fase 1.3.11.1.5     │  Homologação Visual e Design System Unificado
│       (PLANEJADA)       │  Sidebar Dark Premium (#0f172a) + Workspace Claro Executivo (#f8fafc)
└─────────────────────────┘
```

---

## 3. Detalhamento das Próximas Fases

### Fase 1.3.11.1.2 — Recuperação Completa de EVENTOS
- **Objetivo:** Garantir que o catálogo geral (`/eventos`) seja limpo e executivo, e que todos os 23 subcomponentes existentes no MASTER sejam acessados exclusivamente através da navegação contextual do evento ativo (`/eventos/:eventId/*`).
- **Ações Chave:**
  - Validação da State Machine de Eventos (`DRAFT` → `FINISHED`).
  - Hierarquia estrita: Evento → Sessão → Setor → Ingresso → Lote → Preço.
  - Testes e2e de ciclo de vida completo do evento (`event-full-lifecycle.spec.ts`).

### Fase 1.3.11.1.3 — Recuperação Completa do COMERCIAL
- **Objetivo:** Devolver ao Comercial sua função primária de vendas e distribuição de ingressos.
- **Ações Chave:**
  - Central de Pedidos com busca instantânea e inspeção de itens.
  - Central de Vendas & Performance com abas de drilldown (sessões, setores, lotes, canais).
  - Isolamento do pipeline B2B (oportunidades, propostas, contratos) na sub-seção estruturada "Gestão B2B & Expansão".

### Fase 1.3.11.1.4 — Recuperação de Suporte, SAC, Financeiro e Gestão
- **Objetivo:** Alinhamento dos módulos de atendimento e retaguarda financeira.
- **Ações Chave:**
  - SAC: Central de Consulta consolidada de compradores e reenvio de vouchers.
  - Estorno: Fila de aprovação de cancelamentos integrada ao motor central de alçadas.
  - Financeiro: Saldos por evento, conta corrente do produtor, repasses e conciliação bancária.
  - Contabilidade: Livro Diário, DRE gerencial e relatórios fiscais.

### Fase 1.3.11.1.5 — Design System & Homologação Visual
- **Objetivo:** Aplicação definitiva da estética Limitless traduzida em Tailwind.
- **Ações Chave:**
  - Workspace claro (`#f8fafc`) com cards brancos nítidos (`#ffffff`) e bordas sutis (`#e2e8f0`).
  - Sidebar dark premium (`#0f172a`) de alto contraste.
  - Tipografia executiva, densidade de dados alta e ausência de ruído visual.
