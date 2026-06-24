# DataTable com `useQuery` real

Este guia mostra como transformar o exemplo em `apps/web/src/app/(authenticated)/exemplos/data-table/` em uma tabela conectada a uma query real.

O componente já controla busca, filtros, ordenação, paginação e quantidade por página pela URL. O hook real só precisa ler esse estado, converter para o contrato da API e devolver o formato esperado por `useDataTable`.

Para implementar o lado do servidor, veja `docs/data-table-backend.md`.

## Fluxo atual

```txt
URL (?p=1&ps=10&q=ana&sort=[...]&f=[...])
  -> useTableSearchParams()
  -> hook useQuery real
  -> API/list endpoint
  -> useDataTable()
  -> DataTable.Toolbar / Content / Pagination
```

Arquivos principais:

- `apps/web/src/app/(authenticated)/exemplos/data-table/page.tsx`: exemplo de uso.
- `apps/web/src/components/data-table/hooks/use-data-table.ts`: cria a instância do TanStack Table.
- `apps/web/src/components/data-table/lib/table-state-parsers.ts`: define os query params da URL.
- `apps/web/src/components/data-table/hooks/use-data-table-filters.ts`: converte filtros da tabela para o formato da API.
- `apps/web/src/hooks/examples/use-mock-users-query.ts`: mock que simula o comportamento que a API real deve fazer.

## Contrato que o `useDataTable` espera

O hook passado para `useDataTable` deve retornar este shape:

```ts
type QueryState<TData> = {
  data: TData[] | undefined;
  error: unknown;
  isError: boolean;
  isFetching?: boolean;
  isLoading: boolean;
};

type ListQueryState<TData> = QueryState<TData> & {
  pageCount: number;
  total: number;
};
```

`data` deve ser apenas a página atual. `pageCount` deve vir da API ou ser calculado com `Math.ceil(total / limit)` no backend.

## Estado disponível na URL

Use `useTableSearchParams()` para ler o estado atual:

```ts
import { useTableSearchParams } from "@/components/data-table/lib/table-state-parsers";

const [urlState] = useTableSearchParams();
const { filters, pageIndex, pageSize, search, sort } = urlState;
```

Campos:

| Campo | Query param | Tipo no frontend | Uso na API |
|---|---|---|---|
| `pageIndex` | `p` | `number`, base zero | converter para `page = pageIndex + 1` |
| `pageSize` | `ps` | `number` | enviar como `limit` |
| `search` | `q` | `string` | busca global |
| `sort` | `sort` | `SortingState` | converter para string `campo.asc,campo2.desc` |
| `filters` | `f` | `ColumnFilterItem[]` | enviar como `filters` |

Importante: a tabela usa `pageIndex` base zero porque esse é o padrão do TanStack Table. A API usa `page` base um conforme `listParamsSchema`.

## Exemplo de hook real com React Query

Use este modelo quando o recurso tiver um endpoint REST ou uma função client-side que chame a API.

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import type { User } from "@acme/types";
import type { QueryState } from "@/components/data-table/hooks/use-data-table";
import {
  serializeSortingStateForApi,
  useTableSearchParams,
} from "@/components/data-table/lib/table-state-parsers";

type UsersResponse = {
  data: User[];
  pageCount: number;
  total: number;
};

type UsersQueryState = QueryState<User> & {
  pageCount: number;
  total: number;
};

