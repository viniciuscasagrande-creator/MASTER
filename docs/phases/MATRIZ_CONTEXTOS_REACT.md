# Matriz de Contextos React no Frontend — Fase 1.3.11.1.5

## 1. Visão Geral da Árvore de Provedores

A árvore de contextos no frontend (`apps/web/src/core/context/`) segue uma ordem hierárquica estrita para assegurar que dados de sessão e escopo de produtor/evento estejam disponíveis para todos os módulos:

```text
<ThemeProvider>
  <NotificationProvider>
    <AuthProvider>
      <DiskProvider>          <-- Contexto Global Disk Interno (Produtor × Evento)
        <QueryClientProvider>
          <Router>
            <AppRoutes />
          </Router>
        </QueryClientProvider>
      </DiskProvider>
    </AuthProvider>
  </NotificationProvider>
</ThemeProvider>
```

---

## 2. Inventário de Contextos React

| Contexto React | Arquivo Fonte | Estado Gerenciado | Consumidores Principais | Mecanismo de Sincronização |
|---|---|---|---|---|
| `AuthContext` | `src/core/context/AuthContext.tsx` | `user`, `token`, `isAuthenticated`, `permissions` | Todos os módulos, rotas protegidas | `localStorage` (JWT token seguro) |
| `DiskContext` | `src/core/context/DiskContext.tsx` | `activeProducer`, `activeEvent`, `availableProducers`, `availableEvents`, `isProducerContext`, `isEventContext` | `ModuleSidebar`, `TopBar`, páginas operacionais | `localStorage` + Invalidação atômica |
| `NotificationContext`| `src/core/context/NotificationContext.tsx`| Toasts de feedback, alertas de sistema, avisos de erro | Todas as telas e modais | Em memória (fila FIFO) |
| `ThemeContext` | `src/core/context/ThemeContext.tsx`| `theme` ('light' ou 'dark') | Tailwind CSS / Design System | `localStorage` |

---

## 3. Garantia de Invalidação Atômica no `DiskContext`

Para eliminar o risco de "vazamento visual" onde um evento de outro produtor permaneceria renderizado temporariamente em tela:

```typescript
// Trecho de apps/web/src/core/context/DiskContext.tsx
const setActiveProducer = useCallback((producer: Producer | null) => {
  setActiveProducerState(producer);
  if (!producer) {
    setActiveEventState(null);
    localStorage.removeItem('disk_active_producer');
    localStorage.removeItem('disk_active_event');
    return;
  }
  localStorage.setItem('disk_active_producer', JSON.stringify(producer));
  
  // INVALALIDAÇÃO ATÔMICA: Se o evento atual não pertencer ao novo produtor, zera imediatamente
  setActiveEventState((prevEvent) => {
    if (prevEvent && prevEvent.producerId !== producer.id) {
      localStorage.removeItem('disk_active_event');
      return null;
    }
    return prevEvent;
  });
}, []);
```

---

## 4. Diretrizes de Otimização de Performance

- **Uso de `useMemo` e `useCallback`:** Em todos os seletores e callbacks expostos pelo contexto para prevenir renderizações desnecessárias de componentes filhos.
- **Divisão Granular:** Componentes que necessitam apenas do `activeProducer` não re-renderizam quando apenas contadores secundários sofrem atualização.
