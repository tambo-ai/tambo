#!/bin/bash

# Start Tambo Docker Stack
# This script starts the Tambo application with PostgreSQL database

set -e

. "$(cd "$(dirname "$0")" && pwd)/_cloud-helpers.sh"

REPO_ROOT_DIR="$(get_repo_root)" || fail "Could not find repo root. Are you running from inside the tambo folder?"
cd "$REPO_ROOT_DIR"

info "🚀 Starting Tambo Docker Stack..."
info "📁 Working directory: $(pwd)"

# Check if docker.env exists
if [ ! -f "docker.env" ]; then
    fail \
      "❌ docker.env file not found!" \
      "📝 Please copy docker.env.example to docker.env and update with your values"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    fail "❌ Docker is not running. Please start Docker first."
fi

# Create network if it doesn't exist
info "🔗 Creating Docker network..."
docker network create tambo_network 2>/dev/null || true

# Pull latest images (skip in CI where images are built locally)
if [ -z "$GITHUB_ACTIONS" ]; then
    info "📦 Pulling latest images..."
    docker compose --env-file docker.env pull --ignore-buildable
else
    info "📦 Skipping pull in CI (using locally built images)..."
fi

# Start all services with BuildKit
info "🎯 Starting Tambo services with BuildKit..."
DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker compose --env-file docker.env up -d

# Wait for services to start
warn "⏳ Waiting for services to start..."
sleep 10

# Check if PostgreSQL is healthy
warn "⏳ Checking PostgreSQL health..."
POSTGRES_RUNNING=$(docker compose --env-file docker.env ps -q postgres 2>/dev/null | wc -l)
if [ "$POSTGRES_RUNNING" -eq 0 ]; then
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to start...${NC}"
    sleep 20
fi

# Check if postgres container is healthy
POSTGRES_CONTAINER=$(docker compose --env-file docker.env ps -q postgres 2>/dev/null)
if [ -n "$POSTGRES_CONTAINER" ]; then
    POSTGRES_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$POSTGRES_CONTAINER" 2>/dev/null || echo "unknown")
    if [ "$POSTGRES_HEALTH" != "healthy" ]; then
        warn "⏳ Waiting for PostgreSQL to be healthy..."
        sleep 20
    fi
fi

# Check service status
info "✅ Checking service status..."
docker compose --env-file docker.env ps

success \
  "🎉 Tambo Docker Stack started successfully!" \
  "" \
  "📋 Available services:" \
  "  • Tambo Web: http://localhost:3210" \
  "  • Tambo API: http://localhost:3211" \
  "  • PostgreSQL Database: localhost:5433" \
  "" \
  "💡 To stop the stack: ./scripts/cloud/tambo-stop.sh" \
  "💡 To view logs: ./scripts/cloud/tambo-logs.sh" 
