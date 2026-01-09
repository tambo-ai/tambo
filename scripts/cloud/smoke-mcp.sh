#!/usr/bin/env bash
set -euo pipefail

. "$(cd "$(dirname "$0")" && pwd)/_cloud-helpers.sh"

# Default to the new /mcp route; allow override via environment variable
# Usage: TARGET_URL="https://mcp.tambo.co/mcp" ./scripts/cloud/smoke-mcp.sh
TARGET_URL="${TARGET_URL:-http://localhost:8261/mcp}"

info "[smoke] Hitting $TARGET_URL ..."

# Fetch headers and body status
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL")
if [[ "$HTTP_CODE" -lt 200 || "$HTTP_CODE" -ge 300 ]]; then
  fail "[smoke] Unexpected HTTP status: $HTTP_CODE"
fi

# Local dev smoke test only; no platform headers required

success "[smoke] OK: $TARGET_URL responded with $HTTP_CODE"

