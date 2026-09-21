# MATRIZ DE APIS DO COMERCIAL — DISK INTERNO

## 1. Endpoints do Comercial Operacional (Bilheteria & Vendas)

| Método | Endpoint | Permissão Obrigatória | Descrição & Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/commercial/dashboard` | `comercial.dashboard.visualizar` | Retorna KPIs executivos de bilheteria, faturamento, tickets emitidos, alertas de integridade e eventos com taxas pendentes. |
| `GET` | `/api/commercial/performance` | `comercial.vendas.performance.visualizar` | Retorna velocidade de comercialização (vendas/h), ritmo diário e decomposição multi-nível (evento, sessão, lote, setor). |
| `GET` | `/api/commercial/orders` | `comercial.pedidos.visualizar` | Listagem paginada de pedidos com filtros de canal (`SITE`, `BOX_OFFICE`, `PDV`, `DISK`), status, evento e comprador. |
| `GET` | `/api/commercial/orders/:id` | `comercial.pedidos.detalhes` | Dossiê completo do pedido: ingressos, dados do adquirente, parcelamento e histórico de auditoria. |
| `POST` | `/api/commercial/orders/:id/reconcile` | `comercial.pedidos.detalhes` | Conciliação operacional forçada entre o webhook do adquirente, o ledger financeiro e a emissão de ingressos. |
| `POST` | `/api/commercial/tickets/:id/reissue` | `comercial.pedidos.detalhes` | Reemite o hash/QR code do ingresso por motivo de perda ou contestação, invalidando o QR code anterior no Disk Acesso. |
| `GET` | `/api/commercial/events/:eventId/agreement` | `comercial.dashboard.visualizar` | Retorna as condições comerciais ativas do evento (taxas, spread, antecipação, repasse) e histórico de versões. |
| `POST` | `/api/commercial/events/:eventId/agreement` | `comercial.contratos.editar` ou `admin.sistema.configurar` | Cria ou atualiza condições comerciais com versão imutável e justificativa obrigatória de auditoria. |
| `PUT` | `/api/commercial/events/:eventId/agreement` | `comercial.contratos.editar` ou `admin.sistema.configurar` | Alias para atualização de acordo comercial gerando nova versão. |
| `GET` | `/api/commercial/events/:eventId/advances` | `comercial.vendas.visualizar` | Lista operações de antecipação (Advanced) do evento com status, valores solicitados e custos aplicados. |
| `POST` | `/api/commercial/events/:eventId/advance` | `comercial.vendas.visualizar` | Solicita antecipação financeira validando teto sobre o saldo elegível real de pedidos pagos. |
| `GET` | `/api/commercial/channels` | `comercial.dashboard.visualizar` | Lista canais de venda autorizados, cotas de ingressos e faturamento gerado por canal. |
| `GET` | `/api/commercial/export/orders` | `comercial.pedidos.exportar` | Exportação de pedidos filtrados em formato CSV/Planilha. |
| `GET` | `/api/commercial/export/sales` | `comercial.vendas.exportar` | Exportação de relatório consolidado de vendas em formato CSV. |

---

## 2. Endpoints da Gestão Comercial B2B (Produtoras & Contratos)

| Método | Endpoint | Permissão Obrigatória | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/commercial/producers` | `comercial.produtores.visualizar` | Listagem de produtoras cadastradas com métricas de carteira. |
| `GET` | `/api/commercial/producers/:id/summary` | `comercial.produtores.detalhes` | Ficha financeira e operacional detalhada da produtora. |
| `GET` | `/api/commercial/portfolio/my-summary` | `comercial.carteira.visualizar` | Resumo de desempenho da carteira do executivo de contas logado. |
| `GET` | `/api/commercial/leads` | `comercial.prospeccoes.visualizar` | Central de leads e potenciais novos parceiros. |
| `POST` | `/api/commercial/leads` | `comercial.prospeccoes.criar` | Cadastro de novo lead comercial B2B. |
| `POST` | `/api/commercial/leads/:id/convert` | `comercial.prospeccoes.converter` | Conversão de lead qualificado em produtora cadastrada. |
| `GET` | `/api/commercial/opportunities` | `comercial.oportunidades.visualizar` | Listagem do pipeline de oportunidades de fechamento. |
| `POST` | `/api/commercial/opportunities` | `comercial.oportunidades.criar` | Criação de oportunidade vinculada a uma produtora. |
| `GET` | `/api/commercial/proposals` | `comercial.propostas.visualizar` | Central de propostas comerciais de bilhetagem. |
| `POST` | `/api/commercial/proposals` | `comercial.propostas.criar` | Elaboração de proposta comercial com catálogo de preços. |
| `GET` | `/api/commercial/contracts` | `comercial.contratos.visualizar` | Central de contratos comerciais ativos e em assinatura. |
| `POST` | `/api/commercial/contracts` | `comercial.contratos.criar` | Emissão de contrato comercial derivado de proposta aceita. |
| `GET` | `/api/commercial/offerings` | `comercial.catalogo.visualizar` | Catálogo de planos e módulos da DiskIngressos. |
| `GET` | `/api/commercial/account-management/renewals`| `comercial.gestao_contas.visualizar` | Gestão de contratos em janela de renovação e monitoramento de retenção. |
