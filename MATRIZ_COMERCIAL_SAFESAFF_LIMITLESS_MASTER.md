# MATRIZ COMERCIAL: SAFESAFF × LIMITLESS × MASTER

Esta matriz detalha a correspondência tripla entre a funcionalidade do SafeSaff, a experiência de usuário do Limitless e a base técnica do MASTER para cada elemento do módulo Comercial.

---

## 1. Mapeamento de Funcionalidades & Componentes

| Funcionalidade Comercial | Referência SafeSaff (Regra & Comportamento) | Referência Limitless (UI/UX & Estilo) | Implementação MASTER (Código & Arquitetura) |
| :--- | :--- | :--- | :--- |
| **Visão Geral Comercial** | `CommercialHubPage.tsx`: KPIs consolidados de eventos (ativos, em configuração, encerrados), vendas brutas, taxas Disk retidas, spread e antecipações. Alertas automáticos de irregularidade. | Dashboard executivo com cards com borda neutra `border-slate-800`, KPIs com ícones semânticos, badge de integridade e paleta escura profissional. | `CommercialDashboardPage.tsx` + `CommercialHubView`: Integração com `CommercialApi.getDashboard` e consolidação em tempo real. |
| **Condições Comerciais do Evento** | `EventCommercialAgreement`: Definição de taxas (percentual em BPS ou fixa em centavos), quem paga (comprador/produtor), spread, antecipações e prazos de repasse. | Modal e formulário com campos numéricos formatados, switch de ativação de spread/advance e aviso visual de impacto. | `CommercialConditionsPage.tsx` + `backend/src/modules/commercial/agreements`: Versionamento imutável e trilha de auditoria. |
| **Central de Pedidos Omnichannel** | `CommerceOrdersHubPage.tsx`: Tabela com filtro de canais (Site, Bilheteria, PDV, Portal Produtor), status de pagamento e comprador. | Tabela densa `DiskDataTable`, paginação Limitless (10, 25, 50, 100), badges de status e botão de ação rápida "Dossiê". | `OrdersPage.tsx`: Consome `CommercialApi.listOrders` com suporte completo a filtros omnichannel e busca rápida. |
| **Dossiê Operacional do Pedido** | `OrderDossier360Modal.tsx`: Abas Geral, Ingressos, Pagamento, Timeline e Técnico. Reemissão de ingressos e conciliação direta de pagamento. | Drawer/Modal centrado de largura máxima `max-w-5xl`, abas horizontais com sublinhado ativo laranja, visualizador de payload monoespaçado. | `OrderDossierModal.tsx`: Sem o termo "360", com ações de reconciliação e reemissão integradas ao backend. |
| **Vendas & Performance** | `CommercialSalesPage.tsx` / `EventCommercialCharts.tsx`: Velocidade de vendas (vendas/hora), ritmo diário, projeção de fechamento e drilldowns. | Gráficos com barras horizontais e verticais, tabelas com colunas ordenáveis e indicadores percentuais de absorção. | `CommercialSalesPage.tsx`: Suporte a drilldown multi-nível (evento, sessão, setor, tipo de ingresso, lote, canal). |
| **Canais de Venda** | Tipos canônicos de canal e comissões por canal de venda da bilheteria ao site oficial. | Cards por canal de venda com status operacional, volume comercializado e taxas aplicadas. | `CommercialChannelsPage.tsx`: Gestão dos canais autorizados e volume comercial. |
| **Operações de Antecipação (Advanced)** | `AdvanceOperation`: Solicitação de antecipação pelo produtor, validação do saldo elegível de pedidos pagos e aprovação comercial. | Tabela de solicitações de antecipação com status (solicitada, aprovada, transferida, liquidada) e cálculo transparente de custos. | `CommercialAdvancesPage.tsx`: Validação estrita de limites e cálculo de custos financeiros. |
| **Gestão B2B: Carteira & Produtores** | Não implementado no SafeSaff (era manual fora do sistema). | Visualização executiva de produtores com status de conta, responsável comercial e métricas de faturamento. | `ProducersPage.tsx` e `MyPortfolioPage.tsx`: Preservados da Fase 1.3.3. |
| **Gestão B2B: Oportunidades & Pipeline** | Não implementado no SafeSaff. | Visualização Kanban e lista com estágios visuais e probabilidades de fechamento. | `OpportunitiesPage.tsx` e `OpportunityDetailsPage.tsx`: Preservados da Fase 1.3.4. |
| **Gestão B2B: Propostas & Contratos** | Não implementado no SafeSaff. | Visualização de versões, comparador de minutas e gerador de documentos. | `ProposalsPage.tsx` e `ContractsPage.tsx`: Preservados das Fases 1.3.5 e 1.3.6. |
| **Gestão B2B: Catálogo DiskIngressos** | Não implementado no SafeSaff. | Catálogo de planos e ofertas de bilhetagem com versionamento de preços. | `CommercialCatalogPage.tsx`: Preservado da Fase 1.3.7. |
| **Gestão B2B: Renovações & Contas** | Não implementado no SafeSaff. | Painel de monitoramento de churn, vencimento de contratos e solicitações de upgrade/downgrade. | `AccountManagementPage.tsx`: Preservado da Fase 1.3.9. |

---

## 2. Princípios de Coexistência no MASTER

1. **Prioridade de Vendas**: O operador que abre o menu "Comercial" vê primeiro os números reais da operação de bilheteria — pedidos, vendas, ingressos emitidos e taxas dos eventos.
2. **Isolamento de Domínio**: Um produtor contratando um serviço da Disk (ex: locação de catracas ou taxa especial de bilhetagem) é gerenciado no subsetor B2B. A venda de ingressos aos compradores finais é gerenciada no Core de Vendas.
3. **Imutabilidade e Auditoria**: Toda alteração de taxa de conveniência ou repasse gera uma nova versão do acordo comercial e um log de auditoria com justificativa obrigatória.
