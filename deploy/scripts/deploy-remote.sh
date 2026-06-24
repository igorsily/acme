#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_DIR:?DEPLOY_DIR is required}"
: "${IMAGE_NAMESPACE:?IMAGE_NAMESPACE is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"
DEPLOY_API="${DEPLOY_API:-false}"
DEPLOY_WEB="${DEPLOY_WEB:-false}"
RECREATE_ONLY="${RECREATE_ONLY:-false}"

ENV_FILE="${DEPLOY_DIR}/.env"
COMPOSE_APPS="${DEPLOY_DIR}/compose.apps.yml"

if [[ "$DEPLOY_API" != "true" && "$DEPLOY_WEB" != "true" ]]; then
  echo "Nothing to deploy (DEPLOY_API and DEPLOY_WEB are both false)"
  exit 0
fi

cd "$DEPLOY_DIR"

if [[ ! -f "$ENV_FILE" || ! -f "$COMPOSE_APPS" ]]; then
  echo "Missing .env or compose.apps.yml in ${DEPLOY_DIR}"
  exit 1
fi

COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_APPS")
WAIT_TIMEOUT="${WAIT_TIMEOUT:-300}"

set -a
# shellcheck disable=SC1091
source "$ENV_FILE"
set +a

wait_for_traefik() {
  local host="$1"
  local path="$2"
  local label="$3"
  local attempts="${4:-12}"

  for i in $(seq 1 "$attempts"); do
    if curl -sf -H "Host: ${host}" "http://127.0.0.1${path}" > /dev/null; then
      echo "${label} roteamento Traefik OK"
      return 0
    fi
    echo "${label} Traefik: tentativa ${i}/${attempts} — aguardando 5s..."
    sleep 5
  done

  echo "${label} roteamento Traefik falhou após o container ficar healthy"
  "${COMPOSE[@]}" ps
  return 1
}

if [[ "$RECREATE_ONLY" == "true" ]]; then
  echo ">>> Recreate only (sem pull, mantém API_IMAGE/WEB_IMAGE do .env)"

  if [[ "$DEPLOY_API" == "true" ]]; then
    echo ">>> Recriando API"
    "${COMPOSE[@]}" up -d --force-recreate api
    wait_for_traefik "${API_DOMAIN:-api.localhost}" "/api/health" "API"
  fi

  if [[ "$DEPLOY_WEB" == "true" ]]; then
    echo ">>> Recriando Web"
    "${COMPOSE[@]}" up -d --force-recreate web
    wait_for_traefik "${WEB_DOMAIN:-web.localhost}" "/" "Web"
  fi

  echo ">>> Pruning old images"
  docker image prune -f

  echo "Redeploy concluído: $(date)"
  exit 0
fi

if [[ "$DEPLOY_API" == "true" ]]; then
  API_IMAGE="${IMAGE_NAMESPACE}/acme-api:${IMAGE_TAG}"
  echo ">>> Setting API_IMAGE=${API_IMAGE}"
  sed -i "s|^API_IMAGE=.*|API_IMAGE=${API_IMAGE}|" "$ENV_FILE"
fi

if [[ "$DEPLOY_WEB" == "true" ]]; then
  WEB_IMAGE="${IMAGE_NAMESPACE}/acme-web:${IMAGE_TAG}"
  echo ">>> Setting WEB_IMAGE=${WEB_IMAGE}"
  sed -i "s|^WEB_IMAGE=.*|WEB_IMAGE=${WEB_IMAGE}|" "$ENV_FILE"
fi

PULL_SERVICES=()
if [[ "$DEPLOY_API" == "true" ]]; then
  PULL_SERVICES+=(migrate api)
fi
if [[ "$DEPLOY_WEB" == "true" ]]; then
  PULL_SERVICES+=(web)
fi

echo ">>> Pulling images for: ${PULL_SERVICES[*]}"
"${COMPOSE[@]}" pull "${PULL_SERVICES[@]}"

if [[ "$DEPLOY_API" == "true" ]]; then
  echo ">>> Running migrations"
  "${COMPOSE[@]}" up migrate --force-recreate
  echo ">>> Starting API (aguardando healthcheck do container, timeout ${WAIT_TIMEOUT}s)"
  "${COMPOSE[@]}" up -d --wait --wait-timeout "$WAIT_TIMEOUT" api
  wait_for_traefik "${API_DOMAIN:-api.localhost}" "/api/health" "API"
fi

if [[ "$DEPLOY_WEB" == "true" ]]; then
  echo ">>> Starting Web (aguardando healthcheck do container, timeout ${WAIT_TIMEOUT}s)"
  "${COMPOSE[@]}" up -d --wait --wait-timeout "$WAIT_TIMEOUT" web
  wait_for_traefik "${WEB_DOMAIN:-web.localhost}" "/" "Web"
fi

echo ">>> Pruning old images"
docker image prune -f

echo "Deploy concluído: $(date)"
