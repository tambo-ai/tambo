#!/usr/bin/env bash
set -euo pipefail

# Default to the new /mcp route; allow override via environment variable
# Usage: TARGET_URL="https://mcp.tambo.co/mcp" ./scripts/smoke-mcp.sh
TARGET_URL="${TARGET_URL:-http://localhost:3000/mcp}"

echo "[smoke] Hitting $TARGET_URL ..."

# Fetch headers and body status
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL")
if [[ "$HTTP_CODE" -lt 200 || "$HTTP_CODE" -ge 300 ]]; then
  echo "[smoke] Unexpected HTTP status: $HTTP_CODE"
  exit 1
fi

# Local dev smoke test only; no platform headers required

echo "[smoke] OK: $TARGET_URL responded with $HTTP_CODE"
exit 0

