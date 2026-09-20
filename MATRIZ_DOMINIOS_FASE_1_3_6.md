# Matriz de Separação de Domínios — Fase 1.3.6 (Disk Interno B2B)

Esta matriz documenta de forma explícita as fronteiras e proibições de efeitos colaterais indevidos para garantir a pureza da arquitetura B2B da DiskIngressos.

---

## 1. Matriz de Fronteiras

| Conceito / Entidade | O que É | O que NÃO É | O que NUNCA DEVE FAZER |
|---|---|---|---|
| **Proposta Comercial (1.3.5)** | Oferta comercial preliminar com vigência de aceite | Contrato formal com eficácia jurídica vinculante | Não cria obrigações jurídicas nem gera borderôs financeiros |
| **Aceite da Proposta (1.3.5)** | Concordância comercial do produtor com a oferta | Contrato assinado ou vigente | Não cria evento, não cria lote de ingressos, não cria borderô |
| **Contrato Comercial (1.3.6)** | Instrumento formal e jurídico de prestação de serviços | Borderô financeiro, liquidação ou lançamento de repasse | Não calcula vendas em tempo real, não retém fundos diretamente |
| **Status SIGNED (1.3.6)** | Assinaturas eletrônicas concluídas por todas as partes | Contrato necessariamente vigente ou em operação | Não ativa condições comerciais antes da data `effectiveFrom` |
| **Status ACTIVE (1.3.6)** | Contrato vigente e aplicável temporalmente | Contrato eterno ou imodificável sem registro | Não permite edições diretas em termos (exige Aditivo) |
| **Aditivo Contratual (`ContractAmendment`)** | Instrumento formal de repactuação versionada | Rascunho informal ou alteração em banco de dados | Não sobrescreve o histórico do contrato base |
| **Renegociação (`RENEGOTIATION`)** | Desdobramento em uma nova oportunidade no CRM (1.3.4) | Alteração automática de taxas vigentes | Não altera o contrato existente sem novo ciclo de negociação |

---

## 2. Separação Estrita: Assinado vs Vigente (`SIGNED != ACTIVE`)

```text
[ Assinatura das Partes Concluída ]
                ↓
    Data atual < effectiveFrom ?
          /               \
        SIM               NÃO
        /                   \
Status: SIGNED          Status: ACTIVE
(Aguardando Início)     (Efeitos Comerciais Liberados)
        |
    Sweep Diário /
    Chegada de effectiveFrom
        ↓
Status: ACTIVE
```

* **Regra de Ouro:** O módulo Financeiro só considera contratos com status `ACTIVE` cuja vigência compreenda a data da transação ou fechamento de borderô (`effectiveFrom <= atDate <= effectiveUntil`).

---

## 3. Imutabilidade Contratual & Autoridade do Webhook

1. **Tentativa de Alteração Direta em Contrato Assinado:**
   * Qualquer requisição `PUT /api/v1/commercial/contracts/:id` sobre contratos em status `SIGNED` ou `ACTIVE` é rejeitada com código **HTTP 409 (Conflict)** e mensagem explicativa indicando a obrigatoriedade de Aditivo (`ContractAmendment`).

2. **Autoridade Certificadora Externa:**
   * A autoridade externa (Autentique / Clicksign) é a única que atesta a conclusão de assinaturas.
   * O webhook possui verificação de idempotência: eventos repetidos para o mesmo `providerReference` retornam sucesso sem duplicar processamento nem corromper estados.
