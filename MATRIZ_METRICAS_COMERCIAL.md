# MATRIZ DE MÉTRICAS & INDICADORES DO COMERCIAL — DISK INTERNO

## 1. Princípio Fundamental de Integridade

No Disk Interno, **nenhuma métrica comercial é inventada, simulada ou baseada em números arbitrários**.
- Pedidos pagos vêm exclusivamente de transações reais conciliadas.
- Ingressos emitidos refletem registros no banco de dados sincronizados com o estoque e catracas.
- Taxas e comissões da DiskIngressos são calculadas diretamente a partir do valor facial e do acordo comercial vigente do evento.

---

## 2. Indicadores Operacionais de Bilheteria (Vendas & Pedidos)

| Métrica | Unidade | Fórmula / Origem de Cálculo | Interpretação Operacional |
| :--- | :--- | :--- | :--- |
| **Vendas Brutas (Gross Sales)** | Moeda (R$) | $\sum \text{totalAmount}$ de todos os pedidos no status `CONFIRMED` / `PAID`. | Faturamento total movimentado pela bilheteria no período selecionado. |
| **Ingressos Emitidos (Tickets Sold)** | Inteiro | $\sum \text{quantity}$ de itens válidos emitidos em pedidos confirmados. | Quantidade de entradas vendidas e aptas para acesso ao evento. |
| **Ticket Médio (Average Order Value)** | Moeda (R$) | $\frac{\text{Vendas Brutas}}{\text{Total de Pedidos Confirmados}}$. | Valor médio gasto por comprador em cada transação efetuada. |
| **Taxa de Ocupação Comercial** | Porcentagem (%) | $\frac{\text{Ingressos Emitidos}}{\text{Capacidade Total Cadastrada}} \times 100$. | Percentual do inventário de ingressos do evento que já foi comercializado. |
| **Velocidade de Vendas** | Ingressos/hora | $\frac{\text{Ingressos Vendidos nas últimas } N \text{ horas}}{N}$. | Ritmo de absorção do evento, crucial para prever momento de virada de lote. |
| **Taxas de Serviço Disk (Disk Fees)** | Moeda (R$) | $\sum \text{feeAmount}$ apurado conforme a regra do acordo comercial do evento. | Receita líquida retida pela DiskIngressos por prestação do serviço de bilhetagem. |
| **Spread Comercial** | Moeda (R$) | $\sum (\text{Preço de Venda do Canal} - \text{Preço Base}) \times \text{Qtd}$. | Margem adicional obtida por canais diferenciados ou operações especiais. |
| **Saldo Elegível para Antecipação** | Moeda (R$) | $\text{Receita Líquida de Pedidos Pagos} \times \text{Teto \% (ex: 70\%)}$. | Limite máximo que o produtor pode solicitar via operação Advanced. |

---

## 3. Indicadores de Gestão Comercial B2B

| Métrica | Unidade | Origem / Metodologia | Finalidade Gerencial |
| :--- | :--- | :--- | :--- |
| **Produtoras Ativas na Carteira** | Inteiro | Produtoras com status `ACTIVE` e pelo menos 1 evento em vendas nos últimos 12 meses. | Monitoramento da base comercial produtiva. |
| **Pipeline Ponderado B2B** | Moeda (R$) | $\sum (\text{Valor Estimado da Oportunidade} \times \text{Probabilidade do Estágio})$. | Projeção factual de receita futura com novos contratos. |
| **Taxa de Conversão de Propostas** | Porcentagem (%) | $\frac{\text{Propostas Aceitas}}{\text{Total de Propostas Enviadas}} \times 100$. | Eficiência da equipe comercial no fechamento de novos acordos. |
| **Índice de Retenção / Renovação** | Porcentagem (%) | $\frac{\text{Contratos Renovados}}{\text{Contratos com Vencimento no Período}} \times 100$. | Acompanhamento de churn de produtoras parceiras. |
