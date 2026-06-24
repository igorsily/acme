# CRUD Playbook — Acme

Guia end-to-end para criar entidades CRUD no monorepo. Use **item** como referência canônica.

## Referência canônica

| Camada | Arquivo |
|--------|---------|
| Schemas Zod | `packages/types/src/schemas/item.schema.ts` |
| Service | `packages/api/src/services/item-service.ts` |
| Router tRPC | `packages/api/src/routers/item.ts` |
| Colunas | `apps/web/src/components/features/items/item-columns.tsx` |
| Formulário | `apps/web/src/components/features/items/item-form.tsx` |
| Options (selects) | `apps/web/src/components/features/items/item-form-options.ts` |
| Utils do form | `apps/web/src/components/features/items/item-form.utils.ts` |
| Listagem | `apps/web/src/app/(authenticated)/(admin)/items/page.tsx` |
| Criar/editar | `apps/web/src/app/(authenticated)/(admin)/items/[id]/page.tsx` |

Docs complementares:

- Formulários → `apps/web/src/components/form-factory/AGENTS.md`
- Tabelas → `apps/web/src/components/data-table/AGENTS.md`

## Fluxo de dados

```
Página (list/form)
  → tRPC client (apps/web)
    → router (packages/api/src/routers)
      → service (packages/api/src/services)
        → Drizzle (packages/db)
          ↑ validação Zod (packages/types)
```

Regras:

- Schemas Zod vivem só em `packages/types`.
- Routers não acessam Drizzle diretamente.
- Services não importam React.
- `protectedProcedure` para rotas autenticadas no template (sem RBAC na UI).

## Checklist — novo CRUD

### 1. Banco (`packages/db`)

- [ ] Tabela no schema Drizzle
- [ ] Migration / `db:push`
- [ ] Soft delete (`deleted`) se a entidade for arquivável

### 2. Tipos (`packages/types`)

Criar `packages/types/src/schemas/{entidade}.schema.ts`:

| Schema | Uso |
|--------|-----|
| `{entidade}ListSchema` | Linhas da tabela (campos mínimos) |
| `{entidade}DetailSchema` | Resposta de `getById` (campos completos + relações) |
| `{entidade}FormSchema` | Validação do formulário (create + update) |
| `{entidade}CreateSchema` | Input de `create` (geralmente = form) |
| `{entidade}UpdateSchema` | `form.extend({ id })` |
| `{entidade}GetByIdSchema` | `{ id: z.string().min(1) }` |
| Enums | `z.enum([...])` reutilizados em list/detail/form |

Padrões úteis (ver item):

```typescript
// Campo opcional que vem como "" do select vazio
const emptyToUndefined = <T extends z.ZodType>(schema: T) =>
  z.union([z.literal(""), schema]).transform((v) => (v === "" ? undefined : v));

// Máscaras — reutilize mask.schema (cnpj, cep, phone)
import { cepSchema, cnpjSchema, phoneSchema } from "./mask.schema";
```

Exportar tipos inferidos: `List`, `Detail`, `FormInput`, `FormValues`, `CreateInput`, `UpdateInput`.

Registrar export em `packages/types/package.json` se necessário.

### 3. Service (`packages/api/src/services`)

| Função | Responsabilidade |
|--------|------------------|
| `get{Entidade}ById` | Joins necessários; lança `NOT_FOUND` se ausente |
| `create{Entidade}` | Insert; usar `db.transaction` se criar registros relacionados |
| `update{Entidade}` | Update por id; sincronizar relações na mesma transação |

- Mapear `null` do banco → `undefined` no detail schema.
- Lógica de domínio (ex.: slug, vínculo de member) fica no service, não no router nem no form.

### 4. Router (`packages/api/src/routers`)

