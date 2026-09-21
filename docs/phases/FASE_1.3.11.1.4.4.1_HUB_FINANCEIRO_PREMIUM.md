# Fase 1.3.11.1.4.4.1 — Hub Financeiro Premium & Padrão Visual dos Módulos
## Arquitetura de Hub, Reusabilidade de Componentes e Experiência de Navegação

### 1. Contexto e Motivação
A partir do alinhamento com a referência funcional do sistema (`financeiropdtnovo`), estabeleceu-se que o Disk Interno deve ir além da infraestrutura de rotas e APIs do backend: ele requer uma **arquitetura de experiência e navegação centrada em Hubs de Módulo**.

Em vez de menus laterais sobrecarregados de opções ou dashboards genéricos estáticos, cada módulo possui seu **Hub** dedicado organizado por áreas funcionais (**OPERAÇÕES**, **CONTROLE & RISCO**, **GESTÃO DE CAIXA**, **INTELIGÊNCIA & AUDITORIA**), apresentando atalhos rápidos, indicadores factuais, painel de governança e cards de recursos operacionais.

### 2. Conjunto de Componentes Reutilizáveis Criados (`apps/web/src/shared/components/hub/`)
1. **`ModuleHub`:** Estrutura base de página com fundo em gradiente e ambient glow dinâmico configurável (`emerald`, `purple`, `cyan`, etc.).
2. **`ModuleHero`:** Banner executivo com título, subtítulo, badges, contexto do produtor/evento ativo e botões de ação globais.
3. **`ModuleMetricStrip`:** Barra responsiva de indicadores factuais com valor, rótulo, badge de tendência e ícones temáticos.
4. **`ModuleQuickActions`:** Botões instantâneos de acionamento de fluxos prioritários (ex: "Solicitar Repasse", "Nova Transferência", "Lançar Provisão").
5. **`ModuleStatusPanel`:** Painel de saúde e conformidade com indicadores de Maker-Checker, Alçadas Step-Up, Conciliação e Contas Bancárias.
6. **`ModuleSection`:** Seção estrutural de agrupamento com título em caixa alta, descrição de escopo e grid responsivo.
7. **`ModuleFeatureCard`:** Cartão interativo com ícone estilizado, descrição funcional, indicador de posição em tempo real e hover animado com navegação direta (`→`).
8. **`ModuleRecentActivity`:** Feed dinâmico de atividades recentes e auditoria contábil.

### 3. Implementação do Hub Financeiro (`FinanceHub.tsx`)
- **Organização por Clusters:**
  - **OPERAÇÕES:** Conta Financeira (Posição Geral), Saldos por Evento (Segregado), Transferências Entre Eventos (SafeSaff), Repasses Programados (Maker-Checker), Extrato Analítico da Conta (Lançamentos) e Antecipações & Crédito (Spread Transparente).
  - **CONTROLE & AUDITORIA:** Conciliação com Gateways (Cielo, Rede, PIX), Pagamentos, Taxas & Split Contratual, e Centros de Custo & Orçamento.
  - **GESTÃO DE CAIXA:** Contas a Pagar (Fornecedores de Produção), Contas a Receber (Canais de Venda), Fluxo de Caixa Real vs Projetado, DRE Gerencial por Evento, Tesouraria & Contas Bancárias e Borderô Oficial de Fechamento.
- **Transição Fluida:** Ao clicar em qualquer card do Hub, o usuário navega instantaneamente para a tela operacional correspondente, dispondo de um botão de retorno proeminente (`← Hub Financeiro`) no topo da página.
- **Novas Telas Especializadas Criadas:**
  - `AdvancesView.tsx`: Simulador de antecipação com slider de valor, spread mensal (1.8% a.m.), IOF e alçada Maker-Checker.
  - `BorderoView.tsx`: Fechamento contábil e fiscal de evento com resumo de bilheteria, retenção de ISS, taxas Disk e campo de assinatura digital.

### 4. Padrão Padronizado para os Próximos Módulos
Este mesmo padrão visual e de navegação será aplicado diretamente na construção de:
- **Contabilidade (1.3.11.1.4.5):** Hub Contábil com Livro Diário, Razão, Balancete, DRE Fiscal e Conciliação.
- **Marketing (1.3.11.1.4.6):** Hub de Marketing com Campanhas, Central de Mídia, Pixels, UTMs e Atribuição ROAS.
- **Remarketing (1.3.11.1.4.7):** Hub de Remarketing com Carrinho Abandonado, Jornadas e Réguas de Automação.
