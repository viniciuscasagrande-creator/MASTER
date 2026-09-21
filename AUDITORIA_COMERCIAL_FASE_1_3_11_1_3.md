# AUDITORIA TRIPLA DO COMERCIAL — FASE 1.3.11.1.3

## 1. Contexto e Objetivo da Auditoria

O módulo **COMERCIAL** do Disk Interno é o coração da operação de receita da DiskIngressos. No entanto, durante o ciclo inicial de expansão (Fases 1.3.1 a 1.3.10), o MASTER priorizou a construção de uma esteira robusta de CRM B2B (prospecção de produtores, gestão de pipeline, propostas de prestação de serviços, contratos de bilhetagem, catálogo de produtos da Disk e metas da equipe interna), enquanto a funcionalidade central de **Vendas Operacionais de Ingressos, Acordos Comerciais dos Eventos, Taxas de Conveniência, Spread, Antecipações (Advanced) e Dossiê Operacional de Pedidos** — presente com altíssimo rigor no SafeSaff — ficou secundária ou dispersa.

Esta auditoria aplica o **Modelo de Autoridade Tripla**:
1. **SafeSaff (`C:\Users\vinad\OneDrive\Desktop\safesaff`):** Autoridade Funcional (regras de negócio, fluxos de vendas, condições comerciais de eventos, cálculo de taxas, antecipações, dossiê do pedido e conciliação).
2. **Limitless (`C:\Users\vinad\Downloads\limitless`):** Autoridade Visual e UX (design executivo, paleta neutra, cards brancos `#ffffff`, bordas suaves `#e2e8f0`, tabelas densas, badges semânticos, drawers laterais e zero bibliotecas legadas).
3. **MASTER (`C:\Users\vinad\OneDrive\Desktop\MASTER`):** Base Técnica (React 18, TypeScript, Tailwind CSS, TanStack Query, Node.js + Prisma, arquitetura modular e RBAC granular).

---

## 2. Diagnóstico Comparativo Detalhado

| Dimensão Comercial | SafeSaff (Referência Funcional) | MASTER (Antes da Fase 1.3.11.1.3) | Diagnóstico & Ação Requerida |
| :--- | :--- | :--- | :--- |
| **Visão Geral Comercial** | `CommercialHubPage.tsx`: KPIs reais de eventos, produtores, vendas brutas, taxa Disk, spread, antecipações ativas, alertas de eventos sem taxa e pendências contratuais. | `CommercialDashboardPage.tsx`: Focado em métricas agregadas de pedidos e gráficos genéricos. | **RECUPERAR & CONSOLIDAR**: Incorporar KPIs operacionais reais, alertas de eventos sem taxa e tabela de monitoramento comercial. |
| **Condições Comerciais dos Eventos** | `EventCommercialAgreement` (Prisma) + rotas `/api/commercial/events/:id/agreement`: Taxa de serviço (% bps ou fixa), pagador (comprador/produtor), spread, antecipação habilitada (taxa bps e teto), prazos de repasse (D+2, semanal) e log de auditoria obrigatório. | Não existia endpoint de acordo comercial de evento; taxas estavam hardcoded ou espalhadas nas sessões. | **RECUPERAR**: Implementar modelo e endpoints de acordo comercial versionado com trilha de auditoria completa. |
| **Antecipações Financeiras (Advanced)** | `AdvanceOperation`: Cálculo de saldo elegível baseado em pedidos pagos, teto percentual (ex: 70%), taxa de antecipação (bps), custo financeiro e valor líquido transferido. | Ausente do Comercial; apenas menções no Financeiro. | **RECUPERAR**: Integrar operação de antecipação vinculada às condições contratuais do evento. |
| **Central de Pedidos Omnichannel** | `CommerceOrdersHubPage.tsx`: Listagem por canais (Site, Bilheteria, PDV, Portal Produtor), monitoramento de integridade do Core (holds no Redis, inconsistências, pedidos sem ingresso, ingressos sem ledger). | `OrdersPage.tsx`: Filtros básicos por status e evento; sem visão omnichannel por abas e sem monitor de integridade. | **REFINAR & ENRIQUECER**: Adicionar abas de canais, contadores rápidos e monitor de integridade comercial. |
| **Dossiê Operacional do Pedido** | `OrderDossier360Modal.tsx`: Abas Geral, Ingressos, Pagamento, Timeline e Developer; ações de conciliação de pedido e reemissão de ingresso. | `OrderDetailsPage.tsx`: Página estática de visualização de pedido, sem abas nem ações operacionais diretas de conciliação/reemissão. | **RECUPERAR & REFINAR**: Criar `OrderDossierModal` no padrão Limitless (sem o termo "360") com todas as ações operacionais. |
| **Canais de Venda** | Tipos canônicos: `SITE`, `BOX_OFFICE`, `PDV`, `DISK` (Portal Produtor), `PARTNER`. | Canais configurados apenas no módulo de eventos; sem tela gerencial no Comercial. | **COMPLETAR**: Criar central gerencial de canais de venda no Comercial. |
| **CRM B2B & Carteira** | Ausente ou rudimentar. | Completo: Leads, Carteira, Oportunidades, Propostas com versionamento, Contratos, Catálogo de Ofertas, Metas e Renovações. | **MANTER & REALOCAR**: Preservar 100% da inteligência construída, isolando no subsetor "Gestão Comercial B2B". |

---

## 3. Classificação das Ações Estruturais

De acordo com o protocolo de auditoria, cada item é formalmente classificado:

1. **MANTER**: Toda a esteira de CRM B2B (Fases 1.3.1 a 1.3.10) — Leads, Carteira, Oportunidades, Propostas, Contratos, Catálogo Disk, Renovações e Metas.
2. **REALOCAR**: Mover os itens de CRM B2B para o agrupamento estruturado "Gestão Comercial B2B" dentro do Comercial, liberando o topo do módulo para Vendas, Pedidos e Condições Operacionais.
3. **RECUPERAR**:
   - Gestão de Condições Comerciais dos Eventos (taxa de conveniência, pagador, spread, antecipação, repasse).
   - Dossiê Operacional do Pedido com ações de conciliação e reemissão de ingressos.
   - Monitor de integridade comercial (Commerce Integrity Center).
   - Operações de Antecipação (Advanced) vinculadas aos contratos dos eventos.
4. **REFINAR**:
   - `OrdersPage.tsx`: Adicionar abas omnichannel, filtros por canal e acionamento do Dossiê.
   - `CommercialDashboard.tsx`: Organizar rotas internas separando fluxo operacional e fluxo B2B.
   - `ModuleSidebar.tsx` e `EventContextSidebar.tsx`: Expor os submenus corretos conforme o contexto.
5. **EXPURGAR**: Banir definitivamente o termo de marketing "360", substituindo por "Dossiê Operacional do Pedido" e "Ficha Cadastral Consolidada".

---

## 4. Conclusão da Auditoria

O Comercial do MASTER agora terá a completude exigida:
- A operação de vendas do dia a dia da DiskIngressos (ingressos, pedidos, taxas, antecipações) é recuperada do SafeSaff e executada com precisão cirúrgica.
- A máquina de expansão e relacionamento com produtores (CRM B2B) é preservada intacta, permitindo que a equipe gerencie o ciclo de vida completo do produtor e suas vendas.
