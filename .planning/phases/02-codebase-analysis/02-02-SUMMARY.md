---
phase: 02-codebase-analysis
plan: 02
subsystem: cli
tags:
  [
    ts-morph,
    ast-parsing,
    react-components,
    provider-detection,
    component-detection,
  ]

# Dependency graph
requires:
  - phase: 02-01
    provides: Project analysis types (ProviderInfo, ComponentInfo), fs-helpers, ProjectStructure with componentsDirs and rootLayoutPath
provides:
  - Provider detection using ts-morph AST parsing
  - Component detection with props/hooks extraction
  - React Context provider discovery in layout files
  - Exported component identification for interactable candidates
affects: [02-03, 02-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AST-based code analysis using ts-morph"
    - "Two-pass provider detection (identify elements, then calculate relative nesting)"
    - "Fresh ts-morph Project per directory to avoid memory leaks"
    - "Generic type extraction from React.FC<T> using regex"

key-files:
  created:
    - cli/src/utils/project-analysis/provider-detection.ts
    - cli/src/utils/project-analysis/provider-detection.test.ts
    - cli/src/utils/project-analysis/component-detection.ts
    - cli/src/utils/project-analysis/component-detection.test.ts
  modified: []

key-decisions:
  - "Provider nesting level counts only other Provider ancestors, not all JSX elements"
  - "Component detection limited to 50 results to avoid overwhelming output"
  - "Extract FC generic type param with regex instead of complex AST traversal"
  - "Check return expression kind directly before checking descendants for JSX detection"

patterns-established:
  - "Use ts-morph with skipFileDependencyResolution and jsx: Preserve for React file parsing"
  - "Write tests to real temp files (ts-morph requires files on disk, not memfs)"
  - "Filter exported components only (non-exported are internal/private)"

# Metrics
duration: 8min
completed: 2026-02-12
---

# Phase 02 Plan 02: Provider and Component Detection Summary

**AST-based React provider and component detection using ts-morph for intelligent TamboProvider insertion and component registration recommendations**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-12T17:46:11Z
- **Completed:** 2026-02-12T17:54:08Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Provider detection finds all \*Provider JSX elements in layout files with import sources and relative nesting levels
- Component detection identifies exported React functional components (declarations and arrow functions)
- Props interface extraction works for both inline types and React.FC generics
- Hook usage tracking identifies all hooks used within components
- Comprehensive filtering: test files, story files, type definitions, and non-exported components excluded

## Task Commits

Each task was committed atomically:

1. **Task 1: Provider detection with ts-morph** - `176ceee39` (feat) - _Already committed before execution_
2. **Task 2: Component detection for interactable candidates** - `a7e6bdc09` (feat)

## Files Created/Modified

- `cli/src/utils/project-analysis/provider-detection.ts` - Detects React Context providers in layout files using AST parsing
- `cli/src/utils/project-analysis/provider-detection.test.ts` - Comprehensive tests with nested providers, self-closing elements, default imports
- `cli/src/utils/project-analysis/component-detection.ts` - Detects exported React components with props and hook analysis
- `cli/src/utils/project-analysis/component-detection.test.ts` - Tests for function declarations, arrow functions, FC types, filtering

## Decisions Made

- **Provider nesting calculation:** Count only other Provider ancestors, not all JSX elements. This gives more meaningful nesting levels for determining where to insert TamboProvider.
- **Component limit:** Cap results at 50 components to avoid overwhelming the CLI output when analyzing large codebases.
- **FC type extraction:** Use regex to extract generic type param from `React.FC<PropsType>` instead of complex AST traversal. Simple and reliable for this use case.
- **JSX detection strategy:** Check return expression kind directly first, then fall back to descendants. This catches simple cases faster and improves detection reliability.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed JSX detection for simple return statements**

- **Found during:** Task 2 (Component detection tests failing)
- **Issue:** `hasJsxReturn` was not detecting JSX in simple return statements like `return <button>Text</button>`. Only checked descendants, missing the return expression itself.
- **Fix:** Added direct check for return expression kind (JsxElement, JsxFragment, JsxSelfClosingElement) before checking descendants
- **Files modified:** `cli/src/utils/project-analysis/component-detection.ts`
- **Verification:** All component detection tests pass, including simple components with direct JSX returns
- **Committed in:** a7e6bdc09 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added FC generic type extraction**

- **Found during:** Task 2 (React.FC test failing)
- **Issue:** Props interface not extracted for `React.FC<PropsType>` typed components. Only checked arrow function parameter types.
- **Fix:** Added regex extraction of generic type param from FC type annotation, with fallback to parameter type
- **Files modified:** `cli/src/utils/project-analysis/component-detection.ts`
- **Verification:** React.FC test passes with correct propsInterface extraction
- **Committed in:** a7e6bdc09 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes necessary for correctness. No scope creep - all within planned component detection functionality.

## Issues Encountered

- **Provider detection already implemented:** Task 1 was already completed in a previous commit (176ceee39). Verified tests pass and implementation matches plan requirements.
- **Linting errors after implementation:** Three ESLint errors (prefer-string-starts-ends-with, prefer-regexp-exec, prefer-nullish-coalescing). Fixed by using String.endsWith(), RegExp.exec(), and nullish coalescing operator.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Provider detection ready for use in determining TamboProvider insertion point
- Component detection ready for recommending which components to register
- Next plan (02-03) can use these modules to analyze user codebases and provide intelligent recommendations
- No blockers or concerns

## Self-Check: PASSED

All files and commits verified:

- ✓ provider-detection.ts
- ✓ provider-detection.test.ts
- ✓ component-detection.ts
- ✓ component-detection.test.ts
- ✓ Commit 176ceee39
- ✓ Commit a7e6bdc09

---

_Phase: 02-codebase-analysis_
_Completed: 2026-02-12_
