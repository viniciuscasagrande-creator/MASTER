# DISK INTERNO (PDT) — PLATAFORMA UNIFICADA DE OPERAÇÕES

> Plataforma central e unificada de operações da **DiskIngressos**, construída sobre arquitetura **SaaS Enterprise 2026**, design system moderno com paleta escura (obsidian slate) e laranja institucional, sidebar dinâmica orientada a permissões e um **Core relacional único com RBAC granular e escopo de dados**.

---

## 🎯 Princípio Arquitetural Fundamental

O **Disk Interno** não opera com silos ou cópias dispersas de pedidos entre departamentos. Todo o ciclo de vida comercial e operacional compartilha uma única cadeia de integridade referencial:

```text
Produtor ──> Evento ──> Cliente ──> Pedido ──> Ingresso ──> Pagamento ──> Repasse
```

---

## 🔐 Fase 1.1.5.1 — Core Node.js Real: Autenticação + RBAC + Escopo Produtor/Evento

Esta etapa estabelece a **fundação real de infraestrutura do backend** que sustenta todos os módulos operacionais da DiskIngressos.

### Stack Tecnológica
- **Linguagem & Runtime:** Node.js + TypeScript
- **Framework Web:** Express
- **Banco de Dados & ORM:** PostgreSQL + Prisma ORM
- **Autenticação & Sessões:** JWT (Access Token 15m + Refresh Token 7d)
- **Criptografia de Senhas:** Argon2 (Argon2id profile)
- **Validação de Payloads:** Zod
- **Auditoria:** `AuditService` central e imutável

### 🏛️ Banco Central de Identidade (Prisma Schema)

```text
USER
 │
 ├──────── USER_ROLE ─────── ROLE
 │                             │
 │                       ROLE_PERMISSION
 │                             │
 │                         PERMISSION
 │
 ├──────── USER_PERMISSION
 │
 ├──────── USER_PRODUCER_ACCESS ─── PRODUCER
 │
 ├──────── USER_EVENT_ACCESS ────── EVENT
 │
 ├──────── SESSION
 │
 └──────── AUDIT_LOG
```

### 📦 Estrutura Modular do Backend

```text
backend/
├── src/
│   ├── server.ts                    # Entrypoint HTTP
│   ├── app.ts                       # Configuração Express e middlewares
│   ├── config/
│   │   ├── env.ts                   # Variáveis de ambiente validadas com Zod
│   │   └── auth.ts                  # Parâmetros JWT e Argon2
│   ├── core/
│   │   ├── database/
│   │   │   └── prisma.ts            # Cliente Prisma & Engine Relacional em memória para testes
│   │   ├── errors/
│   │   │   └── AppError.ts          # Classes de erro tipadas (401, 403, 404, 400, 500)
│   │   ├── middleware/
│   │   │   ├── authenticate.ts      # Verificação Bearer JWT + Sessão no Banco
│   │   │   ├── requirePermission.ts # Validação RBAC granular e superadmin bypass
│   │   │   ├── requireScope.ts      # Scope Engine (Produtor -> Evento) & query builder
│   │   │   └── errorHandler.ts      # Tratamento unificado de erros e ZodError
│   │   └── security/
│   │       ├── password.ts          # Hash & Verify com Argon2id
│   │       ├── token.ts             # Assinatura e verificação de JWT
│   │       └── twoFactor.ts         # Autenticação de dois fatores (TOTP/2FA)
│   ├── modules/
│   │   ├── auth/                    # Login, Refresh, Logout, /me, 2FA, Sessões
│   │   ├── users/                   # Gestão de usuários, perfis, escopos e bloqueios
│   │   ├── roles/                   # Catálogo de perfis e permissões granulares
│   │   ├── events/                  # Eventos com isolamento por escopo
│   │   ├── finance/                 # Saldos, transferências e aprovação
│   │   ├── orders/                  # Pedidos com barreira contra vazamento entre produtores
│   │   ├── marketing/               # Campanhas e tráfego
│   │   ├── accounting/              # DRE e contabilidade
│   │   └── audit/                   # Trilha de auditoria imutável
│   └── routes/
│       └── index.ts                 # Roteador central da API v1
├── prisma/
│   ├── schema.prisma                # Modelagem relacional completa
│   └── seed.ts                      # Semeadura com perfis e permissões dos 9 módulos
├── tests/
│   └── auth-rbac-real.test.ts       # Suíte de testes automatizados (15 casos)
├── .env
├── package.json
└── tsconfig.json
```

