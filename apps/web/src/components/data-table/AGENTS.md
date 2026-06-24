# DataTable — Filtros Avançados por Coluna

Referência técnica para adicionar filtros por coluna ao sistema de DataTable do projeto.

## Visão Geral

O sistema de filtros opera **end-to-end com type-safety**, sincronizando estado entre URL, TanStack Table e Drizzle ORM:

```
URL (?filters=[...]) ←→ nuqs ←→ TanStack Table ←→ tRPC ←→ applyColumnFilters → Drizzle SQL
```

**Fluxo completo:**

1. **Frontend:** O usuário abre o menu de filtro (ícone de funil no header da coluna), escolhe um operador e um valor.
2. **URL state:** `nuqs` serializa o filtro como JSON na URL via `parseAsJson<ColumnFilterItem[]>`.
3. **TanStack Table:** O hook `useDataTable` converte `ColumnFilterItem[]` para `ColumnFiltersState` interno.
4. **Backend:** O hook de query repassa `filters` para o tRPC, que chama o service com `applyColumnFilters`.
5. **Drizzle:** `applyColumnFilters` traduz cada filtro em condições SQL usando uma **whitelist** de colunas permitidas.

**Componentes envolvidos:**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `data-table-column-filter-menu.tsx` | Menu dropdown com duas abas (Condição / Valor) |
| `cells/data-table-column-header.tsx` | Header da coluna — renderiza o ícone de filtro quando `meta.filterType` existe |
| `hooks/use-data-table.ts` | Hook principal — sincroniza `filters` com URL via `nuqs` |
| `packages/services/src/lib/filters.ts` | Engine de filtros — `applyColumnFilters` gera SQL conditions |
| `packages/types/src/schemas/common.schema.ts` | Schemas `ColumnFilterItem`, `listParamsSchema` |

---

## Passo a Passo: Adicionar Filtros a uma Tabela Existente

### Passo 1: Adicionar `meta.filterType` nas colunas

Em cada coluna que deve ter filtro, adicione `meta.filterType` na definição:

```typescript
// src/components/features/products/product-columns.tsx
import type { Product } from "@acme/types/schemas/product.schema";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/cells/data-table-column-header";

export const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
    meta: {
      filterType: "text",
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Preço" />
    ),
    meta: {
      filterType: "number",
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Criado em" />
    ),
    meta: {
      filterType: "date",
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    meta: {
      filterType: "select",
      filterOptions: [
        { label: "Ativo", value: "active" },
        { label: "Inativo", value: "inactive" },
      ],
    },
  },
  // Coluna de ação — SEMPRE sem filterType
  {
    id: "actions",
    header: "Ações",
    // sem meta.filterType
  },
];
```

**Regra:** O `DataTableColumnHeader` só renderiza o ícone de filtro se `column.columnDef.meta?.filterType` existir. Sem `filterType`, sem filtro.

### Passo 2: Atualizar hook de query para repassar `filters`

O hook de query deve ler `filters` da URL via `decodeFilters` e repassar para o tRPC:

```typescript
// src/hooks/products/use-products.query.ts
import type { ColumnFilterItem } from "@acme/types/schemas/common.schema";
import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { decodeFilters } from "@/components/data-table/lib/filter-url-encoder";
import { tableQueryParsers } from "@/components/data-table/hooks/use-data-table";
import { trpc } from "@/lib/trpc";

function getFiltersFromUrl(): ColumnFilterItem[] {
  const searchParams = new URLSearchParams(window.location.search);
  return decodeFilters(searchParams);
}

export function useProductsQuery() {
  const [{ page, limit, sort, search }] = useQueryStates(tableQueryParsers);
  const filters = getFiltersFromUrl();

  const query = useQuery(
    trpc.product.list.queryOptions({ page, limit, sort, search, filters })
  );

  return {
    ...query,
    data: query.data?.data,
    pageCount: query.data?.pageCount ?? -1,
  };
}
```

**Nota:** Os filtros são serializados na URL como params curtos (`f_status=eq:active`). Use `decodeFilters` para convertê-los de volta para `ColumnFilterItem[]`.

### Passo 3: Atualizar service backend com `filterableColumns` + `applyColumnFilters`

No service, defina uma **whitelist** de colunas filtráveis e aplique os filtros:

