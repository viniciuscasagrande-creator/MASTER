# Repasses Programados e Ciclo de Liquidação Bancária
## Fase 1.3.11.1.4.4

### 1. Visão Geral
O fluxo de repasses coordena a saída de recursos da conta gráfica da plataforma para as contas correntes bancárias dos produtores de eventos, assegurando conformidade com alçadas de aprovação, prazos contratuais de D+X e liquidação formal via PIX ou TED.

### 2. Máquina de Estados do Repasse
```text
[SOLICITAÇÃO] ──> SCHEDULED ──> (Aprovação Maker-Checker) ──> PROCESSING ──> (Liquidação Bancária) ──> COMPLETED
       │                                                             │
       └─────────────────────────────────────────────────────────────┴──> (Rejeição com Justificativa) ──> REJECTED
```

1. **SCHEDULED (Agendado):** Criado pelo operador ou produtor mediante verificação factual de saldo disponível. Saldo fica provisionado (não disponível para novos saques).
2. **PROCESSING (Em Processamento / Aprovado):** Aprovado por usuário com permissão `financeiro.repasses.aprovar`. Se valor > R$ 50.000, exige autenticação Step-Up.
3. **COMPLETED (Liquidado):** Baixa bancária efetivada pelo operador com anexo obrigatório de código de autenticação bancária (ex: `ITAU-PIX-BATCH-...`).
4. **REJECTED (Rejeitado):** Cancelamento formal da solicitação com devolução imediata do saldo provisionado para a disponibilidade do evento.

### 3. Integração com Contas Bancárias Homologadas
Todo repasse deve selecionar uma conta bancária cadastrada na Tesouraria do produtor contendo:
- Código do Banco (ex: 341 - Itaú, 033 - Santander, 001 - Banco do Brasil)
- Agência e Conta Corrente com dígito verificador
- Chave PIX vinculada ao CNPJ/CPF do titular
- Validação de titularidade para impedir desvio de recursos.
