# Matriz de Componentes Duplicados e Consolidação — Fase 1.3.11.1.5

## 1. Visão Geral da Racionalização de Componentes

Durante o crescimento acelerado do MASTER, múltiplos módulos criaram implementações próprias para elementos comuns de interface (modais, badges de status, tabelas de listagem, formulários de moeda).

Na Fase 1.3.11.1.5, esses elementos foram auditados e consolidados em `apps/web/src/shared/components/`, alinhando-se rigorosamente ao design system do **Limitless** (UI/UX) e à funcionalidade operacional do **SafeSaff**.

---

## 2. Inventário de Componentes Auditados e Consolidados

| Elemento de UI | Implementações Duplicadas Anteriores | Componente Canônico Consolidado | Localização Canônica | Benefício / Redução de Código |
|---|---|---|---|---|
| **Navegação Lateral** | `Sidebar.tsx`, `AppSidebar.tsx`, `EventSidebar.tsx` | `ModuleSidebar.tsx` | `src/shared/components/ModuleSidebar.tsx` | Navegação unificada nas 5 seções canônicas com suporte a contexto. |
| **Pílula de Status (Badge)**| Códigos Tailwind repetidos em 12 arquivos com cores divergentes | `StatusBadge.tsx` | `src/shared/components/StatusBadge.tsx` | Mapeamento centralizado de cores por status (`PAID`, `PENDING`, `COMPLETED`, `CANCELLED`). |
| **Estrutura de Modal** | 6 modais com backdrops, z-indexes e animações diferentes | `Modal.tsx` / `Dialog.tsx` | `src/shared/components/ui/Dialog.tsx` | Acessibilidade WAI-ARIA, foco automático e fechamento padronizado em ESC. |
| **Tabela com Paginação** | Tabelas ad-hoc em Comercial, SAC e Estorno | `DataTable.tsx` | `src/shared/components/DataTable.tsx` | Paginação assíncrona, ordenação de colunas e estado de carregamento uniforme. |
| **Input de Moeda (BRL)** | RegExs manuais divergentes de formatação de centavos | `CurrencyInput.tsx` | `src/shared/components/forms/CurrencyInput.tsx` | Máscara monetária brasileira infalível com conversão direta para centavos/float. |
| **Seletor de Contexto** | Dropdowns isolados de Produtor e Evento | `GlobalEventSelector.tsx` | `src/shared/components/GlobalEventSelector.tsx` | Sincronizado atômico com o `DiskContext`. |

---

## 3. Diretrizes de Manutenção de Componentes

1. **Localização Obrigatória:** Qualquer componente genérico (utilizado por mais de um módulo) deve residir em `apps/web/src/shared/components/`.
2. **Componentes de Domínio:** Componentes específicos de um único módulo (ex: `NewRefundModal.tsx`, `CustomerDossierModal.tsx`) residem em `apps/web/src/modules/<modulo>/components/`, consumindo os blocos fundamentais de `shared/`.
3. **Zero Duplicação de Estilo:** Proibido duplicar regras de sombra, borda ou gradiente de botões fora do Tailwind tema pré-configurado.
