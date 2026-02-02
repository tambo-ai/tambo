#!/bin/bash
#
# Checks for incorrect domain usage (tambo.ai instead of tambo.co)
# Run this script to find any instances of the wrong domain in the codebase.
#
# Exit codes:
#   0 - No incorrect domains found
#   1 - Found incorrect domain usage

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Files/patterns to exclude from the check
EXCLUDE_PATTERNS=(
  "check-domain.sh"           # This script
  "node_modules"              # Dependencies
  ".git"                      # Git internals
  "CHANGELOG.md"              # Generated changelogs may reference old commits
  "package-lock.json"         # Lock file
  "*.log"                     # Log files
  "domain-urls.test.ts"       # Domain validation tests (legitimately contains tambo.ai as test data)
)

# Build grep exclude arguments
EXCLUDE_ARGS=()
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
  EXCLUDE_ARGS+=("--exclude=$pattern")
  EXCLUDE_ARGS+=("--exclude-dir=$pattern")
done

cd "$REPO_ROOT"

echo "Checking for incorrect domain usage (tambo.ai instead of tambo.co)..."

# Search for tambo.ai in source files
# Using grep -r for recursive search with exclusions
if grep -r "tambo\.ai" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.md" \
  --include="*.mdx" \
  --include="*.yml" \
  --include="*.yaml" \
  --include="*.json" \
  --include="*.html" \
  --include="*.css" \
  --include="*.env*" \
  "${EXCLUDE_ARGS[@]}" \
  . 2>/dev/null; then
  echo ""
  echo "ERROR: Found 'tambo.ai' references in the codebase."
  echo "The correct domain is 'tambo.co' (e.g., docs.tambo.co, api.tambo.co)"
  echo ""
  echo "Please update the above files to use the correct domain."
  exit 1
fi

echo "No incorrect domain usage found."
exit 0
