#!/usr/bin/env bash
# ==============================================================================
# BreveMente Smart Multi-Project CD Script
# Detects changed sub-projects between commits (or deploys requested services):
#   - backend               (Spring Boot 3 + LEVA Engine)
#   - frontend              (Angular 18 + Nginx)
#   - transcript-engine     (Faster-Whisper Python FastAPI)
#   - document-engine       (PyMuPDF4LLM / Mammoth Markdown Converter)
#   - ollama                (LEVA Local LLM LLaMA 3.1)
# ==============================================================================
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/brevemente}"
if [ ! -d "$REPO_DIR/.git" ] && [ -d "/repo/.git" ]; then
  REPO_DIR="/repo"
fi
COMPOSE_DIR="${COMPOSE_DIR:-$REPO_DIR/Brevemente_App}"
BRANCH="${TARGET_BRANCH:-main}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-brevemente-platform}"

log() {
  echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] [CI/CD] $*"
}

git config --global --add safe.directory "$REPO_DIR" || true

cd "$REPO_DIR"
OLD_SHA="$(git rev-parse HEAD)"
git fetch origin "$BRANCH"
NEW_SHA="$(git rev-parse "origin/$BRANCH")"

FORCE_SERVICES="${1:-}"

if [ "$OLD_SHA" = "$NEW_SHA" ] && [ -z "$FORCE_SERVICES" ]; then
  log "Rama '$BRANCH' ya está actualizada en $NEW_SHA. Sin cambios que desplegar."
  exit 0
fi

log "Actualizando código de $OLD_SHA -> $NEW_SHA (rama $BRANCH)..."
CHANGED_FILES="$(git diff --name-only "$OLD_SHA" "$NEW_SHA" || true)"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

SERVICES_TO_BUILD=()

add_service() {
  local svc="$1"
  for existing in "${SERVICES_TO_BUILD[@]:-}"; do
    if [ "$existing" = "$svc" ]; then
      return
    fi
  done
  SERVICES_TO_BUILD+=("$svc")
}

if [ -n "$FORCE_SERVICES" ]; then
  if [ "$FORCE_SERVICES" = "all" ]; then
    SERVICES_TO_BUILD=(transcript-engine document-engine backend frontend)
  else
    for s in $FORCE_SERVICES; do
      add_service "$s"
    done
  fi
else
  log "Archivos modificados en el merge:"
  echo "$CHANGED_FILES" | sed 's/^/  - /'

  if echo "$CHANGED_FILES" | grep -qE "^Brevemente_App/backend/"; then
    add_service "backend"
  fi
  if echo "$CHANGED_FILES" | grep -qE "^Brevemente_App/frontend/"; then
    add_service "frontend"
  fi
  if echo "$CHANGED_FILES" | grep -qE "^Brevemente_App/transcript_engine_python/"; then
    add_service "transcript-engine"
  fi
  if echo "$CHANGED_FILES" | grep -qE "^Brevemente_App/document_engine_python/"; then
    add_service "document-engine"
  fi
  if echo "$CHANGED_FILES" | grep -qE "^Brevemente_App/docker-compose\.yml$"; then
    add_service "transcript-engine"
    add_service "document-engine"
    add_service "backend"
    add_service "frontend"
  fi
fi

cd "$COMPOSE_DIR"

# 1. Garantizar que PostgreSQL (pgvector) y LEVA Ollama estén activos
log "Verificando servicios base (PostgreSQL + LEVA Ollama)..."
docker compose -p "$COMPOSE_PROJECT_NAME" up -d postgres ollama

if [ "${#SERVICES_TO_BUILD[@]}" -eq 0 ]; then
  log "El merge no modificó código de microservicios (solo docs/config). No se requiere recompilar contenedores."
  exit 0
fi

log "Proyectos a compilar y desplegar: ${SERVICES_TO_BUILD[*]}"
docker compose -p "$COMPOSE_PROJECT_NAME" build "${SERVICES_TO_BUILD[@]}"
docker compose -p "$COMPOSE_PROJECT_NAME" up -d "${SERVICES_TO_BUILD[@]}"

# Limpiar imágenes huérfanas para proteger el disco del servidor
docker image prune -f >/dev/null 2>&1 || true

log "Despliegue de commit $NEW_SHA completado exitosamente. Estado de contenedores:"
docker compose -p "$COMPOSE_PROJECT_NAME" ps
