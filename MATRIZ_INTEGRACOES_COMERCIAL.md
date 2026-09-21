# MATRIZ DE INTEGRAÇÕES DO COMERCIAL — DISK INTERNO

## 1. Mapa de Interações com Outros Módulos

O Comercial não opera de forma isolada; ele se conecta diretamente com a infraestrutura operacional e contábil da plataforma:

```text
                  ┌──────────────────────┐
                  │    COMMERCE CORE     │
                  │ (Pedidos & Ingressos)│
                  └──────────┬───────────┘
                             │
                             ▼
┌─────────────────┐   ┌──────────────┐   ┌──────────────────┐
│     EVENTOS     │◄──┤  COMERCIAL   ├──►│    FINANCEIRO    │
│ (Lotes & Taxas) │   │ (Operação &  │   │ (Repasse, Borderô│
└─────────────────┘   │  Acordos B2B)│   │  & Antecipações) │
                      └──────┬───────┘   └──────────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  ATENDIMENTO │ │   CONTROLE   │ │  MARKETING & │
     │     SAC      │ │  DE ACESSO   │ │  REMARKETING │
     └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 2. Detalhamento dos Pontos de Contato

| Módulo Conectado | Dados Consumidos pelo Comercial | Dados Fornecidos pelo Comercial | Regra de Consistência |
| :--- | :--- | :--- | :--- |
| **Eventos** | Capacidade dos setores, lotes ativos, datas de sessões e status do evento. | Taxas de conveniência acordadas, split de pagamento e canais autorizados. | Um evento não pode iniciar vendas públicas sem ter um acordo comercial (`agreement`) registrado. |
| **Financeiro** | Saldo líquido realizado de pedidos pagos e histórico de liquidações bancárias. | Solicitações de antecipação (Advanced) aprovadas e regras de repasse (D+2, semanal). | Nenhuma antecipação pode ser paga sem a validação prévia de elegibilidade de saldo calculada pelo Comercial. |
| **SAC** | Chamados abertos de contestação de compra ou problemas de ingresso. | Dossiê Operacional do Pedido com histórico de pagamento e ação de reemissão de QR code. | O SAC pode consultar o dossiê, mas a alteração de taxas ou condições comerciais é restrita ao Comercial. |
| **Controle de Acesso (Catracas)**| Logs de leitura de ingressos na portaria (horário e catraca). | Status de validade do ingresso e credenciais QR code ativas (ou canceladas após reemissão). | Ao reemitir um ingresso no Comercial, o QR code anterior é imediatamente revogado na base local das catracas. |
| **Marketing & Remarketing** | Públicos de compradores e campanhas de conversão de carrinhos abandonados. | Dados de vendas por canal e ritmo de absorção de lotes. | O Comercial aciona o Remarketing quando o ritmo de vendas cai abaixo do planejado para a semana do evento. |
