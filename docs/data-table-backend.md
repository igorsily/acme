# Backend para DataTable

Este guia mostra como o backend deve receber os parâmetros da nossa DataTable e montar uma query Drizzle com busca, filtros, ordenação, paginação, quantidade por página e total.

Use este padrão ao criar endpoints `list` para tabelas conectadas ao `useDataTable`.

## Estado atual do backend

Hoje o backend ainda tem uma estrutura mínima:

- `packages/api/src/index.ts` exporta `router`, `publicProcedure` e `protectedProcedure`.
- `packages/api/src/routers/index.ts` registra apenas exemplos básicos.
- `packages/db/src/index.ts` exporta o client Drizzle `db`.
- `packages/db/src/schema/*` contém os schemas Drizzle.
- `packages/types/src/schemas/common.schema.ts` já contém `listParamsSchema`, `listResponseSchema`, `ListParams` e `ColumnFilterItem`.

Ainda não existe um package `packages/services` nem helpers backend compartilhados como `applyColumnFilters` e `parseSort`. Os exemplos abaixo são templates genéricos para criar junto do primeiro endpoint real.

## Contrato recebido da DataTable

O frontend lê a URL com `useTableSearchParams()` e envia para a API usando `listParamsSchema`.

```ts
type ListParams = {
  page: number;
  limit: number;
  sort?: string;
  search?: string;
  filters?: ColumnFilterItem[];
};
```

Campos:

| Campo | Origem no frontend | Significado |
|---|---|---|
| `page` | `pageIndex + 1` | Página base 1 para o backend |
| `limit` | `pageSize` | Quantidade de itens por página |
| `search` | `q` | Busca global |
| `sort` | `sort` serializado | Lista `campo.asc,campo2.desc` |
| `filters` | `f` | Filtros por coluna |

O backend deve retornar:

```ts
type ListResponse<TData> = {
  data: TData[];
  pageCount: number;
  total: number;
};
```

## Regra principal

Nunca use nomes de campos enviados pelo cliente diretamente na query.

Use whitelists para:

1. Colunas pesquisáveis.
2. Colunas ordenáveis.
3. Colunas filtráveis.

Isso impede SQL injection por nome de coluna e evita expor campos internos.

## Router tRPC genérico

O router valida a entrada com `listParamsSchema` e a saída com `listResponseSchema`.

```ts
import {
  listParamsSchema,
  listResponseSchema,
  resourceSchema,
} from "@acme/types";
import { protectedProcedure, router } from "../index";
import { listResources } from "../services/resource";

export const resourceRouter = router({
  list: protectedProcedure
    .input(listParamsSchema)
    .output(listResponseSchema(resourceSchema))
    .query(async ({ input }) => listResources(input)),
});
```

Troque `resource`, `resourceSchema` e `listResources` pelo nome real do domínio.

## Service genérico com Drizzle

Este é o template principal. Ele recebe `ListParams`, monta `whereClause`, aplica `orderBy`, pagina os dados e calcula o `total` com os mesmos filtros.

```ts
import type { ListParams } from "@acme/types";
import { db } from "@acme/db";
import { resource } from "@acme/db/schema/resource";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  ne,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

type ResourceRow = typeof resource.$inferSelect;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const DEFAULT_ORDER_BY = desc(resource.createdAt);

const searchableColumns = [resource.name, resource.description] as const;

const sortableColumns = {
  createdAt: resource.createdAt,
  name: resource.name,
  status: resource.status,
  updatedAt: resource.updatedAt,
} satisfies Record<string, PgColumn>;

const filterableColumns = {
  createdAt: resource.createdAt,
  name: resource.name,
  status: resource.status,
  updatedAt: resource.updatedAt,
} satisfies Record<string, PgColumn>;

export async function listResources(
  params: ListParams
): Promise<{ data: ResourceRow[]; pageCount: number; total: number }> {
  const page = Math.max(params.page ?? DEFAULT_PAGE, DEFAULT_PAGE);
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = (page - 1) * limit;
  const searchTerm = params.search?.trim();

  const searchCondition = buildSearchCondition(searchTerm, searchableColumns);
  const filterConditions = applyColumnFilters(params.filters, filterableColumns);
  const whereClause = and(searchCondition, ...filterConditions);
  const orderBy = parseSort(params.sort, sortableColumns, DEFAULT_ORDER_BY);

  const [rows, [totalRow]] = await Promise.all([
    db
      .select()
      .from(resource)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(resource).where(whereClause),
  ]);

  const total = Number(totalRow?.count ?? 0);

  return {
    data: rows,
    pageCount: Math.ceil(total / limit),
    total,
  };
}
```

Substitua `resource` pelo schema Drizzle real. Ajuste `searchableColumns`, `sortableColumns` e `filterableColumns` para cada tabela.

## Busca global

A busca global deve ser aplicada apenas em colunas textuais escolhidas pelo backend.

```ts
function buildSearchCondition(
  searchTerm: string | undefined,
  columns: readonly PgColumn[]
): SQL | undefined {
  if (!searchTerm) {
    return;
  }

  return or(...columns.map((column) => ilike(column, `%${searchTerm}%`)));
}
```

