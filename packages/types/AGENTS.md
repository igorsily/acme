# Types — Acme

Schemas Zod v4 em `packages/types/src/schemas/`. Fonte única de validação e tipos.

## Regras

- Um arquivo por entidade: `item.schema.ts`, `user.schema.ts`
- Exportar tipos: `export type ItemList = z.infer<typeof itemListSchema>`
- Registrar subpaths em `packages/types/package.json` exports quando necessário

## Schemas por entidade

| Schema | Uso |
|--------|-----|
| `{entity}ListSchema` | Linhas da DataTable |
| `{entity}DetailSchema` | `getById` |
| `{entity}FormSchema` | Formulário |
| `{entity}CreateSchema` / `UpdateSchema` | Mutations |

## Compartilhados

- `common.schema.ts` — `listParamsSchema`, `listResponseSchema`
- `mask.schema.ts` — máscaras (CNPJ, CEP, phone) se precisar

## Utils

- `utils/slugify.ts` — slug no service

Nunca duplique validação no frontend ou router — importe de `@acme/types/schemas/...`.
