# ARQUITETURA RECUPERADA DO COMERCIAL — DISK INTERNO

## 1. Visão Geral da Arquitetura

A arquitetura do módulo **COMERCIAL** do Disk Interno recupera a primazia da operação de vendas da DiskIngressos, organizando suas responsabilidades em duas grandes camadas funcionais:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             MÓDULO COMERCIAL                                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐     ┌───────────────────────────────────────┐
│     OPERAÇÃO DE VENDAS        │     │         GESTÃO COMERCIAL B2B          │
│   (Ingressos & Bilheteria)    │     │       (Relacionamento & Contas)       │
├───────────────────────────────┤     ├───────────────────────────────────────┤
│ • Visão Geral Comercial       │     │ • Central de Produtores & Carteira    │
│ • Central de Pedidos          │     │ • Prospecções & Leads B2B             │
│ • Vendas & Performance        │     │ • Oportunidades & Pipeline            │
│ • Acordos & Taxas de Eventos  │     │ • Propostas Comerciais & Minutas      │
│ • Canais de Venda             │     │ • Contratos Comerciais & Habilitações │
│ • Operações de Antecipação    │     │ • Catálogo de Ofertas DiskIngressos   │
│ • Dossiê Operacional          │     │ • Metas Comerciais & Equipe           │
│ • Exportações & Relatórios    │     │ • Renovações, Upgrades & Movimentações│
└───────────────────────────────┘     └───────────────────────────────────────┘
```

---

## 2. Fluxo no Contexto Global vs. Contexto de Evento

### Contexto Global / Produtor (`ModuleSidebar`)
Quando nenhum evento específico está selecionado:
- O Comercial exibe a visão agregada da bilheteria (todos os eventos ou todos os eventos do produtor ativo).
- Permite navegar entre pedidos de múltiplos eventos, conferir taxas pendentes e gerenciar a carteira B2B.

### Contexto de Evento Selecionado (`EventContextSidebar`)
Quando um evento específico é selecionado:
- O menu contextual do evento disponibiliza acessos diretos no agrupador **MÓDULOS VINCULADOS AO EVENTO**:
  - `commercial-orders`: Pedidos filtrados exclusivamente para o evento.
  - `commercial-sales`: Vendas e performance de absorção do evento.
  - `commercial-conditions`: Acordo comercial do evento (taxas de conveniência, spread, antecipação e repasse).

---

## 3. Modelo de Dados Recuperado: Acordo Comercial de Evento (`EventCommercialAgreement`)

Para garantir que nenhuma taxa seja arbitrária ou sem histórico:

```text
┌──────────────────────────────────────────────┐
│           EventCommercialAgreement           │
├──────────────────────────────────────────────┤
│ id: String (UUID)                            │
│ eventId: String                              │
│ producerId: String                           │
│ currentVersion: Int                          │
│ status: Enum (ativo, pendente, substituido)  │
│ approvedBy: String?                          │
│ approvedAt: DateTime?                        │
│ createdAt / updatedAt: DateTime              │
└──────────────────────┬───────────────────────┘
                       │ 1..N
                       ▼
┌──────────────────────────────────────────────┐
│       EventCommercialAgreementVersion        │
├──────────────────────────────────────────────┤
│ id: String (UUID)                            │
│ agreementId: String                          │
│ version: Int                                 │
│ effectiveFrom: DateTime                      │
│ effectiveTo: DateTime?                       │
│ status: Enum (ativa, substituida)            │
│                                              │
│ serviceFeeType: percentage | fixed           │
│ serviceFeeBps: Int (ex: 1000 = 10%)          │
│ serviceFeeFixedCents: Int (ex: 500 = R$ 5)   │
│ serviceFeePaidBy: buyer | producer           │
│ serviceFeeMinCents: Int                      │
│                                              │
│ spreadEnabled: Boolean                       │
│ spreadType: percentage | fixed               │
│ spreadBps: Int (ex: 150 = 1.5%)              │
│ spreadFixedCents: Int                        │
│                                              │
│ advancedEnabled: Boolean                     │
│ advancedRateBps: Int (ex: 250 = 2.5%)        │
│ advancedMaxPercent: Int (ex: 70 = 70%)       │
│ advancedMinDays: Int                         │
│                                              │
│ payoutTermsDays: Int (ex: 2 = D+2)           │
│ payoutModel: pos_evento | semanal | custom   │
│ contractNumber: String?                      │
│ changeReason: String (obrigatório no update) │
│ createdBy: String                            │
└──────────────────────┬───────────────────────┘
                       │ 1..N
                       ▼
┌──────────────────────────────────────────────┐
│        CommercialAgreementAuditLog           │
├──────────────────────────────────────────────┤
│ id: String (UUID)                            │
│ agreementId: String                          │
│ eventId: String                              │
│ actorId: String                              │
│ actorName: String                            │
│ action: create_agreement | update_fee...     │
│ previousValueJson: String?                   │
│ newValueJson: String                         │
│ reason: String                               │
│ timestamp: DateTime                          │
└──────────────────────────────────────────────┘
```

---

## 4. Estrutura do Dossiê Operacional do Pedido (`OrderDossierModal`)

Substituindo completamente referências antigas a "360", o Dossiê Operacional oferece 5 abas de investigação e ação imediata:

1. **Visão Geral**: Código do pedido, protocolo oficial, canal de origem, produtor, evento, sessão, comprador (nome, CPF, e-mail), valores (subtotal, taxas, descontos, total) e status.
2. **Ingressos & QR Codes**: Lista de cada ingresso emitido, modalidade (inteira, meia, cortesia), setor, fila/assento, status (`ACTIVE`, `USED`, `CANCELLED`), código de autenticação QR e ação operacional de **Reemitir Ingresso** (com invalidação do QR code anterior).
3. **Transação & Adquirente**: Método de pagamento (PIX, Cartão de Crédito, Débito, Dinheiro), adquirente processadora, autorização, NSU, bandeira, parcelamento, status antifraude e ação de **Conciliação de Pedido**.
4. **Linha do Tempo Operacional**: Log cronológico de todas as transações, emissões, webhooks de adquirentes e validações de catraca.
5. **Auditoria & Técnico**: Payload bruto JSON da transação, logs de serviço e integridade com o Ledger contábil.
