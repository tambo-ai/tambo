#!/usr/bin/env bash
set -euo pipefail

# Check a settings section component for required patterns.
# Run from the repository root.
#
# Usage: bash devdocs/skills/settings-component-patterns/scripts/check-settings-section.sh <file>

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" || -z "${1:-}" ]]; then
  cat <<'USAGE'
Usage: bash devdocs/skills/settings-component-patterns/scripts/check-settings-section.sh <file>

Verify a settings section component follows required patterns.

Checks:
  1. EditWithTamboButton imported and used
  2. withTamboInteractable wrapping the export
  3. useToast imported for mutation feedback
  4. Error toast with destructive variant
  5. Card layout components used

Exit codes:
  0  All checks passed
  1  One or more checks failed
  2  Invalid arguments (missing file, file not found)

Example:
  bash devdocs/skills/settings-component-patterns/scripts/check-settings-section.sh \
    apps/web/components/dashboard-components/project-details/my-section.tsx
USAGE
  exit 0
fi

FILE="$1"

if [[ ! -f "$FILE" ]]; then
  echo "Error: File not found: $FILE"
  exit 2
fi

PASS=0
FAIL=0

check() {
  local label="$1"
  local pattern="$2"
  if grep -qE "$pattern" "$FILE" 2>/dev/null; then
    echo "PASS: $label"
    ((PASS++)) || true
  else
    echo "FAIL: $label"
    ((FAIL++)) || true
  fi
}

echo "Checking: $FILE"
echo ""

check "EditWithTamboButton imported" "EditWithTamboButton"
check "withTamboInteractable wrapping" "withTamboInteractable"
check "useToast imported" "useToast"
check "Error toast (destructive variant)" 'variant.*destructive|destructive'
check "Card layout used" "CardTitle"

echo ""
echo "Results: $PASS passed, $FAIL failed"

if [[ $FAIL -gt 0 ]]; then
  echo "Fix failures and re-run to verify."
  exit 1
else
  echo "All checks passed."
  exit 0
fi
