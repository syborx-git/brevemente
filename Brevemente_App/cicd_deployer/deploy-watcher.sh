#!/usr/bin/env bash
# ==============================================================================
# BreveMente GitOps Watcher Daemon
# Polls origin/main every POLL_INTERVAL_SECONDS and triggers deploy-now.sh
# automatically whenever a merge or push lands on GitHub main.
# ==============================================================================
set -euo pipefail

REPO_DIR="${REPO_DIR:-/repo}"
BRANCH="${TARGET_BRANCH:-main}"
INTERVAL="${POLL_INTERVAL_SECONDS:-45}"

log() {
  echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] [CI/CD Watcher] $*"
}

git config --global --add safe.directory "$REPO_DIR" || true

log "Iniciando monitor continuo CI/CD sobre '$REPO_DIR' (rama: $BRANCH, intervalo: ${INTERVAL}s)..."
log "Proyectos vigilados: backend (BE), frontend (FE), transcript-engine, document-engine (MD), ollama (LEVA)"

while true; do
  if [ -d "$REPO_DIR/.git" ]; then
    cd "$REPO_DIR"
    if git fetch origin "$BRANCH" >/dev/null 2>&1; then
      LOCAL_SHA="$(git rev-parse HEAD)"
      REMOTE_SHA="$(git rev-parse "origin/$BRANCH")"
      if [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
        log "Nuevo merge detectado en origin/$BRANCH ($LOCAL_SHA -> $REMOTE_SHA). Ejecutando despliegue..."
        if /deployer/deploy-now.sh; then
          log "Despliegue automático finalizado con éxito en $REMOTE_SHA."
        else
          log "ERROR durante el despliegue de $REMOTE_SHA. Se reintentará en el siguiente ciclo."
        fi
      fi
    else
      log "WARN: No se pudo consultar origin/$BRANCH temporalmente."
    fi
  else
    log "ERROR: No se encontró repositorio git en $REPO_DIR"
  fi
  sleep "$INTERVAL"
done
