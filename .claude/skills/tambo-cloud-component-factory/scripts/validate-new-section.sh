#!/usr/bin/env bash
# validate-new-section.sh -- Verify a new settings section is properly wired
#
# Checks all 6 layers of the Tambo Cloud component factory pattern:
#   1. Database operations file exists and is exported
#   2. tRPC router file exists and is registered in root.ts
#   3. UI component has withTamboInteractable wrapping
#   4. Component is registered in project-settings.tsx (both sidebars)
#   5. Test file exists
#
# Usage:
#   bash scripts/validate-new-section.sh <feature-name>
#   bash scripts/validate-new-section.sh skills
#   bash scripts/validate-new-section.sh my-feature
#
# Exit codes:
#   0 = all checks pass
#   1 = one or more checks failed
#   2 = bad arguments
#
# Designed for agentic use: no interactive prompts, structured output,
# meaningful exit codes.

set -euo pipefail

if [[ $# -lt 1 || "$1" == "--help" || "$1" == "-h" ]]; then
  echo "Usage: $(basename "$0") <feature-name>"
  echo ""
  echo "Validates that a new settings section is properly wired through all layers."
  echo ""
  echo "Arguments:"
  echo "  feature-name   kebab-case name of the feature (e.g., 'skills', 'my-feature')"
  echo ""
  echo "Examples:"
  echo "  $(basename "$0") skills"
  echo "  $(basename "$0") tool-call-limit"
  echo ""
  echo "Exit codes:"
  echo "  0 = all checks pass"
  echo "  1 = one or more checks failed"
  echo "  2 = bad arguments"
  exit 2
fi

FEATURE="$1"
# Convert kebab-case to camelCase for router/variable names
# Uses awk for portability (macOS sed doesn't support \U)
CAMEL=$(echo "$FEATURE" | awk -F'-' '{for(i=1;i<=NF;i++){if(i==1){printf "%s",$i}else{printf "%s",toupper(substr($i,1,1)) substr($i,2)}}}' )

PASS=0
FAIL=0
WARN=0

pass() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  WARN: $1"; WARN=$((WARN + 1)); }

# Find repo root (walk up from script location or cwd)
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"

echo "Validating feature: $FEATURE (camelCase: $CAMEL)"
echo "Repo root: $REPO_ROOT"
echo ""

# --- Layer 1-2: Database ---
echo "=== Layer 1-2: Database ==="

OPS_FILE="$REPO_ROOT/packages/db/src/operations/${FEATURE}.ts"
if [[ -f "$OPS_FILE" ]]; then
  pass "Operations file exists: $OPS_FILE"
else
  # Try singular/plural variants
  ALT_FILE="$REPO_ROOT/packages/db/src/operations/${FEATURE}s.ts"
  if [[ -f "$ALT_FILE" ]]; then
    pass "Operations file exists: $ALT_FILE"
    OPS_FILE="$ALT_FILE"
  else
    fail "Operations file not found: $OPS_FILE (or ${FEATURE}s.ts)"
  fi
fi

OPS_INDEX="$REPO_ROOT/packages/db/src/operations/index.ts"
if grep -q "\"\./${FEATURE}" "$OPS_INDEX" 2>/dev/null; then
  pass "Operations exported from index.ts"
else
  fail "Operations not exported from $OPS_INDEX -- add: export * from \"./${FEATURE}\";"
fi

echo ""

# --- Layer 3: tRPC Router ---
echo "=== Layer 3: tRPC Router ==="

ROUTER_FILE="$REPO_ROOT/apps/web/server/api/routers/${FEATURE}.ts"
if [[ -f "$ROUTER_FILE" ]]; then
  pass "Router file exists: $ROUTER_FILE"
else
  ALT_ROUTER="$REPO_ROOT/apps/web/server/api/routers/${FEATURE}s.ts"
  if [[ -f "$ALT_ROUTER" ]]; then
    pass "Router file exists: $ALT_ROUTER"
    ROUTER_FILE="$ALT_ROUTER"
  else
    fail "Router file not found: $ROUTER_FILE"
  fi
fi

ROOT_ROUTER="$REPO_ROOT/apps/web/server/api/root.ts"
if grep -q "${CAMEL}" "$ROOT_ROUTER" 2>/dev/null; then
  pass "Router registered in root.ts"
else
  fail "Router not registered in $ROOT_ROUTER -- add: ${CAMEL}: ${CAMEL}Router"
fi

if [[ -f "$ROUTER_FILE" ]]; then
  if grep -q 'ensureProjectAccess' "$ROUTER_FILE"; then
    pass "Router uses ensureProjectAccess"
  else
    fail "Router missing ensureProjectAccess -- every procedure needs it"
  fi

  if grep -q 'from "zod/v3"' "$ROUTER_FILE"; then
    pass "Router imports from zod/v3"
  elif grep -q 'from "zod"' "$ROUTER_FILE"; then
    fail "Router imports from \"zod\" instead of \"zod/v3\""
  fi
fi

echo ""

# --- Layer 4: UI Component ---
echo "=== Layer 4: UI Component ==="

COMP_DIR="$REPO_ROOT/apps/web/components/dashboard-components/project-details"
COMP_FILE=$(find "$COMP_DIR" -maxdepth 1 -name "*${FEATURE}*" -name "*.tsx" ! -name "*.test.*" 2>/dev/null | head -1)

if [[ -n "$COMP_FILE" ]]; then
  pass "UI component file exists: $(basename "$COMP_FILE")"

  if grep -q 'withTamboInteractable' "$COMP_FILE"; then
    pass "Component uses withTamboInteractable"
  else
    fail "Component missing withTamboInteractable wrapping"
  fi

  if grep -q '\.describe(' "$COMP_FILE"; then
    pass "Props schema has .describe() calls"
  else
    warn "No .describe() found on Zod props -- Tambo uses these for AI context"
  fi

  if grep -q 'EditWithTamboButton' "$COMP_FILE"; then
    pass "Component uses EditWithTamboButton"
  else
    warn "No EditWithTamboButton found -- consider adding for AI interaction"
  fi

  if grep -q 'from "zod/v3"' "$COMP_FILE"; then
    pass "Component imports from zod/v3"
  elif grep -q 'from "zod"' "$COMP_FILE"; then
    fail "Component imports from \"zod\" instead of \"zod/v3\""
  fi
else
  fail "UI component not found in $COMP_DIR matching *${FEATURE}*"
fi

echo ""

# --- Layer 5: Settings Page Registration ---
echo "=== Layer 5: Settings Page Registration ==="

SETTINGS_FILE="$REPO_ROOT/apps/web/components/dashboard-components/project-settings.tsx"

if grep -q "Interactable.*${FEATURE}" "$SETTINGS_FILE" 2>/dev/null || \
   grep -qi "${FEATURE}" "$SETTINGS_FILE" 2>/dev/null; then
  pass "Feature referenced in project-settings.tsx"
else
  fail "Feature not found in $SETTINGS_FILE"
fi

# Check for ref
if grep -qi "${CAMEL}Ref\|${FEATURE}Ref" "$SETTINGS_FILE" 2>/dev/null; then
  pass "Ref found in project-settings.tsx"
else
  fail "No ref for this section in project-settings.tsx"
fi

# Check desktop sidebar (hidden sm:block section)
DESKTOP_NAV=$(sed -n '/hidden sm:block/,/^[[:space:]]*<\/div>/p' "$SETTINGS_FILE" 2>/dev/null)
if echo "$DESKTOP_NAV" | grep -qi "${FEATURE}\|${CAMEL}" 2>/dev/null; then
  pass "Desktop sidebar nav includes this section"
else
  fail "Desktop sidebar nav missing this section (hidden sm:block div)"
fi

# Check mobile menu (sm:hidden section)
MOBILE_NAV=$(sed -n '/sm:hidden/,/^[[:space:]]*<\/div>[[:space:]]*<\/div>/p' "$SETTINGS_FILE" 2>/dev/null)
if echo "$MOBILE_NAV" | grep -qi "${FEATURE}\|${CAMEL}" 2>/dev/null; then
  pass "Mobile menu nav includes this section"
else
  fail "Mobile menu nav missing this section (sm:hidden div)"
fi

echo ""

# --- Layer 6: Tests ---
echo "=== Layer 6: Tests ==="

TEST_FILE=$(find "$COMP_DIR" -maxdepth 1 -name "*${FEATURE}*.test.*" 2>/dev/null | head -1)
if [[ -n "$TEST_FILE" ]]; then
  pass "Test file exists: $(basename "$TEST_FILE")"

  if grep -q 'withTamboInteractable.*Component' "$TEST_FILE" 2>/dev/null; then
    pass "Test mocks withTamboInteractable as pass-through"
  else
    warn "Test may be missing withTamboInteractable mock"
  fi
else
  fail "Test file not found matching *${FEATURE}*.test.* in $COMP_DIR"
fi

echo ""

# --- Summary ---
echo "================================"
echo "Results: $PASS passed, $FAIL failed, $WARN warnings"
echo "================================"

if [[ $FAIL -gt 0 ]]; then
  exit 1
else
  exit 0
fi
