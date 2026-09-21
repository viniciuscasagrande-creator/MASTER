# Extrato Analítico da Conta Corrente do Produtor
## Fase 1.3.11.1.4.4

### 1. Princípios Contábeis do Extrato
O extrato analítico da conta corrente do produtor funciona como o espelho fidedigno de todas as movimentações financeiras ocorridas no sistema. Todo lançamento obedece ao princípio da partida dobrada e da rastreabilidade irrestrita.

### 2. Tipos de Transações Homologadas
| Tipo de Lançamento | Descrição | Impacto no Saldo | Origem do Fato Gerador |
|---|---|---|---|
| `SALE` | Venda de ingressos | Crédito (+) | Módulo Comercial / Pedidos Concluídos |
| `COMMISSION_FEE` | Taxa de conveniência/serviço Disk | Débito (-) | Regra Contratual (ex: 8% a 10%) |
| `TRANSFER_IN` | Entrada por remanejamento inter-eventos | Crédito (+) | Módulo Financeiro (SafeSaff Transfers) |
| `TRANSFER_OUT` | Saída por remanejamento inter-eventos | Débito (-) | Módulo Financeiro (SafeSaff Transfers) |
| `PAYOUT` | Liquidação de repasse bancário | Débito (-) | Módulo Financeiro (Liquidação Bancária) |
| `REFUND` | Estorno de pedido devolvido ao comprador | Débito (-) | Módulo Estorno (Devolução Concluída) |
| `ADJUSTMENT` | Ajuste compensatório autorizado | Crédito/Débito | Diretoria / Auditoria Contábil |

### 3. Recursos de Interface e Exportação
- Filtros rápidos por período: Hoje, Últimos 7 dias, Últimos 30 dias, Mês Atual e Todos.
- Filtro por tipo de movimentação para conciliação contábil rápida.
- Exportação instantânea em CSV analítico contendo: Data, Tipo, Descrição, Valor, Saldo Pós-Lançamento e ID de Referência.
