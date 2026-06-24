# Infraestrutura Docker

Esta pasta separa os serviços de base dos serviços da aplicação.

## Arquivos

- `compose.infra.yml`: PostGIS, Redis e Watchtower opcional.
- `compose.apps.yml`: Traefik, API Fastify e web Next.js.
- `dockerfiles/server.Dockerfile`: build da imagem da API para CI/registry (3-stage Alpine, 195 MB).
- `dockerfiles/web.Dockerfile`: build da imagem do Next.js para CI/registry (98.5 MB).
- `.env.example`: variáveis para ambos os composes.

O compose de apps não builda localmente. Ele puxa `API_IMAGE` e `WEB_IMAGE`, pensadas para Docker Hub ou outro registry. Os Dockerfiles ficam para o pipeline de CI gerar e publicar essas imagens. Eles usam Bun apenas para instalar dependências e executar o build do monorepo; o runtime dos containers de API e web é Node.js. O Next.js roda como servidor com `next start`, não como static export.

Antes de subir a API, o serviço `migrate` aplica as migrations Drizzle pendentes e encerra. A API só inicia depois que `migrate` completa com sucesso.

## Estratégia de build e tamanho das imagens

### API (195 MB)

A imagem da API usa build em 3 estágios com Alpine:

1. **builder** (`oven/bun:1.3.9-slim`): instala dependências e executa `bun turbo run build --filter=server`
2. **node-source** (`node:22-alpine`): usado apenas como fonte do binário Node.js (`/usr/local/bin/node`)
3. **runner** (`alpine:3.21`): base mínima (~8 MB) + binário Node v22.22.3 (~121 MB) + bundle dist (~4 MB) + migrations (~0.06 MB) = **195 MB total**

O bundle do server usa `tsdown` com `alwaysBundle: [/.*/]`, que inlineia todas as dependências npm no `dist/`. O runner não precisa de `node_modules` — só o binário Node, o bundle e os arquivos de migração.

Isso reduziu a imagem de 658 MB para 195 MB (70% menor).

### WEB (98.5 MB)

A imagem do Next.js usa `standalone` output com base Alpine, resultando em 98.5 MB.

### Variável MIGRATIONS_FOLDER

O compose define `MIGRATIONS_FOLDER=/app/migrations` nos serviços `migrate` e `api`. Os arquivos SQL de migração são copiados separadamente pelo Dockerfile porque o migrador lê do filesystem, não do bundle.

## Uso local

```bash
cp deploy/.env.example deploy/.env
docker compose --env-file deploy/.env -f deploy/compose.infra.yml up -d
docker compose --env-file deploy/.env -f deploy/compose.apps.yml pull
docker compose --env-file deploy/.env -f deploy/compose.apps.yml up -d
```

O `docker compose up -d` executa `migrate` → `api` → `web` (Traefik sobe em paralelo).

## Migrations no deploy

Fluxo normal (primeiro deploy ou restart sem schema novo):

```bash
docker compose --env-file deploy/.env -f deploy/compose.apps.yml up -d
```

Deploy com schema novo (após push de imagem com migrations):

```bash
docker compose --env-file deploy/.env -f deploy/compose.apps.yml pull
docker compose --env-file deploy/.env -f deploy/compose.apps.yml up migrate --force-recreate
docker compose --env-file deploy/.env -f deploy/compose.apps.yml up -d api
```

### Limitação do Watchtower

Watchtower reinicia só a `api` (e `web`), sem reexecutar `migrate`. Em releases com migration, rode o fluxo acima antes de confiar no Watchtower, ou desative-o naquele deploy.

Com os valores padrão:

- Web: `http://web.localhost`
- API: `http://api.localhost`
- PostGIS: `localhost:5432`
- Redis: `localhost:6379`

## HTTPS e domínios reais

Para produção, edite `deploy/.env`:

```env
API_IMAGE=seu-usuario/acme-api:1.0.0
WEB_IMAGE=seu-usuario/acme-web:1.0.0
WEB_DOMAIN=app.seu-dominio.com
API_DOMAIN=api.seu-dominio.com
NEXT_PUBLIC_SERVER_URL=https://api.seu-dominio.com
BETTER_AUTH_URL=https://api.seu-dominio.com
CORS_ORIGIN=https://app.seu-dominio.com
AUTH_COOKIE_DOMAIN=seu-dominio.com
TRAEFIK_ACME_EMAIL=devops@seu-dominio.com
BETTER_AUTH_SECRET=<valor-com-32+-caracteres>
```

Traefik publica HTTP em `80` e HTTPS em `443`, emite certificados pelo Let's Encrypt via HTTP challenge e balanceia réplicas descobertas pelo Docker provider.

### Cookies de autenticação (web + API em subdomínios)

Com `app.seu-dominio.com` (web) e `api.seu-dominio.com` (API), o cookie de sessão precisa ser compartilhado entre os dois hosts. Sem `AUTH_COOKIE_DOMAIN`, o login retorna 200 mas o `proxy.ts` do Next.js não enxerga a sessão e redireciona de volta para `/login`.

Defina o domínio raiz (sem subdomínio):

```env
AUTH_COOKIE_DOMAIN=seu-dominio.com
```

