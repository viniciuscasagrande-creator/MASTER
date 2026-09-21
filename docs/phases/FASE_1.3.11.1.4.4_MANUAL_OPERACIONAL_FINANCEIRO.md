# Manual Operacional do Módulo Financeiro — Disk Interno
## Fase 1.3.11.1.4.4

### 1. Instruções para o Operador Financeiro
O operador financeiro é responsável pela gestão diária dos saldos, autorizações e conciliações dos produtores de eventos.

### 2. Passo a Passo: Transferência Entre Eventos
1. Acesse o menu lateral em **GESTÃO > Financeiro > Transferências entre Eventos**.
2. Clique no botão **Nova Transferência** no canto superior direito.
3. Selecione o **Evento de Origem (Débito)** — o sistema exibe o saldo disponível em tempo real.
4. Selecione o **Evento de Destino (Crédito)** — não é permitido selecionar o mesmo evento.
5. Digite o **Valor (R$)** desejado — o sistema valida se há saldo suficiente.
6. Digite a **Justificativa Operacional** — descreva o motivo do remanejamento (ex: despesa técnica compartilhada).
7. Clique em **Confirmar Transferência**:
   - Valores até R$ 50.000: liquidação instantânea.
   - Valores acima de R$ 50.000: entra em aprovação da Diretoria.

### 3. Passo a Passo: Reversão de Transferência
1. Na listagem de transferências, localize a transferência concluída e clique em **Reverter**.
2. No modal aberto, confira os eventos de origem e destino e o montante a ser compensado.
3. Preencha obrigatoriamente a **Justificativa da Reversão**.
4. Clique em **Confirmar Reversão**: o sistema emite uma transferência compensatória reversa com prefixo `REV-` mantendo o histórico de auditoria intacto.

### 4. Passo a Passo: Agendamento e Baixa de Repasses Bancários
1. Na aba **Visão Geral** ou **Repasses Programados**, clique em **Novo Repasse**.
2. Selecione o evento, digite o valor, data de agendamento e selecione a conta bancária homologada.
3. Salve a solicitação.
4. Após aprovação pelo Checker, proceda à liquidação bancária via banco (PIX/TED) e informe o **Código de Autenticação Bancária** para efetivar a baixa no sistema.

### 5. Passo a Passo: Contas a Pagar
1. Na aba **Contas a Pagar & Receber**, clique em **Nova Conta a Pagar**.
2. Preencha o Favorecido, Categoria, Centro de Custo, Evento Vinculado, Valor, Vencimento e Forma de Pagamento.
3. Para liquidar uma obrigação, clique em **Baixar** na tabela e informe a autenticação do comprovante.
