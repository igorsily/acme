# Web App — Acme

Next.js App Router em `apps/web`.

## Rotas

| Grupo | Caminho | Descrição |
|-------|---------|-----------|
| `(public)` | `/login`, `/convite/[token]` | Sem layout autenticado |
| `(authenticated)` | `/` | Home — mapa na branch `main` |
| `(authenticated)/(admin)` | `/items`, `/users` | CRUDs — pasta `(admin)` é convenção de layout, **sem gate de role** |

## Features

Componentes de domínio em `src/components/features/{entity}/`:

- `{entity}-columns.tsx`
- `{entity}-form.tsx`
- `{entity}-form-options.ts`
- `{entity}-form.utils.ts`

## Padrões

- **Formulários:** `createFormFactory` — ver `form-factory/AGENTS.md`
- **Tabelas:** `DataTable` + `useDataTable` — ver `data-table/AGENTS.md`
- **tRPC:** `src/lib/trpc.ts` + hooks `useListQuery`
- **Auth client:** `src/lib/auth-client.ts`

## Client components

Use `"use client"` quando houver: hooks, eventos, tRPC mutations, nuqs.

Páginas com URL state (`nuqs`) precisam de `<Suspense>` no boundary.

## Mapa (branch `main`)

- `src/components/acme-map.tsx` — home `/`
- `src/components/features/items/item-map-*.tsx`
- `src/stores/map-focus-store.ts` + `src/hooks/map/use-go-to-map.ts`

Branch `without-map`: home redireciona para `/items`; sem componentes de mapa.