```typescript
export const entidadeRouter = router({
  list: protectedProcedure
    .input(listParamsSchema)
    .output(listResponseSchema(entidadeListSchema))
    .query(({ input }) => listEntidades(input)),

  getById: protectedProcedure
    .input(entidadeGetByIdSchema)
    .output(entidadeDetailSchema)
    .query(({ input }) => getEntidadeById(input.id)),

  create: protectedProcedure
    .input(entidadeCreateSchema)
    .output(z.object({ id: z.string() }))
    .mutation(({ input }) => createEntidade(input)),

  update: protectedProcedure
    .input(entidadeUpdateSchema)
    .output(z.object({ id: z.string() }))
    .mutation(({ input }) => updateEntidade(input)),
});
```

Listagem com `createListService` (`packages/api/src/helper/list-service.ts`):

```typescript
const listEntidades = createListService({
  table: entidade,
  filterableColumns: { /* whitelist — só colunas expostas */ },
  sortableColumns: { /* whitelist */ },
  defaultOrderBy: [desc(entidade.createdAt)],
  searchColumns: [entidade.name],
  where: eq(entidade.deleted, false), // se soft delete
});
```

Registrar em `packages/api/src/routers/index.ts`.

### 5. Frontend — feature folder

```
apps/web/src/components/features/{entidades}/
├── {entidade}-columns.tsx      # ColumnDef + statusMap + createXColumns()
├── {entidade}-form.tsx         # createFormFactory + layout
├── {entidade}-form-options.ts  # { label, value }[] para selects
└── {entidade}-form.utils.ts    # emptyValues + detailToFormValues()
```

#### Colunas (`{entidade}-columns.tsx`)

- `create{Entidade}Columns({ onEdit, onArchive })` — factory com callbacks, não hooks dentro.
- `header` com `DataTableColumnHeader` quando sortável/filtrável.
- `meta.filterType` + `filterOptions` para filtros (ver data-table AGENTS.md).
- `StatusBadge` + `statusMap` para enums visuais.
- Coluna `actions` com `DataTableRowActions`; sem `filterType`.

#### Formulário (`{entidade}-form.tsx`)

```typescript
const entidadeFormFactory = createFormFactory({
  schema: entidadeFormSchema,
  defaultValues: emptyEntidadeFormValues,
});

export function EntidadeForm({ entidadeId, initialData }: Props) {
  const form = entidadeFormFactory.useForm({
    defaultValues: initialData ? detailToFormValues(initialData) : emptyEntidadeFormValues,
    onSubmit: async (values) => { /* create ou update mutation */ },
  });
  // ...
}
```

Layout padrão (item):

- Container: `flex min-h-0 flex-1 flex-col`
- Header: título à esquerda, **Cancelar + Salvar à direita**
- Corpo: `grid lg:grid-cols-2` com `overflow-y-auto` e `gap-4`
- Seções em `Card` + `CardHeader` + `CardContent`
- Campos agrupados por domínio (cadastro, endereço, contato, etc.)

#### Selects

Options em arquivo separado (`-form-options.ts`). No form:

```tsx
<form.Field
  name="status"
  label="Status"
  type="select"
  options={[...entidadeStatusOptions]}
/>
```

O `form.Field` com `type="select"` já passa `items={options}` ao Base UI Select — o trigger exibe **label**, o valor enviado é **value**. Não monte `<Select>` manualmente sem `items`.

#### Máscaras

```tsx
<form.Field name="cnpj" label="CNPJ" mask="cnpj" />
```

Validação no Zod via `mask.schema`; máscara visual via `use-mask-input` no form-factory.

#### Campos derivados (ex.: slug)

Derivar na renderização, não em `useEffect`:

```tsx
<form.instance.Subscribe selector={(s) => s.values.name}>
  {(name) => (
    <Input disabled readOnly value={slugify(name)} />
  )}
</form.instance.Subscribe>
```

Persistir slug no service (`slugify` de `@acme/types/utils/slugify`).

#### Mutations

```typescript
const createMutation = useMutation(
  trpc.entidade.create.mutationOptions({
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: trpc.entidade.list.queryKey() });
      toast.success("...");
      router.push(`/entidades/${result.id}`);
    },
    onError: (error) => toast.error(error.message),
  })
);
```

