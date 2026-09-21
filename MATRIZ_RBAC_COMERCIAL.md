# MATRIZ DE RBAC DO COMERCIAL — DISK INTERNO

## 1. Permissões Granulares do Módulo Comercial

A taxonomia de permissões granulares no formato `comercial.[recurso].[acao]` garante controle total de acesso entre operadores de bilheteria, gerentes comerciais, executivos B2B e produtores parceiros:

| Código da Permissão | Módulo | Recurso | Ação | Finalidade Operacional |
| :--- | :--- | :--- | :--- | :--- |
| `comercial.dashboard.visualizar` | Comercial | Dashboard | Visualizar | Permite abrir o painel executivo com contadores de ingressos e volume de pedidos. |
| `comercial.vendas.visualizar` | Comercial | Vendas | Visualizar | Consulta de relatórios e ritmos de venda em tempo real. |
| `comercial.vendas.valores.visualizar` | Comercial | Vendas | Visualizar Valores | Permite ver cifras monetárias (R$); sem ela, apenas contadores numéricos de ingressos são exibidos. |
| `comercial.vendas.performance.visualizar` | Comercial | Vendas | Performance | Acesso a indicadores analíticos (vendas/hora, projeções e taxas de absorção). |
| `comercial.vendas.exportar` | Comercial | Vendas | Exportar | Permite exportar relatórios de vendas em CSV/Excel. |
| `comercial.pedidos.visualizar` | Comercial | Pedidos | Visualizar | Acesso à listagem geral de pedidos e busca por protocolo. |
| `comercial.pedidos.detalhes` | Comercial | Pedidos | Detalhes | Abertura do Dossiê Operacional do pedido, itens e dados da adquirente. |
| `comercial.pedidos.exportar` | Comercial | Pedidos | Exportar | Exportação da base de transações em CSV. |
| `comercial.produtores.visualizar` | Comercial | Produtores | Visualizar | Consulta da carteira de produtoras cadastradas. |
| `comercial.produtores.detalhes` | Comercial | Produtores | Detalhes | Visualização da ficha financeira e histórica da produtora. |
| `comercial.produtores.editar` | Comercial | Produtores | Editar | Atualização cadastral de dados comerciais e contatos do produtor. |
| `comercial.carteira.visualizar` | Comercial | Carteira | Visualizar | Consulta dos produtores atribuídos à carteira do operador. |
| `comercial.carteira.atribuir` | Comercial | Carteira | Atribuir | Permite transferir produtoras entre executivos de contas. |
| `comercial.prospeccoes.visualizar`| Comercial | Prospecções | Visualizar | Acesso à central de leads e novos organizadores. |
| `comercial.prospeccoes.criar` | Comercial | Prospecções | Criar | Cadastro de novos prospects no sistema. |
| `comercial.prospeccoes.converter` | Comercial | Prospecções | Converter | Conversão de prospect em produtora formal no sistema. |
| `comercial.oportunidades.visualizar`| Comercial | Oportunidades | Visualizar | Acesso ao funil/pipeline de negociações B2B. |
| `comercial.oportunidades.criar` | Comercial | Oportunidades | Criar | Abertura de nova negociação no pipeline. |
| `comercial.oportunidades.mover` | Comercial | Oportunidades | Mover | Mudança de estágio no funil de vendas. |
| `comercial.propostas.visualizar` | Comercial | Propostas | Visualizar | Leitura de propostas de bilhetagem e valores. |
| `comercial.propostas.criar` | Comercial | Propostas | Criar | Elaboração de nova proposta comercial. |
| `comercial.contratos.visualizar` | Comercial | Contratos | Visualizar | Leitura de contratos de bilhetagem assinados e ativos. |
| `comercial.contratos.criar` | Comercial | Contratos | Criar | Emissão de novo contrato a partir de proposta. |
| `comercial.contratos.editar` | Comercial | Contratos | Editar | Configuração de aditivos e taxas de acordos de eventos. |
| `comercial.catalogo.visualizar` | Comercial | Catálogo | Visualizar | Consulta de produtos e módulos oferecidos pela DiskIngressos. |
| `comercial.gestao_contas.visualizar`| Comercial | Gestão Contas | Visualizar | Painel de monitoramento de renovações e retenção. |

---

## 2. Perfis de Acesso (Roles) e Mapeamento Comercial

| Perfil (Role) | Escopo Típico | Permissões Comerciais Concedidas |
| :--- | :--- | :--- |
| **`admin_geral`** | Global | Todas as permissões comerciais (operacionais e B2B). |
| **`admin_operacional`** | Global | Permissões operacionais de bilheteria, pedidos, dossiê, relatórios e exportações. |
| **`comercial`** | Global / Carteira | Todas as permissões operacionais + gestão B2B (oportunidades, propostas, contratos, catálogo). |
| **`produtor`** | Própria Produtora | `comercial.dashboard.visualizar`, `comercial.pedidos.visualizar`, `comercial.pedidos.detalhes`, `comercial.vendas.visualizar`, `comercial.vendas.valores.visualizar`. Sem acesso a leads ou outros produtores. |
| **`sac`** | Global | `comercial.pedidos.visualizar`, `comercial.pedidos.detalhes` (para conferência de compras de clientes). |
| **`financeiro`** | Global | `comercial.dashboard.visualizar`, `comercial.pedidos.visualizar`, `comercial.vendas.visualizar`, `comercial.vendas.valores.visualizar`. |
