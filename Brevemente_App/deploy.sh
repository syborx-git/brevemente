#!/bin/bash
set -e

BRANCH=${1:-develop}

echo "=========================================================="
echo "🚀 BreveMente Platform - Deployment Automation"
echo "📌 Target Branch: $BRANCH"
echo "=========================================================="

cd "$(dirname "$0")"

# 1. Actualizar repositorio Git
echo "🔄 [1/5] Actualizando repositorio Git desde rama '$BRANCH'..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# 2. Verificar existencia de .env
if [ ! -f .env ]; then
    echo "⚠️  [2/5] Archivo .env no encontrado. Creando a partir de .env.example..."
    cp .env.example .env
    echo "❗ Revisa el archivo .env para confirmar credenciales antes de producción."
else
    echo "✅ [2/5] Archivo .env de producción verificado."
fi

# 3. Construir y levantar contenedores en segundo plano
echo "🐳 [3/5] Recompilando y recreando contenedores Docker..."
docker compose up -d --build

# 4. Limpieza de imágenes huérfanas
echo "🧹 [4/5] Limpiando capas antiguas e imágenes no etiquetadas..."
docker image prune -f

# 5. Resumen de estado
echo "=========================================================="
echo "📊 [5/5] Estado actual de los contenedores:"
echo "=========================================================="
docker compose ps

echo ""
echo "=========================================================="
echo "🎉 Despliegue finalizado exitosamente en rama '$BRANCH'"
echo "🌐 Frontend:             http://188.245.203.48/"
echo "📖 Backend Swagger:      http://188.245.203.48/api/v1/swagger-ui/index.html"
echo "🎙️  Transcriptor Docs:    http://188.245.203.48:8000/docs"
echo "🧠 Ollama AI Engine:     http://188.245.203.48:11434/api/tags"
echo "=========================================================="
