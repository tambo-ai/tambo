---
phase: 06-cli-integration
plan: 01
subsystem: cli
tags: [orchestrator, magic-init, pipeline, ux, testing]
dependency_graph:
  requires:
    - 02-01 (project-analysis)
    - 03-01 (plan-generation)
    - 04-01 (user-confirmation)
    - 05-01 (file-operations)
    - 05-02 (execution-orchestrator)
  provides:
    - magic-init orchestrator function
    - full pipeline integration
    - progressive spinner UX
    - additive re-run detection
  affects:
    - 06-02 (CLI flag wiring)
tech_stack:
  added: []
  patterns:
    - Integration orchestrator pattern
    - Progressive UI feedback with ora spinners
    - Additive re-run detection via filesystem checks
    - Error recovery with categorized messages
key_files:
  created:
    - cli/src/commands/magic-init.ts
    - cli/src/commands/magic-init.test.ts
  modified: []
decisions:
  - Use environment variable (process.env.TAMBO_API_KEY) first before checking .env files for simplicity
  - Integration-style tests due to Jest ESM mocking limitations
  - Re-run detection reads directly from filesystem (TamboProvider in layout, components in tambo.ts)
  - Error categorization based on phase (file-write, dependency-install, verification) rather than custom categories
metrics:
  duration: 408
  completed_date: 2026-02-16
---

# Phase 06 Plan 01: Magic Init Orchestrator Summary

Built the `handleMagicInit` orchestrator connecting all Phase 2-5 modules into a single --magic pipeline with progressive spinner UX, analysis summary, additive re-run detection, and error recovery.

## Tasks Completed

### Task 1: handleMagicInit Orchestrator Implementation

**File:** `cli/src/commands/magic-init.ts`

**Implementation:**

- **API Key Verification:** Checks `process.env.TAMBO_API_KEY` first, then `.env.local`/`.env` files using `findTamboApiKey()`
- **Phase 2 - Analysis:** Runs `analyzeProject()` with progressive spinner updates ("Detecting framework...", "Detecting components...", "Finding tools...")
- **Analysis Error Recovery:** In interactive mode, prompts "Continue anyway?" if framework detection fails; in non-interactive mode, throws immediately
- **Analysis Summary:** Displays framework name, component count, tool candidate count, and provider count after analysis
- **Additive Re-run Detection:**
  - `detectExistingSetup()` checks root layout file for "TamboProvider" string
  - Parses `tambo.ts` in lib directory for registered component imports
  - `filterPlanForRerun()` removes already-configured items from plan
  - Logs detected setup and filters plan before confirmation
- **Phase 3 - Plan Generation:** Calls `generatePlan()` with project analysis and API key
- **Phase 4 - Confirmation:** Calls `confirmPlan()` with plan and `--yes` option, exits gracefully if not approved
- **Phase 5 - Execution:** Runs `executeCodeChanges()` with confirmation result
- **Success Recap:** Shows files created/modified, dependencies installed, verification warnings if any
- **Next Steps:** Displays "Run npm run dev" and docs link
- **Error Handling:** Uses `categorizeExecutionError()` and `formatExecutionError()`, shows additional fix commands based on error phase

**Key Functions:**

- `handleMagicInit(options)` - Main orchestrator function
- `getApiKeyForMagic()` - Reads API key from env var or .env files
- `displayAnalysisSummary(analysis)` - Logs framework, components, tools, providers
- `detectExistingSetup(analysis)` - Returns `{ hasProvider, existingComponents }`
- `filterPlanForRerun(plan, existing)` - Filters out already-configured items

**Commit:** `5484f2599` - feat(06-01): add handleMagicInit orchestrator

### Task 2: Comprehensive Test Suite

**File:** `cli/src/commands/magic-init.test.ts`

**Test Coverage:**

