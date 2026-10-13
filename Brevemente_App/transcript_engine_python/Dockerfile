# ==============================================================================
# Production Dockerfile for CPU (Linux / Hetzner Cloud / x86_64)
# Optimized multi-stage build with FFmpeg, non-root user, and Healthcheck
# ==============================================================================

# Stage 1: Build & Dependencies
FROM python:3.11-slim AS builder

WORKDIR /build

# Install compilation tools required for native wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install dependencies into virtual environment
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip setuptools wheel && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime Image
FROM python:3.11-slim AS runner

WORKDIR /app

# Install runtime dependencies (FFmpeg is mandatory for audio decoding)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy virtualenv from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TEMP_DIR="/tmp/transcriptions"

# Create application user and temporary directories
RUN useradd -m -u 1000 appuser && \
    mkdir -p /tmp/transcriptions /app/models_cache && \
    chown -R appuser:appuser /app /tmp/transcriptions /app/models_cache

# Copy application source code
COPY --chown=appuser:appuser . /app

USER appuser

EXPOSE 8000

# Docker Healthcheck targeting the microservice health status
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
    CMD curl -f http://localhost:8000/v1/health || exit 1

# Launch ASGI Server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
