# Matriz de Auditoria de Mocks e Dados Hardcoded — Fase 1.3.11.1.5

## 1. Visão Geral e Política de Integridade

Uma das diretrizes inegociáveis do **Disk Interno (MASTER)** é a eliminação total de dados simulados ("falsos dados"), KPIs fictícios e gráficos estáticos em ambientes de produção. 

Toda métrica, valor financeiro, contagem de ingressos e lista de pedidos exibida em tela deve ser derivada diretamente do banco de dados relacional (PostgreSQL/Prisma) ou, na ausência de registros, exibir o **estado vazio factual (Empty State)** com contadores zerados (`0`, `R$ 0,00`).

---

## 2. Inventário de Auditoria por Módulo

| Módulo | Componente / Rota Auditada | Status Anterior | Ação de Correção Executada | Estado Atual |
|---|---|---|---|---|
| **Comercial** | `CommercialDashboard.tsx` | KPIs de conversão estáticos em protótipo | Conectado ao endpoint `/api/commercial/sales/overview` | 100% Real / Agregado |
| **Comercial** | `OrdersListPage.tsx` | Array de pedidos fictícios mockado | Conectado ao endpoint `/api/commercial/orders` via React Query | 100% Real / Paginado |
| **Atendimento SAC** | `SacDashboard.tsx` | Chamados mockados com status fixos | Conectado à rota `/api/sac/search` e `/api/sac/tickets` | 100% Real / Dinâmico |
| **Atendimento SAC** | `CustomerDossierModal.tsx`| Pedidos do cliente mockados | Consulta real por CPF/e-mail no banco via backend | 100% Real / Factual |
| **Estorno** | `RefundsDashboard.tsx` | Indicadores de estorno estáticos | Conectado a `/api/refunds` com contadores reais por status | 100% Real / Factual |
| **Estorno** | `NewRefundModal.tsx` | Cálculo fixo de taxa de conveniência | Cálculo dinâmico baseado nos itens reais do pedido | 100% Real / Factual |
| **Financeiro** | `FinancialDashboard.tsx` | Saldo fictício de demonstração | Agregação real de transações liquidadas menos estornos | 100% Real / Factual |
| **Marketing** | `MarketingDashboard.tsx` | ROAS e conversão hardcoded | Integração com logs de atribuição de pedidos | 100% Real / Factual |
| **Remarketing**| `RemarketingDashboard.tsx`| Lista de carrinhos estática | Consulta real a `AbandonedCart` | 100% Real / Factual |

---

## 3. Padrão de Tratamento de Empty States (Estados Vazios)

Quando uma consulta ao banco não retorna dados para o produtor ou evento selecionado:
1. **Contadores e KPIs:** Exibem explicitamente `0`, `0%` ou `R$ 0,00`, sem inventar médias ou dados aproximados.
2. **Tabelas e Gráficos:** Exibem uma mensagem clara e amigável em português:
   - *"Nenhum registro encontrado para este filtro ou período."*
   - Botão de ação direta (quando aplicável): *"Cadastrar primeiro item"* ou *"Limpar filtros"*.
3. **Erros de API:** Nunca substituídos por fallback de dados fictícios. Em caso de falha de rede ou indisponibilidade da API, exibe-se um banner de erro com opção de retentativa ("Tentar novamente").
