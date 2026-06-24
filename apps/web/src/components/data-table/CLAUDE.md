# DataTable

Tabela reutilizável com paginação, ordenação e busca global. Estado sincronizado automaticamente com a URL via `nuqs`. Construída sobre TanStack Table v8.

**Regra:** Qualquer listagem tabular neste projeto DEVE usar este componente. Nunca use `<table>` raw ou outra library.

## Arquivos

```
data-table/
├── data-table.tsx           # Componente composto (DataTable + subcomponentes)
├── data-table-toolbar.tsx   # Barra de busca + ações
├── data-table-pagination.tsx# Controles de paginação
├── hooks/
│   └── use-data-table.ts    # Hook principal — gerencia estado via URL
└── cells/
    ├── data-table-column-header.tsx  # Header com dropdown de sort
    ├── date-cell.tsx                 # Data relativa com tooltip
    ├── status-badge.tsx              # Badge colorida por status
    └── user-avatar-cell.tsx          # Avatar + nome de usuário
```

## Uso Básico

### 1. Definir colunas (module-level, fora do componente)

```typescript
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/cells/data-table-column-header";

// Defina fora do componente para evitar re-criação a cada render
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Criado em" />
    ),
    cell: ({ row }) => <DateCell date={row.original.createdAt} />,
  },
];
```

### 2. Conectar a query + montar a tabela

```typescript
import { useDataTable } from "@/components/data-table/hooks/use-data-table";
import { DataTable } from "@/components/data-table/data-table";
import { useUsersQuery } from "@/hooks/users/use-users.query";

function UsersPage() {
  const query = useUsersQuery();

  const { table } = useDataTable({
    columns,
    query,
    pageCount: query.data?.pageCount ?? -1,
  });

  return (
    <DataTable>
      <DataTable.Toolbar
        table={table}
        searchPlaceholder="Buscar usuários..."
        actions={[
          { label: "Novo Usuário", onClick: () => setOpen(true), icon: <Plus /> }
        ]}
      />
      <DataTable.Content table={table} />
      <DataTable.Pagination table={table} isLoading={query.isLoading} />
    </DataTable>
  );
}
```

## API

### `useDataTable(props)`

Hook principal. Gerencia estado de paginação, sorting e busca via URL params.

| Prop | Tipo | Descrição |
|------|------|-----------|
| `columns` | `ColumnDef<TData, TValue>[]` | Definição das colunas |
| `query` | `QueryState<TData>` | Objeto com `data`, `isLoading`, `isError`, `isFetching` |
| `pageCount` | `number` | Total de páginas (vindo da API). Use `-1` se desconhecido |

Retorna `{ table, isFetching, error }`.

**URL params gerenciados automaticamente:**

| Param | Default | Descrição |
|-------|---------|-----------|
| `page` | `1` | Página atual (1-indexed) |
| `limit` | `10` | Itens por página |
| `sort` | `"created_at"` | Campo de ordenação no formato `field.asc` ou `field.desc` |
| `search` | `""` | Busca global |
| `f_<campo>` | — | Filtros por coluna no formato `operador:valor` (ex: `f_status=eq:active`) |

### `QueryState<TData>`

Interface que o objeto retornado pelo hook de query deve satisfazer:

```typescript
interface QueryState<TData> {
  data: TData[] | undefined;
  error: unknown;
  isError: boolean;
  isFetching?: boolean;
  isLoading: boolean;
}
```

O retorno de `useQuery(trpc.<router>.list.queryOptions(...))` é compatível diretamente.

### `<DataTable>` (Composto)

| Subcomponente | Props principais | Descrição |
|--------------|-----------------|-----------|
| `<DataTable>` | `className?` | Container raiz (`space-y-4`) |
| `<DataTable.Toolbar>` | `table`, `actions?`, `searchPlaceholder?`, `children?` | Barra de ação + busca |
| `<DataTable.Content>` | `table` | Grid com estados de loading/error/vazio |
| `<DataTable.Pagination>` | `table`, `isLoading?` | Controles de página |

### `<DataTable.Toolbar>` — Actions

```typescript
interface DataTableToolbarAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: ButtonVariant; // "default" | "outline" | "ghost" | ...
}
```

Passe um array em `actions` para substituir o botão padrão "Criar". Use `children` para filtros adicionais ao lado da busca.

## Células Prontas

### `DataTableColumnHeader`

Header clicável com dropdown de ordenação (Asc / Desc / Ocultar).

```typescript
header: ({ column }) => (
  <DataTableColumnHeader column={column} title="Status" />
)
```

Só renderiza o dropdown se `column.getCanSort()` for `true` (controlado por `enableSorting` na def da coluna).

### `DateCell`

Data relativa (ex.: "há 3 dias") com tooltip mostrando data/hora completa.

```typescript
cell: ({ row }) => <DateCell date={row.original.createdAt} />
```

Aceita `Date | string | number`.

### `StatusBadge`

Badge com variante de cor mapeada por um dicionário de status.

```typescript
const STATUS_MAP: Record<string, StatusConfig> = {
  active:   { label: "Ativo",    variant: "default" },
  inactive: { label: "Inativo",  variant: "secondary" },
  banned:   { label: "Banido",   variant: "destructive" },
};

cell: ({ row }) => (
  <StatusBadge status={row.original.status} statusMap={STATUS_MAP} />
)
```

Variantes disponíveis: `"default"` | `"secondary"` | `"destructive"` | `"outline"` | `"warning"`.

### `UserAvatarCell`

Avatar com fallback de iniciais + nome do usuário.

```typescript
cell: ({ row }) => (
  <UserAvatarCell name={row.original.name} image={row.original.avatarUrl} />
)
```

## Paginação Server-Side

O `useDataTable` opera em modo **manual** (server-side) por padrão:
- `manualPagination: true`
- `manualSorting: true`
- `manualFiltering: true`

Isso significa que **a API é responsável por filtrar e paginar**. Passe os URL params (`page`, `limit`, `sort`, `search`) para o hook de query:

```typescript
// src/hooks/users/use-users.query.ts
export const useUsersQuery = () => {
  const [{ page, limit, sort, search }] = useQueryStates(tableQueryParsers);

  return useQuery(
    trpc.users.list.queryOptions({ page, limit, sort, search })
  );
};
```

Importe `tableQueryParsers` de `@/components/data-table/hooks/use-data-table`.

## Regras

- `columns` deve ser declarado **fora** do componente (module-level). Dentro do componente causa re-render infinito no TanStack Table.
- Não chame `useDataTable` com `query` que não implemente `QueryState<TData>`.
- Não implemente paginação client-side — sempre use `pageCount` da API e `manualPagination`.
- Para adicionar filtros facetados (dropdowns de status, etc.), use `children` na `Toolbar` e `columnFilters` do TanStack Table — não crie state separado.
