# MATRIZ DE SEPARAÇÃO: COMERCIAL OPERACIONAL × GESTÃO B2B

## 1. Por que a Separação é Necessária?

Na versão anterior do MASTER, o menu Comercial misturava a venda de ingressos aos clientes finais com o relacionamento comercial B2B entre a DiskIngressos e as produtoras. Isso gerava confusão em termos de permissões, métricas e fluxos de trabalho.

A matriz abaixo estabelece a fronteira clara entre os dois domínios:

| Critério | Comercial Operacional (Vendas de Ingressos) | Gestão Comercial B2B (Contas & Produtores) |
| :--- | :--- | :--- |
| **Público / Interlocutor** | Compradores de ingressos, bilheteiros, operadores de PDV e equipe de conferência. | Produtores de eventos, diretores de produtoras, gerentes de contas da DiskIngressos. |
| **O que é Comercializado?** | Ingressos para eventos (inteira, meia, VIP, camarote, passaporte). | Serviços da DiskIngressos (bilhetagem, locação de catracas, equipe de portaria, marketing). |
| **Fonte Primária de Dados** | Commerce Core (Pedidos, Pagamentos, Gateways, Ledger, Catracas). | Pipeline CRM (Leads, Propostas, Contratos, Metas Comerciais, Aditivos). |
| **Frequência de Atualização** | Tempo real (segundos/minutos durante vendas oficiais e viradas de lote). | Periódica (diária, semanal ou mensal conforme o ciclo de negociação). |
| **Taxas Envolvidas** | Taxa de conveniência/serviço (% ou fixa) cobrada do comprador ou repassada. | Taxas contratuais acordadas com a produtora (% de bilhetagem, spread, mensalidade). |
| **Ações Típicas** | Consultar pedido, reemitir ingresso, conciliar pagamento, aprovar antecipação de repasse. | Criar oportunidade, enviar proposta comercial, emitir aditivo de contrato, calcular meta da equipe. |

---

## 2. Alocação dos Componentes e Rotas

### Grupo 1: Comercial Operacional (Bilheteria & Vendas)
- **`commercial-dashboard`**: Visão Geral de Vendas e Faturamento da Bilheteria.
- **`commercial-orders`**: Central de Pedidos Omnichannel.
- **`commercial-orders-detail` / Dossiê**: Dossiê Operacional do Pedido (sem o termo "360").
- **`commercial-sales`**: Ritmo de Vendas e Velocidade de Comercialização.
- **`commercial-performance`**: Análise de Performance e Absorção de Capacidade.
- **`commercial-conditions`**: Condições Comerciais & Taxas dos Eventos.
- **`commercial-channels`**: Central de Canais de Venda (Site, PDV, Bilheteria, Produtor).
- **`commercial-advances`**: Operações de Antecipação de Recebíveis (Advanced).

### Grupo 2: Gestão Comercial B2B (Relacionamento & Contratos)
- **`commercial-producers`**: Carteira de Produtoras Cadastradas.
- **`commercial-portfolio`**: Minha Carteira Comercial (Executivo de Contas).
- **`commercial-leads`**: Central de Prospecções (Leads de Novas Produtoras).
- **`commercial-opportunities`**: Pipeline e Funil de Negociações B2B.
- **`commercial-proposals`**: Propostas Comerciais de Prestação de Serviços.
- **`commercial-contracts`**: Contratos de Bilhetagem e Habilitações Operacionais.
- **`commercial-catalog`**: Catálogo de Ofertas, Módulos e Serviços da DiskIngressos.
- **`commercial-account-management`**: Gestão de Contas, Renovações, Upgrades e Downgrades.
