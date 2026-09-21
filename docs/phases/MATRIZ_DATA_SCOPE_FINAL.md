# Matriz de Data Scope e Isolamento Multi-Tenant — Fase 1.3.11.1.5

## 1. Princípios de Isolamento de Dados

O Disk Interno adota o modelo de multi-tenancy baseado em isolamento lógico estrito através das chaves relacionais `producerId`, `organizationId` e `eventId`.

Nenhum usuário de produtor (tenant) pode visualizar, listar ou modificar registros pertencentes a outro produtor, mitigando integralmente vulnerabilidades do tipo **IDOR** (Insecure Direct Object References).

---

## 2. Escopos de Acesso por Recurso

| Recurso / Tabela | Escopo Master Admin | Escopo Produtor Admin / Operador | Escopo SAC Agent | Escopo Financeiro |
|---|---|---|---|---|
| `Event` | Todos os eventos de todas as organizações | Somente eventos onde `producerId === user.producerId` | Todos os eventos (somente leitura) para auxílio ao comprador | Somente eventos de produtores sob sua carteira |
| `Order` | Todos os pedidos | Somente pedidos de eventos vinculados ao seu `producerId` | Busca global por documento/código para atendimento ao cliente | Somente pedidos vinculados a transações financeiras em conciliação |
| `Refund` | Todos os estornos | Somente estornos originados de pedidos do seu `producerId` | Estornos abertos pelo SAC ou de compradores em atendimento | Estornos pendentes de aprovação e execução financeira |
| `Customer` | Todos os clientes | Somente dados cadastrais de compradores de seus eventos | Consulta global de participantes para suporte | Consulta apenas de dados bancários/PIX para estornos |
| `Ledger / Payout`| Todas as contas contábeis | Somente extratos e saldos de repasse da sua organização | Sem acesso | Todas as conciliações e contas gráficas de liquidação |

---

## 3. Implementação Prática no Prisma ORM

Todas as consultas aos repositórios e serviços devem injetar a cláusula de escopo `where`:

```typescript
// Exemplo canônico de Data Scoping no Backend
export async function findOrdersForUser(
  user: AuthenticatedUser,
  filters: OrderFilterInput
) {
  const whereClause: Prisma.OrderWhereInput = {};

  // Se não for MASTER_ADMIN, aplica filtro obrigatório de produtor
  if (user.role !== 'MASTER_ADMIN') {
    if (!user.producerId) {
      throw new ForbiddenException('Usuário sem produtor associado.');
    }
    whereClause.producerId = user.producerId;
  } else if (filters.producerId) {
    // Master admin pode filtrar explicitamente por um produtor
    whereClause.producerId = filters.producerId;
  }

  if (filters.eventId) {
    whereClause.eventId = filters.eventId;
  }

  return prisma.order.findMany({
    where: whereClause,
    include: {
      items: true,
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

---

## 4. Prevenção de IDOR na Camada de Rota

Ao receber um ID de entidade na rota (`/api/events/:id`, `/api/refunds/:id`), o controller/service valida:
1. Se a entidade existe no banco.
2. Se o `entity.producerId === user.producerId` (ou se o usuário é `MASTER_ADMIN` ou `SAC_AGENT` com permissão de suporte).
3. Caso a entidade pertença a outro produtor, a API retorna **HTTP 404 Not Found** (ou **HTTP 403 Forbidden**) sem vazar a existência prévia do registro para atacantes.
