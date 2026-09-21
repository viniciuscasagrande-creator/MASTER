# ARQUITETURA DE EVENTOS RECUPERADA — FASE 1.3.11.1.2
## Arquitetura de Domínios, Hierarquias de Entidades e State Machine

**Data:** 20/09/2026  
**Status:** Baseline Homologada  

---

## 1. Modelo de Contexto: Portfólio Global vs Evento Ativo

O módulo de Eventos opera em dois níveis estritamente delimitados:

```
PRODUTOR (Consolidado)
   │
   ├── Visão Geral dos Eventos
   ├── Todos os Eventos (Catálogo e Busca)
   ├── Criar Evento (Wizard)
   ├── Locais & Estrutura Cadastrada
   ├── Calendário Geral de Sessões
   ├── Operação Geral
   ├── Pendências Globais
   └── Eventos Arquivados
          │
          ▼ [Acessar Evento / setEvent(id)]
╔══════════════════════════════════════════════════════════════╗
║                   CONTEXTO DO EVENTO ATIVO                   ║
╚══════════════════════════════════════════════════════════════╝
   │
   ├── VISÃO DO EVENTO (Painel Operacional, Informações)
   ├── ESTRUTURA (Locais, Sessões, Setores, Ingressos, Lotes, Preços, Capacidade)
   ├── VENDAS (Comercial, Canais de Venda, Cortesias)
   ├── MARKETING (Marketing do Evento, Pixels, UTMs)
   ├── OPERAÇÃO (Equipe, Documentos, Check-in, Operação ao Vivo)
   └── GESTÃO (Financeiro do Evento, Relatórios, Histórico, Configurações)
```

---

## 2. Hierarquia de Entidades e Propriedade de Dados

Nenhum módulo duplica dados ou cria inventários concorrentes. As fronteiras de domínio são:

```
1. ESTRUTURA FÍSICA E COMERCIAL:
   EVENTO
     └── SESSÃO (Data/Hora, Abertura de Portões)
           └── SETOR (Capacidade Física e Operacional)
                 └── TIPO DE INGRESSO (Inteira, Meia, VIP, Cortesia)
                       └── LOTE (Quantidade de Venda, Início/Fim, Preço e Taxas)

2. ESTRUTURA DE LOCAL:
   LOCAL (Venue)
     └── PLANTA (VenueMap)
           └── SETOR FÍSICO (Section)
                 └── FILEIRA (Row)
                       └── ASSENTO (Seat)

3. PROPRIEDADE DE DADOS:
   • Definição do Evento & Lotes: Domínio EVENTOS
   • Reserva e Estoque de Ingressos: Domínio INVENTÁRIO (sem overselling)
   • Pedidos, Cobranças e Carrinhos: Domínio COMERCIAL
   • Receitas, Borderôs e Repasses: Domínio FINANCEIRO
   • Validação de Entrada e Catracas: Domínio OPERAÇÕES / CHECK-IN
```

---

## 3. Máquina de Estados (State Machine) Oficial de Eventos

Todas as transições de status de eventos são controladas e passam por validação de regras de negócio (Policy Engine e alçadas de aprovação quando aplicável):

```
       ┌───────────────┐
       │     DRAFT     │ (Rascunho Inicial)
       └───────┬───────┘
               ▼
       ┌───────────────┐
       │  CONFIGURING  │ (Em Configuração de Sessões, Setores e Lotes)
       └───────┬───────┘
               ▼
       ┌───────────────┐
       │    REVIEW     │ (Em Revisão de Prontidão Operacional)
       └───────┬───────┘
               ▼
       ┌────────────────────────┐
       │    APPROVAL_PENDING    │ (Aguardando Aprovação de Alçada - Se Requerido)
       └───────┬────────────────┘
               ▼
       ┌───────────────┐
       │   SCHEDULED   │ (Agendado para Abertura Futura)
       └───────┬───────┘
               ▼
       ┌───────────────┐ ◄──────┐
       │    ON_SALE    │        │
       └───────┬───────┘        │
               │                │
       ┌───────┴───────┐        │ (Reabertura de Vendas)
       ▼               ▼        │
 ┌───────────┐   ┌────────────┐ │
 │ SOLD_OUT  │   │SALES_PAUSED├─┘
 └─────┬─────┘   └─────┬──────┘
       └───────┬───────┘
               ▼
       ┌───────────────┐
       │  IN_PROGRESS  │ (Evento em Andamento / Portões Abertos)
       └───────┬───────┘
               ▼
       ┌───────────────┐
       │   FINISHED    │ (Encerrado / Portões Fechados)
       └───────┬───────┘
               ▼
       ┌───────────────┐
       │   ARCHIVED    │ (Arquivado / Histórico Permanente)
       └───────────────┘

 * Transição excepcional: CANCELLED (Cancelado) pode ser acionada a partir de DRAFT, CONFIGURING, ON_SALE, SALES_PAUSED ou IN_PROGRESS, exigindo obrigatoriamente cálculo de raio de impacto e autorização formal.
```

---

## 4. Tabela de Rótulos em Português do Brasil (pt-BR)

| Identificador Interno | Rótulo Visível no Disk Interno | Cor / Variante de Badge |
| :--- | :--- | :--- |
| `DRAFT` | **Rascunho** | Cinza (`slate`) |
| `CONFIGURING` | **Em configuração** | Azul (`cyan`) |
| `REVIEW` | **Em revisão** | Roxo (`purple`) |
| `APPROVAL_PENDING` | **Aguardando aprovação** | Âmbar (`amber`) |
| `SCHEDULED` | **Agendado** | Azul (`sky`) |
| `ON_SALE` | **Em vendas** | Verde (`emerald`) pulsante |
| `SALES_PAUSED` | **Vendas pausadas** | Amarelo (`amber`) |
| `SOLD_OUT` | **Esgotado** | Laranja (`orange`) |
| `IN_PROGRESS` | **Em andamento** | Verde escuro (`teal`) pulsante |
| `FINISHED` | **Encerrado** | Ardósia neutro (`slate`) |
| `CANCELLED` | **Cancelado** | Vermelho (`rose`) |
| `ARCHIVED` | **Arquivado** | Cinza escuro (`slate-600`) |
