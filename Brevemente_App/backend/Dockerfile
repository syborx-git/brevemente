# ==============================================================================
# Production Multi-Stage Dockerfile for BreveMente Backend (Spring Boot 3 / Java 17)
# Optimized for Hetzner Cloud / Linux Containers
# ==============================================================================

# Stage 1: Build JAR with Maven
FROM maven:3.9.8-eclipse-temurin-17-alpine AS builder
WORKDIR /workspace

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build application artifact
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal Distroless/Alpine JRE Runtime
FROM eclipse-temurin:17-jre-alpine AS runner
WORKDIR /app

# Security: Run as unprivileged user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy JAR from build stage
COPY --from=builder /workspace/target/*.jar app.jar

ENV SERVER_PORT=8080 \
    JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
