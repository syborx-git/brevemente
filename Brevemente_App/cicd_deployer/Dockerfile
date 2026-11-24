# ==============================================================================
# Dockerized CI/CD Auto-Deployer for BreveMente Platform (GitOps Watcher)
# Monitors origin/main on GitHub and automatically rebuilds & deploys affected
# services: backend (BE), frontend (FE), transcript-engine, document-engine (MD),
# and verifies LEVA Ollama & PostgreSQL pgvector health.
# ==============================================================================
FROM docker:27-cli

RUN apk add --no-cache \
    bash \
    git \
    curl \
    openssh-client \
    ca-certificates \
    tzdata

WORKDIR /deployer

COPY deploy-now.sh /deployer/deploy-now.sh
COPY deploy-watcher.sh /deployer/deploy-watcher.sh

RUN sed -i 's/\r$//' /deployer/deploy-now.sh /deployer/deploy-watcher.sh && \
    chmod +x /deployer/deploy-now.sh /deployer/deploy-watcher.sh

ENV REPO_DIR=/opt/brevemente
ENV COMPOSE_DIR=/opt/brevemente/Brevemente_App
ENV TARGET_BRANCH=main
ENV POLL_INTERVAL_SECONDS=45

CMD ["/deployer/deploy-watcher.sh"]