async function fetchUsers(params: {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  filters?: unknown[];
}): Promise<UsersResponse> {
  const response = await fetch("/api/users/list", {
    body: JSON.stringify(params),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Erro ao carregar usuários.");
  }

  return response.json() as Promise<UsersResponse>;
}

export function useUsersQuery(): UsersQueryState {
  const [urlState] = useTableSearchParams();
  const { filters, pageIndex, pageSize, search, sort } = urlState;

  const page = pageIndex + 1;
  const limit = pageSize;
  const serializedSort = serializeSortingStateForApi(sort);
  const normalizedSearch = search.trim() || undefined;
  const normalizedFilters = filters.length > 0 ? filters : undefined;

  const query = useQuery({
    queryKey: [
      "users",
      "list",
      { page, limit, search: normalizedSearch, sort: serializedSort, filters },
    ],
    queryFn: () =>
      fetchUsers({
        filters: normalizedFilters,
        limit,
        page,
        search: normalizedSearch,
        sort: serializedSort,
      }),
  });

  return {
    data: query.data?.data,
    error: query.error,
    isError: query.isError,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    pageCount: query.data?.pageCount ?? -1,
    total: query.data?.total ?? 0,
  };
}
```

Depois use o hook na página:

```tsx
"use client";

import { DataTable } from "@/components/data-table/data-table";
import { useDataTable } from "@/components/data-table/hooks/use-data-table";
import { userColumns } from "@/components/features/users/user-columns";
import { useUsersQuery } from "@/hooks/users/use-users-query";

export function UsersTable() {
  const query = useUsersQuery();
  const { table } = useDataTable({
    columns: userColumns,
    pageCount: query.pageCount,
    query,
  });

  return (
    <DataTable>
      <DataTable.Toolbar searchPlaceholder="Buscar usuários..." table={table} />
      <DataTable.Content table={table} />
      <DataTable.Pagination isLoading={query.isLoading} table={table} />
    </DataTable>
  );
}
```

## Exemplo com tRPC

Se o recurso usa tRPC, mantenha a mesma conversão de estado. Troque apenas a função de query pelo client tRPC do projeto.

```ts
"use client";

import type { User } from "@acme/types";
import { useQuery } from "@tanstack/react-query";
import type { QueryState } from "@/components/data-table/hooks/use-data-table";
import {
  serializeSortingStateForApi,
  useTableSearchParams,
} from "@/components/data-table/lib/table-state-parsers";
import { trpc } from "@/lib/trpc";

type UsersQueryState = QueryState<User> & {
  pageCount: number;
  total: number;
};

export function useUsersQuery(): UsersQueryState {
  const [urlState] = useTableSearchParams();
  const { filters, pageIndex, pageSize, search, sort } = urlState;

  const input = {
    filters: filters.length > 0 ? filters : undefined,
    limit: pageSize,
    page: pageIndex + 1,
    search: search.trim() || undefined,
    sort: serializeSortingStateForApi(sort),
  };

  const query = useQuery(trpc.user.list.queryOptions(input));

  return {
    data: query.data?.data,
    error: query.error,
    isError: query.isError,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    pageCount: query.data?.pageCount ?? -1,
    total: query.data?.total ?? 0,
  };
}
```

O `listParamsSchema` em `packages/types/src/schemas/common.schema.ts` já aceita:

```ts
{
  page: number;
  limit: number;
  sort?: string;
  search?: string;
  filters?: ColumnFilterItem[];
}
```

## Ordenação

O usuário ordena clicando nos headers renderizados com `DataTableColumnHeader`.

O estado fica em `urlState.sort` como array do TanStack Table:

```ts
[
  { id: "name", desc: false },
  { id: "createdAt", desc: true },
]
```

Antes de enviar para a API, use:

```ts
const sort = serializeSortingStateForApi(urlState.sort);
```

Isso gera:

```txt
name.asc,createdAt.desc
```

No backend, aceite somente colunas permitidas:

```ts
const sortableColumns = {
  createdAt: user.createdAt,
  email: user.email,
  name: user.name,
  status: user.status,
} as const;
```

Nunca aplique o nome da coluna recebido do cliente diretamente em SQL. Use uma whitelist como `sortableColumns`.

## Paginação

A tabela usa paginação manual:

```ts
manualPagination: true
```

Quando o usuário troca de página, `useDataTable` atualiza `pageIndex` na URL. Quando troca `pageSize`, ele reseta `pageIndex` para `0`.

Conversão para API:

```ts
const page = pageIndex + 1;
const limit = pageSize;
```

Resposta esperada:

```ts
{
  data: rows,
  pageCount: Math.ceil(total / limit),
  total,
}
```

`DataTable.Pagination` usa `pageCount` para saber quantas páginas existem. Se a API ainda não carregou, retorne `-1`.

## Quantidade por página

O page size fica em `urlState.pageSize` e no query param `ps`.

O hook real deve enviar esse valor como `limit`:

```ts
const limit = urlState.pageSize;
```

No backend, mantenha limite máximo. O schema atual usa `max(100)`, então o cliente não consegue pedir páginas maiores que 100 se o input passar por `listParamsSchema`.

## Busca global

`DataTable.Toolbar` escreve a busca em `urlState.search`, usando o query param `q`.

Ao mudar a busca, `useDataTable` reseta a página para a primeira:

```ts
setUrlState({ pageIndex: 0, search: next || null });
```

Envie `undefined` quando a busca estiver vazia:

```ts
const search = urlState.search.trim() || undefined;
```

No backend, aplique busca apenas em colunas textuais relevantes, como nome e email.

## Filtros por coluna

Para uma coluna ter filtro, ela precisa usar `DataTableColumnHeader` e declarar `meta.filterType`:

```tsx
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
    meta: { filterType: "text" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    meta: {
      filterOptions: [
        { label: "Ativo", value: "active" },
        { label: "Inativo", value: "inactive" },
      ],
      filterType: "select",
    },
  },
];
```

O estado enviado para a API é `ColumnFilterItem[]`:

```ts
type ColumnFilterItem = {
  field: string;
  operator: string;
  value?: string | number | boolean | string[] | number[];
};
```

Exemplo:

```ts
[
  { field: "status", operator: "equals", value: "active" },
  { field: "age", operator: "gte", value: 18 },
  { field: "department", operator: "in", value: ["engineering", "design"] },
]
```

Operadores aceitos pelo schema atual:

| Tipo | `filterType` | Operadores |
|---|---|---|
| Texto | `text` | `contains`, `startsWith`, `endsWith`, `equals`, `notEquals` |
| Número | `number` | `equals`, `gt`, `gte`, `lt`, `lte`, `between` |
| Data | `date` | `equals`, `before`, `after`, `between` |
| Select | `select` | `equals`, `notEquals`, `in`, `notIn` |
| Booleano | `boolean` | `equals` |

O mock também trata `isEmpty` e `isNotEmpty`, mas esses operadores ainda não estão no schema compartilhado. Não use esses operadores em APIs reais até o schema e o backend aceitarem oficialmente.

## Backend: aplicar filtros, ordenação e paginação

O backend deve receber `ListParams` e aplicar três whitelists:

1. Colunas pesquisáveis para `search`.
2. Colunas ordenáveis para `sort`.
3. Colunas filtráveis para `filters`.

Exemplo com Drizzle:

```ts
import type { ListParams } from "@acme/types";
import { and, asc, count, desc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

const sortableColumns = {
  createdAt: user.createdAt,
  email: user.email,
  name: user.name,
  status: user.status,
} as const;

const filterableColumns = {
  age: user.age,
  createdAt: user.createdAt,
  department: user.department,
  name: user.name,
  status: user.status,
} as const;

export async function listUsers(params: ListParams) {
  const offset = (params.page - 1) * params.limit;
  const whereClause = and(
    params.search
      ? or(
          ilike(user.name, `%${params.search}%`),
          ilike(user.email, `%${params.search}%`)
        )
      : undefined,
    ...applyColumnFilters(params.filters, filterableColumns)
  );
  const orderBy = parseSort(params.sort, sortableColumns, user.createdAt);

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(user)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(params.limit)
      .offset(offset),
    db.select({ count: count() }).from(user).where(whereClause),
  ]);

  const total = Number(totalRows[0]?.count ?? 0);

  return {
    data: rows,
    pageCount: Math.ceil(total / params.limit),
    total,
  };
}
```

`applyColumnFilters` e `parseSort` devem ignorar campos que não existem nas whitelists. Isso evita acesso indevido a colunas internas e impede SQL injection via nome de campo.

## Checklist para criar uma nova tabela

1. Crie as colunas em module-level com `ColumnDef<T>[]`.
2. Use `DataTableColumnHeader` em headers que ordenam ou filtram.
3. Adicione `meta.filterType` só nas colunas filtráveis.
4. Adicione `filterOptions` para filtros `select`.
5. Crie `useMeuRecursoQuery()` lendo `useTableSearchParams()`.
6. Converta `pageIndex` para `pageIndex + 1`.
7. Envie `pageSize` como `limit`.
8. Converta `sort` com `serializeSortingStateForApi()`.
9. Envie `filters` como `ColumnFilterItem[]` ou `undefined` quando vazio.
10. Retorne `{ data, pageCount, total, isLoading, isFetching, isError, error }`.
11. No backend, aplique whitelists para ordenação e filtros.
12. Busque `total` com os mesmos filtros da query de dados.

## Troubleshooting

| Sintoma | Causa provável | Correção |
|---|---|---|
| A tabela sempre mostra a primeira página | O hook não envia `pageIndex + 1` para a API | Envie `page: pageIndex + 1` |
| Trocar quantidade por página não muda os dados | O hook ignora `pageSize` | Envie `limit: pageSize` e inclua no `queryKey` |
| Ordenação aparece na URL, mas não muda a lista | `sort` não foi convertido ou backend ignora o campo | Use `serializeSortingStateForApi(sort)` e adicione a coluna em `sortableColumns` |
| Filtro aparece na UI, mas não filtra | Backend não aplica `filters` ou coluna não está na whitelist | Aplique `filters` e inclua o campo em `filterableColumns` |
| Filtro `select` não mostra opções | `filterOptions` não foi definido | Adicione `meta.filterOptions` na coluna |
| A busca global perde a página atual | Comportamento esperado | Busca reseta para a primeira página para evitar páginas vazias |
| `pageCount` fica errado | Total foi calculado sem filtros | Use o mesmo `whereClause` no select de dados e no count |
