# AUDITORIA DE NAVEGAÇÃO E CONTEXTO — FASE 1.3.11.1.1
## Recuperação da Navegação Global e Contexto Produtor × Evento

**Data:** 20/09/2026  
**Status:** Auditado e Aprovado  

---

## 1. Diagnóstico do Estado Inicial no MASTER

### O que existia:
- `Sidebar.tsx` atuava como um menu monolítico único com mais de 500 linhas, contendo todos os módulos do sistema e, dentro de `events`, 25 sub-itens empilhados.
- Ao clicar em sub-itens de evento (ex: "Setores", "Lotes", "Matriz de Preços"), o sistema tentava renderizar a tela para um evento selecionado, mas se nenhum evento estivesse selecionado, forçava o fallback para `events[0]` sem aviso ou ficava em estado órfão.
- A barra lateral exibia os 25 sub-itens de evento permanentemente, mesmo quando o operador estava navegando na "Visão Geral" do produtor ou no "Financeiro".
- O termo "360°" estava presente em múltiplos locais (ex: `sac-query-center`, `EventSectionsPage`, `EventCapacityPage`).
- Mocks (`INITIAL_PRODUCERS` e `INITIAL_EVENTS`) estavam em uso no `DiskContext` sem indicador de fallback de desenvolvimento.

### O que o SafeSaff ensinou:
- O SafeSaff separava categoricamente o contexto:
  - **Contexto Produtor:** `ModuleSidebar` exibia apenas os grandes módulos gerais (Eventos, Comercial, Suporte, SAC, Financeiro, Contabilidade, Marketing).
  - **Contexto Evento:** Ao entrar no evento, a barra lateral era substituída por `EventContextSidebar`, com o botão `← Todos os Eventos` no topo, o `GlobalEventSelector` para troca rápida e os sub-itens operacionais daquele evento.
- Ao sair do evento (`clearEvent()` / `deselectEvent()`), o sistema restaurava imediatamente a `ModuleSidebar` global.

---

## 2. Decisão Arquitetural Homologada

1. **`AppSidebar` (`apps/web/src/shared/components/Sidebar.tsx`):**
   - Transforma-se em orquestrador dinâmico:
     ```tsx
     const isEventContextActive = Boolean(selectedEventId && selectedEventId !== 'all' && activeEvent);

     return isEventContextActive ? (
       <EventContextSidebar ... />
     ) : (
       <ModuleSidebar ... />
     );
     ```
2. **`ModuleSidebar` (`apps/web/src/shared/components/ModuleSidebar.tsx`):**
   - Atende à visão consolidada do Produtor.
   - Retira da barra global as 25 ferramentas específicas de evento.
   - Em `Eventos`, expõe apenas: `Painel de Eventos`, `Todos os Eventos`, `Criar Evento`, `Locais & Plantas`, `Sessões & Calendário`, `Operação Geral`, `Pendências Globais` e `Eventos Arquivados`.
3. **`EventContextSidebar` (`apps/web/src/shared/components/EventContextSidebar.tsx`):**
   - Ativa ao selecionar um evento ativo.
   - Apresenta o botão `← Voltar aos Eventos`.
   - Apresenta o cartão de identidade do evento (Código, Status `Em Vendas`, Título, Produtor, Data).
   - Apresenta os sub-domínios operacionais organizados em grupos conceituais:
     - `VISÃO GERAL`: Painel do Evento
     - `PLANEJAMENTO & ESTRUTURA`: Sessões & Agenda, Locais & Plantas
     - `INGRESSOS & PRECIFICAÇÃO`: Setores, Tipos de Ingresso, Lotes de Venda, Matriz de Preços, Capacidade, Regras, Cortesias, Canais
     - `EQUIPE & PRONTIDÃO`: Equipe, Documentos, Pendências, Prontidão, Alterações, Revisão & Publicação
     - `OPERAÇÃO AO VIVO & ENCERRAMENTO`: Check-in & Portaria, Operação ao Vivo, Encerramento, Relatório Pós-Evento, Cancelamento
     - `MÓDULOS VINCULADOS AO EVENTO`: Financeiro do Evento, Marketing do Evento, Pedidos do Evento, SAC do Evento
4. **Preservação Integral do `DiskContext`:**
   - Mantido como autoridade única para usuário, produtor e evento.
   - Adicionada a distinção entre ambiente real de API e fallback de desenvolvimento.