```typescript
// packages/services/src/product.ts
import { db } from "@condominio/db";
import { product } from "@condominio/db/schema";
import type { ListParams } from "@acme/types/schemas/common.schema";
import { and, asc, count, desc, ilike } from "drizzle-orm";
import { applyColumnFilters } from "./lib/filters";

const sortableColumns = {
  name: product.name,
  price: product.price,
  createdAt: product.createdAt,
} satisfies Record<string, unknown>;

// Whitelist de colunas que podem ser filtradas pelo cliente
const filterableColumns = {
  name: product.name,
  price: product.price,
  status: product.status,
  createdAt: product.createdAt,
} satisfies Record<string, unknown>;

export async function listProducts(
  params: ListParams
): Promise<{ data: Product[]; total: number }> {
  const { page, limit, sort, search } = params;
  const offset = (page - 1) * limit;

  // ... sorting logic ...

  // Aplica filtros da whitelist
  const filterConditions = applyColumnFilters(params.filters, filterableColumns);

  const whereClause = and(
    // ... outros filtros ...
    ...filterConditions,
  );

  // ... query execution ...
}
```

**Segurança:** `filterableColumns` é uma whitelist. Campos não listados aqui são **ignorados silenciosamente** pelo `applyColumnFilters`, mesmo que o cliente os envie. Nunca exponha todas as colunas do banco.

### Passo 4 (Opcional): Adicionar `filterOptions` para colunas `select`

Para colunas do tipo `select`, defina `filterOptions` com as opções disponíveis. Isso alimenta a aba "Valor" do menu de filtro:

```typescript
{
  accessorKey: "category",
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Categoria" />
  ),
  meta: {
    filterType: "select",
    filterOptions: [
      { label: "Eletrônicos", value: "electronics" },
      { label: "Livros", value: "books" },
      { label: "Roupas", value: "clothing" },
    ],
  },
}
```

---

## Exemplo Completo: Tabela de Products (End-to-End)

### 1. Definição de colunas com `meta`

```typescript
// src/components/features/products/product-columns.tsx
import type { Product } from "@acme/types/schemas/product.schema";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/cells/data-table-column-header";
import { DateCell } from "@/components/data-table/cells/date-cell";
import { StatusBadge } from "@/components/data-table/cells/status-badge";

const STATUS_MAP = {
  active: { label: "Ativo", variant: "default" as const },
  inactive: { label: "Inativo", variant: "secondary" as const },
};

const STATUS_OPTIONS = [
  { label: "Ativo", value: "active" },
  { label: "Inativo", value: "inactive" },
];

export const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
    meta: { filterType: "text" },
  },
  {
    accessorKey: "price",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Preço" />,
    meta: { filterType: "number" },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />,
    cell: ({ row }) => <DateCell date={row.original.createdAt} />,
    meta: { filterType: "date" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} statusMap={STATUS_MAP} />
    ),
    meta: {
      filterType: "select",
      filterOptions: STATUS_OPTIONS,
    },
  },
];
```

### 2. Hook de query repassando `filters`

```typescript
// src/hooks/products/use-products.query.ts
import { useQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { tableQueryParsers } from "@/components/data-table/hooks/use-data-table";
import { trpc } from "@/lib/trpc";

export function useProductsQuery() {
  const [{ page, limit, sort, search, filters }] =
    useQueryStates(tableQueryParsers);

  return useQuery(
    trpc.product.list.queryOptions({ page, limit, sort, search, filters })
  );
}
```

### 3. Router tRPC (input já suporta `filters`)

O `listParamsSchema` em `packages/types/src/schemas/common.schema.ts` já inclui `filters`:

```typescript
// packages/api/src/routers/product.ts
import { listParamsSchema, listResponseSchema, productSchema } from "@acme/types";
import { publicProcedure, router } from "../trpc";

export const productRouter = router({
  list: publicProcedure
    .input(listParamsSchema)  // já tem { page, limit, sort, search, filters }
    .output(listResponseSchema(productSchema))
    .query(async ({ input }) => {
      const result = await listProducts(input);
      return {
        data: result.data,
        total: result.total,
        pageCount: Math.ceil(result.total / input.limit),
      };
    }),
});
```

### 4. Service com `filterableColumns` e `applyColumnFilters`

