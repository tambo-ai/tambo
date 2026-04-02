#!/usr/bin/env bash
set -euo pipefail

# Scan for common accessibility violations in apps/web .tsx files.
# Run from the repository root.
#
# Usage: bash devdocs/skills/accessibility-checklist/scripts/scan-a11y.sh [directory]
# Default directory: apps/web/components

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Usage: bash devdocs/skills/accessibility-checklist/scripts/scan-a11y.sh [directory]

Scan .tsx files for common accessibility violations.
Default directory: apps/web/components

Checks:
  1. role="button" on non-button elements
  2. <div onClick> patterns (should use <button>)
  3. Positive tabIndex values (only 0 or -1 allowed)
  4. Icon buttons potentially missing aria-label

Exit codes:
  0  No violations found
  1  Violations found
  2  Invalid arguments
USAGE
  exit 0
fi

SEARCH_DIR="${1:-apps/web/components}"

if [[ ! -d "$SEARCH_DIR" ]]; then
  echo "Error: Directory not found: $SEARCH_DIR"
  echo "Run this script from the repository root."
  exit 2
fi

FOUND=0

echo "Scanning $SEARCH_DIR for accessibility violations..."
echo ""

echo '## role="button" usage (should use <button>)'
if grep -rn 'role="button"' "$SEARCH_DIR" --include="*.tsx" 2>/dev/null; then
  FOUND=1
else
  echo "None found."
fi
echo ""

echo '## <div onClick> patterns (should use <button>)'
if grep -rn '<div[^>]*onClick' "$SEARCH_DIR" --include="*.tsx" 2>/dev/null; then
  FOUND=1
else
  echo "None found."
fi
echo ""

echo "## Positive tabIndex values (only 0 or -1 allowed)"
if grep -rn 'tabIndex={[1-9]' "$SEARCH_DIR" --include="*.tsx" 2>/dev/null; then
  FOUND=1
else
  echo "None found."
fi
echo ""

echo "## Icon buttons potentially missing aria-label"
echo "(Lines with size=\"icon\" but no aria-label on same line)"
if grep -rn 'size="icon"' "$SEARCH_DIR" --include="*.tsx" 2>/dev/null | grep -v 'aria-label'; then
  FOUND=1
else
  echo "None found."
fi

echo ""
if [[ $FOUND -eq 1 ]]; then
  echo "Violations found. Fix and re-run to verify."
  exit 1
else
  echo "No violations detected."
  exit 0
fi
