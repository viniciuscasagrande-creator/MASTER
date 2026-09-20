# CATÁLOGO DE PADRÕES VISUAIS LIMITLESS
## Tradução Arquitetural: HTML/CSS Limitless → React / Tailwind / shadcn/ui

**Data:** 20/09/2026  
**Finalidade:** Guia visual canônico para todas as interfaces do Disk Interno  

---

## 1. Regra de Tradução Tecnológica

O template Limitless fornece a **composição visual, proporções, densidade de dados e hierarquia de informação**.
Nenhum código legado (jQuery, Bootstrap antigo, scripts D3 legados ou HTML estático) entra no repositório MASTER.

```
LIMITLESS (Conceito Visual)
            ↓
DIRETRIZES DE DESIGN SYSTEM
            ↓
REACT 18 + TYPESCRIPT + TAILWIND CSS + SHADCN/UI + LUCIDE
```

---

## 2. Paleta de Cores e Tokens Semânticos

| Elemento | Token Semântico | Valor Hex / Tailwind | Função Visual |
| :--- | :--- | :--- | :--- |
| **Sidebar Background** | `bg-sidebar-dark` | `#0f172a` (`slate-900` / `slate-950`) | Sidebar executiva dark premium de alto contraste. |
| **Sidebar Text** | `text-sidebar-text` | `#cbd5e1` (`slate-300`) / `#ffffff` hover | Tipografia limpa, suave e legível. |
| **Sidebar Active** | `bg-sidebar-active` | `rgba(249, 115, 22, 0.15)` + `#f97316` | Destaque laranja Disk Ingressos com barra indicadora lateral de 4px. |
| **Workspace Background** | `bg-workspace` | `#f8fafc` (`slate-50`) / `#f1f5f9` (`slate-100`) | Área de trabalho clara e relaxante para turnos prolongados. |
| **Card Surface** | `bg-card` | `#ffffff` (branco) com borda `#e2e8f0` (`slate-200`) | Cards nítidos com sombras sutis (`shadow-sm`). |
| **Header Surface** | `bg-header` | `#ffffff` ou `#0f172a` dependendo do modo | Barra superior executiva com alinhamento preciso. |
| **Destaque Primário** | `brand-orange` | `#f97316` (`orange-500`) / `#ea580c` (`orange-600`) | Cor institucional Disk Ingressos para CTAs principais e indicadores ativos. |
| **Status Sucesso** | `badge-success` | `#10b981` (`emerald-500`) / bg `emerald-50` | Eventos publicados, pedidos pagos, check-in validado. |
| **Status Alerta** | `badge-warning` | `#f59e0b` (`amber-500`) / bg `amber-50` | Rascunhos, vendas pausadas, pendências operacionais. |
| **Status Erro / Perigo** | `badge-danger` | `#ef4444` (`rose-500`) / bg `rose-50` | Cancelamentos, incidentes críticos, estornos rejeitados. |
| **Status Informativo** | `badge-info` | `#06b6d4` (`cyan-500`) / bg `cyan-50` | Códigos de evento, identificadores, metadados. |

---

## 3. Catálogo de Componentes Base

### 3.1. AppShell & Sidebar (Limitless Layout Standard)
- **Largura Expandida:** 256px (`w-64`).
- **Largura Recolhida:** 64px (`w-16`).
- **Comportamento de Colapso:** Acionado exclusivamente por **clique** no botão de alternância (não por hover acidental).
- **Submenus:** Recuo de 20px (`ml-5 pl-2.5`) com linha lateral sutil (`border-l border-slate-800`).
- **Transição:** `transition-all duration-300 ease-in-out`.

### 3.2. Page Header com Breadcrumbs (Limitless Header Pattern)
- **Barra de Navegação Estrutural:**
  ```text
  Eventos › Rock Festival 2026 › Lotes de Venda
  ```
- **Linha Principal:** Título da página em destaque (`text-xl font-bold tracking-tight text-slate-900`) acompanhado de badge de status chip (`● Em Vendas`).
- **Barra de Ações Contextuais:** Botões alinhados à direita com ícone e rótulo claro (`[ + Novo Lote ]`, `[ Exportar CSV ]`).

### 3.3. StatCards / KPIs (Limitless Analytics Pattern)
- **Estrutura:**
  - Label superior: caixa alta compacta (`text-[11px] font-bold text-slate-500 tracking-wider`).
  - Valor principal: grande e destacado (`text-2xl font-extrabold text-slate-900 font-mono`).
  - Indicador de tendência inferior: badge pill com percentual e ícone de seta (`+12.4% vs semana anterior`).
  - Ícone de fundo: ícone sutil e translúcido no canto superior direito.

### 3.4. Tabelas de Dados Executivas (Limitless DataTable Standard)
- **Cabeçalho:** Fundo neutro suave (`bg-slate-100`), texto em caixa alta discreto (`text-[11px] font-semibold text-slate-600 tracking-wider`).
- **Linhas:** Altura confortável (48px), borda sutil divisória (`border-b border-slate-200`), hover suave (`hover:bg-slate-50`).
- **Alinhamento Numérico:** Valores monetários e quantidades sempre alinhados estritamente à **direita** com fonte mono-espaçada.
- **Status Chips:** Badges compactos com bolinha de status pulsante para itens em andamento.

### 3.5. Wizard em Passos (Limitless Form Wizard Pattern)
- **Indicador de Passos:** Barra horizontal superior com números em círculos conectados por linhas de progresso.
- **Passos Concluídos:** Círculo verde com ícone de check.
- **Passo Ativo:** Círculo laranja com borda e texto em negrito.
- **Passos Futuros:** Círculo cinza claro.
- **Rodapé Fixo:** Botões `[ Voltar ]`, `[ Salvar Rascunho ]` e `[ Próximo Passo → ]`.

### 3.6. Painéis Deslizantes / Offcanvas (Limitless Drawer Pattern)
- **Largura:** 400px a 540px dependendo da densidade de dados.
- **Fundo:** Superfície limpa com backdrop semitransparente (`bg-slate-900/50 backdrop-blur-sm`).
- **Utilização:** Trilha de auditoria, detalhes de pedido, notificações em tempo real, edição rápida de configurações.

---

## 4. Diretrizes de Responsividade (Desktop, Tablet e Mobile)

| Dispositivo | Breakpoint | Sidebar | Header | Workspace |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop Grande** | `≥ 1280px (xl)` | Fixa expandida (256px) ou recolhida (64px). | Completo com seletores popover e busca. | Grid de 3 a 4 colunas. |
| **Desktop / Laptop** | `1024px – 1279px (lg)` | Fixa recolhida por padrão ou expandida. | Busca com modal (Ctrl+K). | Grid de 2 a 3 colunas. |
| **Tablet** | `768px – 1023px (md)` | Recolhida (64px) com drawer opcional. | Breadcrumbs compactados. | Grid de 1 a 2 colunas. |
| **Mobile** | `< 768px (sm)` | Oculta; acionada via Drawer lateral por botão hambúrguer `☰`. | Header compacto; seletores em modal full-screen. | Coluna única; tabelas com rolagem horizontal suave. |
