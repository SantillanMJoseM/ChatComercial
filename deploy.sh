#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPECTED_BRANCH="main"
CONTAINER_NAME="chatcomercial"
IMAGE_NAME="chatcomercial"
HEALTH_URL="http://127.0.0.1:3001/health"
HTTP_URL="http://127.0.0.1:3001/"
MAX_HEALTH_ATTEMPTS=30
HEALTH_SLEEP=2

PREV_COMMIT=""
NEW_COMMIT=""
PREV_IMAGE=""
STAGE="init"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
err() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2; }

rollback() {
  if [ -z "$PREV_IMAGE" ]; then
    err "No previous image available for rollback."
    return 1
  fi
  log "Rolling back to previous image ${PREV_IMAGE}..."
  docker tag "$PREV_IMAGE" "${IMAGE_NAME}:latest"
  docker compose -f "${PROJECT_DIR}/compose.yaml" up -d
  log "Rollback completed."
}

on_error() {
  err "Failure in stage: ${STAGE}"
  if [ "$STAGE" = "deploy" ] || [ "$STAGE" = "health" ] || [ "$STAGE" = "http" ]; then
    rollback || true
  fi
}
trap on_error ERR

cd "$PROJECT_DIR"

STAGE="validate-tools"
log "Validating required tools..."
command -v git >/dev/null 2>&1 || { err "Git is not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { err "Docker is not installed."; exit 1; }
docker compose version >/dev/null 2>&1 || { err "Docker Compose is not available."; exit 1; }
command -v curl >/dev/null 2>&1 || { err "curl is not installed."; exit 1; }

STAGE="validate-repo"
log "Validating repository..."
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { err "Not a Git repository."; exit 1; }
CURRENT_BRANCH="$(git branch --show-current)"
if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
  err "Expected branch '${EXPECTED_BRANCH}', current branch '${CURRENT_BRANCH}'."
  exit 1
fi

STAGE="local-changes"
if [ -n "$(git status --porcelain)" ]; then
  err "Local uncommitted changes detected. Aborting to avoid data loss."
  git status --short
  exit 1
fi

STAGE="previous-state"
PREV_COMMIT="$(git rev-parse HEAD)"
PREV_IMAGE="$(docker image inspect ${IMAGE_NAME}:latest --format '{{.Id}}' 2>/dev/null || true)"
log "Previous commit: ${PREV_COMMIT}"
if [ -n "$PREV_IMAGE" ]; then
  log "Previous image: ${PREV_IMAGE}"
else
  log "No previous image found (first deploy)."
fi

STAGE="fetch"
log "Fetching latest changes from origin/${EXPECTED_BRANCH}..."
git fetch origin "$EXPECTED_BRANCH"

STAGE="pull"
log "Updating working tree..."
git pull --ff-only origin "$EXPECTED_BRANCH"
NEW_COMMIT="$(git rev-parse HEAD)"
log "New commit: ${NEW_COMMIT}"

STAGE="tag-previous"
if [ -n "$PREV_IMAGE" ]; then
  log "Tagging previous image as ${IMAGE_NAME}:previous..."
  docker tag "$PREV_IMAGE" "${IMAGE_NAME}:previous"
fi

STAGE="build"
log "Building new Docker image..."
docker compose -f "${PROJECT_DIR}/compose.yaml" build

STAGE="deploy"
log "Deploying container..."
docker compose -f "${PROJECT_DIR}/compose.yaml" up -d

STAGE="health"
log "Waiting for healthcheck..."
for i in $(seq 1 "$MAX_HEALTH_ATTEMPTS"); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    log "Healthcheck passed on attempt ${i}."
    break
  fi
  if [ "$i" -eq "$MAX_HEALTH_ATTEMPTS" ]; then
    err "Healthcheck failed after ${MAX_HEALTH_ATTEMPTS} attempts."
    exit 1
  fi
  sleep "$HEALTH_SLEEP"
done

STAGE="http"
log "Verifying HTTP response on port 3001..."
HTTP_CODE="$(curl -o /dev/null -s -w '%{http_code}' "$HTTP_URL")"
if [ "$HTTP_CODE" != "200" ]; then
  err "HTTP check failed with status ${HTTP_CODE}."
  exit 1
fi

STAGE="done"
log "Deployment successful."
log "Deployed commit: ${NEW_COMMIT}"
log "HTTP status: ${HTTP_CODE}"
log "Application available at ${HTTP_URL}"