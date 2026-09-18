# DISK INTERNO (PDT) — PLATAFORMA UNIFICADA DE OPERAÇÕES

> Plataforma central e unificada de operações da **DiskIngressos**, construída sobre arquitetura **SaaS Enterprise 2026**, design system moderno com paleta escura (obsidian slate) e laranja institucional, sidebar dinâmica orientada a permissões e um **Core relacional único com RBAC granular e escopo de dados**.

---

## 🎯 Princípio Arquitetural Fundamental

O **Disk Interno** não opera com silos ou cópias dispersas de pedidos entre departamentos. Todo o ciclo de vida comercial e operacional compartilha uma única cadeia de integridade referencial:

```text
Produtor ──> Evento ──> Cliente ──> Pedido ──> Ingresso ──> Pagamento ──> Repasse
```

---

## 🔐 Fase 1.1.5 — Central de Autenticação, Perfis, Permissões e Escopo de Dados

A segurança e o controle de acesso do Disk Interno separam estritamente **autenticação** de **autorização**. A autorização final é calculada dinamicamente:

$$\text{ACESSO} = \text{USUÁRIO} + \text{PERFIL} + \text{PERMISSÃO} + \text{ORGANIZAÇÃO} + \text{PRODUTOR} + \text{EVENTO} + \text{REGRA DE NEGÓCIO}$$

### 1. Perfis Iniciais (Roles)

| Perfil | Escopo Padrão | Descrição & Acesso |
| :--- | :--- | :--- |
| **Administrador Geral** | `GLOBAL` | Acesso irrestrito a todos os módulos, produtores, eventos, 2FA obrigatório e gestão de acessos. |
| **Administrador Operacional** | `GLOBAL` | Operação do dia a dia de eventos, suporte de campo, bilheteria e SAC. |
| **Produtor** | `PRODUCER` | Acesso restrito e segregado estritamente aos seus próprios eventos, bilheteria e relatórios. |
| **Financeiro** | `GLOBAL` | Gestão de contas a pagar, receber, fluxo de caixa, conciliação e repasses. |
| **Contabilidade** | `GLOBAL` | Livro diário em partidas dobradas, balancetes e DRE em tempo real. |
| **Marketing & Growth** | `GLOBAL` | Campanhas Meta Ads, Google Ads, TikTok Ads, Spotify Ads, ROAS e pixels. |
| **Remarketing** | `GLOBAL` | Recuperação de carrinhos abandonados e réguas de WhatsApp API e e-mail. |
| **Comercial** | `GLOBAL` | Prospecção de produtores, pipeline de eventos, contratos e metas. |
| **Atendimento SAC** | `GLOBAL` | Central de Consulta 360°, pedidos, titulares, reenvio de vouchers e abertura de estornos. |
| **Suporte de Eventos** | `GLOBAL` | War Room presencial, monitoramento de catracas, links e incidentes de portaria. |
| **Estorno & Chargebacks** | `GLOBAL` | Fila de aprovação de estornos (cascata reversa) e contestações de chargeback. |
| **Auditor & Compliance** | `GLOBAL` | Acesso estritamente consultivo a logs imutáveis e trilhas de auditoria. |
| **Personalizado** | Customizado | Concessão e revogação pontual de permissões pelo Administrador Geral. |

> [!IMPORTANT]
> **Perfil não é uma trava rígida:** Dois usuários com o perfil *Financeiro* podem possuir poderes distintos. Por exemplo, **Maria** (Diretora) pode aprovar repasses e transferir saldos, enquanto **Carlos** (Financeiro Júnior) pode apenas visualizar saldos e repasses.

### 2. Permissões Granulares por Ação (`module.resource.action`)

As ações são controladas tanto no frontend (desabilitando ou ocultando botões via `<Can>`) quanto validadas rigidamente no backend Node.js (`requirePermission`):

- `eventos.evento.visualizar`, `eventos.evento.criar`, `eventos.evento.editar`, `eventos.evento.cancelar`
- `financeiro.saldo.visualizar`, `financeiro.transferencia.criar`, `financeiro.transferencia.aprovar`, `financeiro.repasses.visualizar`, `financeiro.repasses.aprovar`, `financeiro.conciliacao.executar`
- `sac.consulta.acessar`, `sac.pedido.visualizar`, `sac.ticket.criar`, `sac.voucher.reenviar`
- `estorno.solicitacao.visualizar`, `estorno.solicitacao.criar`, `estorno.solicitacao.aprovar`, `estorno.solicitacao.executar`
- `admin.usuarios.visualizar`, `admin.usuarios.gerenciar`, `admin.auditoria.visualizar`, `admin.configuracoes.editar`

