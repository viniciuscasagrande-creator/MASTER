# Design System Disk Interno — Especificação Definitiva — Fase 1.3.11.1.5

## 1. Princípios Visuais e Referência Limitless

O Design System do Disk Interno segue a experiência de usuário refinada e minimalista do **Limitless UI**, priorizando densidade de informação limpa, contraste WCAG AA, tipografia legível e feedback instantâneo.

---

## 2. Paleta de Cores e Tokens Semânticos

| Token Semântico | Classe Tailwind (Dark / Light) | Uso e Significado |
|---|---|---|
| **Background Principal** | `bg-slate-950` / `bg-slate-50` | Fundo estrutural da página |
| **Card / Superfície** | `bg-slate-900/80` / `bg-white` | Superfícies de cartões, formulários e modais |
| **Borda Padrão** | `border-slate-800` / `border-slate-200` | Divisores de seção e tabelas |
| **Primário / Destaque** | `bg-blue-600` / `text-blue-500` | Botões primários, links ativos e abas selecionadas |
| **Sucesso / Pago** | `emerald-500` (`bg-emerald-500/10 text-emerald-400`) | Pedidos pagos, lotes ativos, estornos concluídos |
| **Aviso / Pendente** | `amber-500` (`bg-amber-500/10 text-amber-400`) | Estornos pendentes de aprovação, lotes esgotando |
| **Erro / Cancelado** | `rose-500` (`bg-rose-500/10 text-rose-400`) | Pedidos cancelados, estornos rejeitados, erros de API |
| **Neutro / Secundário** | `slate-400` / `slate-600` | Textos secundários, legendas e rótulos de formulário |

---

## 3. Tipografia e Escala de Espaçamento

- **Família Tipográfica:** `Inter`, `system-ui`, `-apple-system`, `sans-serif`.
- **Hierarquia de Títulos:**
  - `H1 (Título de Página):` `text-2xl font-bold tracking-tight text-white`
  - `H2 (Subtítulo / Seção):` `text-lg font-semibold text-slate-200`
  - `H3 (Título de Card):` `text-sm font-medium text-slate-400 uppercase tracking-wider`
  - `Body / Texto Corrido:` `text-sm font-normal text-slate-300`
  - `Caption / Auxiliar:` `text-xs font-normal text-slate-500`

---

## 4. Componentes Primitivos e Estados

### 4.1. Botões (`Button`)
- **Primário:** `bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-colors`
- **Secundário:** `bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg`
- **Perigo / Destrutivo:** `bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-800/40`
- **Estado de Carregamento:** Exibe spinner animado e desabilita cliques (`disabled:opacity-50 disabled:cursor-not-allowed`).

### 4.2. Pílulas de Status (`StatusBadge`)
- Altura uniforme (`h-6`), texto reduzido (`text-xs font-medium`), padding horizontal suave (`px-2.5 py-0.5`), cantos arredondados (`rounded-full`).
- Contraste validado para não ofuscar o texto no tema escuro.

### 4.3. Modais e Diálogos (`Modal`)
- Backdrop com desfoque de vidro (`backdrop-blur-sm bg-black/60`).
- Animação suave de entrada via Framer Motion ou transição CSS (`scale-95` para `scale-100`, `opacity-0` para `opacity-100`).
- Fechamento garantido via botão `X`, clique no backdrop ou tecla `ESC`.