---

## 🧪 Suíte de Testes Automatizados da Fase 1.1.5.1

A conformidade foi homologada com **15/15 testes aprovados (100%)**:

```bash
# Executar a partir da raiz do monorepo:
npm run test:api

# Ou diretamente na pasta backend:
npm test --prefix backend
```

### Casos de Teste Homologados:
1. `PASS`: **Login Válido** com e-mail, senha e geração de Access Token + Refresh Token.
2. `PASS`: **Senha Inválida** rejeitada com `401 Unauthorized`.
3. `PASS`: **Usuário Bloqueado** barrado no login com `403 Forbidden`.
4. `PASS`: **Token Inválido/Corrompido** retorna `401 Unauthorized`.
5. `PASS`: **Token Expirado** retorna `401 Unauthorized`.
6. `PASS`: **Refresh Token Válido** gera novos pares de tokens sem necessidade de relogin.
7. `PASS`: **Logout** invalida a sessão no banco e revoga tokens imediatamente.
8. `PASS`: **ADMIN** acessa módulo Financeiro.
9. `PASS`: **FINANCEIRO** acessa Financeiro (`200`), mas NÃO administra usuários (`403`).
10. `PASS`: **MARKETING** acessa campanhas de Marketing (`200`), mas NÃO acessa Contabilidade (`403`).
11. `PASS`: **SAC** consulta pedido de cliente (`200`), mas NÃO aprova transferências (`403`).
12. `PASS`: **PRODUTOR A (Opus)** acessa Evento A (`200`) e é bloqueado no Evento B (`403`).
13. `PASS`: **PRODUTOR B (Live Nation)** acessa Evento B (`200`) e é bloqueado no Evento A (`403`).
14. `PASS`: **Chamada Direta da API** sem permissão granular específica retorna `403`.
15. `PASS`: **SUPER ADMIN** possui acesso irrestrito universal (módulos, recursos, produtores e eventos).

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js >= 18.x
- npm >= 9.x

### Execução em Desenvolvimento

```bash
# Iniciar o Frontend React (Vite): http://localhost:5173
npm run dev

# Iniciar a API Central Node.js (porta 3001):
npm run dev:api
```

### Compilação de Produção

```bash
# Compila frontend e backend simultaneamente com TypeScript
npm run build:all
```

---

## 👤 Perfis Disponíveis para Demonstração e Teste

- **👑 Super Administrador:** `admin@diskingressos.com.br` (`isSuperAdmin = true`, acesso irrestrito).
- **💼 Financeiro Master (Maria):** `maria.financeiro@diskingressos.com.br` (com permissão de aprovação de repasses).
- **👤 Financeiro Júnior (Carlos):** `carlos.financeiro@diskingressos.com.br` (perfil financeiro, mas sem poder de aprovação).
- **📈 Marketing (Lucas):** `lucas.marketing@diskingressos.com.br` (acessa campanhas, bloqueado no financeiro).
- **🎧 SAC (Ana):** `ana.sac@diskingressos.com.br` (consulta 360 de pedidos, bloqueada em operações financeiras).
- **🎸 Produtor A (Roberto - Opus):** `roberto@opus.com.br` (escopo restrito a `prd_100` / `evt_1001`).
- **🎤 Produtora B (Renata - Live Nation):** `renata@livenation.com.br` (escopo restrito a `prd_200` / `evt_2001`).
- **🚫 Usuário Bloqueado:** `bloqueado@diskingressos.com.br` (conta suspensa por segurança).
