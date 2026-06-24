#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="${1:-/home/igorsily/acme}"
cd "$DEPLOY_DIR"

echo "Checking deploy prerequisites in ${DEPLOY_DIR}"
echo

fail=0

check() {
  if eval "$2"; then
    echo "[OK] $1"
  else
    echo "[FAIL] $1"
    fail=1
  fi
}

check "Docker installed" "command -v docker >/dev/null"
check "Docker Compose available" "docker compose version >/dev/null 2>&1"
check ".env exists" "test -f .env"
check "compose.apps.yml exists" "test -f compose.apps.yml"
check "compose.infra.yml exists" "test -f compose.infra.yml"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
  check "API_IMAGE set" "test -n \"${API_IMAGE:-}\""
  check "WEB_IMAGE set" "test -n \"${WEB_IMAGE:-}\""
fi

check "acme-private network exists" "docker network inspect acme-private >/dev/null 2>&1"

if [[ -n "${API_IMAGE:-}" ]]; then
  check "Can pull API image" "docker pull \"${API_IMAGE}\" >/dev/null"
fi

if [[ -n "${WEB_IMAGE:-}" ]]; then
  check "Can pull Web image" "docker pull \"${WEB_IMAGE}\" >/dev/null"
fi

echo
if [[ "$fail" -eq 0 ]]; then
  echo "All checks passed."
else
  echo "Some checks failed. Fix the items above before enabling CI deploy."
  exit 1
fi
