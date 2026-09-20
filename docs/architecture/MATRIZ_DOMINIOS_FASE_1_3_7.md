# Matriz de Fronteiras de Domínio — Fase 1.3.7

## 1. Visão Geral das Fronteiras de Domínio

O ecossistema **Disk Interno** opera sob estrita segregação de responsabilidades corporativas. O domínio **Comercial** é exclusivamente **B2B**, tendo como cliente o **Produtor** ou **Organizador de Eventos**.

```mermaid
flowchart TD
    subgraph Catálogo Comercial (Fase 1.3.7)
        OFR[CommercialOffering]
        VER[CommercialOfferingVersion\nHash SHA-256]
        COMP[CommercialOfferingComposition\nDFS Cycle Check]
        TERM[CommercialDefaultTerm]
        FEAT[CommercialFeature\nTécnica, independente de RBAC]
        PROV[CommercialCatalogProvider]
    end

    subgraph Propostas Comerciais (Fase 1.3.5)
        PROP[CommercialProposal]
        PVER[CommercialProposalVersion\nSnapshot Imutável]
    end

    subgraph Contratos Comerciais (Fase 1.3.6)
        CTR[CommercialContract]
        CVER[CommercialContractVersion\nSnapshot Imutável]
        ADM[ContractAmendment\nAditivos Temporais]
    end

    subgraph Operação de Eventos & Vendas (Fase 1.2)
        EVT[Event / Session]
        TICK[TicketType / Inventory]
    end

    OFR --> VER
    VER --> COMP
    VER --> TERM
    VER --> FEAT
    VER --> PROV

    PROV -.->|Resolve Snapshot Imutável| PROP
    PROP -.->|Aceite Formal| CTR
    CTR -.->|Condições Efetivas| EVT
```

---

## 2. Matriz de Responsabilidades por Entidade

| Domínio | Entidade Central | Responsabilidade | O que NÃO faz |
|---|---|---|---|
| **Catálogo Comercial (1.3.7)** | `CommercialOffering` | Define o menu oficial do que a DiskIngressos comercializa (Planos, Pacotes, Serviços). | Não calcula ingressos vendidos, não cria eventos, não armazena contratos específicos. |
| **Versionamento de Catálogo (1.3.7)** | `CommercialOfferingVersion` | Registra histórico imutável das condições padrão da oferta com hash determinístico SHA-256. | Não altera retrospectivamente propostas já enviadas ou contratos assinados. |
| **Composições de Pacote (1.3.7)** | `CommercialOfferingComposition` | Conecta pacotes/combos aos seus itens integrantes com validação DFS anti-ciclo. | Não permite auto-inclusão ou ciclos recursivos de pacotes. |
| **Capacidades Técnicas (1.3.7)** | `CommercialFeature` | Define recursos de engenharia ativados para o evento contratante (ex.: validação offline, caixa cego). | Não concede permissões de tela ou usuário do sistema (RBAC do Disk Interno). |
| **Propostas Comerciais (1.3.5)** | `CommercialProposal` | Negociação preliminar e formalização de condições comerciais com o produtor. | Não substitui contrato assinado; não gera eventos de venda automaticamente. |
| **Contratos Comerciais (1.3.6)** | `CommercialContract` | Instrumento jurídico formal assinado com vigência, signatários e aditivos. | Não altera o catálogo de ofertas; isola condições negociadas via snapshot. |
| **Ticketeria & Eventos (1.2)** | `Event` / `EventSession` | Execução operacional, lotes de ingressos, catracas e controle de portaria. | Não define preço de contratação corporativa entre Disk e Produtor. |

---

## 3. Diretrizes Terminológicas e Restrições Mandatórias

1. **Terminologia Proibida:**
   - É terminantemente **proibido** o uso do termo mercadológico *"360"* ou variantes similares.
   - Utilizar sempre as designações formais: *Catálogo Comercial*, *Planos Oficiais*, *Pacotes de Serviços*, *Solução Operacional Completa*.
2. **Separação Rigorosa B2B vs B2C:**
   - O Catálogo Comercial comercializa serviços para **produtores** (taxas percentuais sobre vendas, locação de coletores, kits PDV de bilheteria, operadores de portaria).
   - Ingressos (inteira, meia, social) e taxas de conveniência cobradas do público final são de competência exclusiva do domínio de Ticketeria e Checkout B2C.
3. **Imutabilidade e Não-Ruptura:**
   - Propostas e contratos consomem o catálogo através de snapshots imutáveis.
   - Qualquer evolução nas ofertas do catálogo (`v1 -> v2`) gera novas versões com hash independente, garantindo que nenhum documento passado sofra mutação silenciosa.
