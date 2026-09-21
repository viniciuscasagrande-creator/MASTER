# MAPA FUNCIONAL — SAFESAFF
## Levantamento Sistemático de Funções, Menus, Fluxos e Contextos

**Data:** 20/09/2026  
**Fonte Primária:** Código-fonte auditado em `safesaff/src`  
**Função Arquitetural:** Referência Funcional Mandatória do Disk Interno  

---

## 1. Arquitetura de Contexto do SafeSaff

O SafeSaff operava com base em duas esferas fundamentais de trabalho:

```
                            USUÁRIO AUTENTICADO
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
           CONTEXTO DO PRODUTOR               CONTEXTO DO EVENTO
         (Módulos Gerais da Base)           (Operação de um Evento)
                    │                                 │
            `ModuleSidebar`                 `EventContextSidebar`
                    │                                 │
     • Visão Geral Consolidada         • Cockpit Operacional
     • Todos os Eventos (Catálogo)     • Inventário & Lotes
     • Pedidos & Vendas                • Sessões & Setores
     • Suporte & SAC                   • Ingressos & Preços
     • Estornos & Disputas             • Canais & Cortesias
     • Financeiro & Repasses           • Check-in & Portaria
     • Contabilidade & DRE             • Borderô & Financeiro do Evento
     • Marketing & Remarketing         • Pixels, UTMs & Marketing do Evento
     • Administração Geral             • Equipe, Documentos & Logs
```

---

## 2. Menu Global do Produtor (`ModuleSidebar`)

No SafeSaff, quando nenhum evento individual estava selecionado, a navegação operacional do produtor cobria:

### 2.1. Visão Geral
- **Dashboard Executivo:** Faturamento acumulado, ingressos vendidos, ocupação média e eventos ativos.

### 2.2. Eventos
- **Todos os Eventos:** Listagem com filtros por status (`Em Vendas`, `Agendado`, `Encerrado`), código do evento, data e local. Botão de entrada rápida para abrir o contexto do evento.
- **Novo Evento:** Assistente de cadastro básico inicial.
- **Núcleo Operacional:** Visão agregada de eventos com sessões no mesmo dia.

### 2.3. Comercial e Vendas
- **Pedidos & Vendas (`commerce-orders`):** Consulta centralizada de pedidos da produtora, pesquisa por número do pedido, CPF do comprador, data e status do pagamento (Pago, Pendente, Cancelado, Estornado).
- **Comercial (`commercial-hub`):** Condições comerciais, taxas aplicadas e negociações.

### 2.4. Suporte e Atendimento
- **Suporte a Eventos (`event-support`):** Fila de chamados técnicos de campo e acionamento de contingência.
- **Atendimento SAC (`sac-hub`):** Fila de tickets de clientes, localização de ingressos por CPF/e-mail e reenvio de vouchers.

### 2.5. Estorno e Disputas
- **Centro de Controle de Estornos (`finance-refunds`):** Solicitações de cancelamento, chargebacks de operadoras de cartão e fila de aprovação de devoluções.

### 2.6. Financeiro
- **Dashboard Financeiro:** Saldo disponível, saldo bloqueado e previsões de repasse.
- **Conta Financeira & Extrato:** Lançamentos analíticos de vendas e deduções de taxas.
- **Repasses & Adiantamentos:** Solicitação de saques e borderôs homologados.
- **Conciliação Bancária:** Confronto entre vendas de ingressos e extrato bancário.

### 2.7. Contabilidade
- **Painel Contábil:** Livro Diário, Razão e lançamentos contábeis a crédito e débito.
- **Demonstrativo de Resultado (DRE):** Receitas operacionais, custos e margem líquida.
- **Módulo Fiscal:** Emissão de NFS-e, NF-e e obrigações fiscais (SPED).

### 2.8. Marketing e Remarketing
- **Marketing Hub:** Desempenho de campanhas, atribuição de canais e ROAS consolidado.
- **Remarketing Hub:** Recuperação de carrinhos abandonados, réguas de automação (e-mail e WhatsApp) e cupons promocionais.

