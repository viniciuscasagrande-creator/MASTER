# Gestão de Contas a Pagar e Contas a Receber
## Fase 1.3.11.1.4.4

### 1. Visão Geral
O submódulo de Contas a Pagar e Receber conecta a operação dos eventos à gestão financeira de competência e caixa, permitindo o provisionamento de despesas operacionais da produção e a previsão de recebíveis de canais de venda externos.

### 2. Contas a Pagar (Obrigações Operacionais)
- **Categorias Suportadas:** Infraestrutura (Som, Luz, LED, Gerador), Segurança e Brigada Tática, Artístico e Cachês, Marketing e Tráfego, Locação de Espaço, Limpeza e Apoio.
- **Campos Mandatórios:** Fornecedor/Favorecido, Categoria, Centro de Custo, Evento Vinculado (ou Geral do Produtor), Valor (R$), Data de Vencimento, Forma de Pagamento (Boleto, PIX, TED, Cartão) e Observações.
- **Fluxo de Baixa:**
  1. Criação no status `A_PAGAR` ou `EM_APROVACAO`.
  2. Execução da liquidação pelo operador financeiro com preenchimento obrigatório do código de autenticação bancária.
  3. Atualização automática para status `PAGO` com data e hora da baixa registradas.

### 3. Contas a Receber (Recebíveis de Venda)
- **Origem dos Recebíveis:** Cartão de Crédito Parcelado, Boleto Bancário, PIX e PDV Consignado.
- **Detalhamento:** Adquirente processador, Evento Vinculado, Valor Bruto, Taxa de Intercâmbio/Adquirência, Valor Líquido a Receber, Data Prevista de Vencimento/Depósito e Status (`A_RECEBER`, `RECEBIDO`, `ANTECIPADO`, `ATRASADO`).
