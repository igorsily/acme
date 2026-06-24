# Sentry — Observabilidade

Guia de configuração do Sentry no monorepo Acme: frontend Next.js, API Fastify e deploy.

## Arquitetura

```text
Browser (instrumentation-client.ts)
    │  errors, replay, traces
    │  headers: sentry-trace, baggage
    ▼
Next.js (sentry.server.config.ts / sentry.edge.config.ts)
    │  RSC, server actions, proxy
    │  tunnel /monitoring (anti-adblock)
    ▼
Fastify API (instrument.ts + @sentry/node)
    │  tRPC, auth, rotas HTTP
    ▼
Sentry (igor-sily)
    ├── acme-web   ← projeto Next.js
    └── acme-api   ← projeto Fastify (recomendado)
```

O trace distribuído liga browser → Next.js → API quando os headers `sentry-trace` e `baggage` chegam na API e o CORS permite esses headers.

## Projetos Sentry

| App | Pacote | Projeto Sentry | Variável |
|-----|--------|----------------|----------|
| `apps/web` | `@sentry/nextjs` | `acme-web` | `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` |
| `apps/server` | `@sentry/node` | `acme-api` | `SENTRY_DSN_API` |

## Variáveis de ambiente

### Web (`apps/web`)

| Variável | Onde | Obrigatória | Descrição |
|----------|------|-------------|-----------|
| `NEXT_PUBLIC_SENTRY_DSN` | Client + build | Sim* | DSN público do browser. Bakeado no build da imagem Docker. |
| `SENTRY_DSN` | Server Next.js (runtime) | Sim* | DSN para server/edge do Next.js standalone. |
| `SENTRY_AUTH_TOKEN` | Build | Sim (prod) | Upload de source maps. Arquivo `.env.sentry-build-plugin` ou secret CI. |
| `SENTRY_ORG` | Build | Não | Default: `igor-sily` |
| `SENTRY_PROJECT` | Build | Não | Default: `acme-web` |

\* Opcional no schema (`packages/env`); sem DSN o SDK não envia eventos.

**Arquivo local:** `apps/web/.env`

```bash
NEXT_PUBLIC_SENTRY_DSN=https://<key>@o<org>.ingest.us.sentry.io/<web-project>
SENTRY_DSN=https://<key>@o<org>.ingest.us.sentry.io/<web-project>
```

**Source maps (não commitar):** `apps/web/.env.sentry-build-plugin`

```bash
SENTRY_AUTH_TOKEN=sntrys_...
```

