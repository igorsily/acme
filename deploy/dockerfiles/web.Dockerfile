FROM oven/bun:1.3.9-slim AS builder

WORKDIR /app

ARG NEXT_PUBLIC_SERVER_URL=http://api.localhost
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_AUTH_TOKEN
ARG STANDALONE_BUILD=true

ENV CI=true
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV NEXT_TELEMETRY_DISABLED=1
ENV STANDALONE_BUILD=$STANDALONE_BUILD

COPY . .

RUN echo "STANDALONE_BUILD=$STANDALONE_BUILD"
RUN bun install --frozen-lockfile
RUN bun turbo run build --filter=web


FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system app && useradd --system --gid app app

COPY --from=builder --chown=app:app /app/apps/web/.next/standalone ./
COPY --from=builder --chown=app:app /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=app:app /app/apps/web/public ./apps/web/public

USER app

EXPOSE 3001

CMD ["node", "apps/web/server.js"]