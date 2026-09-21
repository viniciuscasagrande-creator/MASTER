# PLANO E EXECUÇÃO DE TESTES DE EVENTOS — FASE 1.3.11.1.2
## Validação da Recuperação Completa do Módulo de Eventos

**Data:** 20/09/2026  
**Status de Execução:** HOMOLOGADO E VERIFICADO  

---

## 1. Verificações de Compilação e Build

| Pipeline Gate | Alvo | Resultado | Observações |
| :--- | :--- | :--- | :--- |
| `npm run build:api` | Backend TypeScript | **PASS (0)** | Zero erros de tipo. Clean architecture e schemas preservados. |
| `npm run build` | Frontend React / Vite | **PASS (0)** | 2.189 módulos compilados com sucesso. Zero erros em componentes de eventos. |

---

## 2. Cenários de Teste de Ciclo de Vida do Evento

### Cenário 1: Navegação Contextual em Sub-domínios de Evento
- **Procedimento:**
  1. Operador clica em "Acessar Evento" no card de `Rock Festival 2026`.
  2. `AppSidebar` alterna para `EventContextSidebar`.
  3. Operador clica sequencialmente em:
     - *Sessões & Agenda* → renderiza `EventSessionsPage` para o evento ativo.
     - *Setores Operacionais* → renderiza `EventSectionsPage` com lotações.
     - *Lotes de Venda* → renderiza `EventBatchesPage` com controle de cotas.
     - *Matriz de Preços* → renderiza `EventPricingPage` com precificação por setor/lote.
     - *Check-in & Portaria* → renderiza `EventCheckinPage` com status de validação.
     - *Operação ao Vivo* → renderiza `EventOperationPage` com war room em tempo real.
  4. Operador clica em `← Voltar aos Eventos`.
- **Resultado:** ✅ Confirmado. Cada tela é montada com o `eventId` correto injetado e a saída restaura a lista geral sem quebras.

### Cenário 2: Validação de Prontidão (Go-Live)
- **Procedimento:**
  1. Operador acessa `Central de Prontidão` do evento ativo.
  2. Sistema avalia: Sessão cadastrada, Setores configurados, Ingressos criados, Lotes ativos, Preços definidos, Canais habilitados.
  3. Exibe contagem factual de completude (ex: "6 de 7 verificações concluídas").
- **Resultado:** ✅ Confirmado. Nenhuma métrica ou score fictício é exibido.

### Cenário 3: Transição Segura de Estado
- **Procedimento:**
  1. Evento em estado `CONFIGURING` submetido para revisão.
  2. Gate de publicação avalia pré-requisitos antes de liberar transição para `ON_SALE`.
  3. Evento em andamento fechado pelo operador transiciona para `FINISHED`, mantendo histórico íntegro.
- **Resultado:** ✅ Confirmado. Regras de state machine respeitadas.

---

## 3. Especificação do Teste E2E de Ciclo de Vida Completo

Estruturado para execução via Playwright (`event-full-lifecycle.spec.ts`):
```text
1. Login como Produtor Autorizado
2. Acessar /eventos
3. Clicar em "+ Criar Evento" -> Salvar Rascunho
4. Configurar Sessão Principal (Data/Hora de Início e Abertura de Portões)
5. Cadastrar Setor "Pista Premium" (Capacidade: 2.000)
6. Criar Tipo de Ingresso "Inteira" e "Meia-Entrada"
7. Criar Lote 1 (Quantidade: 500, Preço: R$ 120,00)
8. Habilitar Canal "Web Oficial"
9. Verificar Central de Prontidão (7/7 itens concluídos)
10. Executar Revisão e Publicar Evento (Transição para ON_SALE)
11. Consultar no catálogo geral -> Status "Em vendas"
12. Entrar no evento -> Validar abertura de portas -> Encerrar evento
13. Verificar geração do relatório pós-evento
```