Token em [sentry.io/settings/auth-tokens/](https://sentry.io/settings/auth-tokens/) com scopes `project:releases` e `org:read`.

### API (`apps/server`)

| Variável | Onde | Obrigatória | Descrição |
|----------|------|-------------|-----------|
| `SENTRY_DSN_API` | Runtime | Sim* | DSN do projeto `acme-api`. |

**Arquivo local:** `apps/server/.env`

```bash
SENTRY_DSN_API=https://<key>@o<org>.ingest.us.sentry.io/<api-project>
```

## Arquivos de configuração

### Web

| Arquivo | Função |
|---------|--------|
| `apps/web/src/instrumentation-client.ts` | Browser: errors, replay, tracing, propagação para API |
| `apps/web/sentry.server.config.ts` | Node.js server do Next.js |
| `apps/web/sentry.edge.config.ts` | Edge runtime |
| `apps/web/src/instrumentation.ts` | Registro server/edge + `onRequestError` |
| `apps/web/src/app/global-error.tsx` | Erros no root layout |
| `apps/web/src/lib/sentry.client.ts` | DSN client, sample rate, `tracePropagationTargets` |
| `apps/web/src/lib/sentry.server.ts` | DSN server/edge (vars `SENTRY_DSN`) |
| `apps/web/next.config.ts` | `withSentryConfig`, tunnel, source maps |
| `apps/web/src/proxy.ts` | Exclui `/monitoring` do auth proxy |

### API

| Arquivo | Função |
|---------|--------|
| `apps/server/src/instrument.ts` | `Sentry.init` — importado primeiro em `index.ts` |
| `apps/server/src/lib/sentry.ts` | Lê `SENTRY_DSN_API` via `packages/env` |
| `apps/server/src/plugins/error-handler.ts` | `captureException` em erros 5xx |
| `apps/server/src/plugins/trpc.ts` | `captureException` em `INTERNAL_SERVER_ERROR` |
| `apps/server/src/plugins/cors.ts` | Permite headers `sentry-trace`, `baggage` |

## Sample rates

| Ambiente | `tracesSampleRate` | Replay |
|----------|-------------------|--------|
| `development` | `1.0` (100%) | 10% sessões, 100% com erro |
| `production` | `0.1` (10%) | 10% sessões, 100% com erro |

Definido em `apps/web/src/lib/sentry.client.ts`, `apps/web/src/lib/sentry.server.ts` e `apps/server/src/lib/sentry.ts`.

## Tunnel anti-adblock (`/monitoring`)

Requests do browser passam por `https://seu-dominio/monitoring` em vez de ir direto ao `ingest.sentry.io`.

O `proxy.ts` exclui `/monitoring` do matcher de autenticação — sem isso, usuários não logados (ex.: `/login`) não conseguem reportar erros.

## Deploy (Docker)

### `deploy/.env`

```bash
# Web — projeto acme-web
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_DSN=https://...

# API — projeto acme-api
SENTRY_DSN_API=https://...
```

### Build da imagem web

O `deploy/dockerfiles/web.Dockerfile` recebe:

- `NEXT_PUBLIC_SENTRY_DSN` — bakeado no client
- `SENTRY_AUTH_TOKEN` — upload de source maps no build

### Runtime (`deploy/compose.apps.yml`)

- **web:** `SENTRY_DSN`
- **api:** `SENTRY_DSN_API`

## CI/CD (GitHub Actions)

Secrets necessários no repositório:

| Secret | Uso |
|--------|-----|
| `NEXT_PUBLIC_SENTRY_DSN` | Build da imagem web |
| `SENTRY_AUTH_TOKEN` | Upload de source maps no build web |

A API não precisa de secret no CI — `SENTRY_DSN_API` é configurado só em runtime no servidor (`deploy/.env`).

O `turbo.json` inclui `SENTRY_AUTH_TOKEN` em `globalPassThroughEnv` para não quebrar cache remoto.

Workflow: `.github/workflows/ci.yml` → job `build-web`.

## Verificação local

### Web

```typescript
// Temporário em uma server action ou API route
import * as Sentry from "@sentry/nextjs";
Sentry.captureException(new Error("Sentry web test — delete me"));
```

### API

```typescript
// Temporário em um handler
import * as Sentry from "@sentry/node";
Sentry.captureException(new Error("Sentry API test — delete me"));
```

Confira em [igor-sily.sentry.io](https://igor-sily.sentry.io) em ~30 segundos.

### Checklist

| Check | Como validar |
|-------|--------------|
| Erros client | Erro em componente `"use client"` |
| Erros server Next | Erro em server action / RSC |
| Erros API | Erro 500 em rota tRPC (projeto `acme-api`) |
| Source maps | Stack trace com nomes de arquivo legíveis |
| Replay | Aba Replays no dashboard |
| Trace distribuído | Mesmo `trace_id` no web e na API |
| Tunnel | Network tab mostra POST em `/monitoring` |

## Desabilitar Sentry

Remova ou comente as variáveis de DSN de cada app. Os SDKs inicializam sem DSN e não enviam eventos.

## Referências

- [Next.js SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Node.js SDK](https://docs.sentry.io/platforms/javascript/guides/node/)
- Skill interno: `.cursor/plugins/.../sentry-nextjs-sdk/SKILL.md`
- MCP Sentry (Cursor): `apps/web/.cursor/mcp.json` → `https://mcp.sentry.dev/mcp/igor-sily/acme-web`
