# MATRIZ DE TRANSIÇÕES DE ESTADO DE EVENTOS — FASE 1.3.11.1.2
## Regras de Transição da State Machine, Pré-condições e Efeitos Colaterais

**Data:** 20/09/2026  
**Status:** Homologada  

---

| Estado Origem | Estado Destino | Ação / Disparo | Pré-condições Mandatórias | Alçada Requerida | Efeitos Colaterais |
| :--- | :--- | :--- | :--- | :--- | :--- |
| *(Novo)* | `DRAFT` | Criar Rascunho de Evento | Título inicial e identificação de produtora válida. | `produtor` ou `admin_geral` | Gera ID imutável e `publicCode`. Evento invisível para compras públicas. |
| `DRAFT` | `CONFIGURING` | Iniciar Configuração de Estrutura | Informações básicas preenchidas. | `produtor` ou `admin_geral` | Libera cadastro de sessões, setores e matriz de preços. |
| `CONFIGURING` | `REVIEW` | Submeter para Revisão | Pelo menos 1 sessão, 1 setor e 1 lote de venda configurados. | `produtor` | Dispara `EventReadinessService` para validar checklist de prontidão. |
| `REVIEW` | `APPROVAL_PENDING` | Solicitar Aprovação Formal | Checklist de prontidão atende a requisitos mínimos com divergências a avaliar. | `produtor` | Notifica comitê de aprovação e cria tarefa na caixa de entrada de aprovações. |
| `REVIEW` / `APPROVAL_PENDING` | `SCHEDULED` | Agendar Abertura de Vendas | Prontidão 100% aprovada e data de início de vendas futura configurada. | `admin_geral` | Configura cron de liberação automática. Evento visível como "Em breve". |
| `REVIEW` / `SCHEDULED` | `ON_SALE` | Abrir Vendas Oficialmente | Checklist de prontidão 100% aprovado; canais de venda ativos. | `admin_geral` | Libera inventário no motor de vendas. Ingressos disponíveis para compra. |
| `ON_SALE` | `SALES_PAUSED` | Pausar Vendas Temporariamente | Motivo operacional ou de segurança registrado em auditoria. | `admin_geral` ou `produtor` | Bloqueia novas reservas no carrinho; preserva ingressos já emitidos. |
| `SALES_PAUSED` | `ON_SALE` | Retomar Vendas | Liberação de travas operacionais. | `admin_geral` ou `produtor` | Reabre checkout nos canais habilitados. |
| `ON_SALE` | `SOLD_OUT` | Esgotar Ingressos | 100% da capacidade comercial vendida em todos os setores/lotes. | Automático (Sistema) | Atualiza badge público para "Esgotado". Habilita fila de espera se configurada. |
| `ON_SALE` / `SOLD_OUT` | `IN_PROGRESS` | Iniciar Realização do Evento | Chegada da data/hora de abertura dos portões da sessão. | Automático / Coord. de Portaria | Habilita operação de check-in em alta velocidade; ativa painel de operação em tempo real. |
| `IN_PROGRESS` | `FINISHED` | Encerrar Evento / Sessão | Portões fechados e bilheteria encerrada. | `admin_operacional` ou `admin_geral` | Trava emissão de ingressos; gera snapshot de fechamento para conferência financeira. |
| Qualquer estado ativo | `CANCELLED` | Cancelar Evento | Justificativa formal registrada; cálculo de impacto executado. | `admin_geral` | Suspende vendas imediatamente; notifica compradores; envia lista de ingressos para a fila de Estorno. |
| `FINISHED` / `CANCELLED` | `ARCHIVED` | Arquivar Evento | Mínimo de 30 dias após término; reconciliação financeira concluída. | `admin_geral` | Remove do catálogo operacional ativo; preserva histórico somente leitura para auditoria e DRE. |
