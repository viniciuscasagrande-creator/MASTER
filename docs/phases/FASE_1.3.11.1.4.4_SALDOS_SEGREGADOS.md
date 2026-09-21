# Segregação Estrita de Saldos por Evento
## Fase 1.3.11.1.4.4

### 1. Conceito de Centro de Custo Segregado
Cada evento cadastrado por um produtor opera como uma unidade contábil independente (centro de custo isolado). É terminantemente proibido que o saldo de um evento "A" cubra automaticamente os custos ou repasses de um evento "B" sem uma transferência formal deliberada e auditada.

### 2. Equação Fundamental do Saldo Disponível do Evento
```text
SALDO DISPONÍVEL = RECEITA LÍQUIDA 
                 + TRANSFERÊNCIAS ENTRANTES 
                 - TRANSFERÊNCIAS SAINTES 
                 - REPASSES LIQUIDADOS 
                 - REPASSES AGENDADOS/PENDENTES
```
Onde:
- **Receita Líquida:** `Vendas Brutas - Taxa Retida Disk - Estornos Efetivados`.
- **Transferências Entrantes (`transfersIn`):** Saldo recebido de outros eventos do mesmo produtor.
- **Transferências Saintes (`transfersOut`):** Saldo remanejado para outros eventos do mesmo produtor.
- **Repasses Liquidados (`paidPayouts`):** Montante já enviado para a conta bancária do produtor via PIX/TED.
- **Repasses Pendentes (`pendingPayouts`):** Montante reservado em solicitações agendadas ou em processamento (garantia de provisão).

### 3. Garantia de Isolamento
Caso um evento possua saldo negativo devido a estornos posteriores ou adiantamentos, o saldo disponível é travado em `R$ 0,00` para fins de saque, e nenhum repasse pode ser agendado até a regularização do balanço por novas vendas ou remanejamento de outro evento com saldo positivo.