1. ✅ Full pipeline execution (analyzeProject → generatePlan → confirmPlan → executeCodeChanges)
2. ✅ Graceful exit when user cancels confirmation
3. ✅ Analysis summary display after successful analysis
4. ✅ Re-run detection (demonstrates behavior; full fs mocking deferred to integration tests)
5. ✅ Analysis failure with continue prompt in interactive mode
6. ✅ Analysis failure throws in non-interactive mode
7. ✅ --yes flag propagation through confirmPlan and executeCodeChanges
8. ✅ Error when API key not found
9. ✅ API key from process.env.TAMBO_API_KEY
10. ✅ Execution summary with file lists and dependencies
11. ✅ Warning display for verification errors
12. ✅ Plan generation failure handling
13. ✅ Execution failure with error categorization and formatting

**Testing Approach:**

- Integration-style tests with mocked module dependencies (Jest ESM limitations)
- Mocked: project-analysis, plan-generation, user-confirmation, code-execution, interactive, ora, fs
- API key provided via `process.env.TAMBO_API_KEY` in tests (simplest approach for Jest ESM)
- Spinner mock returns chainable object with start/succeed/fail/warn methods

**Commit:** `a0e167e9a` - test(06-01): add comprehensive tests for magic init orchestrator

## Deviations from Plan

None - plan executed exactly as written.

## Verification

All verification commands passed:

```bash
npm run check-types -w cli  # ✅ Passed
npm run lint -w cli          # ✅ Passed (6 warnings about TAMBO_API_KEY env var in turbo.json - expected)
npm test -- --testPathPatterns='magic-init' -w cli  # ✅ 13 tests passed
```

## Technical Decisions

### 1. API Key Priority: Environment Variable First

**Decision:** Check `process.env.TAMBO_API_KEY` before reading .env files

**Rationale:**

- Simpler code flow (no fs operations if env var exists)
- Environment variables take precedence in production deployments
- Easier to test (just set env var in tests)

### 2. Integration-Style Tests

**Decision:** Use integration-style tests with mocked module dependencies instead of unit tests

**Rationale:**

- Jest ESM has limitations with module mocking (unstable_mockModule)
- Orchestrator is inherently about integration between modules
- Testing the full flow is more valuable than testing individual helper functions
- Matches patterns from Phase 5 (05-02-SUMMARY.md decision)

### 3. Re-run Detection via Filesystem

**Decision:** Read layout file and tambo.ts directly to detect existing setup

**Rationale:**

- Simple string matching for "TamboProvider" is reliable
- Parsing imports from tambo.ts gives accurate list of registered components
- No need for complex AST parsing or separate state file
- Fast and deterministic

### 4. Error Phase-Based Categorization

**Decision:** Use `error.phase` (file-write, dependency-install, verification) instead of custom category system

**Rationale:**

- Matches existing `ExecutionError` type from Phase 5
- Clear mapping to which stage of execution failed
- Simpler to extend with additional phases if needed

## Files Modified

**Created:**

- `cli/src/commands/magic-init.ts` (446 lines) - Orchestrator implementation
- `cli/src/commands/magic-init.test.ts` (493 lines) - Test suite

**No files modified** - all new implementations

## Next Steps

Plan 06-02 will wire the `--magic` flag into `tambo init` command and ensure normal init runs first when needed.

## Self-Check

**Created Files:**

```bash
[ -f "cli/src/commands/magic-init.ts" ] && echo "FOUND: cli/src/commands/magic-init.ts" || echo "MISSING: cli/src/commands/magic-init.ts"
[ -f "cli/src/commands/magic-init.test.ts" ] && echo "FOUND: cli/src/commands/magic-init.test.ts" || echo "MISSING: cli/src/commands/magic-init.test.ts"
```

Output:

```
FOUND: cli/src/commands/magic-init.ts
FOUND: cli/src/commands/magic-init.test.ts
```

**Commits:**

```bash
git log --oneline --all | grep -E "(feat|test)\(06-01\)"
```

Output:

```
a0e167e9a test(06-01): add comprehensive tests for magic init orchestrator
5484f2599 feat(06-01): add handleMagicInit orchestrator
```

## Self-Check: PASSED

All created files exist and all commits are present in git history.
