#!/bin/bash
# Start full local dev environment with file upload support
# Usage: ./scripts/dev-local.sh

set -e

echo "Starting local dev environment..."

echo "Checking that ports 8260-8263 are free (web/api/showcase/docs)..."
for port in 8260 8261 8262 8263; do
  if ! python3 - "$port" <<'PY'
import socket
import sys

port = int(sys.argv[1])
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

try:
  sock.bind(("127.0.0.1", port))
except OSError:
  sys.exit(1)
finally:
  sock.close()
PY
  then
    echo "Port ${port} is already in use. Stop the process using it, then re-run this script."
    exit 1
  fi
done

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
echo "  Web:      http://localhost:8260"
echo "  API:      http://localhost:8261"
echo "  Showcase: http://localhost:8262"
echo "  Docs:     http://localhost:8263"
echo "  Supabase: http://127.0.0.1:54423"
echo ""

npm run dev:cloud:full
