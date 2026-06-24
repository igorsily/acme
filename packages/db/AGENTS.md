# Database — Acme

Drizzle ORM em `packages/db`. PostgreSQL com PostGIS (coordenadas em `item.coordinate`).

## Schema

- `schema/auth.ts` — user, session, account, verification (Better Auth)
- `schema/item.ts` — entidade de exemplo do template
- `schema/base-columns.ts` — `id`, `createdAt`, `updatedAt`

Sem `organization`, `member`, `invitation` (plugin organization removido).

## Comandos

```bash
bun run db:push      # dev — sync direto
bun run db:generate  # gerar migration
bun run db:migrate   # aplicar migrations
```

## Convenções

- Soft delete: coluna `deleted boolean`
- Enums: `pgEnum` no mesmo arquivo da tabela
- PostGIS: `geometry("coordinate", { type: "point", mode: "xy", srid: 4326 })`

## Export

`packages/db/src/index.ts` agrega schemas para o Drizzle client.
