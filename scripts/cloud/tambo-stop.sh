#!/bin/bash

# Stop Tambo Docker Stack
# This script stops the Tambo application and PostgreSQL database

set -e

. "$(cd "$(dirname "$0")" && pwd)/_cloud-helpers.sh"

REPO_ROOT_DIR="$(get_repo_root)" || fail "Could not find repo root. Are you running from inside the tambo folder?"
cd "$REPO_ROOT_DIR"

# Check if docker.env exists
if [ ! -f "docker.env" ]; then
    fail \
      "❌ docker.env file not found!" \
      "📝 Please copy docker.env.example to docker.env and update with your values"
fi

warn "🛑 Stopping Tambo Docker Stack..."

# Stop all services
info "🎯 Stopping all services..."
docker compose --env-file docker.env down || true

# Remove network (only if no other containers are using it)
info "🔗 Cleaning up network..."
docker network rm tambo_network 2>/dev/null || true

success \
  "✅ Tambo Docker Stack stopped successfully!" \
  "💡 To start the stack again: ./scripts/cloud/tambo-start.sh" 
