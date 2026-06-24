# API — Acme

Routers tRPC em `packages/api/src/routers/`. Lógica em `packages/api/src/services/`.

## Procedures

| Procedure | Uso |
|-----------|-----|
| `publicProcedure` | Health, convite (token) |
| `protectedProcedure` | Tudo autenticado no template |

O template **não usa** `adminProcedure` nas rotas — qualquer usuário logado acessa users/items.

## Padrão de router

```typescript
export const itemRouter = router({
  list: protectedProcedure
    .input(listParamsSchema)
    .output(listResponseSchema(itemListSchema))
    .query(({ input }) => listItems(input)),
});
```

- Input/output com Zod de `@acme/types`
- Sem Drizzle no router
- Listagens: `createListService` + whitelist `filterableColumns`

## Registrar router

`packages/api/src/routers/index.ts` → `appRouter`.

## Helpers

- `helper/list-service.ts` — listagem paginada
- `helper/format-search.ts` — busca textual
