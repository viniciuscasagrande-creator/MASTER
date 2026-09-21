# Matriz Definitiva de Navegação do Disk Interno — Fase 1.3.11.1.5

## 1. Visão Geral da Navegação

A navegação do **Disk Interno (MASTER)** é dividida em três níveis complementares:
1. **Navegação Superior (TopBar):** Breadcrumb dinâmico, seletores contextuais de Produtor e Evento, notificações e menu do usuário autenticado.
2. **Navegação Lateral Primária (`ModuleSidebar.tsx`):** Estrutura canônica de 5 seções operacionais.
3. **Navegação Secundária / Abas Contextuais:** Abas internas em páginas detalhadas (ex: Abas de Ficha Técnica, Lotes, Ingressos em Eventos; Abas de Ingressos, Pagamento, Histórico em Pedidos).

---

## 2. Estrutura Canônica das 5 Seções da Sidebar

```text
┌─────────────────────────────────────────────────────────┐
│ DISK INGRESSOS · DISK INTERNO                           │
├─────────────────────────────────────────────────────────┤
│ [SELETOR PRODUTOR]    Organização XYZ                  ▼│
│ [SELETOR EVENTO]      Festival de Primavera 2026       ▼│
├─────────────────────────────────────────────────────────┤
│ 1. VISÃO GERAL                                          │
│    ├── Início / Dashboard Global                        │
│    └── Visão Geral do Produtor                          │
│                                                         │
│ 2. OPERAÇÃO                                             │
│    ├── Eventos                                          │
│    ├── Comercial (Vendas & Pedidos)                     │
│    ├── Suporte Eventos (Portaria & Catracas)            │
│    ├── Atendimento SAC (Central de Consulta)            │
│    └── Estorno (Devoluções & Aprovações)                │
│                                                         │
│ 3. GESTÃO                                               │
│    ├── Financeiro (Saldos & Repasses)                   │
│    └── Contabilidade (Livro Razão & Partidas Dobradas)  │
│                                                         │
│ 4. CRESCIMENTO                                          │
│    ├── Marketing (Pixels & Campanhas)                   │
│    └── Remarketing (Carrinhos Abandonados)              │
│                                                         │
│ 5. SISTEMA                                              │
│    ├── Administração & Usuários                         │
│    └── Configurações Globais                            │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Comportamento do Seletor de Contexto

- **Sem Produtor Selecionado:** A barra lateral exibe apenas a Visão Geral consolidada, SAC (Central de Consulta), Financeiro global e Módulos do Sistema. Os módulos de Operação de Evento permanecem em modo de espera ("Aguardando seleção de produtor").
- **Ao Selecionar Produtor:** Filtra automaticamente todos os eventos disponíveis pertencentes àquele produtor.
- **Ao Trocar de Produtor:** O evento selecionado anteriormente é imediatamente limpo do estado do React e do `localStorage`, evitando que uma tela de detalhe de evento permaneça renderizada com dados do produtor anterior.
- **Ao Selecionar Evento:** As páginas de Eventos, Comercial e Suporte Eventos entram automaticamente em modo focado naquele evento específico, exibindo os dados daquele evento sem necessidade de preencher formulários de filtro repetitivos.

---

## 4. Acessibilidade e Atalhos

- **Toggle da Sidebar:** `Ctrl + B` para recolher/expandir a barra lateral.
- **Busca Rápida na Central de Consulta (SAC):** `Ctrl + K` abre o modal de busca omnicanal por CPF, pedido ou e-mail de qualquer lugar da aplicação.
- **Navegação por Teclado:** Foco contínuo via `Tab` com anéis de foco visíveis (`focus:ring-2 focus:ring-primary-500`).
