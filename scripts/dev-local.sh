#!/bin/bash
# Start full local dev environment with file upload support
# Usage: ./scripts/dev-local.sh

set -e

echo "Starting local dev environment..."

echo "Checking that ports 8260-8263 are free (web/api/showcase/docs)..."
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required to run this script. Please install Node and try again."
  exit 1
fi

for port in 8260 8261 8262 8263; do
  if ! node - "$port" <<'NODE'
const net = require("node:net");

// Exit 0 if the port on 127.0.0.1 is available, 1 otherwise.
const portArg = process.argv[2];
const port = Number.parseInt(portArg, 10);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  process.exit(1);
}

const server = net.createServer();
server.unref();

server.on("error", () => {
  process.exit(1);
});

server.listen({ host: "127.0.0.1", port }, () => {
  server.close(() => {
    process.exit(0);
  });
});
NODE
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
# Use npx so developers don't need a globally installed Supabase CLI.
if ! npx --yes supabase status -o json 2>/dev/null | node <<'NODE'
const fs = require("node:fs");

const input = fs.readFileSync(0, "utf8").trim();
if (input.length === 0) {
  process.exit(1);
}

let data;
try {
  data = JSON.parse(input);
} catch {
  process.exit(1);
}

if (data === null || typeof data !== "object" || Array.isArray(data)) {
  process.exit(1);
}

const apiUrl = data["API_URL"];
// `supabase status -o json` emits connection info keyed by env var names.
// Treat a non-empty `API_URL` as the signal that the local stack is running.
process.exit(typeof apiUrl === "string" && apiUrl.length > 0 ? 0 : 1);
NODE
then
  echo "Starting Supabase..."
  npx --yes supabase start
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