```typescript
// packages/services/src/product.ts
import { db } from "@condominio/db";
import { product } from "@condominio/db/schema";
import type { ListParams } from "@acme/types/schemas/common.schema";
import { and, asc, count, desc, ilike } from "drizzle-orm";
import { applyColumnFilters } from "./lib/filters";

const filterableColumns = {
  name: product.name,
  price: product.price,
  status: product.status,
  createdAt: product.createdAt,
} satisfies Record<string, unknown>;

export async function listProducts(params: ListParams) {
  const { page, limit, sort, search } = params;
  const offset = (page - 1) * limit;

  const [sortCol, sortDir] = (sort ?? "createdAt.desc").split(".");
  const col = sortableColumns[sortCol] ?? product.createdAt;
  const orderBy = sortDir === "asc" ? asc(col) : desc(col);

  const filterConditions = applyColumnFilters(params.filters, filterableColumns);

  const whereClause = and(
    search ? ilike(product.name, `%${search}%`) : undefined,
    ...filterConditions,
  );

  const [rows, [total]] = await Promise.all([
    db.select().from(product).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: count() }).from(product).where(whereClause),
  ]);

  return { data: rows, total: Number(total.count) };
}
```

---

## Tipos de Filtro e Operadores

| `filterType` | Operadores disponíveis | Input UI | Exemplo de valor |
|---|---|---|---|
| `text` | `contains`, `startsWith`, `endsWith`, `equals`, `notEquals`, `isEmpty`, `isNotEmpty` | Input text | `"eletrônicos"` |
| `number` | `equals`, `gt`, `gte`, `lt`, `lte`, `between`, `isEmpty`, `isNotEmpty` | Input number | `42` ou `[10, 100]` (between) |
| `date` | `equals`, `before`, `after`, `between`, `isEmpty`, `isNotEmpty` | Input date | `"2024-01-15"` ou `["2024-01-01", "2024-12-31"]` |
| `select` | `equals`, `notEquals`, `in`, `notIn`, `isEmpty`, `isNotEmpty` | Select dropdown | `"active"` ou `["active", "inactive"]` |
| `boolean` | `equals`, `isEmpty`, `isNotEmpty` | Select Sim/Não | `true` ou `false` |

**Operadores que não precisam de valor:** `isEmpty`, `isNotEmpty` — aplicam `IS NULL` / `IS NOT NULL` diretamente.

**Operadores que precisam de dois valores:** `between` — gera `>= valor[0] AND <= valor[1]`.

---

## Comportamento do Menu de Filtro

O menu `DataTableColumnFilterMenu` possui **duas abas**:

### Aba "Condição"

- Dropdown para selecionar o **operador** (ex.: "Contém", "Maior que", "Está em").
- Input para o **valor** do filtro (aparece automaticamente, exceto para `isEmpty`/`isNotEmpty`).
- Para operadores como `between`, exibe **dois inputs** (ex.: "Valor mínimo" / "Valor máximo").
- Botões: **Limpar** (remove filtro), **Cancelar** (fecha sem aplicar), **OK** (aplica filtro).

### Aba "Valor"

- Estilo Excel/Handsontable: lista de **checkboxes** com todos os valores únicos da coluna.
- Usa `column.getFacetedUniqueValues()` do TanStack Table para obter os valores.
- Campo de **busca** para filtrar a lista de valores.
- Botões "Selecionar todos" e "Limpar seleção".
- Ao aplicar:
  - 1 valor selecionado → operador `equals`
  - 2+ valores selecionados → operador `in`
  - 0 valores → remove o filtro

**Inicialização:** Ao abrir o menu, o estado é restaurado do filtro atual da coluna. Se o filtro existente usa operador `in`, a aba "Valor" é ativada automaticamente.

---

## Boas Práticas

1. **Sempre use `meta.filterType`** nas colunas que precisam de filtro. Sem isso, o ícone de filtro não aparece.

2. **Nunca use `filterType` em colunas de ação** (editar/excluir). Colunas com `id: "actions"` não devem ter filtro.

3. **Para colunas `select`, sempre defina `filterOptions`** com `label`/`value`. Sem `filterOptions`, o input de select não renderiza na aba "Condição".

4. **O backend deve ter whitelist de `filterableColumns`** — nunca exponha todas as colunas do banco. Campos não listados são ignorados silenciosamente.

5. **Defina colunas em module-level** — nunca dentro do componente. O TanStack Table recria a tabela a cada render se as colunas mudam de referência.

