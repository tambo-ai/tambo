#!/bin/bash

# Connect to Tambo PostgreSQL Database
# This script connects to the PostgreSQL database running in Docker

set -e

. "$(cd "$(dirname "$0")" && pwd)/_cloud-helpers.sh"

REPO_ROOT_DIR="$(get_repo_root)" || fail "Could not find repo root. Are you running from inside the tambo folder?"
cd "$REPO_ROOT_DIR"

info "🗄️  Connecting to Tambo PostgreSQL Database..."
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

# Check if PostgreSQL container is running
if ! docker compose --env-file docker.env ps postgres | grep -q "Up"; then
    fail \
      "❌ PostgreSQL container is not running. Please start the stack first:" \
      "   ./scripts/cloud/tambo-start.sh"
fi

# Get database credentials from the running container
info "📋 Getting database credentials from running container..."
POSTGRES_PASSWORD=$(docker compose --env-file docker.env exec -T postgres printenv POSTGRES_PASSWORD 2>/dev/null || echo "your-super-secret-and-long-postgres-password")
POSTGRES_USER=$(docker compose --env-file docker.env exec -T postgres printenv POSTGRES_USER 2>/dev/null || echo "postgres")
POSTGRES_DB=$(docker compose --env-file docker.env exec -T postgres printenv POSTGRES_DB 2>/dev/null || echo "tambo")

info "✅ Connecting to PostgreSQL..."
info "📋 Database: $POSTGRES_DB"
info "📋 User: $POSTGRES_USER"
info "📋 Host: localhost:5433"
printf '\n'

# Connect to PostgreSQL using psql in the postgres container (no host psql required)
docker compose --env-file docker.env exec -e PGPASSWORD="$POSTGRES_PASSWORD" -T postgres psql -h localhost -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"
