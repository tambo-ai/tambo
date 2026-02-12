---
phase: 01-client-core-sdk
plan: 01
subsystem: api
tags: [typescript, fetch, retry, exponential-backoff, jest]

# Dependency graph
requires:
  - phase: none
    provides: Initial repository structure
provides:
  - "@tambo-ai/client-core package with dual CJS/ESM build"
  - "TamboClient class for authenticated API requests"
  - "Retry logic with exponential backoff for 5xx/network errors"
  - "Core type definitions (TamboClientOptions, RequestOptions, ApiError)"
affects: [01-02, 01-03, 01-04, react-sdk]

# Tech tracking
tech-stack:
  added: [exponential-backoff, type-fest, jest, ts-jest]
  patterns: [dual CJS/ESM build with tsc, retry on 5xx only, Bearer token auth]

key-files:
  created:
    - packages/client-core/src/client.ts
    - packages/client-core/src/retry.ts
    - packages/client-core/src/types.ts
  modified: []

key-decisions:
  - "Used exponential-backoff library for retry logic instead of custom implementation"
  - "Retry 5xx and network errors only, never retry 4xx client errors"
  - "Default to 3 retries with 1s starting delay and 30s max delay"
  - "Timeout defaults to 30s per request"

patterns-established:
  - "Package structure: dual CJS/ESM build with separate tsconfig files"
  - "Test files colocated with implementation (.test.ts suffix)"
  - "Jest configured with ts-jest and module name mapper for .js extensions"

# Metrics
duration: 4min
completed: 2026-02-12
---

# Phase 01 Plan 01: Client Core Foundation Summary

**TypeScript client with authenticated fetch, exponential backoff retry (5xx/network), and dual CJS/ESM builds**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-12T13:03:47Z
- **Completed:** 2026-02-12T13:08:04Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Created @tambo-ai/client-core package with dual CJS/ESM build system
- Implemented TamboClient class with Bearer token authentication
- Added fetchWithRetry wrapper with exponential backoff for 5xx/network errors
- Achieved 21 passing tests with comprehensive coverage of retry logic and client behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Create package structure and build configuration** - `1ee62dec4` (chore)
2. **Task 2: Implement types, retry logic, and TamboClient with tests** - `fdd6cc1f7` (feat)

## Files Created/Modified

- `packages/client-core/package.json` - Package definition with dual exports and dependencies
- `packages/client-core/tsconfig.json` - Base TypeScript configuration
- `packages/client-core/tsconfig.cjs.json` - CommonJS build configuration
- `packages/client-core/tsconfig.esm.json` - ESM build configuration
- `packages/client-core/jest.config.ts` - Jest test configuration with module name mapper
- `packages/client-core/src/index.ts` - Public API exports
- `packages/client-core/src/types.ts` - Core type definitions (TamboClientOptions, RequestOptions, ApiError)
- `packages/client-core/src/retry.ts` - Exponential backoff retry wrapper
- `packages/client-core/src/client.ts` - TamboClient class with authenticated fetch
- `packages/client-core/src/retry.test.ts` - Retry logic tests (7 tests)
- `packages/client-core/src/client.test.ts` - TamboClient tests (14 tests)
- `.gitignore` - Added esm build output directory

## Decisions Made

- **exponential-backoff library:** Used existing library instead of custom implementation for reliability and battle-tested behavior
- **Retry strategy:** Only retry 5xx and network errors (TypeError), never retry 4xx client errors to avoid wasting resources on invalid requests
- **Default configuration:** 3 retries, 1s starting delay, 30s max delay, 30s timeout - balanced for production use
- **Module system:** Dual CJS/ESM builds to support both Node.js and modern bundlers
- **Jest module mapper:** Required to handle .js extensions in imports for ESM compatibility while using ts-jest

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript configuration for jest.config.ts**

- **Found during:** Task 1 (initial build verification)
- **Issue:** ESLint failed because jest.config.ts was included in tsconfig.json but not under rootDir, and check-types failed with rootDir constraint
- **Fix:** Removed rootDir from base tsconfig.json, added it only to CJS/ESM configs, excluded jest.config.ts from CJS/ESM builds
- **Files modified:** packages/client-core/tsconfig.json, tsconfig.cjs.json, tsconfig.esm.json
- **Verification:** All builds and type-checks pass
- **Committed in:** 1ee62dec4 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed IBackOffOptions type compatibility**

- **Found during:** Task 2 (initial build)
- **Issue:** TypeScript error - IBackOffOptions requires all fields but we only set a subset
- **Fix:** Changed type from IBackOffOptions to Partial<IBackOffOptions>
- **Files modified:** packages/client-core/src/retry.ts
- **Verification:** Build succeeds, tests pass
- **Committed in:** fdd6cc1f7 (Task 2 commit)

**3. [Rule 3 - Blocking] Fixed Jest module name mapper for .js extensions**

- **Found during:** Task 2 (test execution)
- **Issue:** Jest couldn't resolve imports with .js extensions (ESM convention)
- **Fix:** Added moduleNameMapper to jest.config.ts to strip .js extensions
- **Files modified:** packages/client-core/jest.config.ts
- **Verification:** All tests pass
- **Committed in:** fdd6cc1f7 (Task 2 commit)

**4. [Rule 1 - Bug] Removed unused ApiError import**

- **Found during:** Task 2 (pre-commit hook)
- **Issue:** ESLint error - ApiError imported but never used directly in tests
- **Fix:** Removed unused import
- **Files modified:** packages/client-core/src/client.test.ts
- **Verification:** Linting passes
- **Committed in:** fdd6cc1f7 (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 bug)
**Impact on plan:** All auto-fixes were necessary for the build and test infrastructure to work correctly. No scope creep - just solving technical constraints not specified in plan.

## Issues Encountered

None - all issues were blocking configuration problems that were auto-fixed per deviation rules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Package @tambo-ai/client-core is functional and ready to use
- TamboClient can make authenticated API requests with retry logic
- Next phase (01-02) can build thread management on top of this client
- All type definitions exported and available for reuse

## Self-Check: PASSED

All files verified to exist:

- ✓ packages/client-core/src/client.ts
- ✓ packages/client-core/src/retry.ts
- ✓ packages/client-core/src/types.ts
- ✓ packages/client-core/package.json

All commits verified:

- ✓ 1ee62dec4 (Task 1)
- ✓ fdd6cc1f7 (Task 2)

---

_Phase: 01-client-core-sdk_
_Completed: 2026-02-12_
