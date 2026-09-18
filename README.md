# DISK INTERNO (PDT) — PLATAFORMA UNIFICADA DE OPERAÇÕES

> Plataforma central e unificada de operações da **DiskIngressos**, construída sobre arquitetura **SaaS Enterprise 2026**, design system moderno com paleta escura (obsidian slate) e laranja institucional, sidebar expansiva por clique e um **Core relacional único**.

---

## 🎯 Princípio Arquitetural Fundamental

O **Disk Interno** não opera com silos ou cópias dispersas de pedidos entre departamentos. Todo o ciclo de vida comercial e operacional compartilha uma única cadeia de integridade referencial:

```text
Produtor ──> Evento ──> Cliente ──> Pedido ──> Ingresso ──> Pagamento ──> Repasse
```

### Cascata em Tempo Real

Quando uma venda é processada no checkout:

```text
Venda Realizada (Pedido #DK-XXXXX)
      │
      ├── EVENTOS:        +1 ingresso emitido na capacidade do setor
      ├── COMERCIAL:      Atualiza receita e metas do produtor
      ├── SAC:            Disponível instantaneamente na Central de Consulta 360°
      ├── FINANCEIRO:     Registra pagamento, taxa Disk e saldo a repassar
      ├── CONTABILIDADE:  Gera lançamentos em partidas dobradas (Débito e Crédito)
      └── MARKETING:      Computa conversão e ROAS na campanha/UTM de origem
```

E em caso de estorno, o caminho inverso é executado de forma atômica:
- O ingresso é cancelado/bloqueado na portaria
- O pedido tem seu status atualizado para `refunded`
- O saldo do produtor é ajustado
- A contabilidade gera o estorno contábil correspondente
- A trilha de auditoria imutável registra todos os efeitos em cascata

---

## 🏛️ Estrutura dos 9 Módulos Operacionais

```text
DISK INTERNO
│
├── Visão Geral (Radar Executivo & Métricas Consolidadas)
│
├── EVENTOS
│   ├── Painel de Eventos, Todos os Eventos, Criar Evento
│   ├── Lotes e Ingressos, Setores / Mapas
│   └── Check-in & Operação em Tempo Real
│
├── COMERCIAL
│   ├── Painel Comercial, Produtores Credenciados
│   ├── Leads, Oportunidades, Funil Comercial & Pipeline
│   └── Metas & Comissões
│
├── SUPORTE EVENTOS (War Room)
│   ├── Painel Operacional, Chamados & Incidentes de Campo
│   ├── Catracas, Redes & Fiscais de Portaria
│   └── Monitoramento de SLA
│
├── ATENDIMENTO SAC
│   ├── Painel SAC & Fila de Protocolos
│   ├── Central de Consulta 360° (Busca por CPF, Pedido, E-mail)
│   ├── Gestão de Titularidade & Reenvio de Vouchers
│   └── Abertura de Solicitações de Estorno
│
├── ESTORNO
│   ├── Painel de Estornos & Fila de Aprovação
│   ├── Estorno Total vs. Parcial
│   ├── Gestão de Chargebacks
│   └── Disparo de Cascata Reversa no Core
│
├── FINANCEIRO
│   ├── Painel Financeiro (4 KPIs: Vendas, Saldo, A Receber, Repasses)
│   ├── Fluxo Financeiro (Entradas, Taxas e Saídas por hora)
│   ├── Saldo por Evento (Segregação de Contas)
│   ├── Próximos Repasses (Tabela Operacional com PIX/CNAB)
│   └── Alertas & Auto-Conciliação de Gateways
│
├── CONTABILIDADE
│   ├── Painel Contábil & Plano de Contas
│   ├── Livro Diário com Lançamentos em Partidas Dobradas
│   ├── Balancete de Verificação (Débito = Crédito)
│   └── DRE Gerencial em Tempo Real
│
├── MARKETING
│   ├── Painel de Performance Multicanal
│   ├── Campanhas Meta Ads, Google Ads, TikTok Ads, Spotify Ads
│   └── Métricas de ROAS, CPA e Atribuição de Bilheteria
│
└── REMARKETING
    ├── Carrinhos Abandonados & Fila de Retenção
    ├── Réguas de Automação via WhatsApp API & E-mail
    └── Métricas de Recuperação de Receita & ROI
```

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js >= 18.x
- npm >= 9.x

### Instalação e Execução

```bash
# Clone o repositório
git clone https://github.com/viniciuscasagrande-creator/MASTER.git
cd MASTER

# Instale as dependências (workspaces)
npm install --prefix apps/web

# Execute em modo de desenvolvimento
npm run dev

# Para compilar a aplicação de produção
npm run build
```

Acesse no navegador: `http://localhost:5173`

---

## ⚡ Recursos Integrados na Interface

1. **Sidebar Expansiva por Clique:**
   - Modo Rail compacto com ícones ou modo expandido completo.
   - Submenus em Accordion (*clique abre, clique fecha*, persistindo o estado).
2. **Header Enterprise Global:**
   - Filtro de Escopo Global (Produtor & Evento).
   - Busca Global / Command Palette (`Cmd + K` ou `Ctrl + K`).
   - Simulador de Vendas com efeito de cascata inter-módulos em tempo real.
   - Central de Notificações com alertas de segurança e vendas.
   - Trilha de Auditoria imutável com logs de impacto nos 9 módulos.
   - Seletor de Papel RBAC (*Admin Master, Diretoria Financeira, SAC, etc.*).
3. **Design System 2026:**
   - Tailwind CSS v4, Lucide Icons, tipografia geométrica de alta legibilidade, números tabulares para moedas e IDs, e componentes de densidade enterprise.
