# Tesouraria e Fluxo de Caixa Realizado vs Projetado
## Fase 1.3.11.1.4.4

### 1. Papel da Tesouraria no Disk Interno
A Tesouraria homologa as contas bancárias dos produtores para recebimento de repasses e controla a liquidez financeira global, confrontando os recebíveis previstos e os compromissos de repasse e pagamento.

### 2. Contas Bancárias de Tesouraria
- **Campos Estruturais:** Código COMPE do Banco, Nome da Instituição Financeira, Agência com dígito, Conta Corrente com dígito, Tipo de Conta (Corrente/Poupança), Chave PIX e Tipo de Chave (CNPJ, E-mail, Telefone, Aleatória).
- **Homologação:** Uma conta é definida como `isDefault` (Conta Principal) para repasses automáticos, podendo haver contas secundárias homologadas para eventos específicos.

### 3. Modelo do Fluxo de Caixa (Realizado vs Projetado)
O fluxo de caixa segmenta as movimentações financeiras em períodos cronológicos:
- **Entradas Realizadas (`realizedInflows`):** Total de vendas de ingressos já confirmadas e liquidadas em gateways.
- **Saídas Realizadas (`realizedOutflows`):** Total de repasses bancários já pagos aos produtores e fornecedores liquidados.
- **Líquido Realizado (`realizedNet`):** Saldo líquido factual disponível em caixa.
- **Entradas Projetadas (`projectedInflows`):** Recebíveis a vencer de compras parceladas no cartão e boletos emitidos.
- **Saídas Projetadas (`projectedOutflows`):** Repasses agendados e contas a pagar programadas para datas futuras.
- **Saldo Acumulado (`finalBalance`):** Saldo projetado no final do período com garantia de solvência.