Após alterar, faça redeploy da API e peça aos usuários para fazer login novamente (cookies antigos ficam escopados só em `api.*`).

## Escala e load balancing

Traefik balanceia automaticamente múltiplos containers do mesmo serviço:

```bash
docker compose --env-file deploy/.env -f deploy/compose.apps.yml up -d --scale web=2 --scale api=2
```

## Publicação das imagens

Exemplo manual, caso queira publicar fora do CI:

```bash
docker build -f deploy/dockerfiles/server.Dockerfile -t seu-usuario/acme-api:1.0.0 .
docker build -f deploy/dockerfiles/web.Dockerfile --build-arg NEXT_PUBLIC_SERVER_URL=https://api.seu-dominio.com -t seu-usuario/acme-web:1.0.0 .
docker push seu-usuario/acme-api:1.0.0
docker push seu-usuario/acme-web:1.0.0
```

## Watchtower

Watchtower fica desativado por padrão. Ative apenas quando quiser atualização automática de containers com label habilitada:

```bash
docker compose --env-file deploy/.env -f deploy/compose.infra.yml --profile updates up -d watchtower
```

Ele roda com `--label-enable`, então só atualiza serviços que tenham `com.centurylinklabs.watchtower.enable=true`.

## Deploy automático via CI

O workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) concentra validação, build de imagens e deploy:

| Evento | O que roda |
|--------|------------|
| Pull request | Lint + tipos (`--affected`) |
| Push em `main` | Validação + build das duas imagens + deploy API e Web |
| Tag `v*` | Build das duas imagens + deploy |
| Manual | Escolha build e/ou deploy por serviço (ver cenários abaixo) |

### Deploy manual sem mudança de código

No GitHub: **Actions → CI/CD → Run workflow**.

| Cenário | build_api / build_web | deploy_api / deploy_web | image_tag | recreate_only |
|---------|----------------------|-------------------------|-----------|---------------|
| Build + deploy completo | ✅ | ✅ | *(vazio)* | ❌ |
| Redeploy imagem `latest` (sem rebuild) | ❌ | ✅ | *(vazio — usa `latest`)* | ❌ |
| Só aplicar `.env` no servidor (ex.: Sentry) | ❌ | ✅ | *(ignorado)* | ✅ |
| Tag específica | ❌ | ✅ | `sha-abc123...` ou `1.0.0` | ❌ |

**Erro comum** (deploy sem build e sem `latest` no registry):

```text
Error response from daemon: manifest for igorsily/acme-api:sha-<commit> not found: manifest unknown
```

Causa: o workflow usava `sha-<commit>` do checkout, mas essa imagem nunca foi buildada no Docker Hub. Com a correção atual, deploy manual sem build cai em `latest` automaticamente.

**CLI (`gh`):**

```bash
# Redeploy API + Web com imagem latest (sem rebuild)
gh workflow run ci.yml -f deploy_api=true -f deploy_web=true

# Só recriar containers após editar deploy/.env no servidor
gh workflow run ci.yml -f deploy_api=true -f deploy_web=true -f recreate_only=true
```

Fluxo em produção: validação → build condicional → SSH → `docker compose pull` → migrate (se API) → `up -d`.

No dispatch manual, dá para redeploy sem rebuild (marque só `deploy_api` / `deploy_web`; tag padrão `latest`).

### Configuração no GitHub (Settings → Secrets and variables → Actions)

**Secret obrigatório:**

| Nome | Valor |
|------|-------|
| `DEPLOY_SSH_KEY` | Chave privada SSH autorizada no servidor (`~/.ssh/contabo-vps-igorsily`) |

**Variables recomendadas:**

| Nome | Valor |
|------|-------|
| `DEPLOY_SSH_HOST` | `66.94.105.114` |
| `DEPLOY_SSH_USER` | `igorsily` |
| `DEPLOY_PATH` | `/home/igorsily/acme` (padrão no workflow se não definido) |

### Layout no servidor (Contabo)

No servidor, os arquivos de compose ficam **na raiz** de `DEPLOY_PATH`, sem subpasta `infra`:

```
/home/igorsily/acme/
  .env
  compose.apps.yml
  compose.infra.yml
```

No repositório Git, os mesmos arquivos vivem em `deploy/`. O script `deploy-remote.sh` espera o layout do servidor.

### Pré-requisitos no servidor

1. Docker e Docker Compose instalados
2. `.env` de produção em `/home/igorsily/acme/.env`
3. `docker compose --env-file .env -f compose.infra.yml up -d` rodando (PostGIS, Redis)
4. Chave pública de `DEPLOY_SSH_KEY` em `~/.ssh/authorized_keys`
5. Pull das imagens no Docker Hub funcionando

Valide no servidor:

```bash
cd /home/igorsily/acme
bash deploy/scripts/check-server-prep.sh
# ou, se o script estiver copiado no servidor:
bash check-server-prep.sh
```

### Tag implantada

O deploy usa `sha-<commit>` (ex.: `sha-abc123def456...`), não `latest`.

### Watchtower vs deploy SSH

Com deploy via CI ativo, mantenha Watchtower desativado em produção. Releases com migration devem passar pelo pipeline (que executa `migrate` antes da API).
