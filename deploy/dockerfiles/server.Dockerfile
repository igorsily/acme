FROM oven/bun:1.3.9-slim AS builder

WORKDIR /app

ENV CI=true

# Layer 1: Package files for cache (bun install only re-runs when these change)
COPY package.json bun.lock turbo.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/api/package.json packages/api/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/email/package.json packages/email/package.json
COPY packages/env/package.json packages/env/package.json
# COPY packages/services/package.json packages/services/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json

# Layer 2: Install dependencies
RUN bun install --frozen-lockfile

# Layer 3: Copy source code and build
COPY apps/server/src/ apps/server/src/
COPY packages/ packages/
COPY apps/server/tsconfig.json apps/server/tsconfig.json
COPY apps/server/tsdown.config.ts apps/server/tsdown.config.ts
COPY tsconfig.json tsconfig.json
RUN bun turbo run build --filter=server


FROM node:22-alpine AS node-source


FROM alpine:3.21 AS runner

# node binary depends on libstdc++ (includes libgcc_s)
RUN apk add --no-cache libstdc++

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV MIGRATIONS_FOLDER=/app/migrations

# Copy node binary (121 MB) and required shared object from node:22-alpine
COPY --from=node-source /usr/local/bin/node /usr/local/bin/node

# Create non-root user (Alpine syntax)
RUN addgroup -S app && adduser -S app -G app

# Copy ONLY what's needed — no node_modules (tsdown bundles everything)
COPY --from=builder --chown=app:app /app/apps/server/dist/ ./dist/
COPY --from=builder --chown=app:app /app/packages/db/src/migrations/ ./migrations/
COPY --from=builder --chown=app:app /app/apps/server/package.json ./package.json

USER app
EXPOSE 3000
CMD ["node", "dist/index.mjs"]