### 3. Escopo de Dados por Produtor e Evento (`requireScope`)

Mesmo que um usuário possua a permissão `eventos.evento.visualizar`, se o seu escopo for `PRODUCER` (ex: Roberto da *Opus Entretenimento*), qualquer tentativa de consultar eventos ou dados financeiros de outros produtores (*Live Nation*, *CWB Brasil*) resultará em **403 — ACESSO NEGADO**.

### 4. Sidebar Dinâmica Orientada a Permissões

- Menus e submenus para os quais o usuário não tem autorização **não são renderizados** (não ocupam espaço cinza inútil).
- O Produtor visualiza seu menu adaptado: *Meus Eventos, Comercial, Financeiro, Marketing, Remarketing*.
- O SAC visualiza apenas: *Visão Geral, Atendimento SAC, Central de Consulta, Estorno (se concedido)*.
- O Administrador Geral visualiza os 9 módulos + *Administração de Acessos* + *Configurações*.

---

## 🏛️ Estrutura do Repositório (Monólito Modular Node.js + React)

```text
MASTER/
│
├── apps/
│   └── web/                 React 19 + TypeScript + Vite + Tailwind CSS v4
│       └── src/
│           ├── core/
│           │   ├── auth/    AuthContext, LoginView, Can, ProtectedRoute, AccessDeniedView
│           │   ├── context/ ScopeContext, CoreDataContext
│           │   └── database/mockDatabase
│           ├── modules/     overview, events, commercial, eventSupport, sac, refunds,
│           │                finance, accounting, marketing, remarketing, admin, settings
│           └── shared/      Header, Sidebar dinâmica, CommandPalette, StatCard, etc.
│
├── backend/                 Node.js + TypeScript (Monólito Modular)
│   └── src/
│       ├── auth/            authMiddleware, requirePermission, requireScope
│       ├── permissions/     permissionsCatalog (45 ações granulares)
│       ├── roles/           rolesCatalog (13 papéis)
│       └── server.ts        Servidor Express com proteção RBAC e escopo
│
├── prisma/
│   └── schema.prisma        Modelagem completa PostgreSQL (Users, Roles, Permissions,
│                            Scopes, Sessions, TwoFactor, Core Entities)
│
└── shared/
    └── types/               Tipos centrais compartilhados entre frontend e backend
```

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js >= 18.x
- npm >= 9.x

### Instalação de Dependências

```bash
# Na raiz do repositório
npm install --prefix apps/web
npm install --prefix backend
```

### Executando em Desenvolvimento

```bash
# Iniciar o Frontend React (Vite): http://localhost:5173
npm run dev

# Iniciar o Backend Node.js API (porta 3001)
npm run dev:api
```

### Compilação de Produção

```bash
# Compila frontend e backend simultaneamente com TypeScript
npm run build:all
```

---

## 👤 Perfis Prontos para Teste Imediato (Demo Switcher)

Na barra superior (Header) ou tela de login, você pode alternar instantaneamente entre os perfis de teste para verificar a adaptação em tempo real da interface:

1. **👑 Vinicius Casagrande (Admin Master):** Enxerga todos os 9 módulos, Central de Administração de Usuários, Configurações do Core e trilha imutável.
2. **💼 Maria Oliveira (Diretora Financeira):** Acesso completo ao Financeiro e aprovação de repasses.
3. **👤 Carlos Lima (Financeiro Júnior):** Acesso ao Painel Financeiro para visualização de saldos, porém **sem permissão para aprovar repasses** (demonstra a restrição de ação granular).
4. **🎸 Roberto Viana (Produtor Opus):** Escopo segregado para a *Opus Entretenimento*. Módulos internos como SAC, Contabilidade e Suporte de Campo somem da sidebar, e o seletor de produtor fica bloqueado à sua organização.
5. **🎧 Ana Paula Santos (Atendente SAC):** Central de Consulta 360°, pedidos, titulares e reenvio de vouchers.
