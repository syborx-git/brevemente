# ==============================================================================
# Production Multi-Stage Dockerfile for BreveMente Frontend (Angular 18)
# Optimized for Hetzner Cloud / Linux Containers with Nginx
# ==============================================================================

# Stage 1: Build Angular application with Node.js 20
FROM node:20-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci || npm install

# Build static bundle for production
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Ultra-lightweight Nginx runtime
FROM nginx:alpine AS runner

# Copy compiled browser bundle
COPY --from=builder /app/dist/brevemente-frontend/browser /usr/share/nginx/html

# Copy custom Nginx configuration with reverse proxy & SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