Não pesquise automaticamente em todas as colunas. Escolha os campos úteis para o usuário, como `name`, `email`, `title` ou `description`.

## Paginação

A DataTable envia `page` base 1 e `limit` como quantidade por página.

```ts
const page = Math.max(params.page ?? 1, 1);
const limit = Math.min(Math.max(params.limit ?? 10, 1), 100);
const offset = (page - 1) * limit;
```

A query de dados usa `limit` e `offset`:

```ts
.limit(limit).offset(offset)
```

A query de total não usa `limit` nem `offset`. Ela usa o mesmo `whereClause` da query de dados:

```ts
db.select({ count: count() }).from(resource).where(whereClause)
```

Sem isso, `pageCount` fica errado quando há busca ou filtros.

## Ordenação

O frontend envia `sort` como string:

```txt
name.asc,createdAt.desc
```

Converta com whitelist:

```ts
function parseSort(
  sort: string | undefined,
  columns: Record<string, PgColumn>,
  defaultOrderBy: SQL
): SQL[] {
  if (!sort) {
    return [defaultOrderBy];
  }

  const orderBy = sort
    .split(",")
    .map((entry) => {
      const [field, direction] = entry.split(".");
      const column = field ? columns[field] : undefined;

      if (!column) {
        return;
      }

      return direction === "asc" ? asc(column) : desc(column);
    })
    .filter((item): item is SQL => Boolean(item));

  return orderBy.length > 0 ? orderBy : [defaultOrderBy];
}
```

Regras:

- Ignore campos fora de `sortableColumns`.
- Use ordenação padrão quando `sort` estiver vazio ou inválido.
- Sempre ordene queries paginadas. Paginação sem `orderBy` pode retornar resultados instáveis.
- Se a coluna ordenada não for única, adicione um desempate estável no service, como `asc(resource.id)`.

## Filtros por coluna

A DataTable envia filtros como `ColumnFilterItem[]`:

```ts
[
  { field: "status", operator: "equals", value: "active" },
  { field: "createdAt", operator: "after", value: "2026-01-01" },
  { field: "name", operator: "contains", value: "central" },
]
```

Converta usando whitelist:

```ts
function applyColumnFilters(
  filters: ListParams["filters"],
  columns: Record<string, PgColumn>
): SQL[] {
  if (!filters) {
    return [];
  }

  return filters
    .map((filter) => {
      const column = columns[filter.field];

      if (!column) {
        return;
      }

      return createFilterCondition(column, filter.operator, filter.value);
    })
    .filter((condition): condition is SQL => Boolean(condition));
}
```

Implemente os operadores aceitos pelo schema atual:

```ts
function createFilterCondition(
  column: PgColumn,
  operator: string,
  value: unknown
): SQL | undefined {
  switch (operator) {
    case "contains":
      return typeof value === "string" ? ilike(column, `%${value}%`) : undefined;
    case "startsWith":
      return typeof value === "string" ? ilike(column, `${value}%`) : undefined;
    case "endsWith":
      return typeof value === "string" ? ilike(column, `%${value}`) : undefined;
    case "equals":
      return eq(column, value);
    case "notEquals":
      return ne(column, value);
    case "gt":
      return gt(column, value);
    case "gte":
      return gte(column, value);
    case "lt":
      return lt(column, value);
    case "lte":
      return lte(column, value);
    case "between":
      return Array.isArray(value) && value.length >= 2
        ? and(gte(column, value[0]), lte(column, value[1]))
        : undefined;
    case "before":
      return lt(column, value);
    case "after":
      return gt(column, value);
    case "in":
      return Array.isArray(value) ? inArray(column, value) : undefined;
    case "notIn":
      return Array.isArray(value) ? notInArray(column, value) : undefined;
    default:
      return;
  }
}
```

Observação: filtros de data chegam como string pela URL/API. Se a coluna for `timestamp`, converta o valor para `Date` antes de comparar.

## Checklist backend

1. Use `listParamsSchema` no router.
2. Receba `ListParams` no service.
3. Converta `page` e `limit` para `offset`.
4. Monte busca global só com `searchableColumns`.
5. Monte filtros só com `filterableColumns`.
6. Monte ordenação só com `sortableColumns`.
7. Defina `DEFAULT_ORDER_BY` para paginação estável.
8. Use o mesmo `whereClause` na query de dados e na query de count.
9. Retorne `{ data, pageCount, total }`.

## Erros comuns

| Erro | Consequência | Correção |
|---|---|---|
| Usar `page` base zero no backend | Primeira página pula registros | Backend deve receber base 1 |
| Contar sem filtros | `pageCount` maior que o real | Reuse o mesmo `whereClause` no count |
| Ordenar por string do cliente direto | Risco de coluna inválida ou injection | Use `sortableColumns` |
| Filtrar por qualquer campo do cliente | Exposição de campos internos | Use `filterableColumns` |
| Pesquisar em todas as colunas | Busca lenta e comportamento estranho | Use `searchableColumns` explícito |
| Paginar sem `orderBy` | Resultados instáveis entre páginas | Defina `DEFAULT_ORDER_BY` |
