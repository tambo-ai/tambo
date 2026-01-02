#!/bin/bash
# Start full local dev environment with file upload support
# Usage: ./scripts/dev-local.sh

set -e

echo "Starting local dev environment..."

# 0. Kill any existing processes on our ports
echo "Clearing ports 3000, 3001, 3002, 3003..."
for port in 3000 3001 3002 3003; do
  lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
done
sleep 1

# 1. Start Postgres (if not running)
if ! docker ps | grep -q tambo_postgres; then
  echo "Starting Postgres..."
  docker compose --env-file docker.env up postgres -d
  sleep 3
fi

# 2. Start Supabase (if not running)
if ! supabase status 2>/dev/null | grep -q "supabase local development setup is running"; then
  echo "Starting Supabase..."
  supabase start
fi

# 3. Run migrations (idempotent)
echo "Running migrations..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/tambo" npm run db:migrate -w packages/db 2>/dev/null || true

# 4. Start all dev servers
echo ""
echo "Starting dev servers..."
echo "  Web:      http://localhost:3000"
echo "  API:      http://localhost:3001"
echo "  Showcase: http://localhost:3002"
echo "  Docs:     http://localhost:3003"
echo "  Supabase: http://127.0.0.1:54423"
echo ""

npm run dev:cloud:full
