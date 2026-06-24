# Auth — Acme

Better Auth em `packages/auth`. Template usa plugins **`username`** e **`admin`** — sem plugin `organization`.

## Server

```typescript
plugins: [
  username({ displayUsernameNormalization: (v) => v.trim().toLowerCase() }),
  admin({ adminRoles: ["admin"], defaultRole: "user" }),
],
```

- `auth.api.createUser` — criação de usuários via tRPC (`user-service`)
- `auth.api.signUpEmail` — seed / signup direto

## Client (`apps/web`)

```typescript
plugins: [usernameClient()],
```

## Convites customizados

Fluxo em `packages/api/src/services/user-service.ts`:

1. Admin cria usuário via `auth.api.createUser`
2. Token salvo em `verification` com identifier `user-invite:{userId}`
3. E-mail com link `/convite/{token}`
4. Conclusão: username + senha → `account` credential

Não confundir com tabela `invitation` do plugin organization (removida).

## Schema

Colunas do plugin admin em `user`: `role`, `banned`, `banReason`, `banExpires`.

Template **não expõe roles na UI** — `defaultRole: "user"`; seed pode promover primeiro usuário a `admin`.
