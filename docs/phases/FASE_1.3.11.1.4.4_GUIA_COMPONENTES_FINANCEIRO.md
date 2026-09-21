# Guia de Componentes do Frontend — Módulo Financeiro
## Fase 1.3.11.1.4.4 (Design System Limitless)

### 1. Componentes Principais (`apps/web/src/modules/finance/`)
1. **`FinanceDashboard.tsx`:**
   - Hub orquestrador central com navegação horizontal em 8 sub-abas corporativas.
   - Renderização dos cartões executivos de KPI (`StatCard`) com vendas brutas, saldo disponível, repasses pagos e pendentes.
   - Integração com `DiskContext` (produtor ativo) e `AuthContext` (permissões RBAC).
2. **`EventBalancesView.tsx`:**
   - Visualização em cards e tabela dos saldos segregados por evento.
   - Apresenta vendas brutas, taxa Disk retida, receita líquida, repasses pagos/pendentes, transferências e saldo disponível.
   - Ação direta de agendamento de repasse pré-vinculado ao evento.
3. **`TransfersView.tsx` & `NewTransferModal.tsx`:**
   - Tabela analítica de transferências entre eventos com badges de status.
   - Modal com validação de saldo de origem, bloqueio de auto-transferência e alerta para valores > R$ 50.000.
   - Modal de reversão com justificativa operacional e criação de compensação contábil imediata.
4. **`ReceivablesPayablesView.tsx`:**
   - Gestão integrada de Contas a Pagar e Contas a Receber.
   - Cadastro de obrigações com fornecedores (som, luz, segurança, cachê).
   - Baixa de pagamentos com comprovante de autenticação bancária.
5. **`TreasuryCashFlowView.tsx`:**
   - Visualização de fluxo de caixa realizado vs projetado por período.
   - Demonstrativo de Resultado Operacional (DRE) com margem de contribuição.
   - Cards de contas bancárias homologadas da tesouraria.
6. **`AccountStatementView.tsx`:**
   - Extrato completo com filtros de período e tipo de lançamento e exportação CSV.
7. **`ReconciliationView.tsx`:**
   - Painel de conciliação com Cielo, Rede, PIX Banco Central e Asaas.
8. **`NewPayoutModal.tsx` & `PayoutDetailModal.tsx`:**
   - Agendamento e dossiê analítico completo do repasse bancário.