Invalidar `list` e `getById` após update.

### 6. Páginas (`apps/web/src/app`)

#### Listagem — `{entidades}/page.tsx`

```tsx
export default function EntidadesPage() {
  return (
    <DataTable>
      <Suspense fallback={null}>
        <EntidadesTableContent />
      </Suspense>
    </DataTable>
  );
}
```

Dentro do content:

- `useListQuery((input) => trpc.entidade.list.queryOptions(input))`
- `useDataTable({ columns, pageCount, query })`
- `columns` via `useMemo(() => createEntidadeColumns({...}), [deps])`
- Toolbar: ação "Novo" → `router.push('/entidades/novo')`
- `onRowClick` → mesma rota de edição
- `Suspense` obrigatório (nuqs / URL state)

#### Criar/editar — `{entidades}/[id]/page.tsx`

Rota única: `/entidades/novo` (criar) e `/entidades/{id}` (editar).

```tsx
const entidadeId = params.id === "novo" ? undefined : params.id;

const detailQuery = useQuery({
  ...trpc.entidade.getById.queryOptions({ id: entidadeId ?? "" }),
  enabled: Boolean(entidadeId),
});

return (
  <EntidadeForm
    key={entidadeId ?? "novo"}
    entidadeId={entidadeId}
    initialData={detailQuery.data}
  />
);
```

`key` força reset do form ao alternar criar ↔ editar.

Layout pai precisa de `min-h-0` no flex para scroll interno funcionar (`apps/web/src/app/(authenticated)/layout.tsx`).

## Convenções de nomenclatura

| Item | Padrão | Exemplo |
|------|--------|---------|
| Rota listagem | `/{entidades}` | `/items` |
| Rota criar | `/{entidades}/novo` | `/items/novo` |
| Rota editar | `/{entidades}/{id}` | `/items/abc-123` |
| Router tRPC | `{entidade}` (singular) | `trpc.item.list` |
| Pasta feature | plural | `features/items/` |
| Arquivos | kebab singular | `item-form.tsx` |

## Procedure — qual usar

| Cenário | Procedure |
|---------|-----------|
| Rotas autenticadas (template) | `protectedProcedure` |
| Público / sem auth | `publicProcedure` |

## Decisões de domínio

Documente no PR ou no schema quando o CRUD tiver regras não óbvias:

- **Slug**: gerado no server; read-only no client.
- **Soft delete**: `where: eq(table.deleted, false)` no list.
- **Coordenadas** (branch `main`): `lat`/`lng` opcionais no form; PostGIS `coordinate` no service.

## Troubleshooting

| Sintoma | Causa | Solução |
|---------|-------|---------|
| Select mostra `active` em vez de "Ativo" | Base UI sem `items` | Usar `form.Field type="select"` (já corrigido) ou `items={options}` no `Select` |
| Bordas dos cards somem no light | `ring-foreground/10` em fundo branco | `Card` usa `border border-border` |
| Form não ocupa altura / scroll quebrado | Flex sem `min-h-0` | `min-h-0 flex-1` no container e no layout pai |
| Filtro não funciona no backend | Coluna fora de `filterableColumns` | Adicionar whitelist no router/service |
| Validação diverge client/server | Schema duplicado | Um único schema em `packages/types` |
| Form mantém dados ao trocar rota | Sem `key` no componente | `key={id ?? "novo"}` na page |

## Verificação final

```bash
bun x ultracite fix   # nos arquivos alterados
bun run check         # lint geral
```

- [ ] Listagem: busca, sort, filtros, paginação server-side
- [ ] Criar: toast, redirect para edição, invalidate `list`
- [ ] Editar: carrega `getById`, salva, invalidate `list` + `getById`
- [ ] Tipos E2E: input/output tRPC batem com schemas Zod
- [ ] Acessibilidade: labels, `sr-only` em ícones, `aria-*` em autocompletes