6. **Use `DataTableColumnHeader`** como header — ele gerencia a renderização condicional do ícone de filtro baseado em `meta.filterType`.

7. **Para colunas `boolean`**, o valor é convertido automaticamente: `"true"` → `true`, `"false"` → `false`.

---

## Interação por Linha

`DataTable.Content` aceita props opcionais para clique e menu de contexto:

| Prop | Tipo | Descrição |
|------|------|-----------|
| `onRowClick` | `(row: TData) => void` | Callback ao clicar na linha. Ignora cliques em botões, links, inputs e checkboxes. |
| `rowContextMenu` | `(row: TData) => React.ReactNode` | Renderiza itens do menu de contexto (clique direito). Use `ContextMenuItem` de `@acme/ui/components/context-menu`. |

Com `onRowClick`, a linha recebe `cursor-pointer`, `tabIndex={0}` e responde a Enter/Espaço.

```tsx
import { ContextMenuItem } from "@acme/ui/components/context-menu";

<DataTable.Content
  table={table}
  onRowClick={(row) => setEditItem(row)}
  rowContextMenu={(row) => (
    <ContextMenuItem onClick={() => setEditItem(row)}>Editar</ContextMenuItem>
  )}
/>
```

---

## Coluna de Ações (menu ⋮)

Use `DataTableRowActions` na coluna `actions` para um menu dropdown com três pontos verticais. O trigger é um `button`, então cliques nele **não** disparam `onRowClick` da linha.

```tsx
import { DataTableRowActions } from "@/components/data-table/cells/data-table-row-actions";
import { Pencil, Trash2 } from "lucide-react";

{
  id: "actions",
  header: () => <span className="sr-only">Ações</span>,
  cell: ({ row }) => (
    <DataTableRowActions
      actions={[
        {
          label: "Editar",
          icon: <Pencil className="h-4 w-4" />,
          onClick: () => onEdit(row.original),
        },
        {
          label: "Excluir",
          icon: <Trash2 className="h-4 w-4" />,
          onClick: () => onArchive(row.original),
          variant: "destructive",
        },
      ]}
    />
  ),
  enableSorting: false,
}
```

Combine com `onRowClick` e `rowContextMenu` quando quiser atalhos extras (clique na linha e clique direito).

---

## Troubleshooting

| Sintoma | Causa provável | Solução |
|---------|---------------|---------|
| Ícone de filtro não aparece na coluna | `meta.filterType` não definido | Adicione `meta: { filterType: "text" }` (ou outro tipo) na definição da coluna |
| Filtro aparece no frontend mas não filtra no backend | Campo não está em `filterableColumns` no service | Adicione o campo ao objeto `filterableColumns` mapeando para a coluna Drizzle |
| Aba "Valor" aparece vazia | `getFacetedUniqueValues` sem dados carregados | Verifique se a query retornou dados. Os valores facetados vêm dos dados atuais da tabela |
| Filtro `between` não funciona | Valor não é array com 2 elementos | O menu envia `[min, max]` automaticamente. Verifique se o `filterType` é `number` ou `date` |
| Filtro `select` não mostra opções | `filterOptions` não definido na coluna | Adicione `meta: { filterType: "select", filterOptions: [...] }` |
| URL não atualiza com filtros | Hook de query não lê `f_*` params da URL | Use `decodeFilters(new URLSearchParams(window.location.search))` no hook de query |
| Filtro `isEmpty`/`isNotEmpty` não funciona | Backend não trata operadores sem valor | `applyColumnFilters` já trata — verifique se o campo está na whitelist |

---

## Referência Rápida: Estrutura do `ColumnFilterItem`

```typescript
// packages/types/src/schemas/common.schema.ts
interface ColumnFilterItem {
  field: string;      // nome do campo (ex.: "name", "status")
  operator: string;   // operador (ex.: "contains", "equals", "in")
  value?: string | number | boolean | string[] | number[];
}
```

Exemplo serializado na URL (formato curto):

```
?f_status=in:active,inactive&f_name=ct:joao&f_idade=bt:18,65&f_nome=em:
```

Formato: `f_<campo>=<operador>:<valor>`. Operadores: `eq`, `ne`, `ct`, `sw`, `ew`, `gt`, `ge`, `lt`, `le`, `bt`, `in`, `ni`, `em` (isEmpty), `ne` (isNotEmpty).
