# Documentação — Acme

Índice para humanos e agentes de IA.

## Guias principais

| Documento | Conteúdo |
|-----------|----------|
| [crud-playbook.md](./crud-playbook.md) | CRUD end-to-end — referência `item` |
| [data-table-backend.md](./data-table-backend.md) | Filtros server-side |
| [data-table-use-query.md](./data-table-use-query.md) | Hook `useListQuery` |
| [sentry.md](./sentry.md) | Observabilidade |

## AGENTS.md por pacote

| Path | Escopo |
|------|--------|
| `/AGENTS.md` | Ultracite / qualidade |
| `apps/web/AGENTS.md` | App Router, features |
| `packages/api/AGENTS.md` | tRPC routers/services |
| `packages/db/AGENTS.md` | Drizzle schema |
| `packages/types/AGENTS.md` | Zod schemas |
| `packages/auth/AGENTS.md` | Better Auth |
| `apps/web/.../form-factory/AGENTS.md` | Formulários |
| `apps/web/.../data-table/AGENTS.md` | Tabelas |

## Branches do template

| Branch | Diferença |
|--------|-----------|
| `main` | MapLibre na home, `item.listForMap`, "Ver no mapa" |
| `without-map` | Sem mapa, sem `maplibre-gl`, home → `/items` |

Schema do banco é **igual** nas duas branches (`item.coordinate` existe mas sem UI na `without-map`).
