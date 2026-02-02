#!/bin/bash
#
# Checks for incorrect domain usage (e.g., tambo.ai or tambo.com instead of tambo.co)
# Run this script to find any instances of the wrong domain in the codebase.
#
# Exit codes:
#   0 - No incorrect domains found
#   1 - Found incorrect domain usage

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Incorrect domain patterns to check for
# These patterns match domain references but not internal identifiers like "tambo.component"
# Pattern explanation:
#   - tambo\.ai($|[^a-z]) matches tambo.ai at end of line or followed by non-letter (/, space, ", etc.)
#   - tambo\.com($|[^a-z]) matches tambo.com but NOT tambo.component (since 'p' is a letter)
INCORRECT_DOMAINS=(
  'tambo\.ai\([^a-z]\|$\)'
  'tambo\.com\([^a-z]\|$\)'
)

# Human-readable names for error messages
DOMAIN_DISPLAY_NAMES=(
  "tambo.ai"
  "tambo.com"
)

# Files/patterns to exclude from the check
EXCLUDE_PATTERNS=(
  "check-domain.sh"           # This script
  "node_modules"              # Dependencies
  ".git"                      # Git internals
  "CHANGELOG.md"              # Generated changelogs may reference old commits
  "package-lock.json"         # Lock file
  "*.log"                     # Log files
  "domain-urls.test.ts"       # Domain validation tests (legitimately contains incorrect domains as test data)
)

# File types to include
INCLUDE_PATTERNS=(
  "*.ts"
  "*.tsx"
  "*.js"
  "*.jsx"
  "*.md"
  "*.mdx"
  "*.yml"
  "*.yaml"
  "*.json"
  "*.html"
  "*.css"
  "*.env*"
)

# Build grep exclude arguments
EXCLUDE_ARGS=()
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
  EXCLUDE_ARGS+=("--exclude=$pattern")
  EXCLUDE_ARGS+=("--exclude-dir=$pattern")
done

# Build grep include arguments
INCLUDE_ARGS=()
for pattern in "${INCLUDE_PATTERNS[@]}"; do
  INCLUDE_ARGS+=("--include=$pattern")
done

cd "$REPO_ROOT"

echo "Checking for incorrect domain usage (should be tambo.co)..."

found_errors=false

for i in "${!INCORRECT_DOMAINS[@]}"; do
  domain="${INCORRECT_DOMAINS[$i]}"
  display_name="${DOMAIN_DISPLAY_NAMES[$i]}"

  if grep -r "$domain" \
    "${INCLUDE_ARGS[@]}" \
    "${EXCLUDE_ARGS[@]}" \
    . 2>/dev/null; then
    echo ""
    echo "ERROR: Found '$display_name' references in the codebase."
    found_errors=true
  fi
done

if [ "$found_errors" = true ]; then
  echo ""
  echo "The correct domain is 'tambo.co' (e.g., docs.tambo.co, api.tambo.co)"
  echo "Please update the above files to use the correct domain."
  exit 1
fi

echo "No incorrect domain usage found."
exit 0
