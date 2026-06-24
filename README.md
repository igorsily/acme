# Acme — GitHub Template

Monorepo TypeScript com Next.js, Fastify, tRPC, Drizzle, Better Auth e shadcn/ui.

## Usar como template

1. No GitHub: **Use this template** → criar seu repositório.
2. Escolha a branch:
   - **`main`** — inclui mapa MapLibre + CRUD de exemplo `item`
   - **`without-map`** — mesma base sem mapa nem `maplibre-gl`
3. Clone, configure env e instale:

```bash
bun install
cp deploy/.env.example apps/server/.env
# Ajuste DATABASE_URL, BETTER_AUTH_SECRET, etc.
bun run db:push
bun run dev
```

- Web: http://localhost:3001
- API: http://localhost:3000

## Stack

- Bun + Turborepo
- Next.js 16 (`apps/web`)
- Fastify + tRPC v11 (`apps/server`, `packages/api`)
- PostgreSQL + Drizzle (`packages/db`)
- Better Auth — plugins `username` + `admin` (`packages/auth`)
- UI compartilhada (`@acme/ui`)

## Estrutura

```
acme/
├── apps/web/          # Frontend
├── apps/server/       # API HTTP
├── packages/api/      # Routers + services tRPC
├── packages/auth/     # Better Auth
├── packages/db/       # Schema Drizzle
├── packages/types/    # Schemas Zod
└── packages/ui/       # Componentes shadcn
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `bun run dev` | Web + server |
| `bun run fix` | Format + lint |
| `bun run check-types` | TypeScript |
| `bun run db:push` | Sync schema |
| `bun run db:studio` | Drizzle Studio |

## Documentação para IAs

- `docs/AGENTS.md` — índice
- `docs/crud-playbook.md` — CRUD end-to-end (referência: `item`)
- `apps/web/src/components/form-factory/AGENTS.md`
- `apps/web/src/components/data-table/AGENTS.md`

## Seed (usuário inicial)

```bash
bun run --filter server seed
```

Configure credenciais em `apps/server/src/seed.ts` antes de rodar em ambiente real.