---

## 3. Menu Contextual do Evento Selecionado (`EventContextSidebar`)

Ao clicar em um evento específico, o SafeSaff ocultava os menus globais e ativava o `EventContextSidebar`, que continha:

### 3.1. Cabeçalho de Identidade e Seletor
- **Botão de Retorno:** `← Todos os Eventos` (desativa o contexto e retorna ao catálogo geral).
- **`GlobalEventSelector`:** Dropdown compacto no topo da sidebar permitindo trocar de evento imediatamente sem voltar à listagem geral.
- **Cartão do Evento Ativo:** Código (`ID EVT-XXXXX`), badge `Evento Ativo` / `Em Vendas`, título truncado, local e data.

### 3.2. Sub-itens Funcionais do Evento
1. **Cockpit Operacional:** Visão geral da saúde do evento (ingressos vendidos, faturamento bruto, ocupação de setores).
2. **Inventário e Lotes:** Gestão de lotes, virada automática de lote por data ou cota de venda esgotada.
3. **Consulta de Ingressos:** Validação e inspeção de ingressos emitidos para o evento.
4. **Cortesias e Convites:** Emissão nominal de cortesias com autorizador e motivo registrado para auditoria.
5. **Condições Comerciais:** Taxas de conveniência, divisão de receitas (splits) e taxas de cartão contratadas.
6. **Marketing do Evento:**
   - **Pixel GA & Meta Ads:** Configuração multi-pixel específica para as páginas do evento.
   - **Central de UTMs:** Criação de links de rastreamento de venda com parâmetros UTM.
   - **Analytics & Tráfego:** Visitas e conversões na página pública de vendas.
7. **Financeiro do Evento:**
   - **Borderô do Evento:** Fechamento financeiro oficial com receitas brutas, retenções, impostos e saldo líquido do produtor.
   - **Custos & Orçamento:** Lançamentos de despesas da produção associadas ao evento.
8. **Operação e Portaria:**
   - **Check-in & Portaria:** Acompanhamento de leitura de ingressos, catracas e contingência offline.
   - **Central de Incidentes:** Registro de ocorrências durante a realização do evento.
9. **Governança do Evento:**
   - **Equipe e Usuários:** Atribuição de operadores com acesso limitado àquele evento.
   - **Trilha de Auditoria (Logs):** Histórico detalhado de alterações de preço, lote, capacidade e cancelamentos.

---

## 4. Reconciliação dos Termos SafeSaff para o Disk Interno

Para manter a interface 100% em Português do Brasil e aderente à diretriz corporativa de **eliminar termos vagos ou em inglês não-técnico**, estabeleceu-se a seguinte tabela de tradução mandatória:

| Termo no SafeSaff | Termo Reconciliado no Disk Interno | Justificativa |
| :--- | :--- | :--- |
| `Consulta 360° / Dossiê 360°` | **Central de Consulta / Ficha Consolidada** | Expressão "360" expressamente vetada. |
| `Cockpit Operacional` | **Painel Operacional do Evento** | Termo direto e sem jargões desnecessários. |
| `Live Operations` | **Operação em Tempo Real** | Termo formal em pt-BR. |
| `Incident Center` | **Central de Incidentes** | Tradução corporativa fiel. |
| `Revenue Intelligence` | **Performance de Receita** | Foco na métrica objetiva factual. |
| `Readiness / Go-Live` | **Prontidão do Evento** | Clareza operacional em pt-BR. |
| `Forecast Center` | **Projeções de Vendas** | Exibir somente quando houver metodologia matemática formal. |
| `Event Day Command` | **Central do Dia do Evento** | Local de operação consolidada. |
| `Executive Dashboard` | **Painel Executivo** | Tradução correta em pt-BR. |
| `Platform NOC` | **Monitoramento Técnico** | Clareza sem sigla corporativa hermética. |
